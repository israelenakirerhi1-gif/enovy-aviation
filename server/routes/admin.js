const express = require('express');
const { readDB, writeDB } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

const router = express.Router();
router.use(authenticateToken, requireAdmin); // everything below requires an admin session

router.get('/stats', (req, res) => {
  const db = readDB();
  const activeBookings = db.bookings.filter(b => b.status === 'confirmed');
  const openTickets = (db.supportTickets || []).filter(t => t.status === 'open');
  res.json({
    totalUsers: db.users.length,
    totalFlights: db.flights.length,
    totalBookings: db.bookings.length,
    activeBookings: activeBookings.length,
    revenue: activeBookings.reduce((sum, b) => sum + b.totalPrice, 0),
    openTickets: openTickets.length
  });
});

// ---- Users ----
router.get('/users', (req, res) => {
  const db = readDB();
  res.json({
    users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt }))
  });
});

router.patch('/users/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!['active', 'suspended'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const db = readDB();
  const user = db.users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Cannot change the status of an admin account' });

  user.status = status;
  writeDB(db);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt } });
});

// ---- Bookings (all users) ----
router.get('/bookings', (req, res) => {
  const db = readDB();
  const bookings = db.bookings
    .map(b => ({
      ...b,
      flight: db.flights.find(f => f.id === b.flightId),
      user: (() => {
        const u = db.users.find(u => u.id === b.userId);
        return u ? { id: u.id, name: u.name, email: u.email } : null;
      })()
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ bookings });
});

router.delete('/bookings/:id', (req, res) => {
  const db = readDB();
  const booking = db.bookings.find(b => b.id === Number(req.params.id));
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (booking.status !== 'cancelled') {
    booking.status = 'cancelled';
    const flight = db.flights.find(f => f.id === booking.flightId);
    if (flight) flight.seatsAvailable += booking.seats;
  }
  writeDB(db);
  res.json({ booking });
});

// ---- Support tickets (from the AI chatbot) ----
router.get('/support', (req, res) => {
  const db = readDB();
  const tickets = (db.supportTickets || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ tickets });
});

router.patch('/support/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!['open', 'resolved'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const db = readDB();
  const ticket = (db.supportTickets || []).find(t => t.id === Number(req.params.id));
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  ticket.status = status;
  writeDB(db);
  res.json({ ticket });
});

// ---- Flights (CRUD) ----
router.get('/flights', (req, res) => {
  const db = readDB();
  res.json({ flights: db.flights });
});

router.post('/flights', (req, res) => {
  const { flightNo, airline, origin, destination, departTime, arriveTime, price, seatsTotal } = req.body || {};
  if (!flightNo || !origin || !destination || !departTime || !price || !seatsTotal) {
    return res.status(400).json({ error: 'flightNo, origin, destination, departTime, price and seatsTotal are required' });
  }
  const db = readDB();
  const flight = {
    id: db.nextIds.flight++,
    flightNo,
    airline: airline || 'ENOVY Air',
    origin,
    destination,
    departTime,
    arriveTime: arriveTime || departTime,
    price: Number(price),
    seatsTotal: Number(seatsTotal),
    seatsAvailable: Number(seatsTotal)
  };
  db.flights.push(flight);
  writeDB(db);
  res.json({ flight });
});

router.patch('/flights/:id', (req, res) => {
  const db = readDB();
  const flight = db.flights.find(f => f.id === Number(req.params.id));
  if (!flight) return res.status(404).json({ error: 'Flight not found' });
  const allowed = ['flightNo', 'airline', 'origin', 'destination', 'departTime', 'arriveTime', 'price', 'seatsTotal', 'seatsAvailable'];
  allowed.forEach(k => { if (req.body[k] !== undefined) flight[k] = req.body[k]; });
  writeDB(db);
  res.json({ flight });
});

router.delete('/flights/:id', (req, res) => {
  const db = readDB();
  db.flights = db.flights.filter(f => f.id !== Number(req.params.id));
  writeDB(db);
  res.json({ success: true });
});

module.exports = router;
