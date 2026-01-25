# Automated Report Generation & Visualization System

## 📌 Project Description
This repository contains a complete web application for automated report generation, visualization, and lightweight RAG-style PDF chat. It includes a static frontend and a Node.js + Express backend providing authentication, PDF upload/chat, report generation (local Gemini-style mock), and a SQLite (Sequelize) database with a Mongo-compatible model layer.

The system is intended as a developer-friendly starter for building analytic workflows and RAG integrations.

---

## 🎯 Key Features
- Web frontend for sign-up / sign-in, dashboard, report generation, and PDF chat.
- JWT authentication with bcrypt password hashing.
- SQLite (Sequelize) primary database with Mongoose models included as optional fallback.
- PDF upload and text extraction endpoint for RAG-style chat.
- Local Gemini-like mock AI routes: `generateReport` and `chatWithPdf` for testing without external APIs.
- Seed script to populate sample users, documents, and reports.
- CORS and port auto-detection support for local development.

---

## 🧱 Technology Stack
- Frontend: plain HTML/CSS/JavaScript (static files in `Frontend/`).
- Backend: Node.js, Express, JWT, bcrypt (source in `Backend/`).
- Database: Sequelize + SQLite (default). Mongoose models are available under `Backend/models/mongo/` if you switch to MongoDB.
- Dev tools: nodemon, dotenv.

---

## 👥 Team Responsibilities
| Member | Area |
|-------:|:-----|
| Khushboo Pathari | Frontend & integration, project coordination |
| Kolu konda Manoj | Styling & UX (CSS) |
| Ishan Tiwari | Backend API & data models |

---

## 📂 Project Structure
```text
InsightFlow/
├── Frontend/                # Static frontend (HTML/CSS/JS)
├── Backend/                 # Node.js + Express backend
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── seed.js
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started
Prerequisites: Node.js (16+ recommended) and npm.

1. Backend setup

```bash
cd Backend
cp .env.example .env        # or edit .env and set PORT if needed
npm install
npm run seed                # optional: seeds sample users, PDFs, and reports
npm run dev                 # starts server (default PORT=6001)
```

- The backend exposes `/api/config` which returns the active `apiBase` (useful for the frontend auto-detection).

2. Frontend

- Open `Frontend/auth.html` in your browser (or serve the `Frontend/` folder with a static server).
- The frontend probes `http://localhost:6001` (and nearby ports) to discover the backend automatically. If you run the backend on a different port, update `Backend/.env` and restart the server.

---

## ⚙️ Configuration
- Default backend port: `6001`. (Port `6000` is blocked by some browsers — if you must use it, open the site in a browser that permits the port.)
- Environment variables: see `Backend/.env.example`.

---

## ✅ Seed Data
- Run `npm run seed` inside `Backend/` to create sample users (e.g., `alice@example.com` / `bob@example.com`) and example PDF/report entries for quick testing.

---

## 📁 Useful Files
- `Frontend/` — static pages and client JS
- `Backend/server.js` — Express app bootstrap
- `Backend/seed.js` — seed script to populate the database
- `Backend/.env.example` — example environment variables

---

## 🤝 Contributing
- Make changes on feature branches and open a PR. Keep `.env` and other secrets out of commits (a `.gitignore` is included).

---

## 📜 License
Specify your license here.
