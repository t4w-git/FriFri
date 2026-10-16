import 'dotenv/config.js';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { logger } from './logger.js';
import { AppError } from './utils/errors.js';
import { swaggerSpec } from './utils/swagger.js';
import { initSentry, sentryErrorHandler, sentryRequestHandler } from './services/monitoring.service.js';
import { authService } from './services/auth.service.js';
import { emailService } from './services/email.service.js';
import authRouter from './routes/auth.routes.js';
import publicRouter from './routes/public.routes.js';
import poemsRouter from './routes/poems.routes.js';
import sponsorsRouter from './routes/sponsors.routes.js';
import prizeCodesRouter from './routes/prizecodes.routes.js';
import gameSessionsRouter from './routes/gamesessions.routes.js';
import newsletterRouter from './routes/newsletter.routes.js';
import adminRouter from './routes/admin.routes.js';
import uploadRouter from './routes/upload.routes.js';
import eventsRouter from './routes/events.routes.js';
import questionsRouter from './routes/questions.routes.js';
import { authMiddleware, requireRole } from './middleware/auth.middleware.js';
import { publicLimiter as _, adminLimiter } from './middleware/rateLimit.middleware.js';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

// Initialize Sentry
initSentry();

const app: Express = express();

// Set proxy trust early - MUST be before rate limiting middleware
app.set('trust proxy', 1);

// Serve uploaded files FIRST (before helmet) - with explicit CORP headers
app.use('/uploads', (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
app.use('/uploads', express.static(uploadsDir));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// Middleware - Order matters!
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:3000"],
    }
  }
}));

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true
  })
);

// Set CORP headers globally (after helmet to override defaults)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(pinoHttp({ logger }));
app.use(sentryRequestHandler);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// API Routes
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({ message: 'Frifri API v1', version: '1.0.0', docs: '/api/v1/docs' });
});

// Auth routes (public)
app.use('/api/v1/auth', authRouter);

// Public data routes
app.use('/api/v1/public', publicRouter);

// Public redemption endpoints (no auth required for email links)
app.use('/api/v1/prize-codes', prizeCodesRouter);

// Upload routes (protected)
app.use('/api/v1/upload', authMiddleware, requireRole(['admin']), adminLimiter, uploadRouter);

// Newsletter routes (public, individual routes have their own auth)
app.use('/api/v1/newsletter', newsletterRouter);

// Protected routes
app.use('/api/v1/poems', authMiddleware, requireRole(['admin']), adminLimiter, poemsRouter);
app.use('/api/v1/sponsors', authMiddleware, requireRole(['admin']), adminLimiter, sponsorsRouter);
app.use('/api/v1/game-sessions', gameSessionsRouter);
app.use('/api/v1/admin', authMiddleware, requireRole(['admin']), adminLimiter, adminRouter);
app.use('/api/v1/game-questions', questionsRouter);
app.use('/api/v1', eventsRouter);

// Serve index.html for any non-API route (SPA fallback)
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, 'Route not found'));
});

// Sentry error handler (before custom error handler)
app.use(sentryErrorHandler);

// Error handler
app.use(
  (
    err: Error | AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    if (err instanceof AppError) {
      logger.error({
        status: err.statusCode,
        code: err.code,
        message: err.message
      });
      const errorResponse: any = {
        error: {
          code: err.code,
          message: err.message
        }
      };
      if (err.metadata) {
        errorResponse.error = { ...errorResponse.error, ...err.metadata };
      }
      res.status(err.statusCode).json(errorResponse);
    } else {
      logger.error(err);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: config.env === 'production' ? 'Internal server error' : err.message
        }
      });
    }
  }
);

const PORT = config.port;

app.listen(PORT, async () => {
  logger.info(`🚀 Server running on port ${PORT} in ${config.env} mode`);
  
  // Test SMTP connection on startup
  const smtp = config.email.nodemailer;
  if (config.email.service === 'nodemailer' && smtp?.user && smtp.password) {
    try {
      logger.info('🔧 Testing SMTP connection...');
      const testResult = await (emailService as any).transporter?.verify?.();
      if (testResult) {
        logger.info('✅ SMTP connection verified successfully', {
          host: smtp.host,
          port: smtp.port,
          user: smtp.user
        });
      } else {
        logger.warn('⚠️ SMTP transporter.verify() returned false');
      }
    } catch (error: any) {
      logger.error('❌ SMTP connection failed on startup', {
        host: smtp.host,
        port: smtp.port,
        error: error?.message,
        code: error?.code
      });
    }
  } else if (config.email.service === 'nodemailer') {
    logger.warn('⚠️ SMTP check skipped: EMAIL_USER or EMAIL_PASSWORD is not configured');
  }
  
  // Initialize admin account from .env on startup
  try {
    await authService.initializeAdminAccount();
  } catch (error: any) {
    logger.error({ err: error }, 'Failed to initialize admin account');
    process.exit(1);
  }
});

export default app;
