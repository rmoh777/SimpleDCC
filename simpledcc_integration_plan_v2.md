# SimpleDCC Integration Plan v2 - 2-Day Sprint

## Executive Summary
**Timeline:** 2 days with Cursor AI and card-based development  
**Strategy:** Extract proven ECFS patterns from existing codebase + adapt for multi-user SimpleDCC  
**Key Advantage:** Skip 4-6 hours of ECFS API discovery by using battle-tested integration patterns  

---

## 🎯 **Strategic Approach**

### **Code Extraction Strategy**
Instead of building ECFS integration from scratch, we extract and adapt proven patterns:
- ✅ **Proven API Integration**: `fetchECFSFilings()` with all gotchas solved
- ✅ **Robust Field Parsing**: `parseECFSFiling()` with defensive programming
- ✅ **Rate Limiting**: Conservative, production-tested patterns
- ✅ **Error Handling**: Battle-tested against API inconsistencies

### **Multi-User Adaptation**
Transform single-docket monitoring into multi-user, multi-docket system:
- **Database-Driven**: Replace KV storage with D1 database
- **User Frequencies**: Daily notifications for all users (simplified)
- **Scalable Processing**: Batch processing across multiple dockets

---

## 📋 **2-Day Card Structure**

### **Day 1: Foundation + Core Integration (8 cards)**

#### **Morning Session (4 hours)**

**B1: Database Schema Extensions** ⏱️ *1 hour*
```sql
-- Add to existing subscriptions table
ALTER TABLE subscriptions ADD COLUMN frequency TEXT DEFAULT 'daily';
ALTER TABLE subscriptions ADD COLUMN last_notified INTEGER DEFAULT 0;

-- New monitoring tables
CREATE TABLE filings (
  id TEXT PRIMARY KEY,           -- FCC filing ID  
  docket_number TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  filing_type TEXT NOT NULL,
  date_received TEXT NOT NULL,
  filing_url TEXT NOT NULL,
  documents TEXT,                -- JSON array of document info
  raw_data TEXT,                 -- JSON of full FCC response
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at INTEGER DEFAULT (unixepoch()),
  processed_at INTEGER
);

CREATE TABLE system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  component TEXT NOT NULL,
  details TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE active_dockets (
  docket_number TEXT PRIMARY KEY,
  last_checked INTEGER DEFAULT 0,
  total_filings INTEGER DEFAULT 0,
  subscribers_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active'
);
```

**B2: ECFS API Client Extraction** ⏱️ *1 hour*
```javascript
// src/lib/fcc/ecfs-client.js - Extract from existing codebase
// DIRECTLY COPY these proven functions:
// - fetchECFSFilings(docketNumber, lookbackHours = 2)
// - parseECFSFiling(filing) with all defensive patterns
// - Error handling and rate limiting logic

// ADAPT for multi-docket:
export async function fetchMultipleDockets(docketNumbers, lookbackHours = 2) {
  const results = [];
  for (const docket of docketNumbers) {
    try {
      const filings = await fetchECFSFilings(docket, lookbackHours);
      results.push(...filings);
    } catch (error) {
      logError(`Failed to fetch docket ${docket}:`, error);
    }
  }
  return results;
}
```

**A1: Design System Foundation** ⏱️ *1 hour*
```css
/* src/lib/styles/globals.css */
:root {
  --color-primary: #10b981;
  --color-primary-hover: #059669;
  --color-secondary: #0f172a;
  --color-background: #f8fafc;
  --color-surface: #ffffff;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-success: #10b981;
}
```

**A2: Admin Monitoring Layout** ⏱️ *1 hour*
```svelte
<!-- src/routes/admin/monitoring/+layout.svelte -->
<!-- Add "Monitoring" tab to existing admin navigation -->
<!-- Basic structure for ECFS, AI, and System monitoring pages -->
```

#### **Afternoon Session (4 hours)**

**B3: Admin Monitoring APIs** ⏱️ *2 hours*
```javascript
// src/routes/api/admin/monitoring/
├── stats/+server.js          # System statistics
├── dockets/+server.js        # Active docket management
├── filings/+server.js        # Recent filings with status
├── logs/+server.js           # System logs with filtering
└── trigger/+server.js        # Manual system triggers
```

**B4: Filing Storage System** ⏱️ *1 hour*
```javascript
// src/lib/storage/filing-cache.js
// Adapt KV deduplication patterns to D1 database
export async function storeFilings(filings, db) {
  const existing = await getExistingFilings(filings.map(f => f.id), db);
  const newFilings = filings.filter(f => !existing.includes(f.id));
  
  for (const filing of newFilings) {
    await db.prepare(`
      INSERT INTO filings (id, docket_number, title, author, filing_type, 
                          date_received, filing_url, documents, raw_data) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      filing.id, filing.docket_number, filing.title, filing.author,
      filing.filing_type, filing.date_received, filing.filing_url,
      JSON.stringify(filing.documents), JSON.stringify(filing.raw_data)
    ).run();
  }
  
  return newFilings.length;
}
```

**A3: Monitoring Dashboard Components** ⏱️ *1 hour*
```svelte
<!-- src/routes/admin/monitoring/+page.svelte -->
<!-- Real-time system health dashboard using new design system -->
<!-- Stats cards, recent activity, manual controls -->
```

### **Day 2: AI Integration + Email Enhancement (8 cards)**

#### **Morning Session (4 hours)**

**B5: Gemini AI Integration** ⏱️ *2 hours*
```javascript
// src/lib/ai/gemini-client.js
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateFilingSummary(filing, documentText = null) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `
Summarize this FCC filing in 2-3 sentences for regulatory professionals:

Title: ${filing.title}
Author: ${filing.author}
Type: ${filing.filing_type}
Docket: ${filing.docket_number}
${documentText ? `Content: ${documentText.substring(0, 2000)}` : ''}

Focus on: key arguments, regulatory impact, and stakeholder positions.
`;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

**B6: Document Processing** ⏱️ *1.5 hours*  
```javascript
// src/lib/ai/document-processor.js
// Note: Document URLs still unknown from ECFS API
// Start with filing metadata, add document processing later

export async function processFilingForAI(filing) {
  let documentText = '';
  
  // Try to extract text from documents (URLs unknown - investigate later)
  if (filing.documents && filing.documents.length > 0) {
    // TODO: Investigate actual document URL fields in ECFS API response
    // For now, use filing title and metadata
    documentText = `${filing.title} - Filed by ${filing.author}`;
  }
  
  const summary = await generateFilingSummary(filing, documentText);
  
  return {
    ...filing,
    ai_summary: summary,
    processed_at: Date.now()
  };
}
```

**A4: Email Template Enhancement** ⏱️ *30 minutes*
```javascript
// src/lib/email/daily-digest.js
// Enhance existing email templates with AI summaries
export function generateDailyDigest(userEmail, filings) {
  return {
    subject: `DocketCC: ${filings.length} new filings in your monitored dockets`,
    html: `
      <h2>Daily Filing Digest</h2>
      ${filings.map(filing => `
        <div style="border-left: 3px solid #10b981; padding-left: 12px; margin-bottom: 24px;">
          <h3>${filing.title}</h3>
          <p><strong>Docket:</strong> ${filing.docket_number} | <strong>Author:</strong> ${filing.author}</p>
          <p>${filing.ai_summary}</p>
          <a href="${filing.filing_url}">View Full Filing →</a>
        </div>
      `).join('')}
    `
  };
}
```

#### **Afternoon Session (4 hours)**

**B7: Complete Processing Pipeline** ⏱️ *2 hours*
```javascript
// src/lib/processing/digest-processor.js
export async function processDailyDigests(env) {
  // 1. Get users who need daily notifications
  const users = await getUsersForDailyNotification(env.DB);
  
  // 2. For each user, get their pending filings
  for (const user of users) {
    const pendingFilings = await getPendingFilingsForUser(user, env.DB);
    
    if (pendingFilings.length === 0) continue;
    
    // 3. Process filings with AI (if not already processed)
    const processedFilings = [];
    for (const filing of pendingFilings) {
      if (filing.status === 'pending') {
        const processed = await processFilingForAI(filing);
        await updateFilingStatus(processed, 'completed', env.DB);
        processedFilings.push(processed);
      } else {
        processedFilings.push(filing);
      }
    }
    
    // 4. Send digest email
    await sendDailyDigest(user.email, processedFilings, env);
    
    // 5. Update user's last notification time
    await updateLastNotified(user.email, env.DB);
  }
}
```

**B8: Cron Integration** ⏱️ *1 hour*
```javascript
// src/routes/api/cron/daily-check/+server.js
export async function POST({ platform, request }) {
  const cronSecret = platform?.env?.CRON_SECRET;
  const providedSecret = request.headers.get('X-Cron-Secret');
  
  if (cronSecret !== providedSecret) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    // 1. Check for new filings across all active dockets
    const activeDockets = await getActiveDockets(platform.env.DB);
    const newFilings = await fetchMultipleDockets(activeDockets.map(d => d.docket_number));
    
    // 2. Store new filings
    const storedCount = await storeFilings(newFilings, platform.env.DB);
    
    // 3. Process daily digest emails (only during notification hours)
    const currentHour = new Date().getHours();
    if (currentHour === 9) { // 9 AM daily digests
      await processDailyDigests(platform.env);
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      newFilings: storedCount,
      digestsSent: currentHour === 9 
    }));
    
  } catch (error) {
    console.error('Cron job failed:', error);
    return new Response('Error', { status: 500 });
  }
}
```

**A5: UI Integration & Testing** ⏱️ *1 hour*
```svelte
<!-- Complete admin monitoring dashboard -->
<!-- Test full pipeline: ECFS → AI → Email -->
<!-- Error handling and user feedback -->
```

---

## 🔧 **Environment Setup**

### **Required Environment Variables**
```bash
# Existing
ADMIN_SECRET_KEY=your_admin_key
RESEND_API_KEY=your_resend_key

# New for integration
ECFS_API_KEY=your_fcc_api_key
GEMINI_API_KEY=your_google_ai_key  
CRON_SECRET=random_secure_string
```

### **Cloudflare Configuration**
```toml
# Add to wrangler.toml
[triggers]
crons = ["0 * * * *"]  # Every hour

[[env.production.d1_databases]]
binding = "DB"
database_name = "docketcc-production"
database_id = "your-d1-database-id"
```

---

## 🎯 **Success Metrics**

### **Day 1 End State**
- ✅ ECFS API integration working for multiple dockets
- ✅ New filings stored in database with deduplication
- ✅ Admin monitoring dashboard shows system health
- ✅ Manual triggers work for testing

### **Day 2 End State**  
- ✅ AI summaries generated for new filings
- ✅ Daily digest emails sent with AI content
- ✅ Complete automated pipeline: ECFS → AI → Email
- ✅ Error handling and logging throughout system

### **Production Readiness**
- ✅ Cloudflare cron trigger deployed
- ✅ All environment variables configured
- ✅ Database migrations applied
- ✅ End-to-end testing complete

---

## 🚨 **Risk Mitigation**

### **Document URL Investigation**
**Risk:** ECFS document URLs still unknown  
**Mitigation:** Start with filing metadata, investigate document URLs in Phase 3  
**Fallback:** Use filing title and author info for AI processing

### **Rate Limiting**
**Risk:** FCC API rate limits with multiple dockets  
**Mitigation:** Use proven conservative limits (20 filings per request)  
**Monitoring:** Track API response times and errors

### **AI Processing Costs**
**Risk:** Gemini API costs for high-volume processing  
**Mitigation:** Process only new filings, use efficient prompts  
**Monitoring:** Track API usage and costs per day

---

## 🚀 **Deployment Strategy**

### **Parallel Development Approach**
- **Track A (UI):** Cards A1, A2, A3, A4, A5
- **Track B (Backend):** Cards B1, B2, B3, B4, B5, B6, B7, B8
- **Integration Points:** A3+B3, A4+B6, A5+B7

### **Testing Strategy**
- **Unit Testing:** Each card has isolated testing
- **Integration Testing:** End-to-end pipeline testing
- **Manual Testing:** Admin dashboard functionality
- **Production Testing:** Staged rollout with monitoring

This plan leverages proven ECFS patterns while building the multi-user AI-powered enhancement that makes SimpleDCC unique.