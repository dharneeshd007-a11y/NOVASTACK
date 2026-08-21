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
       VALUES (?, ?, ?, ?, ?, ?, ?, 'WAITING_FOR_AMBULANCE')`,
      [req.userId, type, description, latitude, longitude, address, severity]
    );

    const [newEmergency] = await db.query(`SELECT * FROM emergencies WHERE id = ?`, [result.insertId]);
    const io = socketConfig.getIO();
    
    // Auto assignment logic (Haversine)
    let assignedDriverId = null;
    let minDistance = Infinity;

    if (latitude && longitude) {
      const [availableDrivers] = await db.query(
        "SELECT * FROM users WHERE role = 'ambulance_driver' AND availability = 'AVAILABLE' AND last_latitude IS NOT NULL"
      );
      
      if (availableDrivers.length > 0) {
        let nearest = null;
        for (const r of availableDrivers) {
          const d = getDistanceFromLatLonInKm(latitude, longitude, r.last_latitude, r.last_longitude);
          if (d < minDistance) {
            minDistance = d;
            nearest = r;
          }
        }
        
        if (nearest) {
          assignedDriverId = nearest.id;
          
          await db.query('UPDATE emergencies SET ambulance_driver_id = ?, status = "AMBULANCE_ASSIGNED" WHERE id = ?', [assignedDriverId, result.insertId]);
          await db.query('UPDATE users SET availability = "BUSY" WHERE id = ?', [assignedDriverId]);
          
          io.to(`user_${assignedDriverId}`).emit('nearest_ambulance_emergency', { 
            emergency: newEmergency[0], 
            distance: minDistance 
          });
        }
      }
    }

    // Trigger AI analysis asynchronously (non-blocking)
    const aiService = require('../services/aiService');
    aiService.analyzeEmergency(result.insertId);

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
      'SELECT er.*, u.name as responder_name FROM emergency_responses er JOIN users u ON er.responder_id = u.id WHERE er.emergency_id = ? ORDER BY er.id DESC LIMIT 1',
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

// Driver Decline
exports.declineEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const { excluded_driver_ids } = req.body; // array of drivers who already declined
    
    const [emergencies] = await db.query('SELECT * FROM emergencies WHERE id = ?', [id]);
    if (emergencies.length === 0) return res.status(404).json({ message: 'Emergency not found' });
    
    const emergency = emergencies[0];

    // Mark current driver as available again
    await db.query('UPDATE users SET availability = "AVAILABLE" WHERE id = ?', [req.userId]);

    let excluded = [req.userId];
    if (excluded_driver_ids && Array.isArray(excluded_driver_ids)) {
      excluded = [...new Set([...excluded, ...excluded_driver_ids])];
    }

    // Find NEXT nearest
    const [availableDrivers] = await db.query(
      `SELECT * FROM users WHERE role = 'ambulance_driver' AND availability = 'AVAILABLE' AND last_latitude IS NOT NULL AND id NOT IN (?)`,
      [excluded]
    );

    const io = socketConfig.getIO();
    let nextAssignedId = null;
    let minDistance = Infinity;

    if (availableDrivers.length > 0 && emergency.latitude && emergency.longitude) {
      let nearest = null;
      for (const r of availableDrivers) {
        const d = getDistanceFromLatLonInKm(emergency.latitude, emergency.longitude, r.last_latitude, r.last_longitude);
        if (d < minDistance) {
          minDistance = d;
          nearest = r;
        }
      }
      
      if (nearest) {
        nextAssignedId = nearest.id;
        await db.query('UPDATE emergencies SET ambulance_driver_id = ?, status = "AMBULANCE_ASSIGNED" WHERE id = ?', [nextAssignedId, id]);
        await db.query('UPDATE users SET availability = "BUSY" WHERE id = ?', [nextAssignedId]);
        
        io.to(`user_${nextAssignedId}`).emit('nearest_ambulance_emergency', { 
          emergency, 
          distance: minDistance 
        });
      }
    }
    
    if (!nextAssignedId) {
      await db.query('UPDATE emergencies SET ambulance_driver_id = NULL, status = "WAITING_FOR_AMBULANCE" WHERE id = ?', [id]);
    }

    res.json({ message: 'Emergency declined, routed to next available.', nextAssignedId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Simplified Workflow Status Update
exports.updateEmergencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, hospital_id } = req.body;
    
    let query = 'UPDATE emergencies SET status = ? WHERE id = ?';
    let params = [status, id];

    if (hospital_id) {
       query = 'UPDATE emergencies SET status = ?, hospital_id = ? WHERE id = ?';
       params = [status, hospital_id, id];
    }

    await db.query(query, params);
    
    if (status === 'COMPLETED') {
       await db.query('UPDATE users SET availability = "AVAILABLE" WHERE id = ?', [req.userId]);
    }
    
    const io = socketConfig.getIO();
    io.emit('emergency_updated', { id, status });
    
    res.json({ message: 'Status updated successfully', status });
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
      ORDER BY er.assigned_at DESC
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
