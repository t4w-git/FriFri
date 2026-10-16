export interface IConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  corsOrigin: string[];
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiry: string;
  };
  admin: {
    email: string;
    password: string;
  };
  email: {
    service: 'sendgrid' | 'nodemailer';
    sendgrid?: {
      apiKey: string;
    };
    nodemailer?: {
      host: string;
      port: number;
      user: string;
      password: string;
    };
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
  sentry?: {
    dsn: string;
  };
  sentryDsn?: string;
}

function getConfig(): IConfig {
  const env = (process.env.NODE_ENV || 'development') as IConfig['env'];
  const port = parseInt(process.env.PORT || '3000', 10);

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
  }

  const corsOrigin = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(
    ','
  );

  return {
    env,
    port,
    corsOrigin,
    database: {
      url: process.env.DATABASE_URL
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiry: process.env.JWT_EXPIRY || '7d'
    },
    email: {
      service: (process.env.EMAIL_SERVICE || 'nodemailer') as IConfig['email']['service'],
      sendgrid: process.env.SENDGRID_API_KEY ? {
        apiKey: process.env.SENDGRID_API_KEY
      } : undefined,
      nodemailer: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASSWORD || ''
      }
    },
    logging: {
      level: (process.env.LOG_LEVEL || 'info') as IConfig['logging']['level']
    },
    admin: {
      email: process.env.ADMIN_EMAIL!,
      password: process.env.ADMIN_PASSWORD!
    },
    sentryDsn: process.env.SENTRY_DSN
  };
}

export const config = getConfig();
