import { z } from 'zod/v4';

export const requestResetSchema = z.object({
  email: z.email(),
});

export const executeResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const setEmailSchema = z.object({
  email: z.email(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});
