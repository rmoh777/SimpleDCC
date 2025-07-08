# Phase 2 Card 4: Tier-Based Email Templates & Complete Integration ⏱️ *30 minutes*

## **Card Objective**
Enhance the existing email template system to deliver tier-appropriate content (free vs pro users), expose notification frequency controls in the UI, and complete the end-to-end integration of the user tier system with email delivery. This finalizes Phase 2 by connecting all components into a cohesive user experience.

---

## **What Cursor Should Implement**

You are enhancing the existing sophisticated email system that already has:

✅ **Already Working:**
- Email templates in `src/lib/email/daily-digest.js`
- Resend email sending infrastructure
- Notification queue processing (from Card 3)
- User tier system (from Card 1)

❌ **Missing (What you'll implement):**
- Tier-based email content differentiation (free vs pro)
- Frequency controls exposed in ManageSubscriptions.svelte UI
- Upgrade prompts integrated into free tier emails
- Complete user tier integration with email delivery

### **Key Integration Points:**
- Enhance existing `src/lib/email/daily-digest.js` with tier logic
- Update existing `src/lib/components/ManageSubscriptions.svelte` with frequency controls
- Connect user tier system with email template selection
- Add upgrade prompts that drive pro trial conversion

---

## **1. Enhanced Email Template System**

### **Enhance Existing Daily Digest Templates**
Update: `src/lib/email/daily-digest.js`

**Add tier-based content generation to existing template system:**

```javascript
// Enhance existing generateDailyDigest function with tier awareness
export function generateDailyDigest(userEmail, filings, options = {}) {
  const { 
    user_tier = 'free', 
    app_url = 'https://simpledcc.pages.dev',
    unsubscribe_url = `${app_url}/unsubscribe?email=${encodeURIComponent(userEmail)}`
  } = options;
  
  // Route to appropriate template based on user tier
  if (user_tier === 'free') {
    return generateFreeUserDigest(userEmail, filings, { app_url, unsubscribe_url });
  } else {
    return generateProUserDigest(userEmail, filings, { app_url, unsubscribe_url, user_tier });
  }
}

/**
 * FREE TIER: Metadata-only digest with compelling upgrade prompts
 */
function generateFreeUserDigest(userEmail, filings, { app_url, unsubscribe_url }) {
  const filingsByDocket = groupFilingsByDocket(filings);
  const totalFilings = filings.length;
  const uniqueDockets = Object.keys(filingsByDocket).length;
  
  const subject = `📋 ${totalFilings} new filing${totalFilings !== 1 ? 's' : ''} in your monitored dockets`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>SimpleDCC Daily Digest</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: #10b981; color: white; padding: 2rem; text-align: center; }
        .header h1 { margin: 0; font-size: 1.5rem; }
        .free-badge { background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.875rem; margin-top: 0.5rem; display: inline-block; }
        .upgrade-banner { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; margin: 0; }
        .upgrade-banner h2 { margin: 0 0 1rem 0; font-size: 1.25rem; }
        .upgrade-btn { display: inline-block; background: white; color: #667eea; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 1rem; }
        .content { padding: 2rem; }
        .filing-item { border-left: 4px solid #e5e7eb; padding: 1rem; margin: 1rem 0; background: #f9fafb; }
        .filing-title { font-weight: 600; color: #111827; margin-bottom: 0.5rem; }
        .filing-meta { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem; }
        .filing-link { color: #10b981; text-decoration: none; font-weight: 500; }
        .ai-teaser { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 1.5rem; margin: 2rem 0; }
        .ai-teaser h3 { margin: 0 0 1rem 0; color: #92400e; }
        .feature-list { list-style: none; padding: 0; margin: 1rem 0; }
        .feature-list li { padding: 0.5rem 0; color: #374151; }
        .footer { background: #f3f4f6; padding: 1.5rem; text-align: center; font-size: 0.875rem; color: #6b7280; }
        .footer a { color: #10b981; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>📋 SimpleDCC Daily Digest</h1>
          <div class="free-badge">Free Tier - Basic Filing Information</div>
        </div>
        
        <!-- Upgrade Banner -->
        <div class="upgrade-banner">
          <h2>🚀 Want AI-Powered Analysis?</h2>
          <p>Upgrade to Pro for detailed summaries, stakeholder identification, and regulatory impact assessment</p>
          <a href="${app_url}/upgrade" class="upgrade-btn">Start 30-Day Free Trial</a>
        </div>
        
        <!-- Content -->
        <div class="content">
          <h2>New Filings Summary</h2>
          <p><strong>${totalFilings}</strong> new filing${totalFilings !== 1 ? 's' : ''} found across <strong>${uniqueDockets}</strong> docket${uniqueDockets !== 1 ? 's' : ''}:</p>
          
          ${Object.entries(filingsByDocket).map(([docketNumber, docketFilings]) => `
            <div style="margin-bottom: 2rem;">
              <h3 style="color: #10b981; margin-bottom: 1rem;">Docket ${docketNumber} (${docketFilings.length} filing${docketFilings.length !== 1 ? 's' : ''})</h3>
              ${docketFilings.map(filing => `
                <div class="filing-item">
                  <div class="filing-title">${escapeHtml(filing.title || 'Untitled Filing')}</div>
                  <div class="filing-meta">
                    <strong>Author:</strong> ${escapeHtml(filing.author || 'Unknown')} | 
                    <strong>Type:</strong> ${escapeHtml(filing.filing_type || 'Unknown')} |
                    <strong>Date:</strong> ${formatDate(filing.date_received)}
                  </div>
                  <div>
                    <a href="${filing.filing_url}" class="filing-link" target="_blank">View Full Filing →</a>
                  </div>
                </div>
              `).join('')}
            </div>
          `).join('')}
          
          <!-- AI Analysis Teaser -->
          <div class="ai-teaser">
            <h3>🤖 What You're Missing with Pro</h3>
            <p><strong>Pro users receive for each filing:</strong></p>
            <ul class="feature-list">
              <li>🎯 <strong>AI-powered summaries</strong> - Key insights from document content</li>
              <li>👥 <strong>Stakeholder identification</strong> - Who's affected and who's supporting</li>
              <li>📈 <strong>Regulatory impact assessment</strong> - Timeline and scope analysis</li>
              <li>⚡ <strong>Hourly notifications</strong> - Get urgent filings immediately</li>
              <li>📋 <strong>Document analysis</strong> - Full PDF content processing</li>
            </ul>
            <p style="margin-top: 1.5rem;"><em>Sample Pro analysis:</em></p>
            <div style="background: white; padding: 1rem; border-radius: 6px; border-left: 4px solid #10b981;">
              "This filing proposes changes to broadband accessibility requirements that could significantly impact rural telecommunications providers. Key stakeholders include regional ISPs and educational institutions. Implementation timeline is estimated at 18-24 months..."
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p><strong>SimpleDCC</strong> - Independent FCC Docket Monitoring</p>
          <p>
            <a href="${app_url}/manage">Manage Subscriptions</a> | 
            <a href="${app_url}/upgrade">Upgrade to Pro</a> | 
            <a href="${unsubscribe_url}">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
SimpleDCC Daily Digest - Free Tier

${totalFilings} new filing${totalFilings !== 1 ? 's' : ''} across ${uniqueDockets} docket${uniqueDockets !== 1 ? 's' : ''}

🚀 UPGRADE TO PRO FOR AI ANALYSIS
Start 30-day free trial: ${app_url}/upgrade

${Object.entries(filingsByDocket).map(([docketNumber, docketFilings]) => `
DOCKET ${docketNumber} (${docketFilings.length} filing${docketFilings.length !== 1 ? 's' : ''}):
${docketFilings.map(filing => `
• ${filing.title || 'Untitled Filing'}
  Author: ${filing.author || 'Unknown'} | Type: ${filing.filing_type || 'Unknown'}
  Date: ${formatDate(filing.date_received)}
  View: ${filing.filing_url}
`).join('')}
`).join('')}

WHAT YOU'RE MISSING WITH PRO:
• AI-powered summaries from document content
• Stakeholder identification and impact analysis  
• Hourly notifications for urgent filings
• Complete PDF document processing

Manage subscriptions: ${app_url}/manage
Upgrade to Pro: ${app_url}/upgrade
Unsubscribe: ${unsubscribe_url}
  `;
  
  return { subject, html, text };
}

/**
 * PRO TIER: Full AI analysis with rich content
 */
function generateProUserDigest(userEmail, filings, { app_url, unsubscribe_url, user_tier }) {
  const filingsByDocket = groupFilingsByDocket(filings);
  const totalFilings = filings.length;
  const uniqueDockets = Object.keys(filingsByDocket).length;
  const tierDisplay = user_tier === 'trial' ? 'Pro Trial' : 'Pro';
  
  const subject = `🤖 AI Analysis: ${totalFilings} filing${totalFilings !== 1 ? 's' : ''} analyzed across ${uniqueDockets} docket${uniqueDockets !== 1 ? 's' : ''}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>SimpleDCC AI Daily Digest</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 700px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 2rem; text-align: center; }
        .header h1 { margin: 0; font-size: 1.5rem; }
        .pro-badge { background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.875rem; margin-top: 0.5rem; display: inline-block; }
        .content { padding: 2rem; }
        .docket-section { margin-bottom: 3rem; }
        .docket-header { background: #f0fdf4; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; }
        .filing-item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .filing-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; }
        .filing-title { font-weight: 600; color: #111827; font-size: 1.125rem; flex: 1; margin-right: 1rem; }
        .ai-badge { background: #10b981; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
        .filing-meta { font-size: 0.875rem; color: #6b7280; margin-bottom: 1rem; }
        .ai-summary { background: #f0fdf4; border-left: 4px solid #10b981; padding: 1rem; margin: 1rem 0; border-radius: 0 6px 6px 0; }
        .key-points { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; margin: 1rem 0; border-radius: 0 6px 6px 0; }
        .stakeholders { background: #ede9fe; border-left: 4px solid #8b5cf6; padding: 1rem; margin: 1rem 0; border-radius: 0 6px 6px 0; }
        .section-title { font-weight: 600; color: #374151; margin-bottom: 0.5rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .filing-actions { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }
        .filing-link { color: #10b981; text-decoration: none; font-weight: 500; margin-right: 1rem; }
        .confidence-score { font-size: 0.75rem; color: #6b7280; margin-top: 0.5rem; }
        .footer { background: #f3f4f6; padding: 1.5rem; text-align: center; font-size: 0.875rem; color: #6b7280; }
        .footer a { color: #10b981; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>🤖 SimpleDCC AI Analysis</h1>
          <div class="pro-badge">${tierDisplay} - Full AI Processing Active</div>
        </div>
        
        <!-- Content -->
        <div class="content">
          <h2>AI-Analyzed Filings</h2>
          <p><strong>${totalFilings}</strong> filing${totalFilings !== 1 ? 's' : ''} processed with AI analysis across <strong>${uniqueDockets}</strong> docket${uniqueDockets !== 1 ? 's' : ''}:</p>
          
          ${Object.entries(filingsByDocket).map(([docketNumber, docketFilings]) => `
            <div class="docket-section">
              <div class="docket-header">
                <h3 style="margin: 0; color: #059669;">📋 Docket ${docketNumber}</h3>
                <p style="margin: 0.5rem 0 0 0; color: #374151;">${docketFilings.length} filing${docketFilings.length !== 1 ? 's' : ''} with AI analysis</p>
              </div>
              
              ${docketFilings.map(filing => `
                <div class="filing-item">
                  <div class="filing-header">
                    <div class="filing-title">${escapeHtml(filing.title || 'Untitled Filing')}</div>
                    <div class="ai-badge">🤖 AI Analyzed</div>
                  </div>
                  
                  <div class="filing-meta">
                    <strong>Author:</strong> ${escapeHtml(filing.author || 'Unknown')} | 
                    <strong>Type:</strong> ${escapeHtml(filing.filing_type || 'Unknown')} |
                    <strong>Date:</strong> ${formatDate(filing.date_received)}
                    ${filing.documents_processed > 0 ? ` | <strong>Documents:</strong> ${filing.documents_processed} analyzed` : ''}
                  </div>
                  
                  ${filing.ai_summary ? `
                    <div class="ai-summary">
                      <div class="section-title">🤖 AI Summary</div>
                      <p style="margin: 0;">${escapeHtml(filing.ai_summary)}</p>
                    </div>
                  ` : ''}
                  
                  ${filing.ai_key_points ? `
                    <div class="key-points">
                      <div class="section-title">🎯 Key Points</div>
                      ${renderKeyPoints(filing.ai_key_points)}
                    </div>
                  ` : ''}
                  
                  ${filing.ai_stakeholders ? `
                    <div class="stakeholders">
                      <div class="section-title">👥 Stakeholders</div>
                      ${renderStakeholders(filing.ai_stakeholders)}
                    </div>
                  ` : ''}
                  
                  <div class="filing-actions">
                    <a href="${filing.filing_url}" class="filing-link" target="_blank">View Full Filing →</a>
                    ${filing.documents_processed > 0 ? '<span class="filing-link">📋 Documents Analyzed</span>' : ''}
                  </div>
                  
                  ${filing.ai_confidence ? `
                    <div class="confidence-score">AI Confidence: ${filing.ai_confidence}</div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `).join('')}
          
          ${user_tier === 'trial' ? `
            <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 1.5rem; text-align: center; margin-top: 2rem;">
              <h3 style="margin: 0 0 0.5rem 0; color: #1d4ed8;">✨ Pro Trial Active</h3>
              <p style="margin: 0; color: #1e40af;">You're experiencing the full power of SimpleDCC Pro. Continue your subscription to keep receiving AI-powered analysis.</p>
            </div>
          ` : ''}
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p><strong>SimpleDCC ${tierDisplay}</strong> - AI-Powered Regulatory Intelligence</p>
          <p>
            <a href="${app_url}/manage">Manage Subscriptions</a> | 
            <a href="${unsubscribe_url}">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
SimpleDCC AI Daily Digest - ${tierDisplay}

${totalFilings} filing${totalFilings !== 1 ? 's' : ''} analyzed across ${uniqueDockets} docket${uniqueDockets !== 1 ? 's' : ''}

${Object.entries(filingsByDocket).map(([docketNumber, docketFilings]) => `
DOCKET ${docketNumber}:
${docketFilings.map(filing => `
${filing.title || 'Untitled Filing'}
Author: ${filing.author || 'Unknown'} | Type: ${filing.filing_type || 'Unknown'}

AI Summary: ${filing.ai_summary || 'Processing...'}

${filing.ai_key_points ? renderKeyPointsText(filing.ai_key_points) : ''}

${filing.ai_stakeholders ? renderStakeholdersText(filing.ai_stakeholders) : ''}

View: ${filing.filing_url}
${filing.ai_confidence ? `AI Confidence: ${filing.ai_confidence}` : ''}
`).join('\n---\n')}
`).join('\n')}

Manage subscriptions: ${app_url}/manage
Unsubscribe: ${unsubscribe_url}
  `;
  
  return { subject, html, text };
}

// Enhanced filing alert for immediate notifications (already exists, enhance with tier logic)
export function generateFilingAlert(userEmail, filing, options = {}) {
  const { 
    user_tier = 'free',
    app_url = 'https://simpledcc.pages.dev',
    unsubscribe_url = `${app_url}/unsubscribe?email=${encodeURIComponent(userEmail)}`
  } = options;
  
  if (user_tier === 'free') {
    // Free users shouldn't get immediate alerts, but if they do, make it an upgrade prompt
    return {
      subject: `📋 New Filing in ${filing.docket_number} - Upgrade for Instant AI Analysis`,
      html: generateFreeAlertHTML(filing, { app_url, unsubscribe_url }),
      text: generateFreeAlertText(filing, { app_url, unsubscribe_url })
    };
  } else {
    // Pro users get full immediate alerts with AI content
    return {
      subject: `⚡ Immediate Alert: New filing in ${filing.docket_number}`,
      html: generateProAlertHTML(filing, { app_url, unsubscribe_url, user_tier }),
      text: generateProAlertText(filing, { app_url, unsubscribe_url })
    };
  }
}

// Helper functions (keep existing ones and add new tier-specific ones)
function escapeHtml(text) {
  if (!text) return '';
  return text.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Unknown date';
  }
}

function renderKeyPoints(keyPointsJson) {
  try {
    const points = JSON.parse(keyPointsJson);
    if (Array.isArray(points)) {
      return '<ul style="margin: 0; padding-left: 1.5rem;">' + 
        points.map(point => `<li style="margin: 0.25rem 0;">${escapeHtml(point)}</li>`).join('') + 
        '</ul>';
    }
    return `<p style="margin: 0;">${escapeHtml(keyPointsJson)}</p>`;
  } catch {
    return `<p style="margin: 0;">${escapeHtml(keyPointsJson)}</p>`;
  }
}

function renderStakeholders(stakeholdersJson) {
  try {
    const stakeholders = JSON.parse(stakeholdersJson);
    if (typeof stakeholders === 'object') {
      return Object.entries(stakeholders)
        .map(([key, value]) => `<p style="margin: 0.5rem 0;"><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</p>`)
        .join('');
    }
    return `<p style="margin: 0;">${escapeHtml(stakeholdersJson)}</p>`;
  } catch {
    return `<p style="margin: 0;">${escapeHtml(stakeholdersJson)}</p>`;
  }
}

function renderKeyPointsText(keyPointsJson) {
  try {
    const points = JSON.parse(keyPointsJson);
    if (Array.isArray(points)) {
      return 'Key Points:\n' + points.map(point => `• ${point}`).join('\n');
    }
    return `Key Points: ${keyPointsJson}`;
  } catch {
    return `Key Points: ${keyPointsJson}`;
  }
}

function renderStakeholdersText(stakeholdersJson) {
  try {
    const stakeholders = JSON.parse(stakeholdersJson);
    if (typeof stakeholders === 'object') {
      return 'Stakeholders:\n' + Object.entries(stakeholders)
        .map(([key, value]) => `• ${key}: ${value}`)
        .join('\n');
    }
    return `Stakeholders: ${stakeholdersJson}`;
  } catch {
    return `Stakeholders: ${stakeholdersJson}`;
  }
}

// Keep existing groupFilingsByDocket function
function groupFilingsByDocket(filings) {
  return filings.reduce((acc, filing) => {
    const docket = filing.docket_number;
    if (!acc[docket]) acc[docket] = [];
    acc[docket].push(filing);
    return acc;
  }, {});
}
```

---

## **2. Enhanced UI Subscription Management**

### **Update ManageSubscriptions Component with Frequency Controls**
Update: `src/lib/components/ManageSubscriptions.svelte`

**Add notification frequency controls and user tier display:**

```svelte
<script lang="ts">
  // Keep existing imports and variables
  let email = '';
  let subscriptions: Array<{
    id: string;
    docket_number: string;
    frequency: string;
    created_at: number;
  }> = [];
  let userTier = 'free'; // Add user tier tracking
  let isLoadingSubscriptions = false;
  let unsubscribeLoading: Set<string> = new Set();
  
  // Add new variables for frequency management
  let updatingFrequency: Set<string> = new Set();
  
  // Keep existing handleLookup function but enhance to get user tier
  async function handleLookup() {
    if (!email.trim()) {
      showMessage('Please enter your email address', 'error');
      return;
    }
    
    isLoadingSubscriptions = true;
    
    try {
      const response = await fetch(`/api/subscribe?email=${encodeURIComponent(email.trim())}`);
      const result = await response.json();
      
      if (response.ok) {
        // Update local subscription frequency
        subscriptions = subscriptions.map(sub => 
          sub.id === subscriptionId 
            ? { ...sub, frequency: newFrequency }
            : sub
        );
        showMessage(`Notification frequency updated to ${newFrequency} for docket ${docketNumber}.`, 'success');
      } else {
        if (result.upgrade_required) {
          showMessage('This feature requires Pro subscription. Click here to upgrade!', 'error');
          // Could trigger upgrade modal here
        } else {
          showMessage(result.error || 'Failed to update notification frequency.', 'error');
        }
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      updatingFrequency = new Set([...updatingFrequency].filter(id => id !== subscriptionId));
    }
  }
  
  // NEW: Show upgrade modal/page
  function showUpgradePrompt() {
    // Redirect to upgrade page or show modal
    window.open('/upgrade', '_blank');
  }
</script>

<!-- Keep existing email lookup form -->

<!-- ADD: User tier display banner -->
{#if subscriptions.length > 0}
  <div class="user-tier-banner">
    {#if userTier === 'trial'}
      <div class="trial-banner">
        ✨ Pro Trial Active - Full AI analysis and immediate notifications available
      </div>
    {:else if userTier === 'pro'}
      <div class="pro-banner">
        🚀 Pro Account - Full AI analysis and immediate notifications active
      </div>
    {:else}
      <div class="free-banner">
        📧 Free Account - Basic filing information • 
        <button class="upgrade-link" on:click={showUpgradePrompt}>
          Upgrade for AI summaries and immediate alerts
        </button>
      </div>
    {/if}
  </div>
{/if}

<!-- Enhanced subscription list with frequency controls -->
{#if subscriptions.length > 0}
  <div class="subscriptions-list">
    <h3>Your Active Subscriptions</h3>
    
    {#each subscriptions as subscription}
      <div class="subscription-item">
        <div class="subscription-header">
          <div class="docket-info">
            <h4>Docket {subscription.docket_number}</h4>
            <p class="subscription-date">
              Subscribed: {new Date(subscription.created_at * 1000).toLocaleDateString()}
            </p>
          </div>
          
          <!-- NEW: Notification frequency controls -->
          <div class="frequency-controls">
            <label class="frequency-label">Notifications:</label>
            <select 
              bind:value={subscription.frequency}
              on:change={(e) => updateNotificationFrequency(subscription.id, e.target.value, subscription.docket_number)}
              disabled={updatingFrequency.has(subscription.id)}
              class="frequency-select"
            >
              <option value="daily">📧 Daily Digest</option>
              <option value="weekly">📅 Weekly Summary</option>
              <option 
                value="immediate" 
                disabled={userTier === 'free'}
              >
                ⚡ Immediate {userTier === 'free' ? '(Pro Only)' : ''}
              </option>
            </select>
            
            {#if updatingFrequency.has(subscription.id)}
              <span class="updating-indicator">Updating...</span>
            {/if}
          </div>
        </div>
        
        <!-- Pro feature hints for free users -->
        {#if userTier === 'free' && subscription.frequency === 'daily'}
          <div class="pro-hint">
            💡 <strong>Pro users get:</strong> AI summaries, stakeholder analysis, and immediate notifications for urgent filings
          </div>
        {/if}
        
        <!-- Existing unsubscribe button -->
        <div class="subscription-actions">
          <button
            class="unsubscribe-button"
            on:click={() => handleUnsubscribe(subscription.id, subscription.docket_number)}
            disabled={unsubscribeLoading.has(subscription.id)}
          >
            {unsubscribeLoading.has(subscription.id) ? 'Unsubscribing...' : 'Unsubscribe'}
          </button>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  /* Keep existing styles and add new ones */
  
  .user-tier-banner {
    margin: 1rem 0 2rem 0;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .trial-banner, .pro-banner {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 1rem 1.5rem;
    text-align: center;
    font-weight: 500;
  }
  
  .free-banner {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    color: white;
    padding: 1rem 1.5rem;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .upgrade-link {
    background: white;
    color: #4b5563;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
  }
  
  .subscription-item {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    background: white;
  }
  
  .subscription-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }
  
  .docket-info h4 {
    margin: 0 0 0.25rem 0;
    color: #111827;
    font-size: 1.125rem;
  }
  
  .subscription-date {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .frequency-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .frequency-label {
    font-size: 0.875rem;
    color: #374151;
    font-weight: 500;
  }
  
  .frequency-select {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    font-size: 0.875rem;
    min-width: 140px;
  }
  
  .frequency-select:disabled {
    background: #f9fafb;
    color: #6b7280;
  }
  
  .updating-indicator {
    font-size: 0.75rem;
    color: #6b7280;
    font-style: italic;
  }
  
  .pro-hint {
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 6px;
    padding: 0.75rem;
    margin: 1rem 0;
    font-size: 0.875rem;
    color: #92400e;
  }
  
  .subscription-actions {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .unsubscribe-button {
    background: #ef4444;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
  }
  
  .unsubscribe-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .subscription-header {
      flex-direction: column;
      gap: 1rem;
    }
    
    .frequency-controls {
      align-self: flex-start;
    }
    
    .free-banner {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
```

---

## **3. Frequency Update API Endpoint**

### **Create Subscription Frequency API**
Create: `src/routes/api/subscriptions/frequency/+server.ts`

```typescript
// API endpoint for updating notification frequency preferences
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const { email, docket_number, frequency } = await request.json();
    
    // Validate inputs
    if (!email || !docket_number || !frequency) {
      return json({ 
        success: false, 
        error: 'Email, docket number, and frequency are required' 
      }, { status: 400 });
    }
    
    // Validate frequency values
    const validFrequencies = ['daily', 'weekly', 'immediate'];
    if (!validFrequencies.includes(frequency)) {
      return json({ 
        success: false, 
        error: 'Invalid frequency. Must be daily, weekly, or immediate' 
      }, { status: 400 });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const db = platform?.env?.DB;
    
    if (!db) {
      return json({ 
        success: false, 
        error: 'Database connection not available' 
      }, { status: 500 });
    }
    
    // Get subscription and user tier info
    const subscription = await db.prepare(`
      SELECT s.*, u.user_tier 
      FROM subscriptions s 
      LEFT JOIN users u ON s.email = u.email 
      WHERE s.email = ? AND s.docket_number = ?
    `).bind(normalizedEmail, docket_number).first();
    
    if (!subscription) {
      return json({ 
        success: false, 
        error: 'Subscription not found' 
      }, { status: 404 });
    }
    
    // Check user tier eligibility for immediate notifications
    const userTier = subscription.user_tier || 'free';
    if (frequency === 'immediate' && userTier === 'free') {
      return json({ 
        success: false, 
        error: 'Immediate notifications require Pro subscription',
        upgrade_required: true,
        current_tier: userTier
      }, { status: 403 });
    }
    
    // Update notification frequency
    const updateResult = await db.prepare(`
      UPDATE subscriptions 
      SET frequency = ? 
      WHERE email = ? AND docket_number = ?
    `).bind(frequency, normalizedEmail, docket_number).run();
    
    if (updateResult.changes === 0) {
      return json({ 
        success: false, 
        error: 'Failed to update subscription' 
      }, { status: 500 });
    }
    
    // Log the frequency change
    const { logSystemEvent } = await import('$lib/database/db-operations.js');
    await logSystemEvent(db, 'info', 'Notification frequency updated', 'user_preferences', {
      email: normalizedEmail,
      docket_number: docket_number,
      old_frequency: subscription.frequency,
      new_frequency: frequency,
      user_tier: userTier
    });
    
    return json({
      success: true,
      message: `Notification frequency updated to ${frequency}`,
      new_frequency: frequency,
      user_tier: userTier
    });
    
  } catch (error) {
    console.error('Error updating notification frequency:', error);
    return json({ 
      success: false, 
      error: 'Failed to update notification frequency',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
```

---

## **4. Enhanced Subscription API with User Tier**

### **Update Existing Subscription API to Return User Tier**
Update: `src/routes/api/subscribe/+server.ts`

**Enhance the GET handler to return user tier information:**

```typescript
// Enhance existing GET handler (keep existing POST handler)
export const GET: RequestHandler = async ({ url, platform }) => {
  const email = url.searchParams.get('email');
  if (!email) {
    return json({ 
      success: false, 
      error: 'Email parameter required' 
    }, { status: 400 });
  }
  
  const normalizedEmail = email.toLowerCase();
  const db = platform?.env?.DB;
  
  try {
    // Get subscriptions with user tier info
    const subscriptions = await db.prepare(`
      SELECT s.id, s.docket_number, s.frequency, s.created_at
      FROM subscriptions s 
      WHERE s.email = ? 
      ORDER BY s.created_at DESC
    `).bind(normalizedEmail).all();
    
    // Get user tier (if user account exists from Card 1)
    const userInfo = await db.prepare(`
      SELECT user_tier FROM users WHERE email = ?
    `).bind(normalizedEmail).first();
    
    return json({ 
      success: true,
      subscriptions: subscriptions.results || [],
      count: subscriptions.results?.length || 0,
      user_tier: userInfo?.user_tier || 'free' // Default to free for email-only users
    });
    
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return json({ 
      success: false, 
      error: 'Failed to fetch subscriptions' 
    }, { status: 500 });
  }
};
```

---

## **5. Complete Cron Integration with Tier-Based Email Delivery**

### **Update Cron Email Processing to Use Enhanced Templates**
Update the email sending functions in your enhanced cron from Card 3:

```javascript
// Update the email sending functions in daily-check/+server.js
// Replace the sendEmail helper function with tier-aware version

async function sendEmail(email, emailContent, env) {
  try {
    // Use existing Resend infrastructure with enhanced content
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${env.FROM_NAME || 'SimpleDCC'} <${env.FROM_EMAIL || 'notifications@simpledcc.pages.dev'}>`,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      }),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Email API error: ${response.status} - ${errorBody}`);
    }
    
    const result = await response.json();
    console.log(`📧 Email sent successfully to ${email}: ${emailContent.subject}`);
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error);
    throw error;
  }
}

// Update processDailyDigests function to use tier-based templates
async function processDailyDigests(env) {
  try {
    // Get users with user tier information
    const dailyUsers = await env.DB.prepare(`
      SELECT s.email, u.user_tier, COUNT(*) as subscription_count
      FROM subscriptions s 
      LEFT JOIN users u ON s.email = u.email
      WHERE s.frequency = 'daily'
        AND (s.last_notified < ? OR s.last_notified IS NULL)
      GROUP BY s.email, u.user_tier
    `).bind(Date.now() - 20 * 60 * 60 * 1000).all();
    
    let sent = 0;
    const errors = [];
    
    for (const user of dailyUsers.results || []) {
      try {
        // Get user's docket subscriptions
        const userSubscriptions = await env.DB.prepare(`
          SELECT docket_number FROM subscriptions 
          WHERE email = ? AND frequency = 'daily'
        `).bind(user.email).all();
        
        const docketNumbers = userSubscriptions.results?.map(s => s.docket_number) || [];
        if (docketNumbers.length === 0) continue;
        
        // Get new filings for user's dockets
        const placeholders = docketNumbers.map(() => '?').join(',');
        const newFilings = await env.DB.prepare(`
          SELECT * FROM filings 
          WHERE docket_number IN (${placeholders})
            AND created_at > ?
          ORDER BY date_received DESC
          LIMIT 50
        `).bind(...docketNumbers, Date.now() - 24 * 60 * 60 * 1000).all();
        
        if (newFilings.results?.length) {
          // Generate tier-appropriate email content
          const { generateDailyDigest } = await import('$lib/email/daily-digest.js');
          const emailContent = generateDailyDigest(user.email, newFilings.results, {
            user_tier: user.user_tier || 'free', // Key enhancement: pass user tier
            app_url: env.APP_URL || 'https://simpledcc.pages.dev'
          });
          
          // Send email using enhanced template
          await sendEmail(user.email, emailContent, env);
          
          // Update last_notified for all user's daily subscriptions
          for (const docket of docketNumbers) {
            await env.DB.prepare(`
              UPDATE subscriptions SET last_notified = ? 
              WHERE email = ? AND docket_number = ?
            `).bind(Date.now(), user.email, docket).run();
          }
          
          sent++;
          console.log(`📧 Daily digest sent to ${user.email} (${user.user_tier || 'free'}): ${newFilings.results.length} filings`);
        }
        
      } catch (userError) {
        console.error(`❌ Daily digest failed for ${user.email}:`, userError);
        errors.push(`${user.email}: ${userError.message}`);
      }
    }
    
    return { sent, errors };
    
  } catch (error) {
    console.error('❌ Daily digest processing failed:', error);
    return { sent: 0, errors: [error.message] };
  }
}
```

---

## **Testing Requirements**

### **1. Email Template Tests**
```bash
# Test tier-based email generation
curl -X POST "http://localhost:5173/api/admin/test-email-templates" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "user_tier": "free",
    "test_filings": 3
  }'

# Should generate free tier template with upgrade prompts

curl -X POST "http://localhost:5173/api/admin/test-email-templates" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com", 
    "user_tier": "pro",
    "test_filings": 3
  }'

# Should generate pro tier template with AI content
```

### **2. Frequency Control Tests**
```bash
# Test frequency update for free user trying immediate
curl -X POST "http://localhost:5173/api/subscriptions/frequency" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "free@example.com",
    "docket_number": "11-42",
    "frequency": "immediate"
  }'

# Should return upgrade_required error

# Test frequency update for pro user
curl -X POST "http://localhost:5173/api/subscriptions/frequency" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pro@example.com",
    "docket_number": "11-42", 
    "frequency": "immediate"
  }'

# Should succeed for pro user
```

### **3. End-to-End Integration Tests**
```bash
# Test complete signup → upgrade → frequency change flow
# 1. Subscribe as free user
# 2. Try to change to immediate (should prompt upgrade)
# 3. Upgrade to pro trial
# 4. Change to immediate (should succeed)
# 5. Verify appropriate email template is sent
```

---

## **Git Workflow Instructions**

### **Branch Management**
```bash
# Continue on existing phase2 branch
git checkout phase2-card3-production-cron

# Commit enhanced email templates
git add src/lib/email/daily-digest.js
git commit -m "Add tier-based email templates with free vs pro differentiation"

# Commit UI enhancements
git add src/lib/components/ManageSubscriptions.svelte
git commit -m "Add notification frequency controls and user tier display to subscription management"

# Commit API endpoints
git add src/routes/api/subscriptions/frequency/
git commit -m "Add subscription frequency management API with tier validation"

# Commit subscription API enhancements
git add src/routes/api/subscribe/+server.ts
git commit -m "Enhance subscription API to return user tier information"

# DO NOT PUSH TO GITHUB YET
# Test complete end-to-end integration before pushing
```

### **Testing Before Push**
1. **Test email templates** render correctly for both tiers
2. **Verify frequency controls** work in subscription management UI
3. **Test API endpoints** handle tier restrictions properly
4. **Check upgrade prompts** appear and function correctly
5. **Confirm end-to-end flow** from signup to tier-appropriate emails
6. **Test responsive design** on mobile devices
7. **Verify all existing functionality** still works
8. **Report comprehensive test results** before pushing to GitHub

---

## **Success Criteria for Card 4**

### **Email Template Success**
- ✅ Free tier emails display metadata with compelling upgrade prompts
- ✅ Pro tier emails show full AI summaries and rich content formatting
- ✅ Templates are mobile-responsive and professional
- ✅ Upgrade messaging drives trial conversion without being intrusive
- ✅ Email content adapts appropriately based on user tier

### **UI/UX Success**
- ✅ Notification frequency controls are intuitive and accessible
- ✅ User tier status is clearly displayed with appropriate branding
- ✅ Free users understand tier limitations and upgrade value
- ✅ Pro users can easily manage all notification preferences
- ✅ Upgrade prompts are well-integrated into the user experience

### **Integration Success**
- ✅ Email templates integrate seamlessly with cron system from Card 3
- ✅ Frequency controls update database and respect tier restrictions
- ✅ User tier system from Card 1 works throughout email pipeline
- ✅ No disruption to existing subscription functionality
- ✅ Error handling works gracefully for all edge cases

### **Phase 2 Complete**
- ✅ **User account system** with free/pro/trial tiers is fully functional
- ✅ **Pro trial upsell** drives conversion with compelling sample content
- ✅ **Intelligent cron system** optimizes processing based on ET business hours
- ✅ **Tier-based email delivery** provides appropriate content for each user type
- ✅ **Notification preferences** are user-controlled and tier-aware
- ✅ **Complete integration** delivers cohesive end-to-end user experience
- ✅ **Foundation ready** for Stripe payment integration in Phase 2.5

---

## **Cursor Implementation Notes**

- **Enhance existing sophisticated system**: Build on your excellent email infrastructure
- **Match existing TypeScript patterns**: Follow your established coding conventions
- **Integrate with existing database schema**: Use your notification_queue and user tables
- **Test email rendering thoroughly**: Verify templates work across email clients
- **Focus on user experience**: Make tier differences clear but not punitive
- **Prepare for Stripe integration**: Structure trial system for easy payment addition

**Card 4 Complete When**: Tier-based email templates deliver appropriate content, frequency controls function properly in the UI, upgrade prompts drive conversion, and the complete Phase 2 user tier system provides a cohesive experience ready for production deployment with Stripe integration to follow.

**🎉 Phase 2 Implementation Complete!** Your enhanced email-based system now supports user tiers, intelligent scheduling, and compelling upgrade paths while maintaining the sophisticated foundation you've built.();
      
      if (response.ok) {
        subscriptions = result.subscriptions || [];
        userTier = result.user_tier || 'free'; // Get user tier from API
        
        if (subscriptions.length === 0) {
          showMessage('No active subscriptions found for this email address.', 'info');
        } else {
          showMessage(`Found ${subscriptions.length} active subscription${subscriptions.length === 1 ? '' : 's'}.`, 'success');
        }
      } else {
        showMessage(result.error || 'Failed to lookup subscriptions.', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
      isLoadingSubscriptions = false;
    }
  }
  
  // Keep existing handleUnsubscribe function
  async function handleUnsubscribe(subscriptionId: string, docketNumber: string) {
    // ... existing implementation
  }
  
  // NEW: Handle frequency updates
  async function updateNotificationFrequency(subscriptionId: string, newFrequency: string, docketNumber: string) {
    // Check if user tier allows the frequency
    if (newFrequency === 'immediate' && userTier === 'free') {
      showMessage('Immediate notifications require Pro subscription. Upgrade to get instant alerts!', 'error');
      return;
    }
    
    updatingFrequency = new Set([...updatingFrequency, subscriptionId]);
    
    try {
      const response = await fetch('/api/subscriptions/frequency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          docket_number: docketNumber,
          frequency: newFrequency
        })
      });
      
      const result = await response.json