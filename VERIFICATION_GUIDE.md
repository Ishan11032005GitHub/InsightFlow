# InsightFlow 2.0 - Verification & Testing Guide

## ✅ Pre-Deployment Verification Checklist

Use this guide to verify all components are working correctly before deployment.

---

## 1. Backend Setup Verification

### Step 1: Install Dependencies
```bash
cd Backend
npm install
```
**Expected**: All packages installed successfully  
**Verify**: No error messages, `node_modules` folder created

### Step 2: Database Initialization
```bash
npm run seed
```
**Expected**: Sample data created  
**Verify**: SQLite database created at `Backend/sqlite.db`

### Step 3: Start Backend Server
```bash
npm start
```
**Expected**: Server starts on port 6001  
**Verify**: Terminal shows: `Server listening on port 6001`

### Step 4: Test Health Endpoint
```bash
curl http://localhost:6001/
```
**Expected Response**:
```json
{ "ok": true, "message": "InsightFlow Backend running" }
```

### Step 5: Test Config Endpoint
```bash
curl http://localhost:6001/api/config
```
**Expected Response**:
```json
{ "apiBase": "http://localhost:6001" }
```

---

## 2. Frontend Verification

### Step 1: Serve Frontend
```bash
# Option A: Direct browser open
# Open Frontend/analytics-dashboard.html in browser

# Option B: Local server
cd Frontend
npx http-server .
# Access at http://localhost:8080/analytics-dashboard.html
```

### Step 2: Check Page Load
- [ ] Page loads without errors
- [ ] Check browser console (F12) - no red errors
- [ ] Header shows "InsightFlow 2.0"
- [ ] Sidebar visible with "New Session" button

### Step 3: Test Theme Toggle
- [ ] Click moon icon (top right)
- [ ] Page switches to dark mode
- [ ] Click sun icon
- [ ] Page switches to light mode

---

## 3. Authentication Verification

### Step 1: Access Login Page
```bash
# Open in browser
Frontend/auth.html
```

### Step 2: Test Registration
- [ ] Go to Signup tab
- [ ] Fill form with:
  - Name: "Test User"
  - Email: "test@example.com"
  - Password: "Test123!"
- [ ] Click Sign Up
- [ ] Expected: Redirects to login

### Step 3: Test Login
- [ ] Use registered credentials
- [ ] Click Sign In
- [ ] Expected: Redirected to analytics dashboard

### Step 4: Test with Seed Data
- [ ] Email: `alice@example.com`
- [ ] Password: `password123`
- [ ] Should login successfully

---

## 4. Session Management Verification

### Step 1: Create Session
1. In analytics dashboard, click "+ Create Session"
2. Fill form:
   - Title: "Test Analysis"
   - Mode: "data_analysis"
   - Description: "Testing session creation"
3. Click Create
4. **Verify**: Session appears in sidebar

### Step 2: Switch Sessions
1. Create 2-3 sessions with different names
2. Click on each in sidebar
3. **Verify**: Active session changes, UI updates

### Step 3: Session Persistence
1. Refresh browser
2. Go back to analytics dashboard
3. **Verify**: Sessions still appear in sidebar

---

## 5. File Upload & Analysis Verification

### Step 1: Prepare Test CSV
Create a file `test_data.csv`:
```csv
Date,Revenue,Users,Growth
2024-01-01,10000,100,0
2024-01-02,12000,120,20
2024-01-03,14000,145,20
2024-01-04,13500,140,-5
2024-01-05,15000,160,14
```

### Step 2: Upload File
1. In Data Analysis tab
2. Click upload zone
3. Select `test_data.csv`
4. **Verify**:
   - File uploads
   - Document appears in list
   - Initial analysis generated

### Step 3: Run Analysis
1. Click "📊 Summary" button
2. **Verify**:
   - Analysis appears in chat
   - Results tab shows analysis card
   - No errors in console

### Step 4: Test Other Analyses
1. Click "📈 Trends" button
2. **Verify**: Trend analysis displayed
3. Repeat for other analysis types

---

## 6. Chat Interface Verification

### Step 1: Send Message
1. In Document Chat tab
2. Type: "What are the main findings?"
3. Press Enter or click Send
4. **Verify**:
   - Message appears as user message
   - AI response appears as assistant message
   - Messages scroll to bottom

### Step 2: Multi-turn Conversation
1. Send: "Show me the average revenue"
2. **Verify**: AI responds with context
3. Send follow-up: "What about users?"
4. **Verify**: Contextual response

### Step 3: Message Persistence
1. Create new session
2. Send messages
3. Switch to previous session
4. **Verify**: Messages still there

---

## 7. API Endpoint Verification

### Setup
Get your authentication token:
```bash
# Register
curl -X POST http://localhost:6001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "api-test@example.com",
    "password": "Test123!"
  }'

# Login to get token
curl -X POST http://localhost:6001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api-test@example.com",
    "password": "Test123!"
  }'
```

Save the returned token as `$TOKEN`

### Test Session Endpoints

#### Create Session
```bash
curl -X POST http://localhost:6001/api/analytics/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Session",
    "mode": "data_analysis",
    "description": "Testing API"
  }'
```
**Verify**: Returns session object with ID

#### Get Sessions
```bash
curl -X GET http://localhost:6001/api/analytics/sessions \
  -H "Authorization: Bearer $TOKEN"
```
**Verify**: Returns array of sessions

#### Get Session Details
```bash
curl -X GET http://localhost:6001/api/analytics/sessions/$SESSION_ID \
  -H "Authorization: Bearer $TOKEN"
```
**Verify**: Returns session with documents and messages

### Test File Upload
```bash
curl -X POST http://localhost:6001/api/analytics/upload?sessionId=$SESSION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_data.csv"
```
**Verify**: Returns document object with ID

### Test Analysis
```bash
curl -X POST http://localhost:6001/api/analytics/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "$DOC_ID",
    "sessionId": "$SESSION_ID",
    "analysisType": "summary",
    "columns": ["Revenue", "Users"]
  }'
```
**Verify**: Returns analysis results

### Test Chat Message
```bash
curl -X POST http://localhost:6001/api/analytics/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "$SESSION_ID",
    "message": "What are the trends?",
    "documentId": "$DOC_ID"
  }'
```
**Verify**: Returns assistant response

---

## 8. Data Analysis Engine Verification

### Test Statistical Summary
**Expected for sample data**:
- Revenue: min=10000, max=15000, mean≈12900, median=13500
- Users: min=100, max=160, mean≈133, median=140
- Growth: Shows distribution of growth percentages

**Verify**: Results are mathematically correct

### Test Trend Analysis
**Expected**:
- Direction: "increasing" (revenue trending up overall)
- Slope: Positive number (~1250 per day)
- Percent Change: ~50% over 5 days

### Test Anomaly Detection
**Expected**:
- Detects 2024-01-04 as potential anomaly (lower values)
- Uses IQR method
- Shows bounds

### Test Correlation
**Expected**:
- Revenue ↔ Users: High positive correlation (~0.9)
- Growth: Various correlations

---

## 9. Error Handling Verification

### Test Invalid File Upload
1. Try uploading .exe or .zip file
2. **Verify**: Error message appears
3. **Verify**: No file stored

### Test Missing Session
1. In network tab, manually call API with invalid session ID
2. **Verify**: 404 error returned
3. **Verify**: UI handles error gracefully

### Test Invalid Analysis
1. Try analyzing without document
2. **Verify**: Error message appears

### Test Large File
1. Create 50MB test file
2. Try uploading
3. **Verify**: Rejected with size error

---

## 10. Security Verification

### Test Authentication
1. Clear browser storage: `localStorage.clear()`
2. Try accessing analytics dashboard directly
3. **Verify**: Redirects to auth.html

### Test Token Expiration
1. Modify token in browser storage (change one character)
2. Try sending message in chat
3. **Verify**: Returns 401 Unauthorized

### Test Data Isolation
1. Login as user A
2. Note session IDs
3. Logout, login as user B
4. **Verify**: Cannot see user A's sessions/documents

### Test CORS
1. Open browser console
2. Try API call from different origin
3. **Verify**: CORS error (as expected)

---

## 11. Performance Verification

### Measure File Upload Time
```javascript
// In browser console
const start = performance.now();
// Upload file through UI
// After success:
console.log(`Upload time: ${performance.now() - start}ms`);
```
**Expected**: < 5000ms for 10MB file

### Measure Analysis Time
```javascript
// In browser console
const start = performance.now();
// Run analysis through UI
// After success:
console.log(`Analysis time: ${performance.now() - start}ms`);
```
**Expected**: < 3000ms for summary

### Check Network Tab
1. Open DevTools → Network tab
2. Perform various operations
3. **Verify**: 
   - API responses < 200ms
   - File sizes reasonable
   - No 4xx/5xx errors

### Check Database Size
```bash
ls -lh Backend/sqlite.db
```
**Verify**: Reasonable size (should be < 50MB for test data)

---

## 12. Documentation Verification

### Verify Files Exist
- [ ] IMPLEMENTATION.md - Present and readable
- [ ] SDLC_ANALYSIS.md - Present and readable
- [ ] README.md - Updated with new info
- [ ] CHANGELOG.md - Lists all changes
- [ ] COMPLETION_SUMMARY.md - Complete

### Verify Documentation Quality
- [ ] Code examples are accurate
- [ ] Setup instructions work
- [ ] API examples are correct
- [ ] Architecture diagrams make sense
- [ ] Troubleshooting covers issues

---

## 13. Integration Test Workflow

### Complete User Journey
1. **Register** → Create account
2. **Login** → Access dashboard
3. **Create Session** → New analysis session
4. **Upload File** → CSV data
5. **Analyze** → Run summary analysis
6. **Chat** → Ask follow-up question
7. **View Results** → Check results tab
8. **Export** → Download session
9. **Switch Session** → Create and switch between sessions
10. **Logout** → Back to login page

**Verify**: All steps complete without errors

---

## 14. Browser Testing

### Test on Different Browsers
| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | Test | Latest version |
| Firefox | Test | Latest version |
| Safari | Test | Latest version |
| Edge | Test | Latest version |

**Verify**: Consistent experience across browsers

### Test Responsive Design
1. **Desktop** (1920x1080): Full layout
2. **Tablet** (768px): Responsive
3. **Mobile** (375px): Stack layout

**Verify**: UI adapts correctly

---

## 15. Final Checklist

### Backend
- ✅ Server starts without errors
- ✅ Database initialized
- ✅ All endpoints respond
- ✅ Error handling works
- ✅ AI mock functions work

### Frontend
- ✅ Page loads without console errors
- ✅ Theme toggle works
- ✅ File upload works
- ✅ Analysis works
- ✅ Chat interface works

### Integration
- ✅ File → Analysis → Export workflow
- ✅ Session management works
- ✅ Message history persists
- ✅ Multi-session switching works

### Security
- ✅ Authentication required
- ✅ User data isolated
- ✅ CORS configured
- ✅ Input validated

### Performance
- ✅ Response times acceptable
- ✅ File handling efficient
- ✅ UI responsive
- ✅ Memory usage reasonable

### Documentation
- ✅ All guides present
- ✅ API documented
- ✅ Setup instructions work
- ✅ Examples accurate

---

## Known Limitations

1. **File Size**: Maximum 10MB per file (configurable)
2. **Message History**: Limited to 50 most recent (pageable)
3. **Gemini API**: Requires valid API key for full AI features
4. **Database**: SQLite suitable for development (consider PostgreSQL for production)
5. **Charts**: Basic visualization (consider Chart.js for advanced)

---

## Troubleshooting Quick Reference

### Port Already in Use
```bash
# Kill existing process
lsof -i :6001 | grep LISTEN | awk '{print $2}' | xargs kill -9
# Or use different port
PORT=6002 npm start
```

### CORS Errors
- Check CORS_ORIGINS in .env
- Frontend and backend must have matching origins
- Update if running on different port

### File Upload Fails
- Check file size (max 10MB)
- Verify file format (CSV, JSON, TXT, XLSX, PDF)
- Check server logs for details

### No AI Responses
- Check GEMINI_API_KEY in .env
- System falls back to mock automatically
- Check browser console for errors

### Database Locked
```bash
# Reset database
rm Backend/sqlite.db
npm run seed
npm start
```

---

## Performance Tuning Tips

1. **Database**: Add indexes for frequently queried columns
2. **Backend**: Enable gzip compression in Express
3. **Frontend**: Lazy load large datasets
4. **Network**: Enable HTTP/2 caching headers
5. **AI**: Cache Gemini responses for repeated queries

---

## Deployment Readiness

**Before Production Deployment:**
- [ ] Environment variables configured
- [ ] Database backed up
- [ ] SSL/TLS enabled
- [ ] Logging set up
- [ ] Monitoring configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Regular backups scheduled

---

## Support Resources

1. **IMPLEMENTATION.md** - Technical details
2. **SDLC_ANALYSIS.md** - Architecture explanation
3. **README.md** - Quick reference
4. **Browser Console** - Debug frontend
5. **Server Logs** - Debug backend

---

## Sign-Off

**Verification Date**: _______________  
**Verified By**: _______________  
**Status**: ✅ Ready for Deployment  
**Notes**: _______________

---

**Document Version**: 1.0  
**Created**: January 25, 2026  
**Last Updated**: January 25, 2026
