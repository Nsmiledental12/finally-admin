import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        doctor_id,
        name,
        address,
        phone,
        website,
        description,
        business_hours,
        created_at,
        updated_at
      FROM clinics
      ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clinics'
    });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        id,
        doctor_id,
        name,
        address,
        phone,
        website,
        description,
        business_hours,
        created_at,
        updated_at
      FROM clinics
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Clinic not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching clinic:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clinic'
    });
  }
});

export default router;
