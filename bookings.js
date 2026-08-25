const express = require('express');
const { readDB, writeDB } = require('../db');
const { authenticateToken } = require('../auth');

const router = express.Router();

router.post('/', authenticateToken, (req, res) => {
  const { flightId, passengerName, passengerEmail, seats } = req.body || {};
  const seatCount = Math.max(1, Number(seats) || 1);

  const db = readDB();
  const flight = db.flights.find(f => f.id === Number(flightId));
  if (!flight) return res.status(404).json({ error: 'Flight not found' });
  if (flight.seatsAvailable < seatCount) return res.status(400).json({ error: 'Not enough seats available on this flight' });

  flight.seatsAvailable -= seatCount;

  const booking = {
    id: db.nextIds.booking++,
    ref: 'ENV-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    userId: req.user.id,
    flightId: flight.id,
    passengerName: passengerName || req.user.name,
    passengerEmail: passengerEmail || req.user.email,
    seats: seatCount,
    totalPrice: flight.price * seatCount,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };
  db.bookings.push(booking);
  writeDB(db);

  res.json({ booking, flight });
});

router.get('/me', authenticateToken, (req, res) => {
  const db = readDB();
  const bookings = db.bookings
    .filter(b => b.userId === req.user.id)
    .map(b => ({ ...b, flight: db.flights.find(f => f.id === b.flightId) }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ bookings });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const db = readDB();
  const booking = db.bookings.find(b => b.id === Number(req.params.id));
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You can only cancel your own bookings' });
  }
  if (booking.status === 'cancelled') return res.status(400).json({ error: 'Booking is already cancelled' });

  booking.status = 'cancelled';
  const flight = db.flights.find(f => f.id === booking.flightId);
  if (flight) flight.seatsAvailable += booking.seats;
  writeDB(db);

  res.json({ booking });
});

module.exports = router;
