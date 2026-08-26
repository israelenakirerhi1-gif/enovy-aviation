const express = require('express');
const { readDB } = require('../db');

const router = express.Router();

// GET /api/flights?origin=&destination=&date=
router.get('/', (req, res) => {
  const { origin, destination, date } = req.query;

  const db = readDB();
  let flights = db.flights;

  if (origin) {
    flights = flights.filter(f =>
      f.origin.toLowerCase().includes(String(origin).toLowerCase())
    );
  }

  if (destination) {
    flights = flights.filter(f =>
      f.destination.toLowerCase().includes(String(destination).toLowerCase())
    );
  }

  if (date) {
    flights = flights.filter(f =>
      f.departTime.startsWith(String(date))
    );
  }

  flights = flights
    .slice()
    .sort(
      (a, b) =>
        new Date(a.departTime) - new Date(b.departTime)
    );

  res.json({ flights });
});

router.get('/:id', (req, res) => {
  const db = readDB();

  const flight = db.flights.find(
    f => f.id === Number(req.params.id)
  );

  if (!flight) {
    return res.status(404).json({
      error: 'Flight not found'
    });
  }

  res.json({ flight });
});

module.exports = router;
