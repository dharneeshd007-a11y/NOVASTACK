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
