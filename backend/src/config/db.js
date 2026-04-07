// src/config/db.js — MySQL connection pool
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:             process.env.DB_HOST || 'localhost',
  port:             parseInt(process.env.DB_PORT) || 3306,
  user:             process.env.DB_USER || 'root',
  password:         process.env.DB_PASS || '',
  database:         process.env.DB_NAME || 'balaji_jewellers',
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0,
  charset:          'utf8mb4',
  timezone:         '+05:30',
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅  MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌  MySQL connection failed:', err.message);
    console.error('⚠️  Server will continue running, but database queries will fail.');
    console.error('💡  Update DB_PASS in your .env file with your actual MySQL password.');
  });

module.exports = pool;
