# InsightFlow 2.0 - Implementation Documentation

## Overview
InsightFlow 2.0 is an advanced AI-driven data analysis platform implementing **Incremental + Evolutionary Prototype Hybrid SDLC Model** with multi-modal file support, session-based analysis, memory systems, and intelligent insights generation.

---

## Architecture & Components

### 1. **Backend Architecture**

#### New Utilities
- **`fileTypeDetector.js`** - Detects and parses multiple file types (CSV, JSON, Excel, TXT, PDF)
- **`analysisEngine.js`** - Performs statistical analysis (summary, trends, correlations, anomalies, grouping)
- **`sessionManager.js`** - Manages analysis sessions and conversation memory

#### Extended Models
- **`Document`** - Multi-modal document storage with metadata
- **`AnalysisSession`** - Session-based organization with title, mode, status
- **`ConversationMessage`** - Memory system tracking message history
- **`AnalysisResult`** - Stores analysis outputs with insights and chart data

#### New Controller
- **`analyticsController.js`** - Unified API for all multi-modal analysis operations

#### New Routes
- **`analyticsRoutes.js`** - REST endpoints for sessions, file upload, analysis, messaging

---

## Feature Implementation

### Phase 1: Multi-Modal File Support & Analysis ✅

**Supported File Types:**
- CSV - Parsed into rows/headers with statistical analysis
- JSON - Structured data parsing with schema extraction
- Excel (XLSX/XLS) - Basic text extraction support
- Text (TXT/MD) - Word count, line analysis
- PDF - Text extraction for RAG-style chat

**File Type Detection:**
```javascript
// Extension + content-based detection
detectFileType(filename, content)
```

### Phase 2: Data Analysis Engine ✅

**Analysis Types Available:**
1. **Summary** - Statistical metrics (mean, median, std dev, quartiles)
2. **Trends** - Linear trend analysis with slope and direction
3. **Correlation** - Pearson correlation matrix between columns
4. **Anomalies** - IQR-based outlier detection
5. **Grouped** - Group-by aggregations (sum, avg, count, min, max)

**Example Usage:**
```javascript
// Statistical summary
analysisEngine.generateStatisticalSummary(data, columns);

// Trend analysis
analysisEngine.analyzeTrends(data, timeColumn, valueColumn);

// Anomaly detection
analysisEngine.detectAnomalies(data, column);
```

### Phase 3: Session & Memory Management ✅

**Session Features:**
- Create/manage multiple analysis sessions
- Store session metadata (title, mode, status)
- Track documents per session
- Maintain conversation history

**Memory System:**
- Stores all user messages and AI responses
- Supports different message types (text, analysis, query)
- Builds AI context from recent conversation history
- Enables stateful, context-aware analysis

**API:**
```javascript
// Session management
await sessionManager.createSession(userId, title, mode, description);
await sessionManager.getUserSessions(userId, options);
await sessionManager.getSessionDetails(sessionId, userId);

// Memory/Messages
await sessionManager.addMessage(sessionId, role, content, messageType);
await sessionManager.getConversationHistory(sessionId, options);
await sessionManager.saveAnalysisResult(sessionId, analysisData);

// AI Context Building
const context = await sessionManager.buildAIContext(sessionId, contextSize);
```

### Phase 4: AI Integration ✅

**AI Functions:**
```javascript
// Analyze uploaded data
analyzeData({ title, type, data, insights })

// Generate insights from analysis
generateInsights({ analysisType, data, documentName })

// Chat with contextual memory
chatWithContext(message, context)
```

**Mock Implementations:**
- All functions have fallback mock implementations
- Graceful degradation if Gemini API is unavailable
- Suitable for testing and development

---

## API Endpoints

### Session Management
```
POST   /api/analytics/sessions              - Create new session
GET    /api/analytics/sessions              - List user's sessions
GET    /api/analytics/sessions/:sessionId   - Get session details
GET    /api/analytics/sessions/:sessionId/export - Export session
```

### File Operations
```
POST   /api/analytics/upload                - Upload and analyze file
```

### Data Analysis
```
POST   /api/analytics/analyze               - Perform analysis on document
```

### Messaging
```
POST   /api/analytics/message               - Send message in session
```

---

## Frontend Features

### Analytics Dashboard (`analytics-dashboard.html`)

**Key Sections:**
1. **Sidebar**
   - New session creation button
   - Recent sessions list with quick access
   
2. **Data Analysis Tab**
   - Drag-and-drop file upload
   - Document list with actions
   - Analysis options (Summary, Trends, Correlation, Anomalies, Grouped)
   
3. **Document Chat Tab**
   - Chat interface for conversational queries
   - Context-aware responses
   - Message history display
   
4. **Results Tab**
   - Analysis result cards
   - JSON data display
   - Download functionality

**Features:**
- Real-time session switching
- Responsive design with dark mode support
- Drag-and-drop file upload
- Multi-tab interface
- Alert notifications
- Modal dialogs for session creation

---

## Database Schema

### Document
```javascript
{
  id, 
  filename,        // Original filename
  fileType,        // 'csv', 'json', 'pdf', 'text', 'excel'
  contentText,     // Full file content as text
  metadata: {      // File insights
    headers,       // Column names (CSV/JSON)
    rowCount,      // Number of rows
    wordCount,     // Text statistics
    schema,        // Data structure info
  },
  ownerId,         // User who uploaded
  sessionId,       // Associated session
  uploadedAt
}
```

### AnalysisSession
```javascript
{
  id,
  title,           // Session name
  mode,            // 'data_analysis' or 'document_chat'
  description,     // Optional details
  status,          // 'active' or 'archived'
  ownerId,         // Session owner
  createdAt,
  updatedAt
}
```

### ConversationMessage
```javascript
{
  id,
  sessionId,       // Associated session
  role,            // 'user' or 'assistant'
  content,         // Message text
  messageType,     // 'text', 'query', 'analysis', 'chart'
  metadata: {},    // Token usage, model info, etc.
  timestamp
}
```

### AnalysisResult
```javascript
{
  id,
  sessionId,
  analysisType,    // 'summary', 'trend', 'correlation', etc.
  title,
  description,
  chartType,       // 'bar', 'line', 'pie', 'scatter', 'heatmap'
  data: {},        // Chart data
  insights: {},    // AI-generated insights
  createdAt
}
```

---

## SDLC Implementation: Incremental + Evolutionary Prototype

### Phase 1: Prototype (File Detection + Basic Analysis)
✅ Completed
- File type detection and parsing
- Basic statistical analysis
- Single-file data analysis

### Phase 2: Increment 1 (Memory & Sessions)
✅ Completed
- Session management
- Conversation memory
- Multi-session support

### Phase 3: Increment 2 (Advanced Analytics)
✅ Completed
- Trend analysis
- Correlation matrix
- Anomaly detection
- Grouped aggregations

### Phase 4: Increment 3 (AI & RAG)
✅ Completed
- Gemini AI integration
- Context-aware responses
- PDF chat capability
- Insight generation

### Phase 5: Enhancement (UI & Export)
- Advanced visualizations
- Report generation & download
- Sharing capabilities
- Scheduled analysis

---

## Setup & Installation

### Prerequisites
- Node.js 16+
- npm or yarn
- Google Gemini API key (optional for mock mode)

### Backend Setup
```bash
cd Backend
npm install
npm run seed          # Optional: populate sample data
npm start             # Start server on port 6001
```

### Frontend Setup
```bash
# Open Frontend/analytics-dashboard.html in browser
# Or serve with static server:
npx http-server Frontend/
```

### Environment Variables
```env
PORT=6001
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-flash-latest
CORS_ORIGINS=http://localhost:5501,http://localhost:6001
```

---

## Usage Examples

### 1. Create a Session
```javascript
POST /api/analytics/sessions
{
  "title": "Q1 Sales Analysis",
  "mode": "data_analysis",
  "description": "Analyzing Q1 sales trends"
}
```

### 2. Upload a File
```javascript
POST /api/analytics/upload?sessionId=SESSION_ID
Content-Type: multipart/form-data
[File data]
```

### 3. Run Analysis
```javascript
POST /api/analytics/analyze
{
  "documentId": "DOC_ID",
  "sessionId": "SESSION_ID",
  "analysisType": "summary",
  "columns": ["revenue", "users", "growth"]
}
```

### 4. Chat with Session
```javascript
POST /api/analytics/message
{
  "sessionId": "SESSION_ID",
  "message": "What are the top trends?",
  "documentId": "DOC_ID"
}
```

---

## Error Handling

- **File Upload Errors** - Size limits, unsupported formats
- **Analysis Errors** - Insufficient data, invalid columns
- **Session Errors** - Not found, access denied
- **API Errors** - Network timeouts, server errors
- **Auth Errors** - Missing/invalid token

All errors return appropriate HTTP status codes with descriptive messages.

---

## Performance Considerations

- **Large Files** - 10MB limit per file
- **Data Processing** - Streaming for large datasets
- **Memory Caching** - Conversation history limit (default 50 messages)
- **API Rate Limiting** - Per-user session limits
- **Database Indexing** - sessionId, ownerId for fast queries

---

## Security

- JWT-based authentication required for all API routes
- User data isolation (ownerId checks)
- Input validation on all endpoints
- File type validation on upload
- Rate limiting on analysis endpoints
- CORS configuration for frontend

---

## Testing

### Manual Testing Checklist
- [ ] Create session
- [ ] Upload CSV file
- [ ] Run statistical summary
- [ ] Run trend analysis
- [ ] Send message in chat
- [ ] Export session
- [ ] Switch between sessions
- [ ] Dark mode toggle
- [ ] Logout

### Test Data
Use the seed script to generate sample data:
```bash
npm run seed
```

---

## Future Enhancements

1. **Visualization** - Charts and graphs (Chart.js, D3.js)
2. **Advanced NLP** - Sentiment analysis, entity extraction
3. **Real-time Collaboration** - WebSocket support
4. **Scheduled Analysis** - Cron jobs for recurring analysis
5. **Data Export** - CSV, PDF, Excel reports
6. **ML Models** - Predictions, classifications
7. **Custom Dashboards** - User-defined widgets
8. **API Keys** - For programmatic access
9. **Webhooks** - Event notifications
10. **Audit Logs** - Compliance tracking

---

## Troubleshooting

### File Not Uploading
- Check file size (max 10MB)
- Verify file format is supported
- Check browser console for errors

### Analysis Taking Long
- May be processing large dataset
- Check API logs for bottlenecks
- Consider reducing data size

### No Gemini Responses
- Check GEMINI_API_KEY environment variable
- Verify API key is valid
- System will fall back to mock responses

### Session Not Loading
- Refresh page
- Check browser local storage
- Verify server is running

---

## Support & Documentation

- API Documentation: [See endpoints above]
- Frontend Code: `analytics-dashboard.js`
- Backend Code: `controllers/analyticsController.js`
- Database Models: `models/sql/index.js`

---

## Team & Attribution

- **Backend API & Analytics**: Implemented comprehensive analysis engine
- **Frontend Dashboard**: Modern, responsive UI with real-time updates
- **AI Integration**: Gemini API with fallback mocks
- **Database**: SQLite with Sequelize ORM

---

**Version**: 2.0  
**Last Updated**: January 25, 2026  
**Status**: Production Ready
