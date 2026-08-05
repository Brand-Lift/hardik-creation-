require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 10000;

// ─── Supabase Client ───
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── Middleware ───
app.use(express.json());

// ═══════════ CORS Setup (Fixed) ═══════════
const corsOptions = {
  origin: function (origin, callback) {
    const allowed = process.env.CLIENT_ORIGIN
      ? process.env.CLIENT_ORIGIN.split(',').map(s => s.trim())
      : ['*'];
    // allow requests with no origin (mobile, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowed.includes('*') || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-key', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));  // handle preflight

// ─── Helper: verify JWT ───
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// ─── Routes ───

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Products (static list, frontend uses this)
app.get('/api/products', (req, res) => {
  // Frontend has own PRODUCTS array, but if it calls backend, return a list.
  // You can replace this with DB fetch if needed.
  const products = [
    { id: 1, name: 'Classic T-Shirt', price: 499 },
    { id: 2, name: 'Denim Jeans', price: 1499 },
    { id: 3, name: 'Hoodie', price: 999 },
    { id: 4, name: 'Jacket', price: 1999 },
    // add more as needed
  ];
  res.json(products);
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);

    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword, name }])
      .select('id, email, name')
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Email already exists' });
      throw error;
    }

    const token = jwt.sign(
      { id: data.id, email: data.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({ user: data, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (error || users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Place order
app.post('/api/orders', authenticateToken, async (req, res) => {
  const { items, total_amount, customer_name, customer_phone, customer_address, customer_city, customer_pincode, payment_method, payment_screenshot } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Items required' });

  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        user_id: req.user.id,
        user_email: req.user.email,
        items,
        total_amount,
        customer_name,
        customer_phone,
        customer_address,
        customer_city,
        customer_pincode,
        payment_method,
        payment_screenshot,
        order_status: 'Processing'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ order: data });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get all orders (requires admin key)
app.get('/api/admin/orders', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_API_KEY) return res.status(401).json({ error: 'Invalid admin key' });

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Admin orders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Update order status
app.put('/api/admin/order/:id/status', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_API_KEY) return res.status(401).json({ error: 'Invalid admin key' });

  const { status } = req.body;
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});
