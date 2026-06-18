const pool = require('./config/db');

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('? Database connection successful!');
    console.log('Current time from DB:', res.rows[0].now);
  } catch (err) {
    console.error('? Database connection failed:', err.message);
  } finally {
    pool.end();
  }
}

testConnection();
