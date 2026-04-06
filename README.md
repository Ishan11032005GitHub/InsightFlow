# InsightFlow Backend

This backend provides a REST API for InsightFlow: an automated report generation and PDF-chat system.

Quick start

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies:

```bash
cd Backend
npm install
```

3. By default the backend uses SQLite. Ensure `DB_TYPE=sql` and `SQL_STORAGE` in `.env`.
4. Run the server:

```bash
npm run dev
```

Seed dummy data (creates sample users, a PDF text and a sample report):

```bash
npm run seed
```

Notes
- The backend exposes endpoints for authentication, PDF upload/search, report generation, and a `chatWithPdf` endpoint which uses a local Gemini-style mock; no external API keys required.
- SQLite is the recommended local DB for this project. If you prefer MongoDB, set `DB_TYPE=mongo`.
