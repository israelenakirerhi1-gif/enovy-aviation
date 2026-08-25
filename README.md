# ENOVY Air — Flight Booking Platform

A working flight-booking site for ENOVY GLOBAL LTD: customers can search flights, book seats,
and manage their trips from a personal dashboard. You get a separate, owner-only **Admin
Dashboard** to oversee every user account, every booking, and the flight schedule itself.

This is a real client + server app (not just front-end tricks): a Node.js/Express API handles
accounts, passwords, sessions and bookings, and the data is stored in a local `data.json` file
that acts as your database.

## 1. Requirements

- [Node.js](https://nodejs.org) version 18 or later (includes `npm`)

## 2. Install & Run

```bash
cd enovy-aviation
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

The first time you run it, `data.json` is created automatically with:
- One **admin** account (see below)
- One demo traveller account
- Eight sample flights

## 3. Your Admin Login

```
Email:    admin@enovyglobal.com
Password: ChangeMe123!
```

Go to **http://localhost:3000/login.html**, log in with those details, then visit
**http://localhost:3000/admin.html** — this is your control panel. From there you can:

- **Overview** — total users, flights, active bookings, and revenue
- **Users** — see every registered account and suspend/reactivate any of them (suspended users
  can't log in)
- **Bookings** — see every booking made by every customer, and cancel any of them
- **Flights** — add new flights or delete existing ones

**Change the admin password immediately.** The easiest way right now is to stop the server,
delete `data.json`, open `server/db.js`, change `'ChangeMe123!'` to your own password, then
restart the server (this regenerates the database with your new password). A proper "change
password" screen is a natural next feature to add once you're ready to go further.

Only accounts with `role: "admin"` in the database can reach `/admin.html` and its API routes —
that role can never be granted through the public sign-up form, so random visitors can never
make themselves an admin.

## 4. The AI Chatbot

Every page has a floating chat bubble (bottom-right) that customers can use to:
- Search flights ("any flights from Lagos to Abuja?")
- Check a booking's status (needs the booking reference **and** the email it was booked with)
- Cancel a booking (same verification — reference + matching email)
- Get escalated to a human — it opens a **support ticket** you can see and resolve from
  **Admin Dashboard → Support Tickets**

It runs in two modes:

- **Fallback mode (default, no setup needed):** keyword-based matching that still performs real
  actions — it calls the same booking/flight functions the rest of the site uses, it just isn't
  conversational.
- **Full AI mode:** once you set an `ANTHROPIC_API_KEY` environment variable, the chatbot uses
  Claude with real tool-calling to hold a natural conversation, decide when to look something up,
  ask clarifying questions, and only escalate to a human when it truly can't help. Get a key at
  **https://console.anthropic.com** (this requires its own billing setup, separate from
  claude.ai). Then run:
  ```bash
  export ANTHROPIC_API_KEY="sk-ant-..."
  npm start
  ```
  On a host like Render, add it as an environment variable in the dashboard instead (see
  `DEPLOY.md`). If the key is missing, invalid, or the API call fails for any reason, the bot
  automatically drops back to fallback mode rather than breaking — the widget always responds.

## 5. Project Layout

```
enovy-aviation/
  server/
    index.js          → starts the Express server, wires up routes
    db.js              → reads/writes data.json (your "database"), seeds default data
    auth.js             → checks login tokens, blocks non-admins from admin routes
    reset-data.js        → wipes data.json back to the default seed (npm run seed:reset)
    routes/
      auth.js            → register, login, "who am I"
      flights.js         → public flight search
      bookings.js        → book a flight, view my bookings, cancel a booking
      admin.js           → admin-only: users, all bookings, flight management
  public/               → everything the browser loads
    index.html           → search flights
    flights.html         → search results
    booking.html          → passenger details + confirmation (boarding pass)
    login.html / register.html
    dashboard.html        → a logged-in user's own bookings
    admin.html             → your owner-only control panel
    assets/
      style.css            → shared design
      app.js               → shared session/login helpers used by every page
      page-*.js             → the logic for each individual page
  data.json              → created automatically — this is your live database
```

**How accounts and passwords work:** passwords are never stored in plain text — they're hashed
with bcrypt before being saved. Logging in issues a signed token (JWT) that the browser stores
and sends with each request; the server checks that token on every booking/dashboard/admin
action, so a user can only ever see or cancel their own bookings, and only an admin token can
reach `/api/admin/*` routes.

## 6. Before You Put This Live

This is a solid working foundation, but there are a few things worth doing before real customers
and real money touch it:

1. **Set a real `JWT_SECRET`.** Right now it falls back to a development value. Set an
   environment variable before starting the server:
   ```bash
   export JWT_SECRET="a-long-random-string-nobody-can-guess"
   npm start
   ```
2. **Add real payments.** Checkout here confirms bookings instantly with no payment step — wire
   up a payment provider (e.g. Paystack or Flutterwave, popular in Nigeria) before accepting real
   money.
3. **Move off the JSON file for a database** (e.g. PostgreSQL) once you have real traffic — the
   file-based store is simple and fine for getting started, but multiple simultaneous writes at
   scale need a proper database.
4. **Host it somewhere persistent** (Railway, Render, a VPS, etc.) with HTTPS — right now this
   only runs on your own machine.
5. **Send real emails** for booking confirmations and account actions (currently there's no email
   sending — confirmations only show on-screen).
6. **Watch chatbot API costs.** If you turn on full AI mode with `ANTHROPIC_API_KEY`, each chat
   message costs a small amount on your Anthropic account. Fallback mode is free but less capable
   — reasonable to start with, and you can flip on AI mode any time by setting the key.

## 7. Useful Commands

```bash
npm start            # run the server
npm run seed:reset   # wipe data.json and restore the default admin/demo/flights
```
