# InsightFlow 2.0 - AI-Powered Data Analysis Platform

## 📌 Project Description
InsightFlow 2.0 is an advanced, multi-modal AI analysis platform supporting CSV, Excel, JSON, text, and PDF documents. It features automated data analysis, intelligent insights generation, conversational chat interfaces, and session-based memory systems. The platform uses Google Gemini AI for intelligent analysis and implements an Incremental + Evolutionary Prototype Hybrid SDLC model.

The system provides enterprise-grade analytics with a developer-friendly architecture.

---

## 🎯 Key Features

### Core Capabilities
- 📁 **Multi-modal file support** - CSV, JSON, Excel, TXT, PDF
- 📊 **Automatic data analysis** - Statistical summaries, trends, correlations, anomalies
- 💬 **Conversational AI** - Chat with documents using context-aware responses
- 🧠 **Memory system** - Session-based conversation history and insights
- 📈 **Visual analytics** - Generated charts and data visualizations
- 🔍 **Advanced insights** - AI-powered analysis recommendations
- 📱 **Modern UI** - Dark mode, responsive design, real-time updates
- 🔐 **Secure authentication** - JWT tokens with bcrypt hashing

### Technical Features
- Multi-session management
- Conversation memory with context building
- Statistical analysis engine (8+ analysis types)
- File type detection and parsing
- Graceful API fallbacks
- CORS and auto-detection support
- SQLite database with Sequelize ORM

---

## 🧱 Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (no frameworks)
- **Backend**: Node.js, Express.js, JWT authentication
- **AI**: Google Gemini Flash Latest model
- **Database**: SQLite + Sequelize ORM
- **Analysis**: Custom statistical engine
- **Dev tools**: Multer (file upload), Morgan (logging), nodemon

---

## 👥 Team Responsibilities
| Member | Area |
|-------:|:-----|
| Khushboo Pathari | Frontend integration, UI/UX design, project coordination |
| Kolu konda Manoj | Styling, CSS enhancements, responsive design |
| Ishan Tiwari | Backend API, data models, analytics engine, AI integration |

---

## 📂 Project Structure
```text
InsightFlow/
├── Frontend/                        # Modern analytics dashboard
│   ├── analytics-dashboard.html    # Main app interface
│   ├── analytics-dashboard.js      # Dashboard logic
│   ├── auth.html / auth.js         # Authentication UI
│   ├── intro.html                  # Landing page
│   └── *.css                       # Styling
│
├── Backend/                        # Express API server
│   ├── server.js                   # Entry point
│   ├── config/db.js                # Database configuration
│   ├── controllers/
│   │   ├── analyticsController.js  # NEW: Multi-modal analysis
│   │   ├── aiController.js         # AI operations
│   │   ├── authController.js       # Authentication
│   │   └── *.js                    # Other endpoints
│   ├── models/sql/index.js         # NEW: Extended database models
│   ├── routes/
│   │   ├── analyticsRoutes.js      # NEW: Analytics endpoints
│   │   └── *.js                    # Other routes
│   ├── utils/
│   │   ├── fileTypeDetector.js     # NEW: Multi-format parsing
│   │   ├── analysisEngine.js       # NEW: Statistical analysis
│   │   ├── sessionManager.js       # NEW: Session & memory management
│   │   ├── aiMock.js               # AI integration with fallbacks
│   │   └── *.js                    # Utilities
│   ├── middleware/
│   ├── package.json                # Dependencies
│   └── seed.js                     # Sample data
│
├── IMPLEMENTATION.md               # NEW: Complete documentation
├── QUICK_START.md                  # Quick setup guide
├── GEMINI_SETUP.md                 # AI configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ (download from [nodejs.org](https://nodejs.org))
- npm (comes with Node.js)
- Google Gemini API key (optional, system has fallback mocks)

### Quick Start (5 minutes)

**1. Backend Setup**
```bash
cd Backend
npm install
npm run seed                # Populate sample data (optional)
npm start                   # Server starts on http://localhost:6001
```

**2. Frontend Setup**
Open `Frontend/analytics-dashboard.html` in your browser or serve with:
```bash
npx http-server Frontend/
```

**3. Create Account & Start Analyzing**
- Sign up at `/auth.html`
- Log in to access analytics dashboard
- Upload CSV, JSON, or PDF files
- Run analyses and chat with AI

### Environment Variables
Create `.env` in `Backend/` directory:
```env
PORT=6001
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-flash-latest
CORS_ORIGINS=http://localhost:5501,http://localhost:6001
DB_TYPE=sqlite
```

---

## 📊 Features in Detail

### 1. Multi-Modal File Analysis
Upload any file type and get instant insights:
- **CSV/Excel** → Statistical summaries, trends, correlations
- **JSON** → Schema analysis, structure validation
- **PDF** → Text extraction, conversational Q&A
- **Text** → Word count, sentiment, key terms

### 2. Advanced Analytics
Run sophisticated analyses without coding:
- **Summary Statistics** - Mean, median, std dev, quartiles, ranges
- **Trend Analysis** - Detect increasing/decreasing patterns
- **Correlation Matrix** - Find relationships between variables
- **Anomaly Detection** - Identify outliers using IQR method
- **Group & Aggregate** - Custom aggregations by category

### 3. AI-Powered Insights
Gemini AI generates natural language interpretations:
- Auto-generated insights for every analysis
- Context-aware follow-up responses
- Recommendations for next steps
- Confidence levels and limitations

### 4. Session Management
Organize work across multiple sessions:
- Create named sessions (Data Analysis or Document Chat)
- Switch between sessions instantly
- Full conversation history retention
- Export sessions as reports

### 5. Conversational Interface
Chat naturally with your data:
- Ask follow-up questions
- Reference previous analyses
- Get explanations of complex results
- Refine queries in real-time

---

## 🔧 API Endpoints

All endpoints require `Authorization: Bearer YOUR_TOKEN` header.

### Sessions
```
POST   /api/analytics/sessions                 Create new session
GET    /api/analytics/sessions                 List your sessions
GET    /api/analytics/sessions/:id             Get session details
GET    /api/analytics/sessions/:id/export      Export session
```

### Files
```
POST   /api/analytics/upload                   Upload & analyze file
```

### Analysis
```
POST   /api/analytics/analyze                  Run analysis on file
```

### Chat
```
POST   /api/analytics/message                  Send chat message
```

### Example Request
```bash
curl -X POST http://localhost:6001/api/analytics/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_123",
    "sessionId": "sess_456",
    "analysisType": "summary",
    "columns": ["revenue", "users", "growth"]
  }'
```

---

## 🏗️ Architecture: Incremental + Evolutionary Model

InsightFlow uses an **Incremental + Evolutionary Prototype Hybrid** SDLC approach:

### Phase 1: Core Prototype
- ✅ File type detection
- ✅ Basic CSV/JSON analysis
- ✅ Simple AI chat

### Phase 2: Session Layer
- ✅ Multi-session management
- ✅ Conversation memory
- ✅ Context building

### Phase 3: Advanced Analytics
- ✅ Statistical analysis engine
- ✅ Anomaly detection
- ✅ Correlation matrix

### Phase 4: AI Enhancement  
- ✅ Gemini integration
- ✅ Context-aware responses
- ✅ Insight generation

### Phase 5: User Experience (In Progress)
- 📋 Charts & visualizations
- 📋 Report generation & download
- 📋 Data sharing
- 📋 Scheduled analysis

This iterative approach allows:
- ✨ Rapid feedback incorporation
- 🔄 Continuous improvement
- 🎯 Clear incremental milestones
- 📈 Easy scalability

---

## 📚 Documentation

- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Complete technical documentation, database schema, API details
- **[QUICK_START.md](QUICK_START.md)** - Quick setup guide
- **[GEMINI_SETUP.md](GEMINI_SETUP.md)** - AI configuration guide

---

## 🧪 Testing

**Manual Testing Checklist:**
- [ ] Create user account
- [ ] Log in successfully
- [ ] Create analysis session
- [ ] Upload CSV file
- [ ] Run statistical summary
- [ ] Run trend analysis
- [ ] Send chat messages
- [ ] Switch sessions
- [ ] Export session data
- [ ] Test dark mode
- [ ] Logout

**Sample Test Data:**
Run seed script to populate test data:
```bash
npm run seed
```

Default test accounts:
- Email: `alice@example.com` / Password: `password123`
- Email: `bob@example.com` / Password: `password123`

---

## 🔒 Security Features

- 🔐 JWT-based authentication
- 🔑 bcrypt password hashing
- 🛡️ User data isolation
- ✅ Input validation
- 🚫 CORS protection
- 📋 Rate limiting
- 🔍 SQL injection prevention

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 6001
lsof -i :6001 | grep LISTEN | awk '{print $2}' | xargs kill -9
# Or use different port
PORT=6002 npm start
```

### File Upload Fails
- Check file size (max 10MB)
- Verify format: CSV, JSON, TXT, XLSX, PDF
- Check server logs: `npm run dev`

### No AI Responses
- Verify GEMINI_API_KEY in `.env`
- System falls back to mock responses automatically
- Check browser console for errors

### Database Errors
- Delete `Backend/sqlite.db` to reset
- Reinstall dependencies: `rm -rf node_modules && npm install`

---

## 📦 Dependencies

### Backend
```json
{
  "@google/generative-ai": "^0.24.1",
  "express": "^4.18.2",
  "sequelize": "^6.32.1",
  "sqlite3": "^5.1.6",
  "multer": "^1.4.5",
  "jsonwebtoken": "^9.0.0",
  "bcrypt": "^5.1.0"
}
```

### Frontend
- Vanilla JavaScript (no frameworks)
- Native Fetch API
- Modern CSS3

---

## 🚀 Deployment

### Cloud Deployment Checklist
- [ ] Set environment variables in hosting platform
- [ ] Initialize database
- [ ] Update CORS origins for production domain
- [ ] Enable HTTPS
- [ ] Set up logging and monitoring
- [ ] Configure backups
- [ ] Add rate limiting
- [ ] Set up CI/CD pipeline

### Example: Vercel/Heroku
```bash
# Add to package.json
"engines": {
  "node": "18.x"
}

# Deploy
git push heroku main
```

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open Pull Request

Please maintain:
- Code style consistency
- Comprehensive error handling
- User-focused messaging
- Security best practices

---

## 📄 License

MIT License - feel free to use for personal and commercial projects

---

## 🆘 Support

**Having issues?**
1. Check [IMPLEMENTATION.md](IMPLEMENTATION.md) for technical details
2. Review error messages in browser console
3. Check server logs: `npm run dev`
4. Test with sample data from seed script

**Quick Support Contacts:**
- Technical Issues: Check logs and documentation
- Feature Requests: Open an issue
- Security: Handle responsibly, contact maintainers

---

## 🎯 Roadmap

### Q1 2026
- [ ] Advanced visualizations (Chart.js)
- [ ] PDF report generation
- [ ] Data export (CSV, Excel, PDF)

### Q2 2026
- [ ] Real-time collaboration
- [ ] WebSocket support
- [ ] Custom dashboards

### Q3 2026
- [ ] Machine learning predictions
- [ ] Scheduled analysis runs
- [ ] API keys for programmatic access

### Q4 2026
- [ ] Mobile app
- [ ] Data marketplace
- [ ] Team workspaces

---

**Version**: 2.0.0  
**Last Updated**: January 25, 2026  
**Status**: ✅ Production Ready  
**Maintainers**: Khushboo Pathari, Kolu konda Manoj, Ishan Tiwari

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
