const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allows your frontend to make requests to this API
app.use(express.json()); // Parses incoming JSON payloads
app.use(express.static(path.join(__dirname, '../frontend'))); // Serves your HTML/CSS/JS files

// Database Setup
const pool = require('./config/db');

// In-memory storage arrays
let products = [];
let orders = [];
let users = [];
let messages = [];
let faqs = [];
let nextId = 1;

// Initialize Database Tables
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        description TEXT,
        image TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_id TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        address TEXT,
        district TEXT,
        pincode TEXT,
        items TEXT NOT NULL,
        subtotal REAL NOT NULL,
        shipping REAL NOT NULL,
        tax REAL NOT NULL,
        total REAL NOT NULL,
        payment TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        subject TEXT,
        message TEXT,
        reply TEXT,
        status TEXT DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS faqs (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT,
        asked_by TEXT DEFAULT 'Anonymous',
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database tables initialized.');
  } catch (err) {
    console.error('Failed to initialize database tables:', err);
  }
};
initDB();

// Mail setup
let transporter;
const initializeTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('Using Gmail for email transport.');
  } else {
    console.log('No EMAIL_USER or EMAIL_PASS found. Creating an Ethereal test account for email testing...');
    const account = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });
    console.log(`Ethereal test account created. Emails will be caught and previewable.`);
  }
};

const otpStore = new Map(); // Store OTPs temporarily

// ==========================================
// API ROUTES
// ==========================================

// --- Products ---
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  const { name, category, price, stock, description, image, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, category, price, stock, description, image, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [name, category, price, stock, description, image, status]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const { name, category, price, stock, description, image, status } = req.body;
  try {
    await pool.query(
      'UPDATE products SET name=$1, category=$2, price=$3, stock=$4, description=$5, image=$6, status=$7 WHERE id=$8',
      [name, category, price, stock, description, image, status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Orders ---
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { order_id, customer_name, customer_phone, address, district, pincode, items, subtotal, shipping, tax, total, payment } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO orders (order_id, customer_name, customer_phone, address, district, pincode, items, subtotal, shipping, tax, total, payment) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [order_id, customer_name, customer_phone, address, district, pincode, JSON.stringify(items), subtotal, shipping, tax, total, payment]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    await pool.query('UPDATE orders SET status=$1 WHERE id=$2', [req.body.status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Admin Login ---
app.post('/api/admin-login', (req, res) => {
  const { email, password } = req.body;
  
  // Fallback to default credentials if .env variables are not set
  const adminEmail = process.env.ADMIN_USERNAME || 'admin@comictrade.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (email === adminEmail && password === adminPass) {
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Invalid credentials' });
  }
});

// --- Auth & OTP ---
app.post('/api/otp/send', async (req, res) => {
  const { email, purpose } = req.body;
  if (!email) return res.json({ success: false, error: 'Email is required' });

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store it (expires in 5 minutes)
  otpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 });

  console.log(`\n[DEV OTP] Your OTP for ${email} is: ${otp}\n`);

  try {
    const info = await transporter.sendMail({
      from: `"ComicTradeHub" <${process.env.EMAIL_USER || 'test@ethereal.email'}>`,
      to: email,
      subject: `${purpose === 'register' ? 'Sign Up' : 'Login'} OTP for ComicTradeHub`,
      html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
               <h2 style="color: #6d28d9;">ComicTradeHub</h2>
               <p>Your One-Time Password (OTP) for ${purpose === 'register' ? 'creating your account' : 'secure login'} is:</p>
               <h1 style="background: #f1f5f9; padding: 10px; text-align: center; letter-spacing: 5px; color: #1e293b; border-radius: 8px;">${otp}</h1>
               <p style="font-size: 0.8rem; color: #64748b;">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
             </div>`
    });
    
    if (!process.env.EMAIL_USER) {
      console.log(`\n[DEV OTP EMAIL PREVIEW]: ${nodemailer.getTestMessageUrl(info)}\n`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    // For local development: allow process to continue even if email config is missing
    res.json({ success: true, message: 'Email failed to send. Check server console for OTP.' });
  }
});

app.post('/api/otp/verify', (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);

  if (!record || Date.now() > record.expires) return res.json({ success: false, error: 'OTP has expired or was not requested.' });
  if (record.otp !== otp) return res.json({ success: false, error: 'Invalid OTP.' });

  otpStore.delete(email); // Clear OTP after successful verification
  res.json({ success: true });
});

app.post('/api/register', async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4)', 
      [req.body.name, req.body.email, req.body.phone, req.body.password]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [req.body.email, req.body.password]);
    const user = result.rows[0];
    if (user) {
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
    } else {
      res.json({ success: false, error: 'Invalid email or password' });
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// --- Contact Form ---
app.post('/api/contact', async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO messages (name, email, subject, message) VALUES ($1, $2, $3, $4)', 
      [req.body.name, req.body.email, req.body.subject, req.body.message]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// --- Users ---
app.get('/api/users', async (req, res) => { 
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    await pool.query('UPDATE users SET name=$1, phone=$2 WHERE id=$3', [req.body.name, req.body.phone, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/users/:id/status', async (req, res) => {
  try {
    await pool.query('UPDATE users SET status=$1 WHERE id=$2', [req.body.status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/users/:id/reset-password', async (req, res) => {
  try {
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [req.body.password, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/users/:id/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT phone, email FROM users WHERE id=$1', [req.params.id]);
    const user = result.rows[0];
    if (user && user.phone) {
      const ordersResult = await pool.query('SELECT * FROM orders WHERE customer_phone=$1 ORDER BY created_at DESC', [user.phone]);
      res.json(ordersResult.rows);
    } else {
      res.json([]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Messages ---
app.get('/api/messages', async (req, res) => { 
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/messages/:id/reply', async (req, res) => {
  try {
    await pool.query("UPDATE messages SET reply=$1, status='read' WHERE id=$2", [req.body.reply, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/messages/:id/status', async (req, res) => {
  try {
    await pool.query('UPDATE messages SET status=$1 WHERE id=$2', [req.body.status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- FAQs ---
app.get('/api/faqs/all', async (req, res) => { 
  try {
    const result = await pool.query('SELECT * FROM faqs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/faqs/ask', async (req, res) => {
  try {
    const result = await pool.query(
      'INSERT INTO faqs (question, asked_by) VALUES ($1, $2) RETURNING id', 
      [req.body.question, req.body.asked_by || 'Anonymous']
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/faqs/answer/:id', async (req, res) => {
  try {
    await pool.query("UPDATE faqs SET answer=$1, status='answered' WHERE id=$2", [req.body.answer, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/faqs/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM faqs WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

initializeTransporter().then(() => {
  app.listen(port, () => {
    console.log(`ComicTradeHub backend running at http://localhost:${port}`);
  });
}).catch(err => {
  console.error("Failed to initialize mail transporter:", err);
});