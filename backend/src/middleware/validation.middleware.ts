import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors.js';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = { ...req.body, ...req.query, ...req.params };
      const validated = schema.parse(data);
      req.body = { ...req.body, ...validated };
      next();
    } catch (error: any) {
      const message = error.errors?.[0]?.message || 'Validation error';
      next(new ValidationError(message));
    }
  };
};
