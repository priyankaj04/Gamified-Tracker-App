import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { fail } from './errorHandler';

export const validateBody =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
        .join('; ');
      return fail(res, message, 422);
    }
    (req as any).body = result.data;
    next();
  };
