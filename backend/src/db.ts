import { Pool } from "pg";

console.log("🔥 DB CONFIG:", {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
});
// Create a single pool instance for the whole app
export const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "lotus_user",
    password: process.env.DB_PASSWORD || "your_password_here",
    database: process.env.DB_NAME || "lotus_funds",

    // recommended settings
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    max: 10,              // max connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Optional: simple connection test (runs on app start)
pool.on("connect", () => {
    console.log("✅ PostgreSQL connected");
});

pool.on("error", (err) => {
    console.error("❌ PostgreSQL pool error", err);
    process.exit(1);
});



