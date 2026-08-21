const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    const dbName = process.env.DB_NAME || 'emergencylink';
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database ${dbName} created or already exists.`);

    await connection.query(`USE \`${dbName}\``);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('citizen', 'driver', 'hospital_admin') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created or already exists.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS emergencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(100) NOT NULL,
        description TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        address VARCHAR(255),
        severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
        status ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESPONDING', 'RESOLVED') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Emergencies table created or already exists.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS emergency_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emergency_id INT NOT NULL,
        responder_id INT NOT NULL,
        status VARCHAR(100) NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP NULL,
        resolved_at TIMESTAMP NULL,
        FOREIGN KEY (emergency_id) REFERENCES emergencies(id) ON DELETE CASCADE,
        FOREIGN KEY (responder_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Emergency responses table created or already exists.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        emergency_id INT,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (emergency_id) REFERENCES emergencies(id) ON DELETE CASCADE
      )
    `);
    console.log('Notifications table created or already exists.');

    // Phase 4 additions
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN availability ENUM('AVAILABLE', 'BUSY', 'OFFLINE') DEFAULT 'OFFLINE'`);
      await connection.query(`ALTER TABLE users ADD COLUMN last_latitude DECIMAL(10, 8)`);
      await connection.query(`ALTER TABLE users ADD COLUMN last_longitude DECIMAL(11, 8)`);
      await connection.query(`ALTER TABLE users ADD COLUMN last_active TIMESTAMP`);
      console.log('Added Phase 4 columns to users table.');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
      console.log('Phase 4 columns already exist in users table.');
    }

    try {
      await connection.query(`ALTER TABLE emergency_responses ADD COLUMN accepted_at TIMESTAMP NULL`);
      await connection.query(`ALTER TABLE emergency_responses ADD COLUMN responding_at TIMESTAMP NULL`);
      await connection.query(`ALTER TABLE emergency_responses ADD COLUMN arrived_at TIMESTAMP NULL`);
      await connection.query(`ALTER TABLE emergency_responses ADD COLUMN rejection_reason TEXT`);
      console.log('Added Phase 4 columns to emergency_responses table.');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
      console.log('Phase 4 columns already exist in emergency_responses table.');
    }

    await connection.end();
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDB();
