import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

router.get('/overview', async (req, res) => {
  try {
    const [usersCount, approvedDoctorsCount, clinicsCount, applicationStatusBreakdown] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query("SELECT COUNT(*) as count FROM doctors WHERE status = 'approved'"),
      pool.query('SELECT COUNT(*) as count FROM clinics'),
      pool.query(`
        SELECT
          status,
          COUNT(*) as count
        FROM doctors
        WHERE status IN ('new', 'in-process', 'pending', 'approved', 'rejected')
        GROUP BY status
      `)
    ]);

    const statusBreakdown = {
      new: 0,
      'in-process': 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    applicationStatusBreakdown.rows.forEach(row => {
      statusBreakdown[row.status] = parseInt(row.count);
    });

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(usersCount.rows[0].count),
        approvedDoctors: parseInt(approvedDoctorsCount.rows[0].count),
        totalClinics: parseInt(clinicsCount.rows[0].count),
        applicationStatusBreakdown: statusBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data'
    });
  }
});

router.get('/clinics-growth', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'Mon') as month,
        COUNT(*) as count
      FROM clinics
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    const monthlyData = result.rows.map(row => ({
      month: row.month,
      count: parseInt(row.count)
    }));

    res.json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    console.error('Error fetching clinics growth data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clinics growth data'
    });
  }
});

router.get('/applications-trend', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'Mon') as month,
        COUNT(*) as count
      FROM doctors
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    const monthlyData = result.rows.map(row => ({
      month: row.month,
      count: parseInt(row.count)
    }));

    res.json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    console.error('Error fetching applications trend data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications trend data'
    });
  }
});

router.get('/doctor-status-distribution', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        CASE
          WHEN status = 'resigned' THEN 'resigned'
          WHEN status = 'approved' THEN 'active'
          ELSE 'other'
        END as status_category,
        COUNT(*) as count
      FROM doctors
      WHERE status IN ('approved', 'resigned')
      GROUP BY status_category
    `);

    const distribution = {
      active: 0,
      resigned: 0
    };

    result.rows.forEach(row => {
      if (row.status_category === 'active' || row.status_category === 'resigned') {
        distribution[row.status_category] = parseInt(row.count);
      }
    });

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Error fetching doctor status distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctor status distribution'
    });
  }
});

export default router;
