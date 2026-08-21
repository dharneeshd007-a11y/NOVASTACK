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

    try {
      await connection.query(`ALTER TABLE emergencies ADD COLUMN patient_name VARCHAR(255) NULL`);
      console.log('Added patient_name');
    } catch (e) { console.log('patient_name exists', e.message); }

    try {
      await connection.query(`ALTER TABLE emergencies ADD COLUMN patient_age INT NULL`);
      console.log('Added patient_age');
    } catch (e) { console.log('patient_age exists', e.message); }

    try {
      await connection.query(`ALTER TABLE emergencies MODIFY COLUMN status ENUM('ACTIVE', 'SEARCHING_AMBULANCE', 'AMBULANCE_ASSIGNED', 'DRIVER_ON_THE_WAY', 'DRIVER_ARRIVED', 'PATIENT_PICKED_UP', 'HOSPITAL_SELECTED', 'EN_ROUTE_TO_HOSPITAL', 'ARRIVED_HOSPITAL', 'COMPLETED', 'RESOLVED') DEFAULT 'SEARCHING_AMBULANCE'`);
      console.log('Updated status ENUM');
    } catch (e) { console.log('Enum update failed', e.message); }

    await connection.end();
    console.log('Migration complete');
  } catch (err) {
    console.error(err);
  }
}

runMigration();
