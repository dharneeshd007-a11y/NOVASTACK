const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'emergencylink',
    });

    console.log('Connected to DB');

    // 1. Temporarily expand enum so UPDATE can succeed
    await connection.query(`ALTER TABLE users MODIFY COLUMN role VARCHAR(255)`);
    console.log('Modified to VARCHAR');

    // 2. Map old roles to new roles
    await connection.query(`UPDATE users SET role = 'system_admin' WHERE role = 'hospital_admin' OR role = 'admin'`);
    await connection.query(`UPDATE users SET role = 'ambulance_driver' WHERE role = 'driver'`);
    await connection.query(`UPDATE users SET role = 'citizen' WHERE role NOT IN ('citizen', 'ambulance_driver', 'hospital', 'system_admin')`);
    console.log('Mapped data');

    // 3. Set proper enum
    await connection.query(`ALTER TABLE users MODIFY COLUMN role ENUM('citizen', 'ambulance_driver', 'hospital', 'system_admin') NOT NULL DEFAULT 'citizen'`);
    console.log('Enum set successfully');

    await connection.end();
  } catch (err) {
    console.error(err);
  }
}
fix();
