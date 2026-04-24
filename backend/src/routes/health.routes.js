const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

router.get('/db', async (req, res) => {
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    res.json({ success: true, status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ success: false, status: 'error', database: 'disconnected', error: err.message });
  }
});

module.exports = router;
