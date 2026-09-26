import nodemailer from 'nodemailer';
import dns from 'dns';
import net from 'net';
import dotenv from 'dotenv';

dotenv.config();

// Common disposable / fake email domains list to reject immediately
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com',
  'dispostable.com', 'yopmail.com', 'trashmail.com', 'sharklasers.com',
  'getnada.com', 'temp-mail.org', 'fakeinbox.com', 'throwawaymail.com',
  'mytemp.email', 'crazymailing.com', 'nada.ltd', 'mohmal.com'
]);

/**
 * Verify if an email address actually exists.
 * 1. Syntax check (RFC 5322)
 * 2. Disposable domain check
 * 3. DNS MX record lookup
 * 4. SMTP RCPT TO mailbox existence check (with fallback)
 */
export async function verifyEmailAddress(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Email address cannot be empty.' };
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, reason: 'Invalid email format. Please enter a valid address (e.g. name@domain.com).' };
  }

  const [username, domain] = trimmed.split('@');

  // Check 1: Disposable domain check
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, reason: 'Disposable / temporary email addresses are not permitted. Please use a real email.' };
  }

  // Check 2: DNS MX Record lookup
  let mxRecords;
  try {
    mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: `The email domain (@${domain}) does not exist or has no active mail servers.` };
    }
  } catch (err) {
    return { valid: false, reason: `The email domain (@${domain}) does not exist.` };
  }

  // Sort MX records by priority (lowest number = highest priority)
  mxRecords.sort((a, b) => a.priority - b.priority);
  const mxHost = mxRecords[0].exchange;

  // Check 3: Optional SMTP Mailbox Ping (timeout 3000ms)
  const isMailboxValid = await pingSmtpMailbox(mxHost, trimmed);
  if (isMailboxValid === false) {
    return { valid: false, reason: `The mailbox '${trimmed}' does not exist on mail server ${mxHost}.` };
  }

  return { valid: true, domain };
}

/**
 * Ping SMTP server to verify mailbox existence via RCPT TO.
 * Returns true if mailbox exists, false if explicitly rejected (550), or null if connection timed out.
 */
function pingSmtpMailbox(mxHost, email) {
  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxHost);
    let step = 0;
    let status = null;

    socket.setTimeout(3500);

    socket.on('data', (data) => {
      const response = data.toString();
      const code = parseInt(response.substring(0, 3), 10);

      if (step === 0 && code === 220) {
        step = 1;
        socket.write(`EHLO stocksense.com\r\n`);
      } else if (step === 1 && (code === 250 || code === 220)) {
        step = 2;
        socket.write(`MAIL FROM:<verify@stocksense.com>\r\n`);
      } else if (step === 2 && code === 250) {
        step = 3;
        socket.write(`RCPT TO:<${email}>\r\n`);
      } else if (step === 3) {
        if (code === 250 || code === 251) {
          status = true; // Mailbox exists!
        } else if (code === 550 || code === 551 || code === 552 || code === 553 || code === 501) {
          status = false; // Mailbox does NOT exist!
        }
        socket.write(`QUIT\r\n`);
        socket.end();
      }
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(null); // Network / ISP blocked port 25, fallback to MX check
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(null);
    });

    socket.on('close', () => {
      resolve(status);
    });
  });
}

// Create Nodemailer Transporter
export function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  // Fallback dev transporter
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'ethereal.user@ethereal.email',
      pass: 'ethereal.pass'
    }
  });
}

/**
 * Send real 6-digit OTP email to user's registered inbox.
 */
export async function sendOTPEmail(toEmail, otpCode) {
  const transporter = createTransporter();
  const fromName = process.env.SMTP_FROM || '"StockSense Security" <no-reply@stocksense.com>';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #334155;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6366f1; margin: 0; font-size: 24px;">StockSense</h1>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">Inventory Management System</p>
      </div>

      <div style="background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #475569; text-align: center;">
        <h2 style="color: #f8fafc; font-size: 16px; margin-top: 0;">Password Reset Verification Code</h2>
        <p style="color: #cbd5e1; font-size: 13px;">Your 6-digit one-time password (OTP) is:</p>
        
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981; margin: 20px 0; background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #059669;">
          ${otpCode}
        </div>

        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
          This code is valid for <strong>10 minutes</strong>.
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromName,
      to: toEmail,
      subject: `[StockSense] Your Password Reset OTP Code: ${otpCode}`,
      html: htmlContent
    });

    console.log(`✉️ OTP email sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`Failed to send OTP email to ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}
