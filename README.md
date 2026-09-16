# 🏋️‍♂️ KFCG ExerFit - AI-Powered Physical Fitness Assessment System

KFCG ExerFit is a full-stack, AI-powered Physical Fitness Assessment and Learning Management system built with **React, TypeScript, Tailwind CSS, MediaPipe Pose Estimation, Google Gemini AI, Express.js, and PostgreSQL**.

---

## ⚡ Quick Start: 1-Click Automated Setup

### Option 1: Automatic Local Setup (Recommended for Windows)
1. Download or clone this repository to your computer.
2. Double-click **`setup.bat`** (or run `npm run setup` in your terminal).
3. The wizard will automatically install dependencies, create your `.env` configuration, initialize your database tables, seed default PE sections and demo accounts, and launch the server on **`http://localhost:3000`**!

### Option 2: Automatic Local Setup (macOS / Linux)
Open your terminal inside the project directory and run:
```bash
chmod +x setup.sh
./setup.sh
```

### Option 3: 1-Command Docker Setup (Zero Install)
If you have Docker installed, you can start both the PostgreSQL database and the ExerFit application instantly:
```bash
docker compose up -d
```
Open **`http://localhost:3000`** in your browser.

---

## 🗄️ Database Options

ExerFit runs on PostgreSQL with Drizzle ORM. You can choose any of the following:

### A. Free Cloud Serverless Postgres (Recommended - 2 Min Setup)
* Create a free database at **[Neon.tech](https://neon.tech/)** or **[Supabase.com](https://supabase.com/)**.
* Copy the connection string into your `.env` as `DATABASE_URL`:
  ```env
  DATABASE_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
  ```
* The app automatically connects via SSL and auto-generates all tables on first launch!

### B. Local PostgreSQL
* Install PostgreSQL on your PC ([postgresql.org](https://www.postgresql.org/download/)).
* Configure `.env`:
  ```env
  SQL_HOST=localhost
  SQL_PORT=5432
  SQL_USER=postgres
  SQL_PASSWORD=your_password
  SQL_DB_NAME=exerfit_db
  ```

---

## ☁️ Free Online Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for step-by-step guides on deploying to:
- **Render.com** (Free 1-Click Blueprint with `render.yaml`)
- **Railway.app**
- **Fly.io**
- **Vercel**

---

## 🎓 Academic Thesis Defense Documentation

Complete academic manuscripts, slide scripts, and mathematical specifications are provided in this repository:
- 📖 **[THESIS_DEFENSE_DOCUMENTATION.md](./THESIS_DEFENSE_DOCUMENTATION.md)**: Full master thesis defense manuscript (Abstract, Problem Statement, 3-Layer Architecture, Mathematical Formulations, IPO Paradigm, and Panel Defense Q&A).
- 🎤 **[THESIS_DEFENSE_PRESENTATION_SCRIPT.md](./THESIS_DEFENSE_PRESENTATION_SCRIPT.md)**: Slide-by-slide 15-minute presentation script with speaker notes and demo steps.
- 💻 **In-App Thesis Defense Hub**: Click the **"Thesis Defense Hub"** button in the app navigation to view interactive kinematic diagrams and formulas during your live defense.

---

## 🔑 Default Demo Accounts

* **Teacher / Faculty**: `teacher@demo.com` / `password123`
* **Student**: `student@demo.com` / `password123`
