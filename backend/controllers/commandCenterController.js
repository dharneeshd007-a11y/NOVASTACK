const db = require('../config/db');

exports.getCommandCenterState = async (req, res) => {
  try {
    const [emergencies] = await db.query(`
      SELECT e.*, u.name as reporter_name,
             er.status as response_status, er.responder_id, ru.name as responder_name
      FROM emergencies e 
      JOIN users u ON e.user_id = u.id
      LEFT JOIN emergency_responses er ON e.id = er.emergency_id AND er.status != 'REJECTED'
      LEFT JOIN users ru ON er.responder_id = ru.id
      WHERE e.status != 'RESOLVED'
      ORDER BY e.created_at DESC
    `);

    const [responders] = await db.query(`
      SELECT id, name, role, availability, last_latitude, last_longitude, last_active 
      FROM users 
      WHERE role IN ('driver', 'hospital_admin')
    `);

    // Unified state for live map and queue
    res.json({ emergencies, responders });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
