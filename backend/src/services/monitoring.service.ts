import * as Sentry from '@sentry/node';
import type { RequestHandler, ErrorRequestHandler } from 'express';
import { config } from '../config.js';
import { logger } from '../logger.js';

export const initSentry = () => {
  if (!config.sentryDsn) {
    logger.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.env,
    tracesSampleRate: config.env === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out health check errors
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      return event;
    },
  });

  logger.info('Sentry initialized for error tracking');
};

export const captureException = (error: Error, context?: any) => {
  if (!config.sentryDsn) return;
  
  Sentry.captureException(error, {
    extra: context,
  });
};

export const captureMessage = (message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info', context?: any) => {
  if (!config.sentryDsn) return;
  
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
};

export const setSentryUser = (userId: string, email?: string) => {
  if (!config.sentryDsn) return;
  
  Sentry.setUser({
    id: userId,
    email,
  });
};

export const clearSentryUser = () => {
  if (!config.sentryDsn) return;
  Sentry.setUser(null);
};

// Sentry Express middleware
export const sentryErrorHandler: ErrorRequestHandler = (err, _req, _res, next) => {
  if (!config.sentryDsn) {
    next(err);
    return;
  }
  Sentry.captureException(err);
  next(err);
};

export const sentryRequestHandler: RequestHandler = (req, _res, next) => {
  if (config.sentryDsn) {
    Sentry.captureMessage(`${req.method} ${req.path}`, 'debug');
  }
  next();
};
