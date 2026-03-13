import { Resend } from 'resend';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    logger.info({ to, subject, html }, 'EMAIL (dev mode — no RESEND_API_KEY)');
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    logger.error({ error, to, subject }, 'Failed to send email');
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
  const html = `
    <h2>Password Reset</h2>
    <p>You requested a password reset for your SpotApp account.</p>
    <p><a href="${resetUrl}">Click here to reset your password</a></p>
    <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
  `;
  await sendEmail(to, 'Reset your SpotApp password', html);
}

export async function sendEmailVerificationEmail(to: string, token: string): Promise<void> {
  const verifyUrl = `${env.APP_URL}/verify-email?token=${token}`;
  const html = `
    <h2>Verify Your Email</h2>
    <p>Please verify your email address for your SpotApp account.</p>
    <p><a href="${verifyUrl}">Click here to verify your email</a></p>
    <p>This link expires in 24 hours.</p>
  `;
  await sendEmail(to, 'Verify your SpotApp email', html);
}
