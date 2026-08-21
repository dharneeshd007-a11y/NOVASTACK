const db = require('../config/db');

exports.getHospitalCapacity = async (req, res, next) => {
  try {
    const [capacities] = await db.query(`
      SELECT hc.*, a.name, a.address, a.latitude, a.longitude 
      FROM hospital_capacity hc
      JOIN agencies a ON hc.agency_id = a.id
      WHERE a.type = 'HOSPITAL'
    `);
    res.json(capacities);
  } catch (error) {
    next(error);
  }
};

exports.updateHospitalCapacity = async (req, res, next) => {
  try {
    const { id } = req.params; // this is agency_id
    const { emergency_beds, icu_available, general_beds, capacity_status } = req.body;
    
    // Upsert logic
    const [existing] = await db.query('SELECT id FROM hospital_capacity WHERE agency_id = ?', [id]);
    
    if (existing.length > 0) {
      await db.query(
        'UPDATE hospital_capacity SET emergency_beds = ?, icu_available = ?, general_beds = ?, capacity_status = ? WHERE agency_id = ?',
        [emergency_beds, icu_available, general_beds, capacity_status, id]
      );
    } else {
      await db.query(
        'INSERT INTO hospital_capacity (agency_id, emergency_beds, icu_available, general_beds, capacity_status) VALUES (?, ?, ?, ?, ?)',
        [id, emergency_beds, icu_available, general_beds, capacity_status]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

exports.getIncomingEmergencies = async (req, res, next) => {
  try {
    const [emergencies] = await db.query(`
      SELECT e.*, 
             her.status as hospital_status, 
             her.hospital_id,
             (SELECT name FROM agencies WHERE id = her.hospital_id) as hospital_name
      FROM emergencies e
      LEFT JOIN hospital_emergency_responses her ON e.id = her.emergency_id
      WHERE e.status != 'RESOLVED'
      ORDER BY e.created_at DESC
    `);
    res.json(emergencies);
  } catch (error) {
    next(error);
  }
};

exports.acceptEmergency = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hospital_id } = req.body;
    
    await db.query(
      'INSERT INTO hospital_emergency_responses (hospital_id, emergency_id, status, accepted_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE status = ?, accepted_at = NOW()',
      [hospital_id, id, 'ACCEPTED', 'ACCEPTED']
    );
    
    // Broadcast to socket
    const io = req.app.get('io');
    if (io) io.emit('hospital_emergency_accepted', { emergency_id: id, hospital_id });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

exports.rejectEmergency = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hospital_id, reason } = req.body;
    
    if (!reason) return res.status(400).json({ message: 'Rejection reason is required' });
    
    await db.query(
      'INSERT INTO hospital_emergency_responses (hospital_id, emergency_id, status, rejection_reason) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = ?, rejection_reason = ?',
      [hospital_id, id, 'REJECTED', reason, 'REJECTED', reason]
    );
    
    const io = req.app.get('io');
    if (io) io.emit('hospital_emergency_rejected', { emergency_id: id, hospital_id, reason });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
