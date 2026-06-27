import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function createTransporter() {
  const { host, port, secure, user, pass } = env.smtp;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

export async function sendMail({ to, subject, html }) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('[mailer] SMTP not configured — email would have been sent:', { to, subject });
    return;
  }

  await transporter.sendMail({ from: env.smtp.from, to, subject, html });
}
