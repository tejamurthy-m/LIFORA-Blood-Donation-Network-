import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  const uptimeSeconds = process.uptime();
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'LIFORA Blood Donation Network API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptimeSeconds / 60)}m ${Math.floor(uptimeSeconds % 60)}s`,
      environment: process.env.NODE_ENV || 'development',
      memory: {
        rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
      },
    },
  });
});

export default router;
