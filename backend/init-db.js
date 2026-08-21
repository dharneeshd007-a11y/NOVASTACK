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

    await connection.end();
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDB();
