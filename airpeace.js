// Air Peace provider adapter.
// Live inventory must come through an authorized GDS/booking-platform subscription
// or another airline-approved integration. Do not scrape the public booking page.
const name = 'Air Peace';

const config = {
  code: 'P4',
  networkType: 'Authorized GDS / booking-platform / airline integration',
  liveConfigured: Boolean(process.env.AIRPEACE_API_URL && process.env.AIRPEACE_API_KEY),
  directBookingUrl: 'https://flyairpeace.com/book-a-flight/'
};

async function search({ origin, destination, date }) {
  if (!process.env.AIRPEACE_API_URL || !process.env.AIRPEACE_API_KEY) {
    return {
      available: false,
      flights: [],
      reason: 'Live Air Peace connectivity is not configured. Connect an authorized GDS/booking-platform or airline integration on the server.',
      config
    };
  }

  // IMPORTANT: use the exact contract supplied by the authorized provider.
  // Do not guess endpoints, automate the public site, or use robotic availability checks.
  return {
    available: false,
    flights: [],
    reason: 'Air Peace credentials are present, but the partner-specific adapter still needs to be configured.',
    config,
    search: { origin, destination, date }
  };
}

module.exports = { name, config, search };
