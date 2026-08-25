const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// MIDDLEWARE
// =========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// FRONTEND
// =========================

app.use(express.static(path.join(__dirname, '..')));

// =========================
// API ROUTES
// =========================

const authRoutes = require('../auth');
const flightsRoutes = require('../flights');
const bookingsRoutes = require('../bookings');
const adminRoutes = require('../admin');

app.use('/api/auth', authRoutes);
app.use('/api/flights', flightsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/admin', adminRoutes);

// =========================
// HEALTH CHECK
// =========================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ENOVY Air API is running',
    timestamp: new Date().toISOString()
  });
});

// =========================
// START SERVER
// =========================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ENOVY Air running on port ${PORT}`);
});
