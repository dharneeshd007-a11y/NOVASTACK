const db = require('../config/db');

exports.getOverview = async (req, res) => {
  try {
    const [[{ total }]] = await db.query('SELECT count(*) as total FROM emergencies');
    const [[{ active }]] = await db.query('SELECT count(*) as active FROM emergencies WHERE status != "RESOLVED"');
    const [[{ resolved }]] = await db.query('SELECT count(*) as resolved FROM emergencies WHERE status = "RESOLVED"');
    const [[{ critical }]] = await db.query('SELECT count(*) as critical FROM emergencies WHERE severity = "CRITICAL" OR ai_priority_level = "CRITICAL"');
    
    res.json({ total, active, resolved, critical });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTrends = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DATE(created_at) as date, count(*) as count 
      FROM emergencies 
      GROUP BY DATE(created_at) 
      ORDER BY date ASC 
      LIMIT 30
    `);
    // Format dates for the chart
    const formatted = rows.map(r => ({
      name: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      emergencies: r.count
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTypes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT type as name, count(*) as value 
      FROM emergencies 
      GROUP BY type
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
