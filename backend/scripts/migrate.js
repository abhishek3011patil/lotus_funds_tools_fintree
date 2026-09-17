const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "lotus_user",
  password: process.env.DB_PASSWORD || "your_password_here",
  database: process.env.DB_NAME || "lotus_funds",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
});

(async () => {
  const client = await pool.connect();
  try {
    const migrationDirectory = path.join(__dirname, "../migrations");
    for (const filename of fs.readdirSync(migrationDirectory).filter(name => name.endsWith(".sql")).sort()) {
      await client.query("BEGIN");
      try {
        await client.query("SET LOCAL lock_timeout = '10s'");
        await client.query(fs.readFileSync(path.join(migrationDirectory, filename), "utf8"));
        await client.query("COMMIT");
        console.log(`Migration applied: ${filename}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
})().catch(error => {
  console.error("Database migration failed:", error.message);
  process.exitCode = 1;
});
