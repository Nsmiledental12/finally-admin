import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        full_name,
        email,
        country_code,
        mobile_number,
        license_number,
        specialization,
        years_of_experience,
        clinic_address,
        status,
        created_at,
        updated_at
      FROM doctors
      ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctor applications'
    });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        id,
        full_name,
        email,
        country_code,
        mobile_number,
        license_number,
        specialization,
        years_of_experience,
        clinic_address,
        status,
        created_at,
        updated_at
      FROM doctors
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctor'
    });
  }
});

router.get('/status/:status', async (req, res) => {
  const { status } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        id,
        full_name,
        email,
        country_code,
        mobile_number,
        license_number,
        specialization,
        years_of_experience,
        clinic_address,
        status,
        created_at,
        updated_at
      FROM doctors
      WHERE status = $1
      ORDER BY created_at DESC`,
      [status]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching doctors by status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctors by status'
    });
  }
});

router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, userRole } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'Status is required'
    });
  }

  const validStatuses = ['new', 'in-process', 'pending', 'approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status value'
    });
  }

  if ((status === 'approved' || status === 'rejected') && userRole !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Only super admins can approve or reject applications'
    });
  }

  try {
    const result = await pool.query(
      `UPDATE doctors
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating doctor status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update doctor status'
    });
  }
});

router.get('/approved/list', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        full_name,
        email,
        country_code,
        mobile_number,
        license_number,
        specialization,
        years_of_experience,
        clinic_address,
        status,
        created_at,
        updated_at
      FROM doctors
      WHERE status = 'approved'
      ORDER BY updated_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching approved doctors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approved doctors'
    });
  }
});

router.put('/:id/resign', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE doctors
       SET status = 'resigned', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'approved'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found or not approved'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error marking doctor as resigned:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update doctor status'
    });
  }
});

export default router;
