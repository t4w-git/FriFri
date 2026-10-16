import pino from 'pino';
import { config } from './config.js';

const pinoConfig = {
  level: config.logging.level,
  transport:
    config.env === 'development'
      ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
      : undefined
};

export const logger = pino(pinoConfig);
