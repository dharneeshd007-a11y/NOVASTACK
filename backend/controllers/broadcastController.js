const db = require('../config/db');
const socketConfig = require('../config/socket');

exports.getBroadcasts = async (req, res) => {
  try {
    const [broadcasts] = await db.query(`
      SELECT b.*, u.name as creator_name 
      FROM broadcasts b 
      JOIN users u ON b.created_by = u.id 
      ORDER BY b.created_at DESC
    `);
    res.json(broadcasts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendBroadcast = async (req, res) => {
  try {
    const { title, message, priority = 'GENERAL', target = 'ALL_USERS' } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO broadcasts (created_by, title, message, priority, target) VALUES (?, ?, ?, ?, ?)',
      [req.userId, title, message, priority, target]
    );

    const [newBroadcast] = await db.query('SELECT * FROM broadcasts WHERE id = ?', [result.insertId]);

    const io = socketConfig.getIO();
    io.emit('broadcast_created', newBroadcast[0]);
    // Also send standard notification
    io.emit('notification', { message: `[${priority} BROADCAST]: ${title}` });

    res.status(201).json(newBroadcast[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
