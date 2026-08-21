const db = require('../config/db');

exports.updateStatus = async (req, res) => {
  try {
    const { status, latitude, longitude } = req.body;
    
    if (!['ONLINE', 'OFFLINE'].includes(status)) {
       return res.status(400).json({ message: 'Invalid status' });
    }
    
    const availability = status === 'ONLINE' ? 'AVAILABLE' : 'OFFLINE';
    
    let query = 'UPDATE users SET availability = ? WHERE id = ?';
    let params = [availability, req.userId];
    
    if (latitude && longitude) {
      query = 'UPDATE users SET availability = ?, last_latitude = ?, last_longitude = ?, last_active = NOW() WHERE id = ?';
      params = [availability, latitude, longitude, req.userId];
    }
    
    await db.query(query, params);
    
    res.json({ message: 'Status updated', availability });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
