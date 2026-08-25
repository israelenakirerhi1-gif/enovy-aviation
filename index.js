const localProvider = require('./local');
const emiratesProvider = require('./emirates');
const airPeaceProvider = require('./airpeace');

async function searchFlights({ provider = 'all', origin, destination, date }) {
  const providers = provider === 'all'
    ? [localProvider, emiratesProvider, airPeaceProvider]
    : [{ local: localProvider, emirates: emiratesProvider, airpeace: airPeaceProvider }[provider]].filter(Boolean);

  const results = [];
  const unavailable = [];
  for (const p of providers) {
    try {
      const out = await p.search({ origin, destination, date });
      results.push(...(out.flights || []));
      if (out.available === false) unavailable.push({ provider: p.name, reason: out.reason });
    } catch (err) {
      unavailable.push({ provider: p.name, reason: err.message || 'Provider unavailable' });
    }
  }
  results.sort((a, b) => new Date(a.departTime) - new Date(b.departTime));
  return { flights: results, unavailable };

}

module.exports = { searchFlights };
