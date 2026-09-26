import express from 'express';
import bcrypt from 'bcryptjs';
import { run, get } from '../db/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === 'staff' ? 'staff' : 'manager';

    const result = await run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), passwordHash, userRole]
    );

    const user = { id: result.lastID, name: name.trim(), email: email.toLowerCase().trim(), role: userRole };
    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userRow = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!userRow) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, userRow.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = { id: userRow.id, name: userRow.name, email: userRow.email, role: userRow.role };
    const token = generateToken(user);

    res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
});

// Request OTP for Password Reset
router.post('/request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const userRow = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!userRow) {
      return res.status(404).json({ error: 'No user account found with this email' });
    }

    // Generate random 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    await run('DELETE FROM otp_codes WHERE email = ?', [email.toLowerCase().trim()]);
    await run('INSERT INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)', [
      email.toLowerCase().trim(),
      code,
      expiresAt
    ]);

    // Return the generated OTP code in response so user/tester can instantly reset password
    res.json({
      message: 'OTP sent successfully! (Simulated Mode)',
      code: code,
      email: email.toLowerCase().trim()
    });
  } catch (err) {
    console.error('OTP error:', err);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
});

// Reset Password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const record = await get(
      'SELECT * FROM otp_codes WHERE email = ? AND code = ? AND expires_at > CURRENT_TIMESTAMP ORDER BY id DESC LIMIT 1',
      [email.toLowerCase().trim(), otp.trim()]
    );

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await run('UPDATE users SET password_hash = ? WHERE email = ?', [newHash, email.toLowerCase().trim()]);
    await run('DELETE FROM otp_codes WHERE email = ?', [email.toLowerCase().trim()]);

    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Me endpoint
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userRow = await get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(userRow);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching user details' });
  }
});

export default router;
