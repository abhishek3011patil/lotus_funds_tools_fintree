require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

(async () => {
  try {
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'telegram%'"
    );
    console.log('=== Telegram Tables ===');
    console.log(tables.rows);

    try {
      const users = await pool.query('SELECT * FROM telegram_users LIMIT 10');
      console.log('\n=== telegram_users (first 10) ===');
      console.log(JSON.stringify(users.rows, null, 2));
    } catch (e) {
      console.log('\n=== telegram_users TABLE ERROR ===');
      console.log(e.message);
    }

    try {
      const msgs = await pool.query('SELECT count(*) as total FROM telegram_messages');
      console.log('\n=== telegram_messages count ===');
      console.log(msgs.rows[0]);
    } catch (e) {
      console.log('\n=== telegram_messages TABLE ERROR ===');
      console.log(e.message);
    }

    try {
      const allUsers = await pool.query('SELECT id, name, role FROM users LIMIT 5');
      console.log('\n=== users table sample ===');
      console.log(JSON.stringify(allUsers.rows, null, 2));
    } catch (e) {
      console.log('\n=== users table error ===');
      console.log(e.message);
    }
  } catch (e) {
    console.error('DB Error:', e.message);
  } finally {
    pool.end();
  }
})();
