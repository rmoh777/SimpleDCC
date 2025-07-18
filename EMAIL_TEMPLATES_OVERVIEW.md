# SimpleDCC Email Templates & Design System Overview

*Comprehensive guide to all email templates, designs, and patterns for the SimpleDCC FCC docket monitoring service*

---

## Table of Contents

1. [Email Template Types](#email-template-types)
2. [Design System & Branding](#design-system--branding)
3. [Template Architecture](#template-architecture)
4. [User Tier System](#user-tier-system)
5. [Code Snippets & Implementation](#code-snippets--implementation)
6. [Testing & Preview System](#testing--preview-system)
7. [Future Enhancement Guide](#future-enhancement-guide)

---

## Email Template Types

### 1. Daily Digest Email
**Purpose**: Daily summary of new FCC filings across monitored dockets
**Frequency**: Daily at 1 PM ET
**Audience**: All subscribers with daily frequency preference

**Key Features**:
- AI-powered summaries for Pro/Trial users
- Basic metadata for Free users with upgrade prompts
- Grouped by docket number for organization
- Summary statistics (total filings, dockets, AI summaries)
- Responsive design with mobile optimization

**Subject Line Pattern**:
```
SimpleDCC: {X} new filing{s} across {Y} docket{s} - {Date}
```

### 2. Immediate Filing Alert
**Purpose**: Real-time notification for individual filing events
**Frequency**: Immediate upon filing detection
**Audience**: Users with immediate frequency preference

**Key Features**:
- Single filing focus with detailed metadata
- AI summary prominently displayed (tier-dependent)
- Emergency-style alert design with orange accent
- Direct link to FCC filing document
- Tier-specific upgrade prompts

**Subject Line Pattern**:
```
🚨 New Filing Alert: {Docket} - {Title truncated to 60 chars}
```

### 3. Welcome Email (Seed Digest)
**Purpose**: Onboarding experience for new subscribers
**Frequency**: Sent immediately upon subscription
**Audience**: New subscribers

**Key Features**:
- Welcome message with docket confirmation
- Sample filing with AI summary to demonstrate value
- Feature overview and next steps
- Professional branding with gradient header
- Clear call-to-action for subscription management

**Subject Line Pattern**:
```
🎉 Welcome to SimpleDCC! Your {Docket} monitoring starts now
```

### 4. Standard Welcome Email
**Purpose**: Alternative welcome template (legacy)
**Frequency**: Sent upon subscription
**Audience**: New subscribers

**Key Features**:
- Simple welcome message
- Docket monitoring confirmation
- Feature list with checkmarks
- Professional styling with brand colors

**Subject Line Pattern**:
```
Welcome to SimpleDCC - Now monitoring FCC Docket {Docket}
```

---

## Design System & Branding

### Color Palette
```css
/* Primary Brand Colors */
--primary-green: #10b981;      /* Main brand color */
--primary-green-dark: #059669; /* Darker shade for gradients */
--primary-blue: #3b82f6;       /* Free tier upgrade prompts */
--primary-orange: #f59e0b;     /* Trial tier and alerts */
--primary-red: #ef4444;        /* Unsubscribe buttons */

/* Neutral Colors */
--text-primary: #0f172a;       /* Main text */
--text-secondary: #6b7280;     /* Secondary text */
--text-muted: #9ca3af;         /* Muted text */
--background-light: #f8fafc;   /* Light backgrounds */
--border-color: #e5e7eb;       /* Borders */
```

### Typography
```css
/* Font Stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;

/* Font Sizes */
--text-xs: 12px;    /* Footer text */
--text-sm: 14px;    /* Secondary content */
--text-base: 16px;  /* Body text */
--text-lg: 18px;    /* Headers */
--text-xl: 24px;    /* Large headers */
--text-2xl: 28px;   /* Main titles */
--text-3xl: 32px;   /* Welcome titles */
```

### Layout Patterns
```css
/* Container Structure */
.email-container {
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Header Pattern */
.email-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 32px 24px;
  text-align: center;
}

/* Card Pattern */
.filing-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}
```

---

## Template Architecture

### File Structure
```
src/lib/email/
├── daily-digest.js          # Main email template functions
├── email-preview.js         # Preview and testing utilities
└── email.ts                 # Legacy welcome email template

cron-worker/src/lib/email/
├── daily-digest.js          # Enhanced templates with tier support
├── email-preview.js         # Preview utilities for worker
└── email.ts                 # Email sending functions
```

### Core Functions
```javascript
// Main template generators
export function generateDailyDigest(userEmail, filings, options)
export function generateFilingAlert(userEmail, filing, options)
export function generateSeedDigest(userEmail, docketNumber, filings, options)
export function generateWelcomeEmail(userEmail, docketNumber, options)

// Helper functions
function generateHTMLTemplate(userEmail, filingsByDocket, options)
function generateTextTemplate(userEmail, filingsByDocket, options)
function generateTierSpecificBanner(user_tier, unsubscribeBaseUrl)
function generateFilingContent(filing, user_tier, unsubscribeBaseUrl)
```

### Template Options Structure
```javascript
const defaultOptions = {
  brandName: 'SimpleDCC',
  supportEmail: 'support@simpledcc.com',
  unsubscribeBaseUrl: 'https://simpledcc.pages.dev',
  user_tier: 'free',           // 'free', 'trial', 'pro'
  digest_type: 'daily'         // 'daily', 'weekly', 'immediate'
};
```

---

## User Tier System

### Free Tier
- **AI Summaries**: ❌ Not available
- **Content**: Basic filing metadata only
- **Upgrade Prompts**: Prominent blue banners
- **Features**: Daily digest, immediate alerts

### Trial Tier
- **AI Summaries**: ✅ Full access
- **Content**: Complete AI summaries
- **Upgrade Prompts**: Orange trial expiration banners
- **Features**: All Pro features for trial period

### Pro Tier
- **AI Summaries**: ✅ Full access
- **Content**: Complete AI summaries
- **Upgrade Prompts**: None
- **Features**: All features, no restrictions

### Tier-Specific Banner Code
```javascript
function generateTierSpecificBanner(user_tier, unsubscribeBaseUrl) {
  switch (user_tier) {
    case 'free':
      return `
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 24px; border-radius: 8px; margin-bottom: 32px; text-align: center;">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">🚀 Upgrade to Pro for Full AI Summaries</h3>
          <p style="margin: 0 0 16px 0; font-size: 14px; opacity: 0.9;">
            Free users see basic filing metadata. Upgrade to Pro for AI-powered summaries that help you quickly understand key regulatory developments.
          </p>
          <a href="${unsubscribeBaseUrl}/pricing" style="display: inline-block; background-color: white; color: #1d4ed8; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
            Upgrade to Pro →
          </a>
        </div>
      `;
    
    case 'trial':
      return `
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 24px; border-radius: 8px; margin-bottom: 32px; text-align: center;">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">⏰ Trial Active - Full AI Access</h3>
          <p style="margin: 0 0 16px 0; font-size: 14px; opacity: 0.9;">
            You're enjoying full AI summaries during your trial. Don't miss out on continued access to detailed regulatory insights.
          </p>
          <a href="${unsubscribeBaseUrl}/pricing" style="display: inline-block; background-color: white; color: #d97706; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
            Continue with Pro →
          </a>
        </div>
      `;
    
    case 'pro':
    default:
      return ''; // No banner for pro users
  }
}
```

---

## Code Snippets & Implementation

### Daily Digest Template Structure
```javascript
export function generateDailyDigest(userEmail, filings, options = {}) {
  const {
    brandName = 'SimpleDCC',
    supportEmail = 'support@simpledcc.com',
    unsubscribeBaseUrl = 'https://simpledcc.pages.dev',
    user_tier = 'free',
    digest_type = 'daily'
  } = options;
  
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Group filings by docket for better organization
  const filingsByDocket = groupFilingsByDocket(filings);
  const totalFilings = filings.length;
  const uniqueDockets = Object.keys(filingsByDocket).length;
  
  return {
    subject: `${brandName}: ${totalFilings} new filing${totalFilings !== 1 ? 's' : ''} across ${uniqueDockets} docket${uniqueDockets !== 1 ? 's' : ''} - ${today}`,
    html: generateHTMLTemplate(userEmail, filingsByDocket, { brandName, supportEmail, unsubscribeBaseUrl, today, user_tier, digest_type }),
    text: generateTextTemplate(userEmail, filingsByDocket, { brandName, supportEmail, unsubscribeBaseUrl, today, user_tier, digest_type })
  };
}
```

### Filing Alert Template
```javascript
export function generateFilingAlert(userEmail, filing, options = {}) {
  const {
    brandName = 'SimpleDCC',
    unsubscribeBaseUrl = 'https://simpledcc.pages.dev',
    user_tier = 'free'
  } = options;
  
  return {
    subject: `🚨 New Filing Alert: ${filing.docket_number} - ${filing.title.substring(0, 60)}${filing.title.length > 60 ? '...' : ''}`,
    html: `...`, // Full HTML template
    text: `...`  // Full text template
  };
}
```

### AI Summary Display Pattern
```javascript
function generateFilingContent(filing, user_tier, unsubscribeBaseUrl) {
  if (user_tier === 'free') {
    // Free users get basic metadata with upgrade prompt
    return `
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin-bottom: 16px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-style: italic;">
          📝 Basic filing information (upgrade for AI summary)
        </p>
        <div style="background-color: #e5e7eb; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
          <p style="margin: 0; font-size: 13px; color: #4b5563;">
            <strong>Filing Type:</strong> ${escapeHtml(filing.filing_type || 'N/A')}<br>
            <strong>Date Received:</strong> ${formatDate(filing.date_received)}<br>
            <strong>Author:</strong> ${escapeHtml(filing.author || 'N/A')}
          </p>
        </div>
        <div style="text-align: center; margin-top: 12px;">
          <a href="${unsubscribeBaseUrl}/pricing" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 8px 16px; border-radius: 4px; font-size: 12px; font-weight: 500;">
            Upgrade for AI Summary →
          </a>
        </div>
      </div>
    `;
  } else {
    // Trial and Pro users get full AI summaries
    if (filing.ai_summary) {
      return `
        <div class="ai-summary">
          <div class="ai-summary-header">
            <span style="font-size: 16px;">🤖</span>
            <h5 class="ai-summary-title">AI Summary</h5>
          </div>
          <p class="ai-summary-text">${escapeHtml(filing.ai_summary)}</p>
        </div>
      `;
    } else {
      return `
        <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
          <p style="margin: 0; font-size: 14px; color: #6b7280; font-style: italic;">
            📝 Full filing details available in original document
          </p>
        </div>
      `;
    }
  }
}
```

### Responsive Design Patterns
```css
/* Mobile Responsive Breakpoints */
@media only screen and (max-width: 600px) {
  .email-container {
    border-radius: 0;
    margin: 0;
  }
  
  .email-content {
    padding: 24px 16px;
  }
  
  .email-header {
    padding: 24px 16px;
  }
  
  .summary-stats {
    flex-direction: column;
    gap: 16px;
  }
  
  .filing-meta {
    flex-direction: column;
    gap: 8px;
  }
}
```

---

## Testing & Preview System

### Admin Preview Interface
**Location**: `/admin/email-preview`
**Features**:
- Template selector (Daily Digest, Welcome, Filing Alert)
- Live HTML preview in iframe
- Text version display
- Sample data generation

### Sample Data Generation
```javascript
export function generateSampleEmailData() {
  return {
    userEmail: 'user@example.com',
    filings: [
      {
        id: 'sample-filing-1',
        docket_number: '23-108',
        title: 'Comments on Broadband Infrastructure Deployment',
        author: 'National Telecommunications Association',
        filing_type: 'comment',
        date_received: new Date(Date.now() - 86400000).toISOString(),
        filing_url: 'https://www.fcc.gov/ecfs/filing/sample1',
        ai_summary: 'The filing argues for streamlined permitting processes to accelerate broadband deployment in underserved areas. Key recommendations include standardizing municipal approval timelines and reducing regulatory barriers for infrastructure projects.'
      },
      // ... more sample filings
    ],
    options: {
      brandName: 'SimpleDCC',
      supportEmail: 'support@simpledcc.com',
      unsubscribeBaseUrl: 'https://simpledcc.pages.dev'
    }
  };
}
```

### Preview Banner System
```javascript
function addPreviewStyles(html) {
  const previewBanner = `
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 12px; margin-bottom: 20px; border-radius: 6px; text-align: center;">
      <strong style="color: #dc2626;">📧 EMAIL PREVIEW MODE</strong>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #7f1d1d;">
        This is a preview of the email template. In production, this banner will not appear.
      </p>
    </div>
  `;
  
  return html.replace(/<body[^>]*>/, match => match + previewBanner);
}
```

---

## Future Enhancement Guide

### Adding New Email Templates

1. **Create Template Function**
```javascript
export function generateNewTemplate(userEmail, data, options = {}) {
  const {
    brandName = 'SimpleDCC',
    supportEmail = 'support@simpledcc.com',
    unsubscribeBaseUrl = 'https://simpledcc.pages.dev'
  } = options;
  
  return {
    subject: `Your Subject Line Here`,
    html: generateNewTemplateHTML(userEmail, data, { brandName, supportEmail, unsubscribeBaseUrl }),
    text: generateNewTemplateText(userEmail, data, { brandName, supportEmail, unsubscribeBaseUrl })
  };
}
```

2. **Add to Preview System**
```javascript
// In src/lib/email/email-preview.js
const templateOptions = [
  { value: 'daily-digest', label: 'Daily Digest' },
  { value: 'welcome', label: 'Welcome Email' },
  { value: 'filing-alert', label: 'Filing Alert' },
  { value: 'new-template', label: 'New Template' } // Add here
];
```

3. **Update Admin Interface**
```svelte
<!-- In src/routes/admin/email-preview/+page.svelte -->
case 'new-template':
  emailData = generateNewTemplate(sampleData.userEmail, sampleData.data, sampleData.options);
  break;
```

### Design Pattern Guidelines

1. **Consistent Structure**
   - Always include HTML and text versions
   - Use the standard color palette
   - Follow responsive design patterns
   - Include proper unsubscribe links

2. **Tier-Specific Content**
   - Check `user_tier` parameter
   - Use `generateTierSpecificBanner()` for upgrade prompts
   - Conditionally show AI summaries

3. **Accessibility**
   - Use semantic HTML structure
   - Include alt text for images
   - Ensure sufficient color contrast
   - Test with screen readers

4. **Brand Consistency**
   - Use SimpleDCC branding elements
   - Maintain professional tone
   - Include proper legal disclaimers
   - Follow FCC compliance guidelines

### Template Customization Points

1. **Branding Elements**
   - Logo and colors in header
   - Footer links and disclaimers
   - Support email addresses

2. **Content Structure**
   - Filing metadata display
   - AI summary formatting
   - Call-to-action buttons

3. **User Experience**
   - Email frequency preferences
   - Unsubscribe mechanisms
   - Mobile responsiveness

4. **Technical Integration**
   - Database field mapping
   - API endpoint integration
   - Error handling patterns

---

## Implementation Notes

### Email Sending Integration
```javascript
// In notification queue processor
async function generateAndSendNotificationEmail(user, digestType, filings, env) {
  const { generateDailyDigest, generateFilingAlert, generateSeedDigest } = await import('../email/daily-digest.js');
  const { sendEmail } = await import('../email');
  
  let emailContent;
  
  if (digestType === 'immediate') {
    emailContent = generateFilingAlert(user.email, filings[0], {
      user_tier: user.user_tier,
      unsubscribe_url: `${env.APP_URL}/unsubscribe?email=${encodeURIComponent(user.email)}`
    });
  } else if (digestType === 'seed_digest') {
    const docketNumber = filings[0]?.docket_number || 'unknown';
    emailContent = generateSeedDigest(user.email, docketNumber, filings, {
      user_tier: user.user_tier,
      unsubscribeBaseUrl: env.APP_URL
    });
  } else {
    emailContent = generateDailyDigest(user.email, filings, {
      user_tier: user.user_tier,
      digest_type: digestType,
      unsubscribe_url: `${env.APP_URL}/unsubscribe?email=${encodeURIComponent(user.email)}`
    });
  }
  
  await sendEmail(user.email, emailContent.subject, emailContent.html, emailContent.text, env);
}
```

### Environment Configuration
```javascript
// Required environment variables
const env = {
  RESEND_API_KEY: 'your_resend_api_key',
  APP_URL: 'https://simpledcc.pages.dev',
  SUPPORT_EMAIL: 'support@simpledcc.com'
};
```

---

*This document serves as the comprehensive reference for all email template designs, patterns, and implementation details in the SimpleDCC system. Use this guide for maintaining consistency when adding new templates or modifying existing ones.* 