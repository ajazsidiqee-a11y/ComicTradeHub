const { Pool } = require('pg');
require('dotenv').config();

let config;

if (process.env.DATABASE_URL) {
  // Use a single connection string for Supabase or other cloud providers
  console.log("Attempting to connect using DATABASE_URL...");
  config = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      // Supabase typically requires SSL. 
      // rejectUnauthorized: false is often used in development/testing with cloud DBs to prevent cert issues
      rejectUnauthorized: false 
    },
    // Add connection pool limits for stability
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  };
} else {
  // Fallback to individual variables for local PostgreSQL
  console.log("DATABASE_URL not found. Attempting to connect using local DB environment variables...");
  config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };
}

const pool = new Pool(config);

// Add event listeners to the pool for better debugging
pool.on('connect', (client) => {
  console.log('✅ A new database client successfully connected.');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle database client:', err.message);
  // Do not process.exit(1) here as it will kill the whole server on intermittent DB drops
});

// Initial Connection Test
pool.connect()
  .then(client => {
    console.log('🚀 Successfully established initial connection to the PostgreSQL database (Supabase)!');
    client.release(); // Important: Release the client back to the pool
  })
  .catch(err => {
    console.error('❌ Failed to establish initial database connection:', err.message);
    console.error('👉 Please check your DATABASE_URL in the .env file.');
  });

module.exports = pool;
