# Deploying ENOVY Air to a Public URL

I can't create hosting accounts or push deployments on your behalf, but this project is set up
so you can go from "code on my computer" to "live website anyone can visit" in about 10 minutes,
using **Render** (free to start, no credit card required).

## Option A: Render — recommended, easiest

### 1. Put the code on GitHub
Render deploys from a Git repository, so the code needs to live there first.

```bash
cd enovy-aviation
git init
git add .
git commit -m "Initial commit"
```

Then create a new empty repository at **https://github.com/new** (don't add a README there),
and push:

```bash
git remote add origin https://github.com/YOUR-USERNAME/enovy-air.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Render
1. Go to **https://render.com** and sign up (GitHub sign-in is fastest).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub account and select the `enovy-air` repository you just pushed.
4. Render will detect the included `render.yaml` file and configure everything automatically —
   it builds with `npm install` and starts with `npm start`, and generates a secure `JWT_SECRET`
   for you.
5. Click **Apply** / **Create**. First deploy takes a couple of minutes.
6. When it's done, Render gives you a live URL like `https://enovy-air.onrender.com` — that's
   your public website.

No `render.yaml`? You can also click **New +** → **Web Service**, point it at your repo, and set:
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variable:** `JWT_SECRET` = (any long random string)

### Turning on the full AI chatbot (optional)
The chatbot works out of the box in fallback mode. To give it real conversational AI:
1. Get an API key at **https://console.anthropic.com** (separate account/billing from claude.ai).
2. In Render: **Service → Environment → Add Environment Variable** → key `ANTHROPIC_API_KEY`,
   value your key.
3. Render redeploys automatically. That's it — no code changes needed.

### 3. Log in as admin on the live site
Visit `https://your-app.onrender.com/login.html` and log in with:
```
admin@enovyglobal.com / ChangeMe123!
```
**Change this password immediately** — see the main `README.md` for how.

### Important limitation on Render's free tier
Free web services on Render don't keep a persistent disk — every time you redeploy (e.g. push a
code update), the `data.json` file resets to the default seed data, wiping any bookings/users
made in between. This is fine while you're testing the site publicly. Before real customers use
it, either:
- Upgrade to Render's **Starter** plan (~$7/month) and attach a persistent disk (instructions are
  commented in `render.yaml`), or
- Move from the JSON file to a real hosted database — Render's managed **Postgres** is the
  natural next step, and is a bigger change I can help you make when you're ready.

Free services also "spin down" after 15 minutes with no visitors and take ~30–60 seconds to wake
back up on the next visit — normal for free tiers, and gone once you're on a paid plan.

## Option B: Railway (similar, alternative to Render)

1. Push the same code to GitHub as above.
2. Go to **https://railway.app**, sign in with GitHub.
3. **New Project** → **Deploy from GitHub repo** → select your repo.
4. Railway auto-detects Node.js. Add an environment variable `JWT_SECRET` with a random string.
5. Once deployed, Railway gives you a public URL under **Settings → Networking → Generate Domain**.

Railway's free trial is usage-based rather than always-free, so check current pricing before
relying on it long-term.

## Using your own domain (e.g. www.enovyglobal.com)

Both Render and Railway let you attach a custom domain once deployed:
- Render: **Service → Settings → Custom Domains** → add your domain → update your domain's DNS
  (a CNAME record) as instructed.
- Railway: **Settings → Networking → Custom Domain**, same idea.

HTTPS is issued automatically on both platforms — no extra setup needed.

## If you'd rather I keep helping from here

I can't click through hosting dashboards for you, but I can:
- Walk through any error message you hit during deploy
- Update the code for a different host if you prefer (e.g. Fly.io, a VPS with Docker)
- Make the Postgres migration when you're ready to move off the JSON file
