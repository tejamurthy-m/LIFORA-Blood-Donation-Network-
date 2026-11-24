import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';
import { config } from './environment.js';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: config.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (config.env !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected successfully to Supabase PostgreSQL database via Prisma.');
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    throw error;
  }
};
