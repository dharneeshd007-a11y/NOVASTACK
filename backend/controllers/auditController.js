const db = require('../config/db');

exports.getAuditLogs = async (req, res) => {
  try {
    const [logs] = await db.query(`
      SELECT a.*, u.name as user_name 
      FROM audit_logs a 
      JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC 
      LIMIT 100
    `);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logAction = async (userId, action, entityType, entityId, oldValue, newValue, ip, userAgent) => {
  try {
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, action, entityType, entityId, oldValue ? JSON.stringify(oldValue) : null, newValue ? JSON.stringify(newValue) : null, ip, userAgent]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};
