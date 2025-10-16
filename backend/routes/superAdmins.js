import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../config/database.js';
import { authenticateSuperAdmin } from '../middleware/auth.js';

const router = express.Router();
const SALT_ROUNDS = 10;

router.get('/', authenticateSuperAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT
        id,
        email,
        full_name,
        status,
        phone,
        last_login,
        created_at,
        updated_at,
        failed_login_attempts
      FROM super_admins
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching super admins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch super admins'
    });
  }
});

router.get('/profile/me', authenticateSuperAdmin, async (req, res) => {
  try {
    const superAdminId = req.superAdmin.id;

    const result = await pool.query(
      `SELECT
        id,
        email,
        full_name,
        last_login,
        created_at
      FROM super_admins
      WHERE id = $1`,
      [superAdminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Super admin not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching super admin profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

router.get('/:id', authenticateSuperAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        id,
        email,
        full_name,
        status,
        phone,
        last_login,
        created_at,
        updated_at,
        failed_login_attempts
      FROM super_admins
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Super admin not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching super admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch super admin'
    });
  }
});

router.post('/', authenticateSuperAdmin, async (req, res) => {
  const {
    email,
    password,
    full_name,
    status = 'active',
    phone
  } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({
      success: false,
      error: 'Email, password, and full name are required'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long'
    });
  }

  try {
    const existingUser = await pool.query(
      'SELECT id FROM super_admins WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'A super admin with this email already exists'
      });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO super_admins
        (email, password_hash, full_name, status, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, full_name, status, phone, created_at, updated_at`,
      [email, password_hash, full_name, status, phone]
    );

    res.status(201).json({
      success: true,
      message: 'Super admin created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating super admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create super admin'
    });
  }
});

router.put('/profile/me', authenticateSuperAdmin, async (req, res) => {
  const superAdminId = req.superAdmin.id;
  const { email, full_name } = req.body;

  if (!email && !full_name) {
    return res.status(400).json({
      success: false,
      error: 'At least one field (email or full_name) is required'
    });
  }

  try {
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      const emailCheck = await pool.query(
        'SELECT id FROM super_admins WHERE email = $1 AND id != $2',
        [email, superAdminId]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'A super admin with this email already exists'
        });
      }
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramIndex}`);
      params.push(full_name);
      paramIndex++;
    }

    params.push(superAdminId);
    const query = `
      UPDATE super_admins
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, full_name, last_login, created_at
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating super admin profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

router.put('/:id', authenticateSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    email,
    full_name,
    status,
    phone
  } = req.body;

  try {
    const existingUser = await pool.query(
      'SELECT id FROM super_admins WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Super admin not found'
      });
    }

    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM super_admins WHERE email = $1 AND id != $2',
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'A super admin with this email already exists'
        });
      }
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramIndex}`);
      params.push(full_name);
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      params.push(phone);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    params.push(id);
    const query = `
      UPDATE super_admins
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, full_name, status, phone, created_at, updated_at
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Super admin updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating super admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update super admin'
    });
  }
});

router.delete('/:id', authenticateSuperAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM super_admins WHERE status = $1', ['active']);
    const activeCount = parseInt(countResult.rows[0].count);

    if (activeCount <= 1) {
      const checkResult = await pool.query('SELECT id, status FROM super_admins WHERE id = $1', [id]);
      if (checkResult.rows.length > 0 && checkResult.rows[0].status === 'active') {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the last active super admin'
        });
      }
    }

    const result = await pool.query(
      `DELETE FROM super_admins
      WHERE id = $1
      RETURNING id, email, full_name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Super admin not found'
      });
    }

    res.json({
      success: true,
      message: 'Super admin deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting super admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete super admin'
    });
  }
});

router.post('/profile/change-password', authenticateSuperAdmin, async (req, res) => {
  const superAdminId = req.superAdmin.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 8 characters long'
    });
  }

  try {
    const result = await pool.query(
      'SELECT id, password_hash FROM super_admins WHERE id = $1',
      [superAdminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Super admin not found'
      });
    }

    const superAdmin = result.rows[0];
    const isPasswordValid = await bcrypt.compare(currentPassword, superAdmin.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await pool.query(
      'UPDATE super_admins SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, superAdminId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

router.post('/:id/change-password', authenticateSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 8 characters long'
    });
  }

  try {
    const result = await pool.query(
      'SELECT id, password_hash FROM super_admins WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Super admin not found'
      });
    }

    const superAdmin = result.rows[0];
    const isPasswordValid = await bcrypt.compare(currentPassword, superAdmin.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await pool.query(
      'UPDATE super_admins SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

router.post('/request-password-reset', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  try {
    const result = await pool.query(
      'SELECT id FROM super_admins WHERE email = $1 AND status = $2',
      [email, 'active']
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link will be sent'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000);

    await pool.query(
      'UPDATE super_admins SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, result.rows[0].id]
    );

    res.json({
      success: true,
      message: 'If the email exists, a password reset link will be sent',
      resetToken
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request password reset'
    });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Reset token and new password are required'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long'
    });
  }

  try {
    const result = await pool.query(
      `SELECT id FROM super_admins
       WHERE password_reset_token = $1
       AND password_reset_expires > CURRENT_TIMESTAMP
       AND status = $2`,
      [token, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await pool.query(
      `UPDATE super_admins
       SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL,
           failed_login_attempts = 0, account_locked_until = NULL
       WHERE id = $2`,
      [newPasswordHash, result.rows[0].id]
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

export default router;
