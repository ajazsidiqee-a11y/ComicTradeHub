const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
    // Connect to the default "postgres" database first so we can issue the CREATE DATABASE command
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password', // Uses the password from your .env
        database: 'postgres' 
    });

    try {
        await client.connect();
        console.log("Connected to PostgreSQL server...");
        await client.query('CREATE DATABASE comictraders;');
        console.log("✅ Success! Database 'comictraders' has been created.");
    } catch (err) {
        if (err.code === '42P04') {
            console.log("⚠️ Database 'comictraders' already exists.");
        } else {
            console.error("❌ Error creating database:", err.message);
        }
    } finally {
        await client.end();
        console.log("➡️  You can now start your main server by running: node server.js");
    }
}

createDatabase();