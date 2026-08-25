// Emirates provider adapter.
// Live inventory must use an authorized Emirates Gateway/NDC or approved GDS connection.
// Credentials stay on the server and must never be placed in public/assets.
const name = 'Emirates';

const config = {
  code: 'EK',
  networkType: 'Emirates Gateway / NDC or approved GDS',
  liveConfigured: Boolean(process.env.EMIRATES_NDC_URL && process.env.EMIRATES_API_KEY),
  directBookingUrl: 'https://www.emirates.com/'
};

async function search({ origin, destination, date }) {
  if (!process.env.EMIRATES_NDC_URL || !process.env.EMIRATES_API_KEY) {
    return {
      available: false,
      flights: [],
      reason: 'Live Emirates connectivity is not configured. Connect an authorized Emirates Gateway/NDC or approved GDS account on the server.',
      config
    };
  }

  // IMPORTANT: Emirates supplies partner-specific endpoint/authentication details.
  // Implement the exact NDC contract supplied for your approved account here.
  // Do not guess the request format or scrape emirates.com.
  return {
    available: false,
    flights: [],
    reason: 'Emirates credentials are present, but the partner-specific NDC adapter still needs the endpoint contract and agency identifiers supplied by Emirates.',
    config,
    search: { origin, destination, date }
  };
}

module.exports = { name, config, search };
