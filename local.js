const { readDB } = require('../db');
const name = 'ENOVY Air';

async function search({ origin, destination, date }) {
  const db = readDB();
  let flights = db.flights.filter(f => f.provider === 'local' || !f.provider);
  if (origin) flights = flights.filter(f => f.origin.toLowerCase().includes(String(origin).toLowerCase()));
  if (destination) flights = flights.filter(f => f.destination.toLowerCase().includes(String(destination).toLowerCase()));
  if (date) flights = flights.filter(f => f.departTime.startsWith(String(date)));
  return { available: true, flights: flights.map(f => ({ ...f, provider: 'local', bookingMode: 'enovy' })) };
}
module.exports = { name, search };
