import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: string } | null;
    }
  }
}

/**
 * Extracts and verifies JWT from Authorization header.
 * Attaches user to req.user if valid, sets null if missing/invalid.
 * Does NOT reject anonymous requests — use `requireAuth` for that.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    req.user = null;
    next();
    return;
  }

  try {
    const token = header.slice(7);
    req.user = verifyAccessToken(token);
  } catch {
    req.user = null;
  }

  next();
}

/**
 * Requires a valid JWT. Returns 401 if not authenticated.
 * Also checks if the user's account has been blocked.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  try {
    const token = header.slice(7);
    req.user = verifyAccessToken(token);
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { isBlocked: true },
  });

  if (dbUser?.isBlocked) {
    throw new AppError(403, 'ACCOUNT_BLOCKED', 'Account blocked');
  }

  next();
}

/**
 * Requires the authenticated user to have a specific role.
 * Must be used after requireAuth.
 */
export function requireRole(role: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }
    next();
  };
}
