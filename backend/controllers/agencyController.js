const db = require('../config/db');

exports.createAgency = async (req, res, next) => {
  try {
    const { name, type, address, latitude, longitude, phone, email } = req.body;
    const [result] = await db.query(
      'INSERT INTO agencies (name, type, address, latitude, longitude, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, type, address, latitude, longitude, phone, email]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    next(error);
  }
};

exports.getAgencies = async (req, res, next) => {
  try {
    const [agencies] = await db.query('SELECT * FROM agencies');
    res.json(agencies);
  } catch (error) {
    next(error);
  }
};

exports.updateAgencyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await db.query('UPDATE agencies SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
