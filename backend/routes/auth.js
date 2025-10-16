import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';

const router = express.Router();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000;

router.post('/super-admin/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, password_hash, full_name, status, failed_login_attempts, account_locked_until
       FROM super_admins
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const superAdmin = result.rows[0];

    if (superAdmin.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive'
      });
    }

    if (superAdmin.account_locked_until && new Date(superAdmin.account_locked_until) > new Date()) {
      const lockoutMinutes = Math.ceil((new Date(superAdmin.account_locked_until) - new Date()) / 60000);
      return res.status(403).json({
        success: false,
        error: `Account is locked. Please try again in ${lockoutMinutes} minutes.`
      });
    }

    const isPasswordValid = await bcrypt.compare(password, superAdmin.password_hash);

    if (!isPasswordValid) {
      const failedAttempts = (superAdmin.failed_login_attempts || 0) + 1;

      if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
        await pool.query(
          `UPDATE super_admins
           SET failed_login_attempts = $1, account_locked_until = $2
           WHERE id = $3`,
          [failedAttempts, lockUntil, superAdmin.id]
        );

        return res.status(403).json({
          success: false,
          error: 'Account locked due to too many failed login attempts. Please try again in 15 minutes.'
        });
      }

      await pool.query(
        'UPDATE super_admins SET failed_login_attempts = $1 WHERE id = $2',
        [failedAttempts, superAdmin.id]
      );

      return res.status(401).json({
        success: false,
        error: `Invalid email or password. ${MAX_LOGIN_ATTEMPTS - failedAttempts} attempts remaining.`
      });
    }

    await pool.query(
      `UPDATE super_admins
       SET last_login = CURRENT_TIMESTAMP, failed_login_attempts = 0, account_locked_until = NULL
       WHERE id = $1`,
      [superAdmin.id]
    );

    const token = generateToken({
      userId: superAdmin.id,
      email: superAdmin.email,
      userType: 'super_admin'
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          full_name: superAdmin.full_name,
          userType: 'super_admin'
        }
      }
    });
  } catch (error) {
    console.error('Super admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, password_hash, full_name, role, status
       FROM admin_users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const admin = result.rows[0];

    if (admin.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    await pool.query(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [admin.id]
    );

    const token = generateToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      userType: 'admin'
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
          role: admin.role,
          userType: 'admin'
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  try {
    let userType = null;
    let userExists = false;

    const superAdminResult = await pool.query(
      'SELECT id, email, full_name FROM super_admins WHERE email = $1 AND status = $2',
      [email, 'active']
    );

    if (superAdminResult.rows.length > 0) {
      userType = 'super_admin';
      userExists = true;
    } else {
      const adminResult = await pool.query(
        'SELECT id, email, full_name FROM admin_users WHERE email = $1 AND status = $2',
        [email, 'active']
      );

      if (adminResult.rows.length > 0) {
        userType = 'admin';
        userExists = true;
      }
    }

    if (!userExists) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY);

    await pool.query(
      `INSERT INTO admin_password_reset_tokens (email, token_hash, user_type, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [email, tokenHash, userType, expiresAt]
    );

    try {
      await sendPasswordResetEmail(email, resetToken, userType);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request'
    });
  }
});

router.post('/verify-reset-token', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token is required'
    });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await pool.query(
      `SELECT id, email, user_type, expires_at, used
       FROM admin_password_reset_tokens
       WHERE token_hash = $1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    const resetToken = result.rows[0];

    if (resetToken.used) {
      return res.status(400).json({
        success: false,
        error: 'This reset token has already been used'
      });
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Reset token has expired'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        email: resetToken.email
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify reset token'
    });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Token and new password are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long'
    });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await pool.query(
      `SELECT id, email, user_type, expires_at, used
       FROM admin_password_reset_tokens
       WHERE token_hash = $1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    const resetToken = result.rows[0];

    if (resetToken.used) {
      return res.status(400).json({
        success: false,
        error: 'This reset token has already been used'
      });
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Reset token has expired'
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    if (resetToken.user_type === 'super_admin') {
      await pool.query(
        `UPDATE super_admins
         SET password_hash = $1, failed_login_attempts = 0, account_locked_until = NULL
         WHERE email = $2`,
        [passwordHash, resetToken.email]
      );
    } else {
      await pool.query(
        'UPDATE admin_users SET password_hash = $1 WHERE email = $2',
        [passwordHash, resetToken.email]
      );
    }

    await pool.query(
      'UPDATE admin_password_reset_tokens SET used = true WHERE id = $1',
      [resetToken.id]
    );

    await pool.query(
      'DELETE FROM admin_password_reset_tokens WHERE email = $1 AND id != $2',
      [resetToken.email, resetToken.id]
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

export default router;
