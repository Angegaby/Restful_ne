import nodemailer from 'nodemailer';

function getTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
}

export async function sendOtpEmail(to: string, code: string) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@tzw.com';
  const subject = 'TZW LTD — Verify your email';
  const text = `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`;
  const html = `<p>Your TZW LTD verification code is:</p><h2 style="letter-spacing:4px">${code}</h2><p>Expires in 10 minutes.</p>`;

  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[OTP Email — SMTP not configured] To: ${to} | Code: ${code}`);
    return { sent: false, devMode: true };
  }

  try {
    await transporter.sendMail({ from, to, subject, text, html });
    return { sent: true, devMode: false };
  } catch (err) {
    console.error('[OTP Email — send failed]', err);
    console.log(`[OTP Email — fallback] To: ${to} | Code: ${code}`);
    return { sent: false, devMode: true };
  }
}

const INVITE_ROLE_COPY: Record<
  string,
  { label: string; subject: string; intro: string; capabilities: string }
> = {
  INSPECTOR: {
    label: 'Field Inspector',
    subject: 'TZW LTD — Your inspector account is ready',
    intro: 'An administrator created your inspector account on the Fire Extinguisher Management System.',
    capabilities:
      'You can sign in to view assigned extinguishers, complete inspections, and log maintenance.',
  },
  USER: {
    label: 'Staff User',
    subject: 'TZW LTD — Your staff account is ready',
    intro: 'An administrator created your staff account on the Fire Extinguisher Management System.',
    capabilities:
      'You can sign in to view extinguisher status, request inspections, and view reports.',
  },
  ADMIN: {
    label: 'Administrator',
    subject: 'TZW LTD — Your administrator account is ready',
    intro: 'An administrator created your admin account on the Fire Extinguisher Management System.',
    capabilities: 'You can sign in to manage extinguishers, users, inspections, and reports.',
  },
};

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@tzw.com';
  const subject = 'TZW LTD — Reset your password';
  const text = `You requested a password reset for your FEMS account.

Open this link to choose a new password (valid for 1 hour):
${resetUrl}

If you did not request this, ignore this email. Your password will not change.`;

  const html = `
    <p>You requested a password reset for your <strong>TZW LTD FEMS</strong> account.</p>
    <p><a href="${resetUrl}" style="display:inline-block;background:#0d4f4f;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px">Reset password</a></p>
    <p style="color:#64748b;font-size:13px">Or copy this link: <br/><a href="${resetUrl}">${resetUrl}</a></p>
    <p style="color:#64748b;font-size:13px">This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
  `;

  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[Password Reset — SMTP not configured] To: ${to} | Link: ${resetUrl}`);
    return { sent: false, devMode: true };
  }

  try {
    await transporter.sendMail({ from, to, subject, text, html });
    return { sent: true, devMode: false };
  } catch (err) {
    console.error('[Password Reset Email — send failed]', err);
    console.log(`[Password Reset — fallback] To: ${to} | Link: ${resetUrl}`);
    return { sent: false, devMode: true };
  }
}

export async function sendInviteEmail(
  to: string,
  firstName: string,
  role: string,
  password: string
) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@tzw.com';
  const loginUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '') + '/login';
  const copy = INVITE_ROLE_COPY[role] ?? INVITE_ROLE_COPY.USER;
  const roleLabel = copy.label;

  const subject = copy.subject;
  const text = `Hello ${firstName},

${copy.intro}

Role: ${roleLabel}
Email: ${to}
Temporary password: ${password}

${copy.capabilities}

Sign in: ${loginUrl}

You can change your password anytime under Profile after logging in.

Do not share this email. If you did not expect this account, contact your administrator.`;

  const html = `
    <p>Hello <strong>${firstName}</strong>,</p>
    <p>${copy.intro}</p>
    <p style="color:#475569;font-size:14px">${copy.capabilities}</p>
    <table style="border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 12px;color:#64748b">Role</td><td><strong>${roleLabel}</strong></td></tr>
      <tr><td style="padding:6px 12px;color:#64748b">Email</td><td><strong>${to}</strong></td></tr>
      <tr><td style="padding:6px 12px;color:#64748b">Password</td><td><code style="background:#f1f5f9;padding:4px 8px;border-radius:4px">${password}</code></td></tr>
    </table>
    <p><a href="${loginUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px">Sign in to FEMS</a></p>
    <p style="color:#64748b;font-size:13px">Change your password under <strong>Profile</strong> after signing in.</p>
  `;

  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[Invite Email — SMTP not configured] To: ${to} | Password: ${password} | Login: ${loginUrl}`);
    return { sent: false, devMode: true };
  }

  try {
    await transporter.sendMail({ from, to, subject, text, html });
    return { sent: true, devMode: false };
  } catch (err) {
    console.error('[Invite Email — send failed]', err);
    console.log(`[Invite Email — fallback] To: ${to} | Password: ${password} | Login: ${loginUrl}`);
    return { sent: false, devMode: true };
  }
}
