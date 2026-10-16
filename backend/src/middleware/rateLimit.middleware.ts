import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';

// In-memory tracking for IP-based reserve attempts (Layer 1 anti-cheating)
const ipReserveAttempts = new Map<string, { count: number; resetTime: number }>();

/**
 * Layer 1: IP-based rate limiter for /reserve endpoint
 * Prevents spam-reserving from same IP: max 1 reserve per 60 seconds
 */
export const reserveIpLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const clientIp = (req.ip || req.socket.remoteAddress || 'unknown') as string;
  const now = Date.now();

  if (clientIp === 'unknown') {
    next(); // If IP unknown, allow (fail open)
    return;
  }

  const existing = ipReserveAttempts.get(clientIp);

  if (existing) {
    // If window has expired, reset
    if (now > existing.resetTime) {
      ipReserveAttempts.set(clientIp, { count: 1, resetTime: now + 60 * 1000 });
      next();
      return;
    }

    // If still within window, check count
    if (existing.count >= 1) {
      res.status(429).json({
        error: 'Too many reserve attempts from this IP. Wait 60 seconds before trying again.'
      });
      return;
    }

    // Increment count
    existing.count++;
  } else {
    // First attempt from this IP
    ipReserveAttempts.set(clientIp, { count: 1, resetTime: now + 60 * 1000 });
  }

  next();
};

// Rate limiter per endpoints pubblici
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Troppe richieste da questo indirizzo IP, riprova più tardi.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return (req as any).user?.role === 'admin';
  },
});

// Rate limiter per newsletter subscription
export const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Hai raggiunto il limite di iscrizioni. Riprova più tardi.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return (req as any).user?.role === 'admin';
  },
});

// Rate limiter per game sessions
export const gameSessionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  message: 'Giochi troppo velocemente. Aspetta prima di giocare di nuovo.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return (req as any).user?.role === 'admin';
  },
});

// Rate limiter per admin
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Rate limit superato.',
  standardHeaders: true,
  legacyHeaders: false,
});
