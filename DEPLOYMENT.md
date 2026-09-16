# 🚀 ExerFit Cloud Deployment Guide

This guide explains how to deploy KFCG ExerFit to free cloud hosting platforms.

---

## 1. Deploy to Render.com (Recommended Free Full-Stack Host)

Render provides free hosting for full-stack Node.js web services and free PostgreSQL databases.

### Method A: 1-Click Blueprint (Easiest)
1. Push your repository to **GitHub**.
2. Go to [Render.com](https://render.com/) and sign in.
3. Click **New +** → **Blueprint**.
4. Select your GitHub repository.
5. Render will automatically read `render.yaml`, create a free PostgreSQL database, link it to your web service, build the frontend, and deploy!

### Method B: Manual Web Service Setup
1. Create a **Free PostgreSQL Database** on Render (or use [Neon.tech](https://neon.tech/)).
2. Click **New +** → **Web Service** and connect your repository.
3. Set:
   * **Runtime**: `Node`
   * **Build Command**: `npm run build`
   * **Start Command**: `npm start`
4. Add Environment Variables in Settings:
   * `NODE_ENV`: `production`
   * `JWT_SECRET`: (Random string, e.g. `exerfit_secret_token_123`)
   * `DATABASE_URL`: (Your database connection string)
   * `GEMINI_API_KEY`: (Your Google Gemini API Key from AI Studio)
5. Click **Deploy Web Service**.

---

## 2. Deploy to Railway.app

1. Go to [Railway.app](https://railway.app/).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Add a **PostgreSQL** service to your Railway canvas.
4. Link `DATABASE_URL` from the PostgreSQL service to your app variables.
5. Railway will automatically build and start the app via `package.json`.

---

## 3. Deploy to Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run `fly launch` in the project directory.
3. Attach a Postgres cluster: `fly postgres create` and `fly postgres attach`.
4. Run `fly deploy`.

---

## 4. Deploy to Vercel

1. Push code to GitHub and import the project in [Vercel](https://vercel.com/).
2. Create a serverless PostgreSQL database on [Neon.tech](https://neon.tech/) (free).
3. In Vercel Project Settings → **Environment Variables**, add:
   * `DATABASE_URL`: Your Neon connection string.
   * `JWT_SECRET`: Random secure string.
   * `GEMINI_API_KEY`: Your Gemini API key.
4. Deploy! The `vercel.json` configuration handles static assets and API routes automatically.
