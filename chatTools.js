// The chatbot's real capabilities. These same functions back both AI mode (called by Claude via
// tool use) and fallback mode (called directly from simple keyword matching), so the bot can
// genuinely search flights, check bookings, cancel bookings, and open support tickets — not just
// talk about doing those things.
const { readDB, writeDB } = require('../db');

const toolDefs = [
  {
    name: 'search_flights',
    description: 'Search ENOVY Air flights by origin city, destination city, and/or date. Use this whenever a customer asks about routes, prices, times, or seat availability — never invent flight details.',
    input_schema: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Origin city or airport code, e.g. "Lagos"' },
        destination: { type: 'string', description: 'Destination city or airport code, e.g. "Abuja"' },
        date: { type: 'string', description: 'Departure date in YYYY-MM-DD format, optional' }
      }
    }
  },
  {
    name: 'check_booking_status',
    description: "Look up a booking's status. Requires BOTH the booking reference and the email used to book, to verify identity. Ask for both if you don't have them yet.",
    input_schema: {
      type: 'object',
      properties: {
        ref: { type: 'string', description: 'Booking reference, e.g. ENV-AB12CD' },
        email: { type: 'string', description: 'Email address used to make the booking' }
      },
      required: ['ref', 'email']
    }
  },
  {
    name: 'cancel_booking',
    description: 'Cancel a confirmed booking. Only call this after the customer has clearly confirmed they want to cancel, and you have both the booking reference and matching email.',
    input_schema: {
      type: 'object',
      properties: {
        ref: { type: 'string' },
        email: { type: 'string' }
      },
      required: ['ref', 'email']
    }
  },
  {
    name: 'create_support_ticket',
    description: "Escalate to a human agent when you can't resolve something, or when the customer asks to speak to a person. Creates a ticket the ENOVY team sees in their dashboard.",
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        message: { type: 'string', description: 'Summary of what the customer needs help with' }
      },
      required: ['name', 'email', 'message']
    }
  }
];

async function executeTool(name, input) {
  const db = readDB();

  switch (name) {
    case 'search_flights': {
      let flights = db.flights;
      if (input.origin) flights = flights.filter(f => f.origin.toLowerCase().includes(String(input.origin).toLowerCase()));
      if (input.destination) flights = flights.filter(f => f.destination.toLowerCase().includes(String(input.destination).toLowerCase()));
      if (input.date) flights = flights.filter(f => f.departTime.startsWith(String(input.date)));
      return {
        flights: flights.slice(0, 8).map(f => ({
          flightNo: f.flightNo, origin: f.origin, destination: f.destination,
          departTime: f.departTime, price: f.price, seatsAvailable: f.seatsAvailable
        }))
      };
    }

    case 'check_booking_status': {
      const b = db.bookings.find(b =>
        b.ref.toLowerCase() === String(input.ref || '').toLowerCase() &&
        b.passengerEmail.toLowerCase() === String(input.email || '').toLowerCase()
      );
      if (!b) return { found: false, message: 'No booking found matching that reference and email.' };
      const flight = db.flights.find(f => f.id === b.flightId);
      return {
        found: true, ref: b.ref, status: b.status, seats: b.seats, totalPrice: b.totalPrice,
        flight: flight ? { origin: flight.origin, destination: flight.destination, departTime: flight.departTime } : null
      };
    }

    case 'cancel_booking': {
      const b = db.bookings.find(b =>
        b.ref.toLowerCase() === String(input.ref || '').toLowerCase() &&
        b.passengerEmail.toLowerCase() === String(input.email || '').toLowerCase()
      );
      if (!b) return { success: false, message: 'No booking found matching that reference and email.' };
      if (b.status === 'cancelled') return { success: false, message: 'That booking is already cancelled.' };
      b.status = 'cancelled';
      const flight = db.flights.find(f => f.id === b.flightId);
      if (flight) flight.seatsAvailable += b.seats;
      writeDB(db);
      return { success: true, message: `Booking ${b.ref} has been cancelled and the seats released.` };
    }

    case 'create_support_ticket': {
      db.supportTickets = db.supportTickets || [];
      db.nextIds.ticket = db.nextIds.ticket || 1;
      const ticket = {
        id: db.nextIds.ticket++,
        name: input.name || 'Website visitor',
        email: input.email || '',
        message: input.message || '',
        status: 'open',
        createdAt: new Date().toISOString()
      };
      db.supportTickets.push(ticket);
      writeDB(db);
      return { success: true, ticketId: ticket.id, message: 'A human agent will follow up by email shortly.' };
    }

    default:
      return { error: 'Unknown tool: ' + name };
  }
}

module.exports = { toolDefs, executeTool };
