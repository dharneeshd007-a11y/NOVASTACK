const db = require('../config/db');
const socketConfig = require('../config/socket');
const { getDistanceFromLatLonInKm } = require('../utils/distance');

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

    // Send general notification to responders
    await db.query(`
      INSERT INTO notifications (user_id, emergency_id, message)
      SELECT id, ?, ? FROM users WHERE role IN ('driver', 'hospital_admin')
    `, [result.insertId, `New ${severity} emergency reported: ${type}`]);

    // Auto assignment logic
    if (latitude && longitude) {
      const [availableResponders] = await db.query(
        "SELECT * FROM users WHERE role IN ('driver', 'hospital_admin') AND availability = 'AVAILABLE' AND last_latitude IS NOT NULL"
      );
      
      if (availableResponders.length > 0) {
        let nearest = null;
        let minDistance = Infinity;
        for (const r of availableResponders) {
          const d = getDistanceFromLatLonInKm(latitude, longitude, r.last_latitude, r.last_longitude);
          if (d < minDistance) {
            minDistance = d;
            nearest = r;
          }
        }
        
        if (nearest) {
          await db.query(
            'INSERT INTO emergency_responses (emergency_id, responder_id, status) VALUES (?, ?, ?)',
            [result.insertId, nearest.id, 'ASSIGNED']
          );
          await db.query('UPDATE users SET availability = ? WHERE id = ?', ['BUSY', nearest.id]);
          
          io.to(`user_${nearest.id}`).emit('emergency_assigned', { emergency: newEmergency[0], distance: minDistance });
          
          await db.query(`INSERT INTO notifications (user_id, emergency_id, message) VALUES (?, ?, ?)`,
            [nearest.id, result.insertId, `You have been automatically assigned to a new emergency!`]
          );
        }
      }
    }

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

    // Get current response info if exists
    const [responses] = await db.query(
      'SELECT er.*, u.name as responder_name FROM emergency_responses er JOIN users u ON er.responder_id = u.id WHERE er.emergency_id = ? ORDER BY er.created_at DESC LIMIT 1',
      [id]
    );

    if (responses.length > 0) {
      emergency.response = responses[0];
    }

    res.json(emergency);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin Assignment
exports.assignResponder = async (req, res) => {
  try {
    const { id } = req.params;
    const { responder_id } = req.body;
    
    const [emergencies] = await db.query('SELECT * FROM emergencies WHERE id = ?', [id]);
    if (emergencies.length === 0) return res.status(404).json({ message: 'Emergency not found' });

    const [responders] = await db.query('SELECT * FROM users WHERE id = ? AND role IN ("driver", "hospital_admin")', [responder_id]);
    if (responders.length === 0) return res.status(404).json({ message: 'Responder not found' });
    
    if (responders[0].availability !== 'AVAILABLE') {
      return res.status(400).json({ message: 'Responder is not available' });
    }

    await db.query(
      'INSERT INTO emergency_responses (emergency_id, responder_id, status) VALUES (?, ?, ?)',
      [id, responder_id, 'ASSIGNED']
    );
    await db.query('UPDATE users SET availability = ? WHERE id = ?', ['BUSY', responder_id]);
    
    const io = socketConfig.getIO();
    io.to(`user_${responder_id}`).emit('emergency_assigned', { emergency: emergencies[0] });
    
    res.json({ message: 'Emergency assigned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Responder Accept
exports.acceptEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [responses] = await db.query('SELECT * FROM emergency_responses WHERE emergency_id = ? AND responder_id = ? AND status = "ASSIGNED" ORDER BY id DESC LIMIT 1', [id, req.userId]);
    if (responses.length === 0) return res.status(404).json({ message: 'Assignment not found' });

    await db.query('UPDATE emergency_responses SET status = "ACCEPTED", accepted_at = NOW() WHERE id = ?', [responses[0].id]);
    await db.query('UPDATE emergencies SET status = "ACKNOWLEDGED" WHERE id = ?', [id]);
    
    const io = socketConfig.getIO();
    io.emit('response_status_updated', { emergency_id: id, status: 'ACCEPTED' });
    io.emit('emergency_updated', { id, status: 'ACKNOWLEDGED' });

    res.json({ message: 'Emergency accepted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Responder Reject
exports.rejectEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const [responses] = await db.query('SELECT * FROM emergency_responses WHERE emergency_id = ? AND responder_id = ? AND status = "ASSIGNED" ORDER BY id DESC LIMIT 1', [id, req.userId]);
    if (responses.length === 0) return res.status(404).json({ message: 'Assignment not found' });

    await db.query('UPDATE emergency_responses SET status = "REJECTED", rejection_reason = ? WHERE id = ?', [reason || null, responses[0].id]);
    await db.query('UPDATE users SET availability = "AVAILABLE" WHERE id = ?', [req.userId]);
    
    const io = socketConfig.getIO();
    io.to('responders').emit('emergency_rejected', { emergency_id: id, responder_id: req.userId });

    res.json({ message: 'Emergency rejected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Response Status
exports.updateResponseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'RESPONDING', 'ARRIVED', 'RESOLVED'
    
    const [responses] = await db.query('SELECT * FROM emergency_responses WHERE emergency_id = ? AND responder_id = ? AND status NOT IN ("REJECTED", "RESOLVED") ORDER BY id DESC LIMIT 1', [id, req.userId]);
    if (responses.length === 0) return res.status(404).json({ message: 'Active response not found' });

    let timeCol = null;
    let emergencyStatus = null;
    
    if (status === 'RESPONDING') {
      timeCol = 'responding_at';
      emergencyStatus = 'RESPONDING';
    } else if (status === 'ARRIVED') {
      timeCol = 'arrived_at';
    } else if (status === 'RESOLVED') {
      timeCol = 'resolved_at';
      emergencyStatus = 'RESOLVED';
    } else {
      return res.status(400).json({ message: 'Invalid status transition' });
    }

    await db.query(`UPDATE emergency_responses SET status = ?, ${timeCol} = NOW() WHERE id = ?`, [status, responses[0].id]);
    
    if (emergencyStatus) {
      await db.query('UPDATE emergencies SET status = ? WHERE id = ?', [emergencyStatus, id]);
    }

    if (status === 'RESOLVED') {
      await db.query('UPDATE users SET availability = "AVAILABLE" WHERE id = ?', [req.userId]);
    }
    
    const io = socketConfig.getIO();
    io.emit('response_status_updated', { emergency_id: id, status });
    if (emergencyStatus) {
       io.emit('emergency_updated', { id, status: emergencyStatus });
    }

    res.json({ message: 'Status updated', status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getResponseHistory = async (req, res) => {
  try {
    const query = `
      SELECT er.*, e.type, e.severity, u.name as responder_name 
      FROM emergency_responses er 
      JOIN emergencies e ON er.emergency_id = e.id 
      JOIN users u ON er.responder_id = u.id 
      ORDER BY er.created_at DESC
    `;
    const [history] = await db.query(query);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Legacy Update Status (for backward compatibility if needed)
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

    if (status === 'RESOLVED') {
      await db.query('UPDATE users SET availability = "AVAILABLE" WHERE id = ?', [req.userId]);
    }

    const io = socketConfig.getIO();
    io.emit('emergency_updated', updatedEmergency[0]);
    res.json(updatedEmergency[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
