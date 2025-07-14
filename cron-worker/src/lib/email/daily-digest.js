// Enhanced email templates with AI summary support
import { formatDate, formatTimeAgo } from '../utils/date-formatters.js';

/**
 * Generate daily digest email with AI summaries
 * @param {string} userEmail - Recipient email
 * @param {Array} filings - Array of filings with AI summaries
 * @param {Object} options - Email customization options
 */
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

/**
 * Generate HTML email template with professional styling
 */
function generateHTMLTemplate(userEmail, filingsByDocket, options) {
  const { brandName, supportEmail, unsubscribeBaseUrl, today, user_tier, digest_type } = options;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} Daily Digest</title>
  <style>
    /* Reset and base styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      margin: 0;
      padding: 0;
    }
    
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #0f172a;
    }
    
    /* Container */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    /* Header */
    .email-header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    
    .email-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    
    .email-header .subtitle {
      margin: 8px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
      font-weight: 400;
    }
    
    /* Content */
    .email-content {
      padding: 32px 24px;
    }
    
    .summary-box {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 32px;
    }
    
    .summary-box h2 {
      margin: 0 0 12px 0;
      font-size: 18px;
      color: #065f46;
      font-weight: 600;
    }
    
    .summary-stats {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
    }
    
    .stat-item {
      text-align: center;
      flex: 1;
    }
    
    .stat-number {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: #059669;
      line-height: 1;
    }
    
    .stat-label {
      font-size: 14px;
      color: #374151;
      margin-top: 4px;
    }
    
    /* Docket sections */
    .docket-section {
      margin-bottom: 40px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 32px;
    }
    
    .docket-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .docket-header {
      background-color: #f8fafc;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #10b981;
    }
    
    .docket-number {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    
    .docket-meta {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
    
    /* Filing cards */
    .filing-card {
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
      transition: all 0.2s ease;
    }
    
    .filing-card:last-child {
      margin-bottom: 0;
    }
    
    .filing-header {
      margin-bottom: 12px;
    }
    
    .filing-title {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }
    
    .filing-meta {
      display: flex;
      gap: 16px;
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 16px;
    }
    
    .filing-meta span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .ai-summary {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 16px;
    }
    
    .ai-summary-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .ai-summary-title {
      font-size: 14px;
      font-weight: 600;
      color: #92400e;
      margin: 0;
    }
    
    .ai-summary-text {
      font-size: 14px;
      color: #1f2937;
      margin: 0;
      line-height: 1.5;
    }
    
    .filing-actions {
      text-align: right;
    }
    
    .filing-link {
      display: inline-block;
      background-color: #10b981;
      color: white;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s ease;
    }
    
    .filing-link:hover {
      background-color: #059669;
    }
    
    /* Footer */
    .email-footer {
      background-color: #f8fafc;
      padding: 32px 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer-links {
      margin-bottom: 16px;
    }
    
    .footer-link {
      color: #6b7280;
      text-decoration: none;
      font-size: 14px;
      margin: 0 12px;
    }
    
    .footer-link:hover {
      color: #10b981;
    }
    
    .footer-text {
      font-size: 12px;
      color: #9ca3af;
      margin: 0;
    }
    
    /* Responsive */
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
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <h1>${brandName}</h1>
      <div class="subtitle">Daily Filing Digest - ${today}</div>
    </div>
    
    <!-- Content -->
    <div class="email-content">
      <!-- Summary Box -->
      <div class="summary-box">
        <h2>📊 Today's Summary</h2>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-number">${Object.values(filingsByDocket).reduce((sum, filings) => sum + filings.length, 0)}</span>
            <div class="stat-label">New Filings</div>
          </div>
          <div class="stat-item">
            <span class="stat-number">${Object.keys(filingsByDocket).length}</span>
            <div class="stat-label">Dockets</div>
          </div>
          <div class="stat-item">
            <span class="stat-number">${Object.values(filingsByDocket).flat().filter(f => f.ai_summary).length}</span>
            <div class="stat-label">AI Summaries</div>
          </div>
        </div>
        <p style="margin: 0; font-size: 14px; color: #374151;">
          🤖 AI-powered summaries help you quickly understand key regulatory developments
        </p>
      </div>
      
      ${generateTierSpecificBanner(user_tier, unsubscribeBaseUrl)}
      
      <!-- Docket Sections -->
      ${Object.entries(filingsByDocket).map(([docketNumber, filings]) => `
        <div class="docket-section">
          <div class="docket-header">
            <h3 class="docket-number">📋 Docket ${docketNumber}</h3>
            <p class="docket-meta">${filings.length} new filing${filings.length !== 1 ? 's' : ''}</p>
          </div>
          
          ${filings.map(filing => `
            <div class="filing-card">
              <div class="filing-header">
                <h4 class="filing-title">${escapeHtml(filing.title)}</h4>
                <div class="filing-meta">
                  <span>👤 ${escapeHtml(filing.author)}</span>
                  <span>📝 ${escapeHtml(filing.filing_type)}</span>
                  <span>📅 ${formatDate(filing.date_received)}</span>
                </div>
              </div>
              
              ${generateFilingContent(filing, user_tier, unsubscribeBaseUrl)}
              
              <div class="filing-actions">
                <a href="${filing.filing_url}" class="filing-link" target="_blank">
                  View Full Filing →
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
    
    <!-- Footer -->
    <div class="email-footer">
      <div class="footer-links">
        <a href="${unsubscribeBaseUrl}" class="footer-link">Manage Subscriptions</a>
        <a href="mailto:${supportEmail}" class="footer-link">Support</a>
        <a href="${unsubscribeBaseUrl}/admin" class="footer-link">Dashboard</a>
      </div>
      <p class="footer-text">
        You're receiving this because you're subscribed to FCC docket monitoring with ${brandName}.<br>
        <a href="${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}" style="color: #9ca3af;">Unsubscribe from all notifications</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate tier-specific banner content
 */
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

/**
 * Generate filing content based on user tier
 */
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

/**
 * Generate plain text email template
 */
function generateTextTemplate(userEmail, filingsByDocket, options) {
  const { brandName, supportEmail, unsubscribeBaseUrl, today, user_tier } = options;
  const totalFilings = Object.values(filingsByDocket).reduce((sum, filings) => sum + filings.length, 0);
  const uniqueDockets = Object.keys(filingsByDocket).length;
  
  let text = `${brandName} - Daily Filing Digest\n`;
  text += `${today}\n`;
  text += `${'='.repeat(50)}\n\n`;
  
  text += `SUMMARY\n`;
  text += `-------\n`;
  text += `New Filings: ${totalFilings}\n`;
  text += `Dockets: ${uniqueDockets}\n`;
  text += `AI Summaries: ${Object.values(filingsByDocket).flat().filter(f => f.ai_summary).length}\n\n`;
  
  // Add tier-specific message
  if (user_tier === 'free') {
    text += `UPGRADE TO PRO FOR AI SUMMARIES\n`;
    text += `${'-'.repeat(35)}\n`;
    text += `Free users see basic filing metadata. Upgrade to Pro for AI-powered summaries.\n`;
    text += `Upgrade: ${unsubscribeBaseUrl}/pricing\n\n`;
  } else if (user_tier === 'trial') {
    text += `TRIAL ACTIVE - FULL AI ACCESS\n`;
    text += `${'-'.repeat(30)}\n`;
    text += `You're enjoying full AI summaries during your trial. Continue with Pro for ongoing access.\n`;
    text += `Continue: ${unsubscribeBaseUrl}/pricing\n\n`;
  }
  
  Object.entries(filingsByDocket).forEach(([docketNumber, filings]) => {
    text += `DOCKET ${docketNumber}\n`;
    text += `${'-'.repeat(20)}\n`;
    text += `${filings.length} new filing${filings.length !== 1 ? 's' : ''}\n\n`;
    
    filings.forEach((filing, index) => {
      text += `${index + 1}. ${filing.title}\n`;
      text += `   Author: ${filing.author}\n`;
      text += `   Type: ${filing.filing_type}\n`;
      text += `   Date: ${formatDate(filing.date_received)}\n`;
      
      if (user_tier === 'free') {
        text += `   AI Summary: [Upgrade to Pro for AI summaries]\n`;
        text += `   Upgrade: ${unsubscribeBaseUrl}/pricing\n`;
      } else if (filing.ai_summary) {
        text += `   AI Summary: ${filing.ai_summary}\n`;
      }
      
      text += `   Link: ${filing.filing_url}\n\n`;
    });
  });
  
  text += `${'='.repeat(50)}\n`;
  text += `Manage your subscriptions: ${unsubscribeBaseUrl}\n`;
  text += `Support: ${supportEmail}\n`;
  text += `Unsubscribe: ${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}\n`;
  
  return text;
}

/**
 * Generate welcome email for new subscriptions
 */
export function generateWelcomeEmail(userEmail, docketNumber, options = {}) {
  const {
    brandName = 'SimpleDCC',
    supportEmail = 'support@simpledcc.com',
    unsubscribeBaseUrl = 'https://simpledcc.pages.dev'
  } = options;
  
  return {
    subject: `Welcome to ${brandName} - Now monitoring FCC Docket ${docketNumber}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${brandName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      line-height: 1.6;
      color: #0f172a;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8fafc;
    }
    
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    
    .logo {
      font-size: 32px;
      font-weight: 700;
      color: #10b981;
      margin-bottom: 8px;
    }
    
    .subtitle {
      color: #6b7280;
      font-size: 18px;
    }
    
    .content {
      margin-bottom: 32px;
    }
    
    .docket-badge {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 18px;
      text-align: center;
      margin: 24px 0;
    }
    
    .features {
      background-color: #f0fdf4;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    
    .features h3 {
      color: #065f46;
      margin-top: 0;
    }
    
    .feature-list {
      list-style: none;
      padding: 0;
    }
    
    .feature-list li {
      margin: 12px 0;
      padding-left: 24px;
      position: relative;
    }
    
    .feature-list li:before {
      content: "✅";
      position: absolute;
      left: 0;
    }
    
    .cta-button {
      display: inline-block;
      background-color: #10b981;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      text-align: center;
      margin: 16px 0;
    }
    
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
      padding-top: 24px;
      margin-top: 32px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${brandName}</div>
      <div class="subtitle">Professional FCC Regulatory Monitoring</div>
    </div>
    
    <div class="content">
      <h2>🎉 Welcome to ${brandName}!</h2>
      
      <p>Thank you for subscribing to our FCC docket monitoring service. You're now actively monitoring:</p>
      
      <div class="docket-badge">
        📋 FCC Docket ${docketNumber}
      </div>
      
      <div class="features">
        <h3>What you'll receive:</h3>
        <ul class="feature-list">
          <li>Daily digest emails with new filings</li>
          <li>AI-powered summaries of complex regulatory documents</li>
          <li>Real-time notifications for important developments</li>
          <li>Direct links to official FCC filing documents</li>
          <li>Professional formatting for regulatory professionals</li>
        </ul>
      </div>
      
      <p><strong>Next Steps:</strong></p>
      <p>Your first digest will arrive within 24 hours if there are new filings in docket ${docketNumber}. Our AI system will analyze each filing and provide concise summaries to help you quickly understand key regulatory developments.</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${unsubscribeBaseUrl}" class="cta-button">
          Manage Your Subscriptions
        </a>
      </div>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:${supportEmail}" style="color: #10b981;">${supportEmail}</a>.</p>
    </div>
    
    <div class="footer">
      <p>You can <a href="${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&docket=${docketNumber}" style="color: #6b7280;">unsubscribe from this docket</a> or <a href="${unsubscribeBaseUrl}" style="color: #6b7280;">manage all subscriptions</a> at any time.</p>
    </div>
  </div>
</body>
</html>`,
    text: `Welcome to ${brandName}!

Thank you for subscribing to our FCC docket monitoring service.

You're now monitoring: FCC Docket ${docketNumber}

What you'll receive:
- Daily digest emails with new filings
- AI-powered summaries of regulatory documents
- Real-time notifications for important developments
- Direct links to official FCC documents
- Professional formatting for regulatory professionals

Your first digest will arrive within 24 hours if there are new filings.

Manage subscriptions: ${unsubscribeBaseUrl}
Support: ${supportEmail}
Unsubscribe: ${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&docket=${docketNumber}

${brandName} - Professional FCC Regulatory Monitoring`
  };
}

/**
 * Generate filing alert email for immediate notifications
 */
export function generateFilingAlert(userEmail, filing, options = {}) {
  const {
    brandName = 'SimpleDCC',
    unsubscribeBaseUrl = 'https://simpledcc.pages.dev',
    user_tier = 'free'
  } = options;
  
  return {
    subject: `🚨 New Filing Alert: ${filing.docket_number} - ${filing.title.substring(0, 60)}${filing.title.length > 60 ? '...' : ''}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Filing Alert - ${brandName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      line-height: 1.6;
      color: #0f172a;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8fafc;
    }
    
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #f59e0b;
    }
    
    .alert-header {
      background-color: #fef3c7;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .alert-title {
      font-size: 18px;
      font-weight: 600;
      color: #92400e;
      margin: 0;
    }
    
    .filing-details {
      background-color: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .detail-row {
      margin: 12px 0;
      display: flex;
      align-items: center;
    }
    
    .detail-label {
      font-weight: 600;
      min-width: 80px;
      color: #374151;
    }
    
    .detail-value {
      color: #0f172a;
    }
    
    .ai-summary-box {
      background-color: #f0f9ff;
      border: 1px solid #0ea5e9;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .cta-button {
      display: inline-block;
      background-color: #10b981;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      text-align: center;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="alert-header">
      <h1 class="alert-title">🚨 New Filing Alert</h1>
    </div>
    
    <div class="filing-details">
      <div class="detail-row">
        <span class="detail-label">📋 Docket:</span>
        <span class="detail-value">${filing.docket_number}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">👤 Author:</span>
        <span class="detail-value">${escapeHtml(filing.author)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">📝 Type:</span>
        <span class="detail-value">${escapeHtml(filing.filing_type)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">📅 Date:</span>
        <span class="detail-value">${formatDate(filing.date_received)}</span>
      </div>
    </div>
    
    <h3>${escapeHtml(filing.title)}</h3>
    
    ${generateFilingAlertContent(filing, user_tier, unsubscribeBaseUrl)}
    
    <div style="text-align: center;">
      <a href="${filing.filing_url}" class="cta-button" target="_blank">
        View Full Filing →
      </a>
    </div>
    
    <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #6b7280;">
      <a href="${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&docket=${filing.docket_number}" style="color: #6b7280;">Unsubscribe from ${filing.docket_number}</a>
    </div>
  </div>
</body>
</html>`,
    text: `🚨 NEW FILING ALERT

Docket: ${filing.docket_number}
Title: ${filing.title}
Author: ${filing.author}
Type: ${filing.filing_type}
Date: ${formatDate(filing.date_received)}

${generateFilingAlertTextContent(filing, user_tier, unsubscribeBaseUrl)}

View full filing: ${filing.filing_url}

Unsubscribe: ${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&docket=${filing.docket_number}`
  };
}

/**
 * Generate filing alert content based on user tier (HTML version)
 */
function generateFilingAlertContent(filing, user_tier, unsubscribeBaseUrl) {
  if (user_tier === 'free') {
    return `
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h4 style="margin-top: 0; color: #4b5563;">🚀 Upgrade to Pro for AI Summary</h4>
        <p style="margin-bottom: 16px; color: #6b7280;">Free users see basic filing information. Upgrade to Pro for AI-powered summaries that help you quickly understand key regulatory developments.</p>
        <a href="${unsubscribeBaseUrl}/pricing" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600;">
          Upgrade to Pro →
        </a>
      </div>
    `;
  } else if (user_tier === 'trial') {
    const content = filing.ai_summary ? `
      <div class="ai-summary-box">
        <h4 style="margin-top: 0; color: #0c4a6e;">🤖 AI Summary</h4>
        <p style="margin-bottom: 0;">${escapeHtml(filing.ai_summary)}</p>
      </div>
    ` : '';
    
    return content + `
      <div style="background-color: #fef3c7; padding: 16px; border-radius: 6px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          ⏰ <strong>Trial Active</strong> - You're enjoying full AI summaries. <a href="${unsubscribeBaseUrl}/pricing" style="color: #92400e; text-decoration: underline;">Continue with Pro →</a>
        </p>
      </div>
    `;
  } else {
    // Pro users get full AI summaries with no banners
    return filing.ai_summary ? `
      <div class="ai-summary-box">
        <h4 style="margin-top: 0; color: #0c4a6e;">🤖 AI Summary</h4>
        <p style="margin-bottom: 0;">${escapeHtml(filing.ai_summary)}</p>
      </div>
    ` : '';
  }
}

/**
 * Generate filing alert content based on user tier (text version)
 */
function generateFilingAlertTextContent(filing, user_tier, unsubscribeBaseUrl) {
  if (user_tier === 'free') {
    return `UPGRADE TO PRO FOR AI SUMMARY
${'-'.repeat(32)}
Free users see basic filing information. Upgrade to Pro for AI-powered summaries.
Upgrade: ${unsubscribeBaseUrl}/pricing
`;
  } else if (user_tier === 'trial') {
    const content = filing.ai_summary ? `AI Summary: ${filing.ai_summary}\n\n` : '';
    return content + `TRIAL ACTIVE - Continue with Pro: ${unsubscribeBaseUrl}/pricing
`;
  } else {
    // Pro users get full AI summaries
    return filing.ai_summary ? `AI Summary: ${filing.ai_summary}\n` : '';
  }
}

/**
 * Generate seed digest email - Welcome experience for new subscribers
 * @param {string} userEmail - Recipient email
 * @param {string} docketNumber - Docket number being monitored
 * @param {Array} filings - Array of filings (now supports single filing)
 * @param {Object} options - Email customization options
 */
export function generateSeedDigest(userEmail, docketNumber, filings, options = {}) {
  const {
    brandName = 'SimpleDCC',
    supportEmail = 'support@simpledcc.com',
    unsubscribeBaseUrl = 'https://simpledcc.pages.dev',
    user_tier = 'free'
  } = options;
  
  // Handle single filing or array (backward compatibility)
  const filingsArray = Array.isArray(filings) ? filings : [filings];
  
  if (!filingsArray.length || !filingsArray[0]) {
    throw new Error('No filing provided for seed digest');
  }
  
  return {
    subject: `🎉 Welcome to ${brandName}! Your ${docketNumber} monitoring starts now`,
    html: generateSeedDigestHTML(userEmail, docketNumber, filingsArray, { brandName, supportEmail, unsubscribeBaseUrl, user_tier }),
    text: generateSeedDigestText(userEmail, docketNumber, filingsArray, { brandName, supportEmail, unsubscribeBaseUrl, user_tier })
  };
}

/**
 * Generate HTML template for seed digest (welcome experience)
 */
function generateSeedDigestHTML(userEmail, docketNumber, filings, options) {
  const { brandName, supportEmail, unsubscribeBaseUrl, user_tier } = options;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${brandName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #0f172a;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .welcome-header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 40px 24px;
      text-align: center;
    }
    .welcome-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .welcome-title {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .welcome-subtitle {
      margin: 8px 0 0 0;
      font-size: 18px;
      opacity: 0.9;
    }
    .email-content {
      padding: 32px 24px;
    }
    .welcome-message {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
      text-align: center;
    }
    .seed-intro {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 32px;
    }
    .seed-intro h3 {
      margin: 0 0 12px 0;
      color: #92400e;
      font-size: 18px;
    }
    .filing-card {
      background-color: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .filing-header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .filing-title {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 8px 0;
    }
    .filing-meta {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
    .ai-summary {
      background-color: #f0f9ff;
      border: 1px solid #0ea5e9;
      border-radius: 6px;
      padding: 16px;
      margin-top: 16px;
    }
    .ai-summary h4 {
      margin: 0 0 8px 0;
      color: #0c4a6e;
      font-size: 14px;
      font-weight: 600;
    }
    .ai-summary p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
    }
    .next-steps {
      background-color: #eff6ff;
      border: 1px solid #3b82f6;
      border-radius: 8px;
      padding: 24px;
      margin: 32px 0;
      text-align: center;
    }
    .cta-button {
      display: inline-block;
      background-color: #10b981;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      margin: 8px;
    }
    .footer {
      text-align: center;
      padding: 24px;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="welcome-header">
      <div class="welcome-icon">🎉</div>
      <h1 class="welcome-title">Welcome to ${brandName}!</h1>
      <p class="welcome-subtitle">Your monitoring for docket ${docketNumber} is now active</p>
    </div>
    
    <div class="email-content">
      <div class="welcome-message">
        <h2 style="margin: 0 0 12px 0; color: #065f46;">You're all set!</h2>
        <p style="margin: 0; color: #374151;">We'll monitor docket ${docketNumber} and send you AI-powered summaries when new filings are submitted. Here's the most recent filing to get you started:</p>
      </div>
      
      <div class="seed-intro">
        <h3>🚀 Getting You Up to Speed</h3>
        <p style="margin: 0; color: #92400e;">This is the latest filing from docket ${docketNumber}. It includes our AI-powered summary to help you quickly understand the key points and regulatory implications.</p>
      </div>
      
      ${filings.map((filing, index) => `
        <div class="filing-card">
          <div class="filing-header">
            <h3 class="filing-title">${escapeHtml(filing.title)}</h3>
            <p class="filing-meta">
              👤 ${escapeHtml(filing.author)} • 
              📝 ${escapeHtml(filing.filing_type)} • 
              📅 ${formatDate(filing.date_received)}
            </p>
          </div>
          
          ${filing.ai_summary ? `
            <div class="ai-summary">
              <h4>🤖 AI Summary</h4>
              <p>${escapeHtml(filing.ai_summary)}</p>
            </div>
          ` : `
            <div style="color: #6b7280; font-style: italic;">
              <p>AI summary will be available when new filings are processed.</p>
            </div>
          `}
        </div>
      `).join('')}
      
      <div class="next-steps">
        <h3 style="margin: 0 0 16px 0; color: #1e40af;">What happens next?</h3>
        <p style="margin: 0 0 20px 0; color: #374151;">Going forward, we'll send you updates only when <strong>new</strong> filings are submitted to docket ${docketNumber}. You'll never miss important regulatory developments!</p>
        <a href="${unsubscribeBaseUrl}/manage" class="cta-button">Manage Subscriptions</a>
        <a href="https://publicapi.fcc.gov/ecfs/dockets/${docketNumber}" class="cta-button" target="_blank">View Docket</a>
      </div>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you subscribed to monitoring for docket ${docketNumber}.</p>
      <p><a href="${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&docket=${docketNumber}" style="color: #6b7280;">Unsubscribe from this docket</a> | <a href="${unsubscribeBaseUrl}/manage" style="color: #6b7280;">Manage all subscriptions</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate text template for seed digest
 */
function generateSeedDigestText(userEmail, docketNumber, filings, options) {
  const { brandName, supportEmail, unsubscribeBaseUrl, user_tier } = options;
  const filing = filings[0]; // Use first filing (single filing approach)
  
  return `🎉 WELCOME TO ${brandName.toUpperCase()}!

Your monitoring for docket ${docketNumber} is now active!

${'-'.repeat(50)}

You're all set! We'll monitor docket ${docketNumber} and send you AI-powered summaries when new filings are submitted. Here's the most recent filing to get you started:

GETTING YOU UP TO SPEED
${'-'.repeat(25)}
This is the latest filing from docket ${docketNumber}. It includes our AI-powered summary to help you quickly understand the key points and regulatory implications.

LATEST FILING
${'-'.repeat(13)}
Title: ${filing.title}
Author: ${filing.author}
Type: ${filing.filing_type}
Date: ${formatDate(filing.date_received)}

${filing.ai_summary ? `AI Summary: ${filing.ai_summary}` : 'AI summary will be available when new filings are processed.'}

WHAT HAPPENS NEXT?
${'-'.repeat(18)}
Going forward, we'll send you updates only when NEW filings are submitted to docket ${docketNumber}. You'll never miss important regulatory developments!

Manage subscriptions: ${unsubscribeBaseUrl}/manage
View docket: https://publicapi.fcc.gov/ecfs/dockets/${docketNumber}

${'-'.repeat(50)}

You're receiving this because you subscribed to monitoring for docket ${docketNumber}.

Unsubscribe from this docket: ${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&docket=${docketNumber}
Manage all subscriptions: ${unsubscribeBaseUrl}/manage`;
}

// Helper functions
function groupFilingsByDocket(filings) {
  return filings.reduce((acc, filing) => {
    if (!acc[filing.docket_number]) {
      acc[filing.docket_number] = [];
    }
    acc[filing.docket_number].push(filing);
    return acc;
  }, {});
}

function escapeHtml(text) {
  if (!text) return '';
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  } else {
    // Server-side fallback
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
} 