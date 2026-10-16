import prisma from './client.js';
import { logger } from '../logger.js';

async function reset() {
  try {
    logger.info('🔄 Resetting database...');
    
    await prisma.$executeRawUnsafe(`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
    `);
    
    logger.info('✅ Database reset complete');
  } catch (error) {
    logger.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

reset();
