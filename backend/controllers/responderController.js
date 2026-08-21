const db = require('../config/db');
const socketConfig = require('../config/socket');

exports.getResponders = async (req, res) => {
  try {
    const [responders] = await db.query(
      "SELECT id, name, email, role, availability, last_latitude, last_longitude, last_active FROM users WHERE role IN ('driver', 'hospital_admin')"
    );
    res.json(responders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { availability } = req.body;
    if (!['AVAILABLE', 'BUSY', 'OFFLINE'].includes(availability)) {
      return res.status(400).json({ message: 'Invalid availability status' });
    }

    await db.query('UPDATE users SET availability = ? WHERE id = ?', [availability, req.userId]);
    
    const io = socketConfig.getIO();
    io.emit('responder_availability_changed', { responder_id: req.userId, availability });

    res.json({ message: 'Availability updated', availability });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ message: 'Missing coordinates' });

    await db.query(
      'UPDATE users SET last_latitude = ?, last_longitude = ?, last_active = NOW() WHERE id = ?',
      [latitude, longitude, req.userId]
    );

    const io = socketConfig.getIO();
    io.emit('responder_location_updated', { responder_id: req.userId, latitude, longitude });

    res.json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
