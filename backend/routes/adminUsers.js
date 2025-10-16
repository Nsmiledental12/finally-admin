import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import { authenticateSuperAdmin } from '../middleware/auth.js';

const router = express.Router();
const SALT_ROUNDS = 10;

router.get('/', authenticateSuperAdmin, async (req, res) => {
  try {
    const { role, status, search } = req.query;

    let query = `
      SELECT
        id,
        email,
        full_name,
        role,
        status,
        phone,
        department,
        last_login,
        created_at,
        updated_at,
        created_by
      FROM admin_users
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

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
    console.error('Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin users'
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
        role,
        status,
        phone,
        department,
        last_login,
        created_at,
        updated_at,
        created_by
      FROM admin_users
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching admin user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin user'
    });
  }
});

router.post('/', authenticateSuperAdmin, async (req, res) => {
  const {
    email,
    password,
    full_name,
    role = 'admin',
    status = 'active',
    phone,
    department,
    created_by
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
      'SELECT id FROM admin_users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An admin user with this email already exists'
      });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO admin_users
        (email, password_hash, full_name, role, status, phone, department, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, full_name, role, status, phone, department, created_at, updated_at`,
      [email, password_hash, full_name, role, status, phone, department, created_by]
    );

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create admin user'
    });
  }
});

router.put('/:id', authenticateSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    email,
    full_name,
    role,
    status,
    phone,
    department
  } = req.body;

  try {
    const existingUser = await pool.query(
      'SELECT id FROM admin_users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }

    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM admin_users WHERE email = $1 AND id != $2',
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'An admin user with this email already exists'
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

    if (role !== undefined) {
      updates.push(`role = $${paramIndex}`);
      params.push(role);
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

    if (department !== undefined) {
      updates.push(`department = $${paramIndex}`);
      params.push(department);
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
      UPDATE admin_users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, full_name, role, status, phone, department, created_at, updated_at
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Admin user updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating admin user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update admin user'
    });
  }
});

router.delete('/:id', authenticateSuperAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM admin_users
      WHERE id = $1
      RETURNING id, email, full_name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }

    res.json({
      success: true,
      message: 'Admin user deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete admin user'
    });
  }
});

export default router;
