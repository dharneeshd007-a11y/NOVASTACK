const db = require('../config/db');

exports.createAlert = async (req, res, next) => {
  try {
    const { title, message, severity, center_latitude, center_longitude, radius_km, expires_at } = req.body;
    const [result] = await db.query(
      'INSERT INTO public_alerts (created_by, title, message, severity, center_latitude, center_longitude, radius_km, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.userId, title, message, severity, center_latitude, center_longitude, radius_km, expires_at || null]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    next(error);
  }
};

exports.getAlerts = async (req, res, next) => {
  try {
    const [alerts] = await db.query('SELECT * FROM public_alerts WHERE expires_at IS NULL OR expires_at > NOW() ORDER BY created_at DESC');
    res.json(alerts);
  } catch (error) {
    next(error);
  }
};
