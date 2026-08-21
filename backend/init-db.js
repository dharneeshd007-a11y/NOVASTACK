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

    // Phase 5 additions
    try {
      await connection.query(`ALTER TABLE emergencies ADD COLUMN ai_priority_score INT`);
      await connection.query(`ALTER TABLE emergencies ADD COLUMN ai_priority_level VARCHAR(50)`);
      await connection.query(`ALTER TABLE emergencies ADD COLUMN ai_recommendation TEXT`);
      await connection.query(`ALTER TABLE emergencies ADD COLUMN ai_analyzed_at TIMESTAMP NULL`);
      console.log('Added Phase 5 columns to emergencies table.');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
      console.log('Phase 5 columns already exist in emergencies table.');
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS emergency_ai_analysis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emergency_id INT NOT NULL,
        priority_score INT,
        priority_level VARCHAR(50),
        recommendation TEXT,
        risk_factors TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (emergency_id) REFERENCES emergencies(id) ON DELETE CASCADE
      )
    `);
    console.log('emergency_ai_analysis table created or already exists.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS emergency_escalations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emergency_id INT NOT NULL,
        previous_priority VARCHAR(50),
        new_priority VARCHAR(50),
        reason TEXT,
        escalated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        escalated_by VARCHAR(100),
        FOREIGN KEY (emergency_id) REFERENCES emergencies(id) ON DELETE CASCADE
      )
    `);
    console.log('emergency_escalations table created or already exists.');

    // Phase 6 additions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS emergency_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emergency_id INT NOT NULL,
        sender_id INT NOT NULL,
        message TEXT NOT NULL,
        message_type ENUM('TEXT', 'SYSTEM', 'ALERT') DEFAULT 'TEXT',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (emergency_id) REFERENCES emergencies(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('emergency_messages table created or already exists.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS broadcasts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        created_by INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        priority ENUM('GENERAL', 'CRITICAL', 'SAFETY', 'WEATHER', 'SYSTEM') DEFAULT 'GENERAL',
        target ENUM('ALL_USERS', 'RESPONDERS', 'ADMINS', 'ACTIVE_RESPONDERS') DEFAULT 'ALL_USERS',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('broadcasts table created or already exists.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id INT,
        old_value TEXT,
        new_value TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('audit_logs table created or already exists.');

    // Phase 8 additions
    try {
      await connection.query(`
        ALTER TABLE users MODIFY COLUMN role ENUM('citizen', 'driver', 'hospital_admin', 'ambulance', 'hospital', 'police', 'fire', 'admin') NOT NULL
      `);
      console.log('Updated users table roles for Phase 8.');
    } catch (err) {
      console.log('Roles already updated or error:', err.message);
    }

    try {
      await connection.query(`ALTER TABLE emergencies ADD COLUMN incident_mode ENUM('NORMAL', 'MASS_CASUALTY', 'DISASTER') DEFAULT 'NORMAL'`);
      console.log('Added incident_mode column to emergencies table.');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS agencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type ENUM('AMBULANCE', 'HOSPITAL', 'POLICE', 'FIRE', 'OTHER') NOT NULL,
        address TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        phone VARCHAR(50),
        email VARCHAR(255),
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('agencies table created or already exists.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agency_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        status ENUM('AVAILABLE', 'BUSY', 'MAINTENANCE', 'OFFLINE') DEFAULT 'OFFLINE',
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
      )
    `);
    console.log('resources table created or already exists.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS hospital_capacity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agency_id INT NOT NULL,
        emergency_beds INT DEFAULT 0,
        icu_available INT DEFAULT 0,
        general_beds INT DEFAULT 0,
        capacity_status ENUM('AVAILABLE', 'LIMITED', 'FULL') DEFAULT 'AVAILABLE',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
      )
    `);
    console.log('hospital_capacity table created or already exists.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS public_alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        created_by INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
        center_latitude DECIMAL(10, 8),
        center_longitude DECIMAL(11, 8),
        radius_km DECIMAL(5, 2),
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('public_alerts table created or already exists.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        relationship VARCHAR(100),
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        priority INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('emergency_contacts table created or already exists.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS incident_agencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emergency_id INT NOT NULL,
        agency_id INT NOT NULL,
        status ENUM('ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'RESOLVED') DEFAULT 'ASSIGNED',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (emergency_id) REFERENCES emergencies(id) ON DELETE CASCADE,
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
      )
    `);
    console.log('incident_agencies table created or already exists.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS hospital_emergency_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hospital_id INT NOT NULL,
        emergency_id INT NOT NULL,
        status ENUM('NOTIFIED', 'ACCEPTED', 'PREPARING', 'AMBULANCE_EN_ROUTE', 'PATIENT_ARRIVED', 'COMPLETED', 'REJECTED') DEFAULT 'NOTIFIED',
        rejection_reason TEXT,
        accepted_at TIMESTAMP NULL,
        preparing_at TIMESTAMP NULL,
        arrived_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES agencies(id) ON DELETE CASCADE,
        FOREIGN KEY (emergency_id) REFERENCES emergencies(id) ON DELETE CASCADE
      )
    `);
    console.log('hospital_emergency_responses table created or already exists.');

    await connection.end();
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDB();
