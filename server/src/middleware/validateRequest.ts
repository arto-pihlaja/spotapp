import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import { AppError } from '../utils/appError.js';

type RequestLocation = 'body' | 'query' | 'params';

export function validateRequest(schema: z.ZodType, location: RequestLocation = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[location]);
    if (!result.success) {
      const message = z.prettifyError(result.error);
      throw new AppError(400, 'VALIDATION_ERROR', message);
    }
    req[location] = result.data;
    next();
  };
}
