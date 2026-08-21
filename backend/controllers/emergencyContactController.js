const db = require('../config/db');

exports.createContact = async (req, res, next) => {
  try {
    const { name, relationship, phone, email, priority } = req.body;
    const [result] = await db.query(
      'INSERT INTO emergency_contacts (user_id, name, relationship, phone, email, priority) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, name, relationship, phone, email, priority || 1]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    next(error);
  }
};

exports.getContacts = async (req, res, next) => {
  try {
    const [contacts] = await db.query('SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY priority ASC', [req.userId]);
    res.json(contacts);
  } catch (error) {
    next(error);
  }
};

exports.deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?', [id, req.userId]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
