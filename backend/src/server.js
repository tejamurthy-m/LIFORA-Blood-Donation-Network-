import http from 'http';
import { createApp } from './app.js';
import { config } from './config/environment.js';
import { logger } from './config/logger.js';
import { initSocketServer } from './config/socket.js';

const app = createApp();
const server = http.createServer(app);
const io = initSocketServer(server);

const PORT = config.port;

server.listen(PORT, () => {
  logger.info(`========================================================`);
  logger.info(` LIFORA Blood Donation Network - Backend API Server     `);
  logger.info(`========================================================`);
  logger.info(` Environment: ${config.env}`);
  logger.info(` HTTP Server: http://localhost:${PORT}`);
  logger.info(` Health Check: http://localhost:${PORT}/api/health`);
  logger.info(` API v1 Base: http://localhost:${PORT}/api/v1`);
  logger.info(` CORS Origin: ${config.corsOrigin}`);
  logger.info(`========================================================`);
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10 seconds if hanging
  setTimeout(() => {
    logger.error('Forcing server shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, server, io };
