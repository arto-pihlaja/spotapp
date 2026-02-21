import { prisma } from '../config/prisma.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { AppError } from '../utils/appError.js';

interface RegisterInput {
  username: string;
  password: string;
  invitationCode: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: { id: string; username: string; role: string };
}

export async function register(input: RegisterInput): Promise<AuthTokens> {
  // Validate invitation code
  const code = await prisma.invitationCode.findUnique({
    where: { code: input.invitationCode },
  });

  if (!code) {
    throw new AppError(403, 'FORBIDDEN', 'Invalid invitation code');
  }

  if (code.currentUses >= code.maxUses) {
    throw new AppError(403, 'FORBIDDEN', 'Invalid invitation code');
  }

  if (code.expiresAt && code.expiresAt < new Date()) {
    throw new AppError(403, 'FORBIDDEN', 'Invalid invitation code');
  }

  // Check username uniqueness
  const existing = await prisma.user.findUnique({ where: { username: input.username } });
  if (existing) {
    throw new AppError(409, 'USERNAME_TAKEN', 'Username is already taken');
  }

  // Create user and consume invitation code in transaction
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        username: input.username,
        passwordHash,
      },
    });

    await tx.invitationCode.update({
      where: { id: code.id },
      data: { currentUses: { increment: 1 } },
    });

    return newUser;
  });

  const payload = { userId: user.id, role: user.role };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user.id, username: user.username, role: user.role },
  };
}

export async function login(username: string, password: string): Promise<AuthTokens> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }

  if (user.isBlocked) {
    throw new AppError(403, 'ACCOUNT_BLOCKED', 'Account blocked');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }

  const payload = { userId: user.id, role: user.role };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user.id, username: user.username, role: user.role },
  };
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.isBlocked) {
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired refresh token');
  }

  const newPayload = { userId: user.id, role: user.role };

  return {
    accessToken: signAccessToken(newPayload),
    refreshToken: signRefreshToken(newPayload),
    user: { id: user.id, username: user.username, role: user.role },
  };
}
