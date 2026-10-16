import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import bcrypt from 'bcryptjs';

const router = Router();

// DEBUG ONLY - Remove in production
router.post('/debug-login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const prisma = (await import('../db/client.js')).default;
    
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      res.json({ found: false });
      return;
    }
    
    const isValid = await bcrypt.compare(password, admin.password);
    res.json({
      found: true,
      email: admin.email,
      passwordMatch: isValid,
      storedHash: admin.password.substring(0, 30) + '...',
      inputLength: password.length
    });
  } catch (error: any) {
    next(error);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// REGISTRATION DISABLED - Admin accounts must be created via .env configuration only
// This prevents unauthorized user account creation
router.post('/register', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(403).json({
      error: 'Registration is disabled. Admin accounts are configured via environment variables.'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
});

router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    const result = await authService.verifyToken(token);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
