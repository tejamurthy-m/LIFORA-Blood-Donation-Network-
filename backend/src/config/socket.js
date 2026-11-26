import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/token.js';
import { logger } from './logger.js';
import { config } from './environment.js';
import { prisma } from './prisma.js';

let io = null;

export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [config.corsOrigin, 'http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Authentication Middleware for Sockets
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        if (
          process.env.NODE_ENV !== 'production' &&
          (token.startsWith('jwt_demo_') || token.startsWith('jwt_mock_'))
        ) {
          // Check if token embeds a UUID
          const uuidMatch = token.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
          let user = null;

          if (uuidMatch) {
            try {
              user = await prisma.user.findUnique({ where: { id: uuidMatch[0] } });
            } catch {}
          }

          if (!user) {
            const email = token.includes('donor')
              ? 'donor@lifora.org'
              : token.includes('hospital')
              ? 'hospital@lifora.org'
              : token.includes('recipient')
              ? 'recipient@lifora.org'
              : token.includes('admin') || token.includes('super')
              ? 'admin@lifora.org'
              : null;

            if (email) {
              try {
                user = await prisma.user.findFirst({ where: { email } });
              } catch {}
            }
          }

          if (user) {
            socket.user = { userId: user.id, role: user.role, email: user.email };
          } else {
            socket.user = null;
          }
        } else {
          try {
            const decoded = verifyAccessToken(token);
            socket.user = decoded;
          } catch (err) {
            logger.warn(`Socket connection with invalid token: ${err.message}`);
            socket.user = null;
          }
        }
      } else {
        socket.user = null;
      }
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.userId;
    const userRole = socket.user?.role;

    if (userId) {
      // Join personal room for targeted alerts (verification, donations, responses)
      socket.join(`user:${userId}`);
      logger.info(`Socket connected: User ${userId} (${userRole}) [Socket ID: ${socket.id}]`);
    } else {
      logger.info(`Guest socket connected [Socket ID: ${socket.id}]`);
    }

    // Join public requests feed room
    socket.join('public:requests');

    // Hospital staff room
    socket.on('join:hospital', (hospitalId) => {
      if (hospitalId) {
        socket.join(`hospital:${hospitalId}`);
        logger.info(`Socket ${socket.id} joined hospital room: hospital:${hospitalId}`);
      }
    });

    // Public / donor / recipient tracking room for specific blood request
    socket.on('join:request', (trackingCode) => {
      if (trackingCode) {
        socket.join(`request:${trackingCode}`);
        logger.info(`Socket ${socket.id} joined tracking room: request:${trackingCode}`);
      }
    });

    socket.on('leave:request', (trackingCode) => {
      if (trackingCode) {
        socket.leave(`request:${trackingCode}`);
        logger.info(`Socket ${socket.id} left tracking room: request:${trackingCode}`);
      }
    });

    // Blood group emergency room (for donors waiting for specific alerts)
    socket.on('join:bloodGroup', (bloodGroup) => {
      if (bloodGroup) {
        const cleanBg = bloodGroup.replace('+', 'POS').replace('-', 'NEG');
        socket.join(`bloodGroup:${cleanBg}`);
        logger.info(`Socket ${socket.id} joined bloodGroup room: bloodGroup:${cleanBg}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};

// Broadcasters for Application Events

export const emitToUser = (userId, event, payload) => {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, payload);
    logger.info(`Socket Event emitted to user:${userId} -> ${event}`);
  }
};

export const emitToHospital = (hospitalId, event, payload) => {
  if (io && hospitalId) {
    io.to(`hospital:${hospitalId}`).emit(event, payload);
    logger.info(`Socket Event emitted to hospital:${hospitalId} -> ${event}`);
  }
};

export const emitToRequest = (trackingCode, event, payload) => {
  if (io && trackingCode) {
    io.to(`request:${trackingCode}`).emit(event, payload);
    logger.info(`Socket Event emitted to request:${trackingCode} -> ${event}`);
  }
};

export const broadcastBloodAlert = (payload) => {
  if (io) {
    // Broadcast to public requests feed
    io.to('public:requests').emit('blood_request:created', payload);

    // Also broadcast to specific blood group room
    if (payload.bloodGroup) {
      const cleanBg = payload.bloodGroup.replace('+', 'POS').replace('-', 'NEG');
      io.to(`bloodGroup:${cleanBg}`).emit('blood_request:urgent_alert', payload);
    }

    logger.info(`Broadcast blood alert for ${payload.bloodGroup || 'request'} across public feed.`);
  }
};
