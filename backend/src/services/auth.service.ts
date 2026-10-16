import prisma from '../db/client.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.middleware.js';
import { UnauthorizedError, ValidationError, InternalServerError } from '../utils/errors.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export class AuthService {
  /**
   * Initialize admin account from .env on application startup
   * This ensures the admin account always exists with the configured credentials
   */
  async initializeAdminAccount() {
    const adminEmail = config.admin.email;

    try {
      const adminPassword = config.admin.password;

      // Check if admin already exists
      const existingAdmin = await prisma.admin.findUnique({ where: { email: adminEmail } });

      if (existingAdmin) {
        // Update password in case it changed in .env
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await prisma.admin.update({
          where: { email: adminEmail },
          data: {
            password: hashedPassword,
            active: true
          }
        });
      } else {
        // Create admin account
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await prisma.admin.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            active: true
          }
        });
      }
    } catch (error: any) {
      logger.error({
        err: error,
        adminEmail,
        code: error?.code,
        meta: error?.meta,
        clientVersion: error?.clientVersion
      }, 'Failed to initialize admin account');
      throw new InternalServerError('Failed to initialize admin account');
    }
  }

  async login(email: string, password: string) {
    try {
      LoginSchema.parse({ email, password });

      const admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin || !admin.active) {
        throw new UnauthorizedError('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      const token = generateToken(admin.id, admin.email, admin.role);
      return { token, user: { id: admin.id, email: admin.email, role: admin.role } };
    } catch (error: any) {
      if (error instanceof UnauthorizedError) throw error;
      if (error.name === 'ZodError') {
        throw new ValidationError(error.errors?.[0]?.message || 'Invalid login data');
      }
      throw new InternalServerError('Login failed');
    }
  }

  async verifyToken(token: string) {
    try {
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      const admin = await prisma.admin.findUnique({ where: { id: decoded.userId } });
      if (!admin || !admin.active) {
        throw new UnauthorizedError('User not found or inactive');
      }
      return { user: { id: admin.id, email: admin.email, role: admin.role } };
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }
}

export const authService = new AuthService();
