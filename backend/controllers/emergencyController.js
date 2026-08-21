const db = require('../config/db');
const socketConfig = require('../config/socket');

exports.createEmergency = async (req, res) => {
  try {
    const { type, description, latitude, longitude, address, severity } = req.body;
    
    if (!type || !severity) {
      return res.status(400).json({ message: 'Type and severity are required' });
    }

    const [result] = await db.query(
      `INSERT INTO emergencies (user_id, type, description, latitude, longitude, address, severity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [req.userId, type, description, latitude, longitude, address, severity]
    );

    const [newEmergency] = await db.query(`SELECT * FROM emergencies WHERE id = ?`, [result.insertId]);
    
    const io = socketConfig.getIO();
    io.to('responders').emit('new_emergency', newEmergency[0]);

    await db.query(`
      INSERT INTO notifications (user_id, emergency_id, message)
      SELECT id, ?, ? FROM users WHERE role IN ('driver', 'hospital_admin')
    `, [result.insertId, `New ${severity} emergency reported: ${type}`]);

    res.status(201).json(newEmergency[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEmergencies = async (req, res) => {
  try {
    let query = 'SELECT e.*, u.name as reporter_name FROM emergencies e JOIN users u ON e.user_id = u.id ORDER BY e.created_at DESC';
    let params = [];

    if (req.userRole === 'citizen') {
      query = 'SELECT e.*, u.name as reporter_name FROM emergencies e JOIN users u ON e.user_id = u.id WHERE e.user_id = ? ORDER BY e.created_at DESC';
      params = [req.userId];
    }
    
    const [emergencies] = await db.query(query, params);
    res.json(emergencies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEmergencyById = async (req, res) => {
  try {
    const { id } = req.params;
    const [emergencies] = await db.query('SELECT e.*, u.name as reporter_name FROM emergencies e JOIN users u ON e.user_id = u.id WHERE e.id = ?', [id]);
    
    if (emergencies.length === 0) {
      return res.status(404).json({ message: 'Emergency not found' });
    }
    
    const emergency = emergencies[0];
    
    if (req.userRole === 'citizen' && emergency.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(emergency);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['ACTIVE', 'ACKNOWLEDGED', 'RESPONDING', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await db.query('UPDATE emergencies SET status = ? WHERE id = ?', [status, id]);
    
    const [updatedEmergency] = await db.query('SELECT * FROM emergencies WHERE id = ?', [id]);
    
    if (updatedEmergency.length === 0) return res.status(404).json({ message: 'Not found' });

    await db.query(
      'INSERT INTO emergency_responses (emergency_id, responder_id, status) VALUES (?, ?, ?)',
      [id, req.userId, status]
    );

    const io = socketConfig.getIO();
    io.emit('emergency_updated', updatedEmergency[0]);
    io.to(`user_${updatedEmergency[0].user_id}`).emit('notification', { message: `Your emergency status updated to ${status}` });

    res.json(updatedEmergency[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
