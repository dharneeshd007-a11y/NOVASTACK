const db = require('../config/db');
const socketConfig = require('../config/socket');

exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const [messages] = await db.query(`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM emergency_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.emergency_id = ?
      ORDER BY m.created_at ASC
    `, [id]);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, message_type = 'TEXT' } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO emergency_messages (emergency_id, sender_id, message, message_type) VALUES (?, ?, ?, ?)',
      [id, req.userId, message, message_type]
    );

    const [newMessage] = await db.query(`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM emergency_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [result.insertId]);

    const io = socketConfig.getIO();
    io.to(`emergency_${id}`).emit('emergency_chat_message', newMessage[0]);

    res.status(201).json(newMessage[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
