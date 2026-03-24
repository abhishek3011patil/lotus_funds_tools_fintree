require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function run() {
  const t = await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'telegram%'");
  console.log('TABLES:', JSON.stringify(t.rows));

  try {
    const u = await p.query('SELECT * FROM telegram_users LIMIT 5');
    console.log('TELE_USERS:', JSON.stringify(u.rows));
  } catch (e) { console.log('TELE_USERS_ERR:', e.message); }

  try {
    const m = await p.query('SELECT count(*) as c FROM telegram_messages');
    console.log('TELE_MSGS:', JSON.stringify(m.rows));
  } catch (e) { console.log('TELE_MSGS_ERR:', e.message); }

  p.end();
}
run().catch(e => { console.error(e.message); p.end(); });
