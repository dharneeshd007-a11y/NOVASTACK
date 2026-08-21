const db = require('../config/db');
const socketConfig = require('../config/socket');
const { getDistanceFromLatLonInKm } = require('../utils/distance');

// Helper for robust dispatch with timeouts and retry queues
async function dispatchToNearestAmbulance(emergencyId, excludeDriverIds = []) {
  const io = socketConfig.getIO();
  
  // 1. Get the emergency to know its location
  const [emergencies] = await db.query('SELECT * FROM emergencies WHERE id = ?', [emergencyId]);
  if (emergencies.length === 0) return false;
  const emergency = emergencies[0];

  // If someone already accepted or it's resolved, stop dispatching.
  if (emergency.status !== 'SEARCHING_AMBULANCE') return false;

  // 2. Find eligible drivers (Online, Available, with GPS, not excluded)
  let query = "SELECT * FROM users WHERE role = 'ambulance_driver' AND availability = 'AVAILABLE' AND last_latitude IS NOT NULL";
  let params = [];
  if (excludeDriverIds.length > 0) {
    query += " AND id NOT IN (?)";
    params.push(excludeDriverIds);
  }
  
  const [availableDrivers] = await db.query(query, params.length > 0 ? params : undefined);

  if (availableDrivers.length === 0) {
    // No more drivers available. Mark as RESOLVED (since CANCELLED is missing from ENUM).
    await db.query('UPDATE emergencies SET status = "RESOLVED" WHERE id = ?', [emergencyId]);
    io.emit('emergency_updated', { id: emergencyId, status: 'RESOLVED' });
    return false;
  }

  // 3. Find the strictly nearest driver using Haversine
  let minDistance = Infinity;
  let nearestDriver = null;

  for (const driver of availableDrivers) {
    const d = getDistanceFromLatLonInKm(emergency.latitude, emergency.longitude, driver.last_latitude, driver.last_longitude);
    if (d < minDistance) {
      minDistance = d;
      nearestDriver = driver;
    }
  }

  if (nearestDriver) {
    // Insert into attempts table
    const [attempt] = await db.query(
      'INSERT INTO emergency_driver_attempts (emergency_id, driver_id, status) VALUES (?, ?, "PENDING")',
      [emergencyId, nearestDriver.id]
    );
    const attemptId = attempt.insertId;

    // Emit real-time notification
    io.to(`user_${nearestDriver.id}`).emit('nearest_ambulance_emergency', { 
      emergency, 
      distance: minDistance,
      attempt_id: attemptId
    });

    // Start 30-second timeout
    setTimeout(async () => {
      // Check if this specific attempt is still PENDING
      const [check] = await db.query('SELECT status FROM emergency_driver_attempts WHERE id = ?', [attemptId]);
      if (check.length > 0 && check[0].status === 'PENDING') {
        // Expire it
        await db.query('UPDATE emergency_driver_attempts SET status = "EXPIRED" WHERE id = ?', [attemptId]);
        
        // Find next nearest driver
        const [allAttempts] = await db.query('SELECT driver_id FROM emergency_driver_attempts WHERE emergency_id = ?', [emergencyId]);
        const allExcluded = allAttempts.map(a => a.driver_id);
        
        dispatchToNearestAmbulance(emergencyId, allExcluded);
      }
    }, 30000); // 30 seconds

    return true;
  }
  
  return false;
}

exports.createEmergency = async (req, res) => {
  try {
    const { type, description, latitude, longitude, address, severity, patient_name, patient_age } = req.body;
    
    if (!type || !severity) {
      return res.status(400).json({ message: 'Type and severity are required' });
    }

    // 1. Insert emergency as SEARCHING_AMBULANCE
    const [result] = await db.query(
      `INSERT INTO emergencies (user_id, type, description, latitude, longitude, address, severity, patient_name, patient_age, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SEARCHING_AMBULANCE')`,
      [req.userId, type, description, latitude, longitude, address, severity, patient_name, patient_age]
    );

    const emergencyId = result.insertId;
    const [newEmergency] = await db.query(`SELECT * FROM emergencies WHERE id = ?`, [emergencyId]);

    // 2. Begin asynchronous automated dispatch
    dispatchToNearestAmbulance(emergencyId, []);

    // Trigger AI analysis asynchronously
    const aiService = require('../services/aiService');
    aiService.analyzeEmergency(emergencyId);

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

// Responder Accept (Atomic)
exports.acceptEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Check if the emergency is STILL searching for an ambulance
    const [emergencies] = await db.query('SELECT status FROM emergencies WHERE id = ?', [id]);
    if (emergencies.length === 0) return res.status(404).json({ message: 'Emergency not found' });
    
    if (emergencies[0].status !== 'SEARCHING_AMBULANCE') {
      return res.status(400).json({ message: 'This emergency has already been assigned.' });
    }

    // 2. Check if driver is still AVAILABLE
    const [driverCheck] = await db.query('SELECT availability FROM users WHERE id = ?', [req.userId]);
    if (driverCheck[0].availability !== 'AVAILABLE') {
      return res.status(400).json({ message: 'You are no longer marked as AVAILABLE.' });
    }

    // 3. Atomic Update: Try to assign the ambulance driver ID where it is still NULL and status is SEARCHING
    const [updateResult] = await db.query(
      'UPDATE emergencies SET ambulance_driver_id = ?, status = "AMBULANCE_ASSIGNED" WHERE id = ? AND status = "SEARCHING_AMBULANCE"',
      [req.userId, id]
    );

    if (updateResult.affectedRows === 0) {
      // Race condition lost
      return res.status(400).json({ message: 'This emergency has already been assigned.' });
    }

    // 4. Update the driver to BUSY
    await db.query('UPDATE users SET availability = "BUSY" WHERE id = ?', [req.userId]);

    // 5. Mark the attempt as ACCEPTED
    await db.query('UPDATE emergency_driver_attempts SET status = "ACCEPTED", responded_at = NOW() WHERE emergency_id = ? AND driver_id = ? AND status = "PENDING"', [id, req.userId]);

    // 6. Notify everyone
    const io = socketConfig.getIO();
    io.emit('emergency_updated', { id, status: 'AMBULANCE_ASSIGNED' });

    res.json({ message: 'Emergency assigned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Driver Decline
exports.declineEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [emergencies] = await db.query('SELECT * FROM emergencies WHERE id = ?', [id]);
    if (emergencies.length === 0) return res.status(404).json({ message: 'Emergency not found' });

    // Mark attempt as REJECTED
    await db.query(
      'UPDATE emergency_driver_attempts SET status = "REJECTED", responded_at = NOW() WHERE emergency_id = ? AND driver_id = ? AND status = "PENDING"', 
      [id, req.userId]
    );

    // Find all drivers who have already attempted/rejected/expired this emergency
    const [allAttempts] = await db.query('SELECT driver_id FROM emergency_driver_attempts WHERE emergency_id = ?', [id]);
    const allExcluded = allAttempts.map(a => a.driver_id);

    // Route to the next nearest
    dispatchToNearestAmbulance(id, allExcluded);

    res.json({ message: 'Emergency declined, routed to next available.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

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
    
    if (status === 'COMPLETED' || status === 'RESOLVED') {
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
  // Obsolete for simplified flow, but keeping for compatibility
  res.json([]);
};
