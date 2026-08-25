// Keyword-based fallback so the chatbot is genuinely useful even before an ANTHROPIC_API_KEY is
// configured. It still performs real actions via executeTool — it's just less conversational
// than full AI mode.
const { executeTool } = require('./chatTools');
const { readDB } = require('../db');

const REF_RE = /\bENV-[A-Z0-9]{6}\b/i;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;

async function fallbackReply(text) {
  const raw = String(text || '');
  const msg = raw.toLowerCase();
  const refMatch = raw.match(REF_RE);
  const emailMatch = raw.match(EMAIL_RE);

  if (/cancel/.test(msg) && refMatch && emailMatch) {
    const r = await executeTool('cancel_booking', { ref: refMatch[0], email: emailMatch[0] });
    return r.message;
  }

  if (/status|track|find my booking|check my booking/.test(msg) && refMatch && emailMatch) {
    const r = await executeTool('check_booking_status', { ref: refMatch[0], email: emailMatch[0] });
    if (!r.found) return r.message;
    const routeStr = r.flight ? `${r.flight.origin} to ${r.flight.destination}, departing ${new Date(r.flight.departTime).toLocaleString()}.` : '';
    return `Booking ${r.ref} is ${r.status}. ${routeStr} Seats: ${r.seats}, total paid: ₦${Number(r.totalPrice).toLocaleString()}.`;
  }

  if (/cancel|status|track my|my booking/.test(msg) && (!refMatch || !emailMatch)) {
    return 'I can look that up — please send your booking reference (e.g. ENV-AB12CD) and the email you booked with, both in the same message.';
  }

  if (/flight|book|route|fly|fare|price/.test(msg)) {
    const db = readDB();
    const cities = Array.from(new Set(db.flights.flatMap(f => [f.origin, f.destination])));
    const found = cities.filter(c => msg.includes(c.split(' (')[0].toLowerCase()));
    if (found.length >= 1) {
      const r = await executeTool('search_flights', found.length >= 2 ? { origin: found[0], destination: found[1] } : { origin: found[0] });
      if (r.flights.length === 0) return "I couldn't find flights matching that. Try our search page, or tell me a different route.";
      return 'Here\u2019s what I found:\n' + r.flights.map(f =>
        `${f.flightNo}: ${f.origin} \u2192 ${f.destination}, ${new Date(f.departTime).toLocaleString()}, \u20A6${f.price.toLocaleString()}, ${f.seatsAvailable} seats left`
      ).join('\n');
    }
    return 'Tell me your origin and destination city (e.g. "flights from Lagos to Abuja") and I\u2019ll look them up.';
  }

  if (/human|agent|speak to someone|real person/.test(msg)) {
    return 'I can flag this for a human agent \u2014 just send your name, email, and what you need help with, and I\u2019ll open a support ticket.';
  }

  if (emailMatch && /help|issue|problem|question|support/.test(msg)) {
    const r = await executeTool('create_support_ticket', { name: 'Website visitor', email: emailMatch[0], message: raw });
    return `Thanks \u2014 I've logged this for our team (ticket #${r.ticketId}). Someone will follow up by email.`;
  }

  return "I can help with flight searches, checking a booking, cancelling a booking, or connecting you to a human agent. What do you need?";
}

module.exports = { fallbackReply };
