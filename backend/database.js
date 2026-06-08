// database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sewa_properti',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // Opsional: Memaksa MySQL mengirim tanggal sebagai teks biasa agar tidak diubah zona waktunya oleh Node.js
  timezone: '+07:00' // Opsional: Memastikan zona waktu selalu WIB
});

pool.getConnection()
  .then(conn => {
    console.log('Connected to MySQL database');
    conn.release();
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
  });

module.exports = pool;