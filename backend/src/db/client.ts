import { PrismaClient } from '@prisma/client';
import { logger } from '../logger.js';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  const globalForPrisma = global as unknown as { prisma: PrismaClient };
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['warn', 'error']
    });
  }
  prisma = globalForPrisma.prisma;
}

prisma.$connect()
  .then(() => logger.info('✅ Database connected'))
  .catch((error) => {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  });

export default prisma;
export { prisma };
