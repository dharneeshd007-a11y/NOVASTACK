const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'emergencylink',
    });

    console.log('Connected to DB');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS emergency_driver_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emergency_id INT NOT NULL,
        driver_id INT NOT NULL,
        status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED') DEFAULT 'PENDING',
        notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP NULL,
        FOREIGN KEY (emergency_id) REFERENCES emergencies(id) ON DELETE CASCADE,
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Created emergency_driver_attempts');

    await connection.end();
    console.log('Migration complete');
  } catch (err) {
    console.error(err);
  }
}

runMigration();
