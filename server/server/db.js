const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH =
  process.env.DATA_PATH ||
  path.join(__dirname, '..', 'data.json');

function seedData() {
  const adminHash = bcrypt.hashSync('ChangeMe123!', 10);
  const demoHash = bcrypt.hashSync('Password123!', 10);
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: 1,
        name: 'Ovie Enakirerhi',
        email: 'admin@enovyglobal.com',
        passwordHash: adminHash,
        role: 'admin',
        status: 'active',
        createdAt: now
      },
      {
        id: 2,
        name: 'Test Traveller',
        email: 'traveller@example.com',
        passwordHash: demoHash,
        role: 'user',
        status: 'active',
        createdAt: now
      }
    ],

    flights: [
      {
        id: 1,
        flightNo: 'EN101',
        airline: 'ENOVY Air',
        origin: 'Lagos (LOS)',
        destination: 'Abuja (ABV)',
        departTime: '2026-09-10T07:30:00',
        arriveTime: '2026-09-10T08:45:00',
        price: 85000,
        seatsTotal: 150,
        seatsAvailable: 118
      },
      {
        id: 2,
        flightNo: 'EN214',
        airline: 'ENOVY Air',
        origin: 'Lagos (LOS)',
        destination: 'Port Harcourt (PHC)',
        departTime: '2026-09-10T11:15:00',
        arriveTime: '2026-09-10T12:10:00',
        price: 62000,
        seatsTotal: 120,
        seatsAvailable: 95
      },
      {
        id: 3,
        flightNo: 'EN330',
        airline: 'ENOVY Air',
        origin: 'Warri (QRW)',
        destination: 'Lagos (LOS)',
        departTime: '2026-09-11T09:00:00',
        arriveTime: '2026-09-11T09:55:00',
        price: 54000,
        seatsTotal: 90,
        seatsAvailable: 61
      },
      {
        id: 4,
        flightNo: 'EN045',
        airline: 'ENOVY Air',
        origin: 'Abuja (ABV)',
        destination: 'Kano (KAN)',
        departTime: '2026-09-11T14:20:00',
        arriveTime: '2026-09-11T15:15:00',
        price: 58000,
        seatsTotal: 100,
        seatsAvailable: 100
      },
      {
        id: 5,
        flightNo: 'EN702',
        airline: 'ENOVY Air',
        origin: 'Lagos (LOS)',
        destination: 'London (LHR)',
        departTime: '2026-09-12T22:40:00',
        arriveTime: '2026-09-13T05:10:00',
        price: 780000,
        seatsTotal: 240,
        seatsAvailable: 173
      },
      {
        id: 6,
        flightNo: 'EN511',
        airline: 'ENOVY Air',
        origin: 'Lagos (LOS)',
        destination: 'Dubai (DXB)',
        departTime: '2026-09-13T01:15:00',
        arriveTime: '2026-09-13T11:00:00',
        price: 690000,
        seatsTotal: 220,
        seatsAvailable: 140
      },
      {
        id: 7,
        flightNo: 'EN128',
        airline: 'ENOVY Air',
        origin: 'Port Harcourt (PHC)',
        destination: 'Abuja (ABV)',
        departTime: '2026-09-14T08:05:00',
        arriveTime: '2026-09-14T09:10:00',
        price: 71000,
        seatsTotal: 100,
        seatsAvailable: 88
      },
      {
        id: 8,
        flightNo: 'EN870',
        airline: 'ENOVY Air',
        origin: 'Abuja (ABV)',
        destination: 'Lagos (LOS)',
        departTime: '2026-09-14T17:45:00',
        arriveTime: '2026-09-14T19:00:00',
        price: 83000,
        seatsTotal: 150,
        seatsAvailable: 130
      }
    ],

    bookings: [],
    supportTickets: [],

    nextIds: {
      user: 3,
      flight: 9,
      booking: 1,
      ticket: 1
    }
  };
}

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const data = seedData();

    fs.writeFileSync(
      DB_PATH,
      JSON.stringify(data, null, 2)
    );

    return data;
  }

  const data = JSON.parse(
    fs.readFileSync(DB_PATH, 'utf-8')
  );

  let changed = false;

  if (!Array.isArray(data.supportTickets)) {
    data.supportTickets = [];
    changed = true;
  }

  if (!data.nextIds) {
    data.nextIds = {};
    changed = true;
  }

  if (!data.nextIds.ticket) {
    data.nextIds.ticket = 1;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(
      DB_PATH,
      JSON.stringify(data, null, 2)
    );
  }

  return data;
}

function writeDB(data) {
  fs.writeFileSync(
    DB_PATH,
    JSON.stringify(data, null, 2)
  );
}

module.exports = {
  readDB,
  writeDB,
  seedData,
  DB_PATH
};
