const db = require('../config/db');

exports.createResource = async (req, res, next) => {
  try {
    const { agency_id, name, type, status, latitude, longitude } = req.body;
    const [result] = await db.query(
      'INSERT INTO resources (agency_id, name, type, status, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
      [agency_id, name, type, status || 'OFFLINE', latitude, longitude]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    next(error);
  }
};

exports.getResources = async (req, res, next) => {
  try {
    const [resources] = await db.query(`
      SELECT r.*, a.name as agency_name, a.type as agency_type 
      FROM resources r 
      JOIN agencies a ON r.agency_id = a.id
    `);
    res.json(resources);
  } catch (error) {
    next(error);
  }
};

exports.updateResourceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, latitude, longitude } = req.body;
    
    let query = 'UPDATE resources SET status = ?';
    let params = [status];
    
    if (latitude && longitude) {
      query += ', latitude = ?, longitude = ?';
      params.push(latitude, longitude);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    await db.query(query, params);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
