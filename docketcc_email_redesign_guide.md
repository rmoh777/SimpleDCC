# DocketCC Email Redesign Guide
*Complete implementation guide for dark mode, mobile-responsive transactional emails*

---

## Design System Foundation

### Brand Colors
```css
/* Primary Brand */
--primary-green: #10b981;      /* Main emerald green */
--primary-dark: #059669;       /* Dark emerald for gradients */
--navy-primary: #0f172a;       /* Main dark navy */
--navy-secondary: #1e293b;     /* Secondary navy */
--navy-tertiary: #334155;      /* Tertiary navy for borders */

/* Background & Layout */
--bg-gradient: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
--card-bg: #0f172a;
--card-secondary: linear-gradient(135deg, #1e293b 0%, #334155 100%);
--border-color: #475569;

/* Typography */
--text-primary: #f8fafc;       /* Main text */
--text-secondary: #94a3b8;     /* Secondary text */
--text-muted: #64748b;         /* Muted text */
--text-bright: #e2e8f0;        /* Bright text for emphasis */
--text-light: #cbd5e1;         /* Light text for content */
```

### Typography Scale
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;

/* Font Sizes */
--text-xs: 10px;     /* Badges, micro text */
--text-sm: 11px;     /* Labels, captions */
--text-base: 13px;   /* Body text */
--text-md: 14px;     /* Primary content */
--text-lg: 16px;     /* Subheadings */
--text-xl: 20px;     /* Main headings */
--text-2xl: 24px;    /* Large headings */
--text-3xl: 28px;    /* Hero headings */
```

### Layout Patterns
```css
/* Container Structure */
.email-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
  background: var(--bg-gradient);
  min-height: 100vh;
}

.email-card {
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--navy-secondary);
}

/* Responsive Breakpoints */
@media only screen and (max-width: 600px) {
  .email-container { padding: 8px; }
  .header { padding: 16px; }
  .content { padding: 16px; }
}
```

---

## Component Library

### Header Component
```html
<div class="header">
  <div class="header-top">
    <div class="logo">
      <div class="logo-icon">📡</div>
      <div class="logo-text">Docket<span class="logo-cc">CC</span></div>
    </div>
    <div class="tier-badge">{USER_TIER_BADGE}</div>
  </div>
  <div class="header-bottom">
    <h1 class="header-title">{EMAIL_TITLE}</h1>
    <a href="https://simpledcc.pages.dev/manage" class="dashboard-link">Dashboard</a>
  </div>
</div>
```

**CSS:**
```css
.header {
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--primary-dark) 100%);
  padding: 20px;
  color: white;
  position: relative;
}

.header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.header-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.logo-cc {
  opacity: 0.9;
}

.tier-badge {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.dashboard-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dashboard-link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.15);
}

@media only screen and (max-width: 600px) {
  .header-bottom {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
  
  .dashboard-link {
    align-self: center;
  }
}
```

### Filing Card Component
```html
<div class="filing-card">
  <div class="filing-header">
    <div class="docket-badge">{DOCKET_NUMBER}</div>
    <div class="filing-type">{FILING_TYPE}</div>
  </div>
  <h3 class="filing-title">{FILING_TITLE}</h3>
  <div class="filing-meta">
    <strong>{FILING_AUTHOR}</strong> • {FILING_DATE} • {FILING_PAGES} pages
  </div>
  
  {AI_CONTENT_SECTION}
  
  <div class="filing-actions">
    <a href="{FILING_URL}" class="filing-link" target="_blank">
      View Filing →
    </a>
  </div>
</div>
```

**CSS:**
```css
.filing-card {
  background: var(--card-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}

.filing-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(5, 150, 105, 0.03) 100%);
  pointer-events: none;
}

.filing-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.docket-badge {
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--primary-dark) 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.filing-type {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  background: rgba(148, 163, 184, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
}

.filing-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.filing-meta {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

.filing-meta strong {
  color: var(--text-bright);
}

.filing-actions {
  display: flex;
  justify-content: flex-end;
  position: relative;
  z-index: 1;
}

.filing-link {
  color: var(--primary-green);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.2s;
}

.filing-link:hover {
  color: var(--primary-dark);
}
```

### AI Content Sections (Tier-Based)

#### Free Tier - Partial Reveal
```html
<div class="ai-preview-section">
  <div class="ai-preview-header">
    <div class="ai-icon">AI</div>
    <div class="ai-title">Key Insights Preview</div>
    <div class="lock-icon">🔒 LOCKED</div>
  </div>
  <div class="partial-content">
    <p class="visible-text">
      {FIRST_PHRASE} <span class="upgrade-hint">••• upgrade to unlock full summary</span>
    </p>
    <p class="blurred-text">{REMAINING_SUMMARY}</p>
    <div class="fade-overlay"></div>
  </div>
  <div class="upgrade-prompt">
    <p>💡 Unlock complete AI analysis and key business impacts</p>
    <a href="https://simpledcc.pages.dev/pricing" class="upgrade-link">
      Upgrade to Pro →
    </a>
  </div>
</div>
```

#### Trial/Pro Tier - Full Content
```html
<div class="ai-summary">
  <div class="ai-summary-header">
    <div class="ai-icon">AI</div>
    <div class="ai-title">Key Insights</div>
  </div>
  <p class="ai-summary-text">{AI_SUMMARY}</p>
  
  <div class="key-points desktop-content">
    <h4>The Gist</h4>
    <div class="gist-content">
      {KEY_ARGUMENTS_FROM_AI_DOCUMENT_ANALYSIS}
    </div>
  </div>
</div>
```

**AI Content CSS:**
```css
/* Free Tier Preview */
.ai-preview-section {
  background: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 6px;
  padding: 14px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.ai-preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.ai-icon {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--primary-dark) 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  font-weight: bold;
}

.ai-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.lock-icon {
  background: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  margin-left: auto;
}

.partial-content {
  position: relative;
  overflow: hidden;
}

.visible-text {
  color: var(--text-light);
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.upgrade-hint {
  color: var(--text-muted);
  font-style: italic;
}

.blurred-text {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.4;
  filter: blur(3px);
  user-select: none;
  position: relative;
}

.fade-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(transparent, rgba(30, 41, 59, 0.9));
  pointer-events: none;
}

.upgrade-prompt {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  margin-top: 12px;
}

.upgrade-prompt p {
  color: white;
  font-size: 12px;
  margin-bottom: 8px;
  font-weight: 500;
}

.upgrade-link {
  color: white;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 4px;
  display: inline-block;
  transition: all 0.2s;
}

.upgrade-link:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* Pro/Trial Tier Full Content */
.ai-summary {
  background: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 6px;
  padding: 14px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.ai-summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.ai-summary-text {
  color: var(--text-light);
  font-size: 14px;
  line-height: 1.4;
  margin: 0;
}

.key-points {
  margin-top: 12px;
}

.key-points h4 {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.gist-content {
  font-size: 13px;
  color: var(--text-light);
  line-height: 1.4;
  font-style: italic;
}

.desktop-content {
  display: block;
}

@media only screen and (max-width: 600px) {
  .desktop-content {
    display: none;
  }
}
```

---

## Email Templates

### 1. Trial Filing Alert
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Filing Alert - DocketCC</title>
  <!-- Include all CSS from above -->
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <!-- Header Component -->
      <div class="header">
        <div class="header-top">
          <div class="logo">
            <div class="logo-icon">📡</div>
            <div class="logo-text">Docket<span class="logo-cc">CC</span></div>
          </div>
          <div class="tier-badge">Trial Active</div>
        </div>
        <div class="header-bottom">
          <h1 class="header-title">🚨 New Filing Alert</h1>
          <a href="https://simpledcc.pages.dev/manage" class="dashboard-link">Dashboard</a>
        </div>
      </div>
      
      <div class="content">
        <div class="filing-summary">
          <div class="docket-line">
            <div class="docket-badge">{DOCKET_NUMBER}</div>
            <div class="timing">Filed {TIME_AGO}</div>
          </div>
          
          <h2 class="filing-title">{FILING_TITLE}</h2>
          <div class="filing-meta">
            <strong>{FILING_AUTHOR}</strong> • {FILING_TYPE} • {FILING_PAGES} pages
          </div>
        </div>
        
        <!-- AI Analysis for Trial/Pro -->
        <div class="ai-summary">
          <div class="ai-summary-header">
            <div class="ai-icon">AI</div>
            <div class="ai-title">Key Insights</div>
          </div>
          <p class="ai-summary-text">{AI_SUMMARY}</p>
          
          <div class="key-points desktop-content">
            <h4>The Gist</h4>
            <div class="gist-content">
              {KEY_ARGUMENTS_FROM_AI_DOCUMENT_ANALYSIS}
            </div>
          </div>
        </div>
        
        <div class="actions">
          <a href="{FILING_URL}" class="btn-primary" target="_blank">
            View Filing
          </a>
        </div>
        
        <div class="trial-cta">
          <div class="trial-cta-content">
            <h3>Continue Your Trial Benefits</h3>
            <p class="mobile-content">Keep AI analysis access</p>
            <p class="desktop-content">Don't lose access to AI analysis and instant alerts</p>
            <a href="https://simpledcc.pages.dev/pricing" class="btn-upgrade">
              Upgrade to Pro
            </a>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <a href="https://simpledcc.pages.dev/manage">Manage</a> • 
        <a href="https://simpledcc.pages.dev/unsubscribe?email={USER_EMAIL}&docket={DOCKET_NUMBER}">Unsubscribe</a> • 
        <a href="mailto:support@simpledcc.com">Support</a>
      </div>
    </div>
  </div>
</body>
</html>
```

### 2. Daily Digest Email
```html
<!-- Same structure as above, but with: -->
<div class="content">
  <div class="digest-stats">
    <div class="stat-item">
      <div class="stat-number">{TOTAL_FILINGS}</div>
      <div class="stat-label">New Filings</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">{UNIQUE_DOCKETS}</div>
      <div class="stat-label">Dockets</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">{AI_SUMMARIES_COUNT}</div>
      <div class="stat-label">AI Summaries</div>
    </div>
  </div>
  
  <!-- Loop through filings -->
  {#each FILINGS as filing}
    <!-- Filing Card Component with tier-based AI content -->
  {/each}
  
  <!-- Global upgrade CTA for free users -->
  {#if USER_TIER === 'free'}
    <div class="upgrade-cta">
      <div class="upgrade-content">
        <h3>Unlock AI-Powered Intelligence</h3>
        <p>Get executive summaries and key insights for all filings</p>
        <a href="https://simpledcc.pages.dev/pricing" class="btn-upgrade">
          Upgrade to Pro
        </a>
      </div>
    </div>
  {/if}
</div>
```

### 3. Welcome Email (Standard)
```html
<!-- Same header structure -->
<div class="content">
  <div class="status-section">
    <div class="status-badge">✓ Monitoring Active</div>
    <div class="docket-info">
      <div class="docket-number">Proceeding {DOCKET_NUMBER}</div>
      <div class="docket-title">{DOCKET_TITLE}</div>
    </div>
  </div>
  
  <div class="features-grid">
    <div class="feature-item">
      <span class="feature-icon">🔔</span>
      <div class="feature-title">Real-Time Alerts</div>
      <div class="feature-desc">Instant notifications when new documents are published</div>
    </div>
    <!-- More features... -->
  </div>
  
  <div class="next-steps">
    <h3>What Happens Next</h3>
    <ol class="steps-list">
      <li>You'll receive your first digest email within 24 hours</li>
      <li>Notifications arrive as new filings are published</li>
      <li>Manage preferences anytime via the dashboard</li>
      <li>Add additional dockets to expand coverage</li>
    </ol>
  </div>
  
  <!-- Upgrade CTA -->
</div>
```

### 4. Seed Digest (Welcome with Sample)
```html
<!-- Same as Welcome, but includes: -->
<div class="sample-section">
  <div class="sample-header">
    <h3>Sample Filing Alert</h3>
    <p>This is how you'll be notified of new regulatory activity</p>
  </div>
  
  <!-- Sample Filing Card with "Sample" badges -->
  <div class="filing-card">
    <!-- Include sample filing data -->
    <div class="ai-summary">
      <div class="ai-summary-header">
        <div class="ai-icon">AI</div>
        <div class="ai-title">Key Insights</div>
        <div class="sample-badge">Sample</div>
      </div>
      <!-- Sample AI content -->
    </div>
  </div>
</div>
```

---

## Database Field Mapping

### User Data
- `users.email` → {USER_EMAIL}
- `users.user_tier` → {USER_TIER} ('free', 'trial', 'pro')
- `users.user_tier` → {USER_TIER_BADGE} ('Free Tier', 'Trial Active', 'Pro User')

### Filing Data
- `filings.docket_number` → {DOCKET_NUMBER}
- `filings.title` → {FILING_TITLE}
- `filings.author` → {FILING_AUTHOR}
- `filings.filing_type` → {FILING_TYPE}
- `filings.date_received` → {FILING_DATE} (formatted)
- `filings.filing_url` → {FILING_URL}
- `filings.ai_summary` → {AI_SUMMARY}
- `filings.ai_document_analysis` → {AI_DOCUMENT_ANALYSIS}
- `filings.documents` → {FILING_PAGES} (extract page count)

### Calculated Fields
- Time since filing → {TIME_AGO}
- Array length → {TOTAL_FILINGS}
- Unique dockets → {UNIQUE_DOCKETS}
- AI summaries count → {AI_SUMMARIES_COUNT}
- Docket title lookup → {DOCKET_TITLE}

### Free Tier AI Processing
```javascript
// Extract key arguments from ai_document_analysis
function extractKeyArguments(aiDocumentAnalysis) {
  // Parse "Key Arguments: [content]" from the field
  const keyArgsMatch = aiDocumentAnalysis.match(/Key Arguments:\s*([^-]+)/);
  return keyArgsMatch ? keyArgsMatch[1].trim() : '';
}

// Truncate AI summary for free tier
function truncateAISummary(summary, userTier) {
  if (userTier === 'free') {
    const cutoffPhrases = ['argues for', 'proposes', 'recommends', 'suggests'];
    
    for (const phrase of cutoffPhrases) {
      const index = summary.toLowerCase().indexOf(phrase);
      if (index !== -1) {
        const cutoff = index + phrase.length;
        return {
          visible: summary.substring(0, cutoff),
          hidden: summary.substring(cutoff)
        };
      }
    }
    
    // Fallback: first sentence
    const firstSentence = summary.split('.')[0] + '.';
    return {
      visible: firstSentence,
      hidden: summary.substring(firstSentence.length)
    };
  }
  
  return { visible: summary, hidden: '' };
}
```

---

## Implementation Notes

### Template Function Structure
```javascript
export function generateEmailTemplate(emailType, userData, filingData, options = {}) {
  const {
    brandName = 'DocketCC',
    supportEmail = 'support@simpledcc.com',
    unsubscribeBaseUrl = 'https://simpledcc.pages.dev'
  } = options;
  
  // Process user tier
  const userTier = userData.user_tier || 'free';
  const tierBadge = {
    'free': 'Free Tier',
    'trial': 'Trial Active',
    'pro': 'Pro User'
  }[userTier];
  
  // Process filing data based on email type
  let processedFilings = filingData;
  if (userTier === 'free') {
    processedFilings = filingData.map(filing => ({
      ...filing,
      aiSummaryTruncated: truncateAISummary(filing.ai_summary, userTier)
    }));
  }
  
  // Generate HTML based on email type
  let html, subject;
  switch (emailType) {
    case 'filing_alert':
      html = generateFilingAlertHTML(userData, processedFilings[0], options);
      subject = `🚨 New Filing Alert: ${processedFilings[0].docket_number}`;
      break;
    case 'daily_digest':
      html = generateDailyDigestHTML(userData, processedFilings, options);
      subject = `📬 Daily Digest: ${processedFilings.length} new filings`;
      break;
    case 'welcome':
      html = generateWelcomeHTML(userData, options);
      subject = `🎉 Welcome to DocketCC!`;
      break;
    case 'seed_digest':
      html = generateSeedDigestHTML(userData, processedFilings, options);
      subject = `🎉 Welcome to DocketCC! Your monitoring starts now`;
      break;
  }
  
  return {
    subject,
    html,
    text: generateTextVersion(html) // Convert HTML to plain text
  };
}
```

### CSS Organization
- Include all CSS inline in `<style>` tags for maximum email client compatibility
- Use CSS custom properties for maintainability
- Mobile-first responsive design with `@media` queries
- Fallback fonts and colors for older clients

### Testing Checklist
- [ ] All user tiers render correctly (free, trial, pro)
- [ ] Mobile responsive on 320px+ screens
- [ ] All database fields populate correctly
- [ ] Upgrade CTAs work and track conversions
- [ ] Unsubscribe links include proper parameters
- [ ] Images/emojis display consistently
- [ ] Print-friendly styling
- [ ] Accessibility features (alt text, proper contrast)

---

## Email Client Compatibility

### Supported Clients
- Gmail (Web, Mobile, iOS, Android)
- Outlook (2016+, Web, Mobile)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Thunderbird
- Mobile clients (iOS Mail, Android Gmail)

### Fallback Strategies
- Use table-based layouts for Outlook 2016
- Inline CSS for maximum compatibility
- Web fonts with system font fallbacks
- Gradient backgrounds with solid color fallbacks
- Progressive enhancement for modern features

---

*This guide provides everything needed to implement the new DocketCC email design system. All templates maintain brand consistency while providing tier-appropriate content and excellent mobile responsiveness.*