// Run with: npm run seed:reset
// Wipes data.json and rebuilds it from the default seed (admin account, demo user, sample flights).
const fs = require('fs');
const { seedData, DB_PATH } = require('./db');

fs.writeFileSync(DB_PATH, JSON.stringify(seedData(), null, 2));
console.log('Database reset to defaults at', DB_PATH);
console.log('Admin login: admin@enovyglobal.com / ChangeMe123!  (change this immediately)');
