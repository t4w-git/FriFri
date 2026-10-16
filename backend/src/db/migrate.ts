import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reset() {
  try {
    console.log('🔄 Resetting database...');
    
    await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE;');
    await prisma.$executeRawUnsafe('CREATE SCHEMA public;');
    
    console.log('✅ Database reset complete');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

reset();
