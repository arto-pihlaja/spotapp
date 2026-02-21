import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

/**
 * Rejects requests that fill the honeypot field (hidden from real users, filled by bots).
 * Expects body._hp to be absent or empty.
 */
export function honeypotCheck(req: Request, _res: Response, next: NextFunction) {
  if (req.body?._hp) {
    throw new AppError(403, 'FORBIDDEN', 'Request rejected');
  }
  next();
}

/**
 * Rejects requests submitted too quickly (< minMs since form timestamp).
 * Expects body._ts to be a Unix ms timestamp of when the form was rendered.
 */
export function timeCheck(minMs: number) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const formTimestamp = Number(req.body?._ts);
    if (!formTimestamp || Date.now() - formTimestamp < minMs) {
      throw new AppError(403, 'FORBIDDEN', 'Request rejected');
    }
    next();
  };
}
