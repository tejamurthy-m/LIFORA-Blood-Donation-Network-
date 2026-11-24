import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/environment.js';
import { logger } from './config/logger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import healthRouter from './routes/health.routes.js';
import apiV1Router from './routes/api.routes.js';

export const createApp = () => {
  const app = express();

  // Security Headers
  app.use(helmet());

  // Cross-Origin Resource Sharing (CORS)
  const allowedOrigins = [
    config.corsOrigin,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not permitted by CORS`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // HTTP Request Logging
  const morganStream = {
    write: (message) => logger.http(message.trim()),
  };
  app.use(
    morgan(config.env === 'development' ? 'dev' : 'combined', {
      stream: morganStream,
      skip: (req) => req.url === '/api/health', // Don't clutter logs with health checks
    })
  );

  // Body Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global API Rate Limiter
  app.use('/api', apiLimiter);

  // Health check endpoint
  app.use('/api/health', healthRouter);

  // API v1 root router (available at both /api/v1 and /api)
  app.use('/api/v1', apiV1Router);
  app.use('/api', apiV1Router);

  // Catch-all 404 Handler
  app.use(notFoundHandler);

  // Central Error Handler
  app.use(errorHandler);

  return app;
};
