# InsightFlow - Quick Start Guide

## ✅ Backend Server Status

**Backend is now RUNNING on port 6001!**

### How to Start the Backend

You have several options:

#### **Option 1: Using start scripts (EASIEST)**
- **Windows (CMD):** Double-click `start-backend.bat`
- **Windows (PowerShell):** Run `.\start-backend.ps1`
- **Mac/Linux:** Run `./start-backend.sh`

#### **Option 2: Manual start from Backend folder**
```bash
cd Backend
npm start
```

#### **Option 3: Development mode with auto-reload**
```bash
cd Backend
npm run dev
```
(Requires nodemon to be installed)

#### **Option 4: One-line from root**
```bash
cd Backend && npm start
```

---

## 📋 Project Structure

```
InsightFlow/
├── Backend/              (Node.js/Express API)
│   ├── server.js        (Main server file)
│   ├── package.json
│   ├── config/          (Database config)
│   ├── controllers/      (API logic)
│   ├── routes/          (API endpoints)
│   ├── models/          (MongoDB & SQL schemas)
│   └── middleware/      (Auth, error handling)
│
├── Frontend/            (HTML/CSS/JS)
│   ├── dashboard.html   (Main app)
│   ├── auth.html        (Login/signup)
│   ├── intro.html       (Landing page)
│   └── *.css & *.js     (Styling & logic)
│
├── start-backend.bat    (Windows CMD launcher)
├── start-backend.ps1    (Windows PowerShell launcher)
└── README.md
```

---

## 🚀 Quick Start

### Step 1: Start the Backend
```bash
cd Backend
npm start
```
✅ Server will start on `http://localhost:6001`

### Step 2: Open Frontend
- **Option A:** Open `Frontend/intro.html` in your browser
- **Option B:** Set up a local server (VS Code Live Server, Python, etc.)

### Step 3: Test the Application
1. Click "Get Started" or "Sign in" on the intro page
2. Create an account or sign in
3. Use Data Analysis or PDF Chat features
4. Toggle theme with the moon/sun icon

---

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user (protected)

### Settings
- `GET /api/settings` - Get user settings
- `POST /api/settings/theme` - Save theme preference

### Data Analysis
- PDF upload and chat endpoints (ready for integration)

---

## 🎨 Features Implemented

✅ **Dark/Light Theme Toggle** - Click moon/sun icon to switch
✅ **Authentication** - Register, login, logout
✅ **Data Analysis** - Upload CSV, generate reports with charts
✅ **PDF Chat** - Upload PDF and ask questions (UI ready)
✅ **Session Management** - Create, save, export sessions
✅ **Responsive Design** - Works on desktop, tablet, mobile
✅ **Form Validation** - Client and server-side validation
✅ **Toast Notifications** - Success/error feedback
✅ **Charts.js Integration** - Bar and pie charts with export

---

## 🐛 Troubleshooting

### "Cannot find module 'server.js'"
**Solution:** Make sure you're in the `Backend` folder before running `npm start`

### Server won't start on port 6001
**Solution:** The server tries ports 6001-6010 automatically. Check if another app is using the port.

### Frontend can't connect to backend
**Solution:** Make sure backend is running, and frontend is trying to connect to `http://localhost:6001`

### Missing dependencies error
**Solution:** Run `npm install` in the Backend folder

### Charts not showing
**Solution:** Make sure Chart.js is loaded. Check browser console for errors.

---

## 📝 Database Setup

The backend supports both:
- **MongoDB** - For production (set `DB_TYPE=mongo` in .env)
- **SQLite** - For development (default)

---

## 🔐 Environment Variables

Create a `.env` file in the Backend folder:

```env
PORT=6001
DB_TYPE=sqlite
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5501,http://127.0.0.1:5501
```

---

## 📞 Development Commands

```bash
# In Backend folder:
npm start          # Production start
npm run dev        # Development with auto-reload
npm run seed       # Seed database with test data
npm install        # Install dependencies
npm audit fix      # Fix security vulnerabilities
```

---

## ✨ What's Next

1. ✅ Backend API running
2. ✅ All frontend buttons working
3. ✅ Theme system fully functional
4. ⏳ Connect PDF chat to RAG endpoint
5. ⏳ Add real database persistence
6. ⏳ Deploy to production

---

**Happy coding! 🚀**
