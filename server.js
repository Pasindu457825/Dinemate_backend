// --- Load env FIRST ---
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

// Models
const User = require('./models/tharusha/userModel');

// Routes
// pasindu
const orderRoutes = require('./routes/pasindu/orderRoutes');
const reservationRoutes = require('./routes/pasindu/reservationRoutes');
// tharusha
const userRoutes = require('./routes/tharusha/userRoute');
// pamaa
const foodItemRoutes = require('./routes/pamaa/foodItemRoutes');
const restaurantRoutes = require('./routes/pamaa/restaurantRoutes');
// isuri - Payment Managements
const paymentRoutes = require('./routes/Isuri/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // set to your frontend URL in prod
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// --- Health checks / root ---
app.get('/', (req, res) => res.send('✅ Dinemate Backend is Live'));
app.get('/healthz', (req, res) => res.status(200).json({ ok: true }));

// --- MongoDB connection ---
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('❌ MONGO_URI is not set');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await createDefaultAdmin();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// --- API Routes ---
app.use('/api/ITPM/orders', orderRoutes);
app.use('/api/ITPM/reservations', reservationRoutes);
app.use('/api/ITPM/users', userRoutes);
app.use('/api/ITPM/foodItems', foodItemRoutes);
app.use('/api/ITPM/restaurants', restaurantRoutes);
app.use('/api/ITPM/payments', paymentRoutes);

// --- 404 + Error handlers ---
app.use((req, res, next) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

// --- Start server (Render needs 0.0.0.0) ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// --- Create default admin if not exists ---
async function createDefaultAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPwd = await bcrypt.hash(adminPassword, 10);
      const adminUser = new User({
        fname: 'Admin',
        lname: 'User',
        email: adminEmail,
        pwd: hashedPwd,
        phone_no: '1234567890',
        role: 'admin',
      });
      await adminUser.save();
      console.log(`👤 Default admin created: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log('ℹ️ Admin account already exists.');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error.message);
  }
}

// Optional: clean shutdown logs
process.on('SIGTERM', () => { console.log('SIGTERM received'); process.exit(0); });
process.on('SIGINT', () => { console.log('SIGINT received'); process.exit(0); });
