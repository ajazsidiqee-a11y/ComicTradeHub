const pool = require('./backend/config/db');

async function test() {
  try {
    const result = await pool.query('SELECT * FROM comics');
    console.log(result.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}
test();
