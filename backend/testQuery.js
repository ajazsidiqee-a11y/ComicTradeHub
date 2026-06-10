const pool = require('./backend/config/db');

async function testQuery() {
  try {
    const result = await pool.query('SELECT current_database();');
    console.log(result.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}
testQuery();
