// DocketCC Email Templates - Redesigned with Dark/Light Mode Support
import { formatDate, formatTimeAgo } from '$lib/utils/date-formatters.js';

/**
 * Generate filing alert email with dual-mode support (dark/light)
 */
export function generateFilingAlert(userEmail, filing, options = {}) {
  const {
    brandName = 'DocketCC',
    unsubscribeBaseUrl = 'https://simpledcc.pages.dev',
    user_tier = 'free',
    theme = 'dark' // 'dark' or 'light'
  } = options;
  
  return {
    subject: `🚨 New Filing Alert: ${filing.docket_number} - ${filing.title.substring(0, 60)}${filing.title.length > 60 ? '...' : ''}`,
    html: theme === 'dark' 
      ? generateDarkFilingAlertHTML(userEmail, filing, { brandName, unsubscribeBaseUrl, user_tier })
      : generateLightFilingAlertHTML(userEmail, filing, { brandName, unsubscribeBaseUrl, user_tier }),
    text: generateFilingAlertText(userEmail, filing, { brandName, unsubscribeBaseUrl, user_tier })
  };
}

/**
 * Generate dark mode filing alert HTML
 */
function generateDarkFilingAlertHTML(userEmail, filing, options) {
  const { brandName, unsubscribeBaseUrl, user_tier } = options;
  const tierBadge = getTierBadge(user_tier);
  const pageCount = estimatePageCount(filing);
  const timeAgo = formatTimeAgo(new Date(filing.date_received).getTime());
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Filing Alert - ${brandName}</title>
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      line-height: 1.6; 
      color: #f8fafc; 
      margin: 0; 
      padding: 0; 
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      min-height: 100vh;
    }
    
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 16px;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      min-height: 100vh;
    }
    
    .email-card {
      background: #0f172a;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border: 1px solid #1e293b;
    }
    
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
    
    .content {
      padding: 20px;
    }
    
    .filing-summary {
      margin-bottom: 20px;
    }
    
    .docket-line {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .docket-badge {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
    }
    
    .timing {
      color: #94a3b8;
      font-size: 12px;
    }
    
    .filing-title {
      font-size: 18px;
      font-weight: 600;
      color: #f8fafc;
      line-height: 1.3;
      margin-bottom: 8px;
    }
    
    .filing-meta {
      color: #94a3b8;
      font-size: 13px;
    }
    
    .filing-meta strong {
      color: #e2e8f0;
    }
    
    .actions {
      text-align: center;
      margin: 24px 0;
    }
    
    .btn-primary {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }
    
    .footer {
      background: #1e293b;
      padding: 16px 20px;
      text-align: center;
      border-top: 1px solid #334155;
    }
    
    .footer a {
      color: #94a3b8;
      text-decoration: none;
      font-size: 12px;
      margin: 0 8px;
      transition: color 0.2s;
    }
    
    .footer a:hover {
      color: #10b981;
    }
    
    @media only screen and (max-width: 600px) {
      .email-container { 
        padding: 8px; 
      }
      .header { 
        padding: 16px; 
      }
      .content { 
        padding: 16px; 
      }
      .header-bottom {
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }
      .dashboard-link {
        align-self: center;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <div class="header">
        <div class="header-top">
          <div class="logo">
            <div class="logo-icon">📡</div>
            <div class="logo-text">Docket<span class="logo-cc">CC</span></div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="tier-badge">${tierBadge}</div>
            <a href="${unsubscribeBaseUrl}/manage" class="dashboard-link">Dashboard</a>
          </div>
        </div>
        <div class="header-bottom">
          <h1 class="header-title">🚨 New Filing Alert</h1>
        </div>
      </div>
      
      <div class="content">
        <div class="filing-summary">
          <div class="docket-line">
            <div class="docket-badge">${filing.docket_number}</div>
            <div class="timing">Filed ${timeAgo}</div>
          </div>
          
          <h2 class="filing-title">${escapeHtml(filing.title)}</h2>
          <div class="filing-meta">
            <strong>${escapeHtml(filing.author)}</strong> • ${escapeHtml(filing.filing_type)} • ${pageCount} pages
          </div>
        </div>
        
        ${generateAIContent(filing, user_tier, unsubscribeBaseUrl, 'dark')}
        
        <div class="actions">
          <a href="${filing.filing_url}" class="btn-primary" target="_blank">
            View Filing
          </a>
        </div>
        
        ${generateTierCTA(user_tier, unsubscribeBaseUrl, 'dark')}
      </div>
      
      <div class="footer">
        <a href="${unsubscribeBaseUrl}/manage">Manage</a> • 
        <a href="${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&docket=${filing.docket_number}">Unsubscribe</a> • 
        <a href="mailto:support@simpledcc.com">Support</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate light mode filing alert HTML
 */
function generateLightFilingAlertHTML(userEmail, filing, options) {
  const { brandName, unsubscribeBaseUrl, user_tier } = options;
  const tierBadge = getTierBadge(user_tier);
  const pageCount = estimatePageCount(filing);
  const timeAgo = formatTimeAgo(new Date(filing.date_received).getTime());
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Filing Alert - ${brandName}</title>
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      line-height: 1.6; 
      color: #0f172a; 
      margin: 0; 
      padding: 0; 
      background-color: #f8fafc;
      min-height: 100vh;
    }
    
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 16px;
      background-color: #f8fafc;
      min-height: 100vh;
    }
    
    .email-card {
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }
    
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
    
    .content {
      padding: 20px;
    }
    
    .filing-summary {
      margin-bottom: 20px;
    }
    
    .docket-line {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .docket-badge {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
    }
    
    .timing {
      color: #6b7280;
      font-size: 12px;
    }
    
    .filing-title {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      line-height: 1.3;
      margin-bottom: 8px;
    }
    
    .filing-meta {
      color: #6b7280;
      font-size: 13px;
    }
    
    .filing-meta strong {
      color: #374151;
    }
    
    .actions {
      text-align: center;
      margin: 24px 0;
    }
    
    .btn-primary {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }
    
    .footer {
      background: #f8fafc;
      padding: 16px 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer a {
      color: #6b7280;
      text-decoration: none;
      font-size: 12px;
      margin: 0 8px;
      transition: color 0.2s;
    }
    
    .footer a:hover {
      color: #10b981;
    }
    
    @media only screen and (max-width: 600px) {
      .email-container { 
        padding: 8px; 
      }
      .header { 
        padding: 16px; 
      }
      .content { 
        padding: 16px; 
      }
      .header-bottom {
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }
      .dashboard-link {
        align-self: center;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <div class="header">
        <div class="header-top">
          <div class="logo">
            <div class="logo-icon">📡</div>
            <div class="logo-text">Docket<span class="logo-cc">CC</span></div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="tier-badge">${tierBadge}</div>
            <a href="${unsubscribeBaseUrl}/manage" class="dashboard-link">Dashboard</a>
          </div>
        </div>
        <div class="header-bottom">
          <h1 class="header-title">🚨 New Filing Alert</h1>
        </div>
      </div>
      
      <div class="content">
        <div class="filing-summary">
          <div class="docket-line">
            <div class="docket-badge">${filing.docket_number}</div>
            <div class="timing">Filed ${timeAgo}</div>
          </div>
          
          <h2 class="filing-title">${escapeHtml(filing.title)}</h2>
          <div class="filing-meta">
            <strong>${escapeHtml(filing.author)}</strong> • ${escapeHtml(filing.filing_type)} • ${pageCount} pages
          </div>
        </div>
        
        ${generateAIContent(filing, user_tier, unsubscribeBaseUrl, 'light')}
        
        <div class="actions">
          <a href="${filing.filing_url}" class="btn-primary" target="_blank">
            View Filing
          </a>
        </div>
        
        ${generateTierCTA(user_tier, unsubscribeBaseUrl, 'light')}
      </div>
      
      <div class="footer">
        <a href="${unsubscribeBaseUrl}/manage">Manage</a> • 
        <a href="${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&docket=${filing.docket_number}">Unsubscribe</a> • 
        <a href="mailto:support@simpledcc.com">Support</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate AI content based on user tier and theme
 */
function generateAIContent(filing, user_tier, unsubscribeBaseUrl, theme) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#e2e8f0' : '#374151';
  const bgColor = isDark ? 'rgba(16, 185, 129, 0.05)' : '#f0fdf4';
  const borderColor = isDark ? 'rgba(16, 185, 129, 0.2)' : '#bbf7d0';
  const mutedColor = isDark ? '#94a3b8' : '#6b7280';
  
  if (user_tier === 'free') {
    // Free tier - partial AI reveal
    const truncatedContent = truncateAISummary(filing.ai_summary, user_tier);
    
    return `
      <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 6px; padding: 14px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
          <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">AI</div>
          <div style="font-size: 13px; font-weight: 600; color: ${textColor};">Key Insights Preview</div>
          <div style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; margin-left: auto;">🔒 LOCKED</div>
        </div>
        <div style="position: relative; overflow: hidden;">
          <p style="color: ${textColor}; font-size: 14px; line-height: 1.4; margin-bottom: 8px;">
            ${truncatedContent.visible} <span style="color: ${mutedColor}; font-style: italic;">••• upgrade to unlock full summary</span>
          </p>
          <p style="color: ${mutedColor}; font-size: 14px; line-height: 1.4; filter: blur(3px); user-select: none; position: relative;">
            ${truncatedContent.hidden}
          </p>
          <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 40px; background: linear-gradient(transparent, ${isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(248, 250, 252, 0.9)'}); pointer-events: none;"></div>
        </div>
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 6px; padding: 12px; text-align: center; margin-top: 12px;">
          <p style="color: white; font-size: 12px; margin-bottom: 8px; font-weight: 500;">💡 Unlock complete AI analysis and key business impacts</p>
          <a href="${unsubscribeBaseUrl}/pricing" style="color: white; text-decoration: none; font-size: 13px; font-weight: 600; background: rgba(255, 255, 255, 0.2); padding: 6px 12px; border-radius: 4px; display: inline-block; transition: all 0.2s;">
            Upgrade to Pro →
          </a>
        </div>
      </div>
    `;
  } else {
    // Trial/Pro tier - full AI content
    if (!filing.ai_summary) {
      return `
        <div style="background: ${bgColor}; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
          <p style="margin: 0; font-size: 14px; color: ${mutedColor}; font-style: italic;">
            📝 Full filing details available in original document
          </p>
        </div>
      `;
    }
    
    return `
      <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 6px; padding: 14px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">AI</div>
          <div style="font-size: 13px; font-weight: 600; color: ${textColor};">Key Insights</div>
        </div>
        <p style="color: ${textColor}; font-size: 14px; line-height: 1.4; margin: 0;">${escapeHtml(filing.ai_summary)}</p>
        
        ${filing.ai_key_points ? `
          <div style="margin-top: 12px;">
            <h4 style="font-size: 12px; font-weight: 600; color: ${textColor}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.025em;">The Gist</h4>
            <div style="font-size: 13px; color: ${textColor}; line-height: 1.4; font-style: italic;">
              ${escapeHtml(extractKeyArguments(filing.ai_key_points))}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

/**
 * Generate tier-specific call-to-action
 */
function generateTierCTA(user_tier, unsubscribeBaseUrl, theme) {
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1e293b' : '#f8fafc';
  const textColor = isDark ? '#e2e8f0' : '#374151';
  const borderColor = isDark ? '#334155' : '#e5e7eb';
  
  if (user_tier === 'trial') {
    return `
      <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
        <h3 style="margin: 0 0 8px 0; color: ${textColor}; font-size: 16px;">Continue Your Trial Benefits</h3>
        <p style="margin: 0 0 16px 0; color: ${textColor}; font-size: 14px;">Don't lose access to AI analysis and instant alerts</p>
        <a href="${unsubscribeBaseUrl}/pricing" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px;">
          Upgrade to Pro
        </a>
      </div>
    `;
  }
  
  return ''; // No CTA for free or pro users
}

/**
 * Generate plain text version
 */
function generateFilingAlertText(userEmail, filing, options) {
  const { brandName, unsubscribeBaseUrl, user_tier } = options;
  const pageCount = estimatePageCount(filing);
  const timeAgo = formatTimeAgo(new Date(filing.date_received).getTime());
  
  let text = `🚨 NEW FILING ALERT - ${brandName}\n\n`;
  text += `Docket: ${filing.docket_number}\n`;
  text += `Title: ${filing.title}\n`;
  text += `Author: ${filing.author}\n`;
  text += `Type: ${filing.filing_type}\n`;
  text += `Date: ${formatDate(filing.date_received)} (${timeAgo})\n`;
  text += `Pages: ${pageCount}\n\n`;
  
  if (user_tier === 'free') {
    const truncatedContent = truncateAISummary(filing.ai_summary, user_tier);
    text += `AI SUMMARY PREVIEW\n`;
    text += `${'-'.repeat(20)}\n`;
    text += `${truncatedContent.visible} [UPGRADE TO PRO FOR FULL SUMMARY]\n\n`;
    text += `Upgrade to Pro for complete AI analysis: ${unsubscribeBaseUrl}/pricing\n\n`;
  } else if (filing.ai_summary) {
    text += `AI SUMMARY\n`;
    text += `${'-'.repeat(12)}\n`;
    text += `${filing.ai_summary}\n\n`;
    
    if (filing.ai_key_points) {
      text += `KEY POINTS\n`;
      text += `${'-'.repeat(11)}\n`;
      text += `${extractKeyArguments(filing.ai_key_points)}\n\n`;
    }
  }
  
  text += `View full filing: ${filing.filing_url}\n\n`;
  text += `Manage subscriptions: ${unsubscribeBaseUrl}/manage\n`;
  text += `Unsubscribe: ${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&docket=${filing.docket_number}\n`;
  
  return text;
}

/**
 * Helper functions
 */
function getTierBadge(user_tier) {
  const badges = {
    'free': 'Free Tier',
    'trial': 'Trial Active', 
    'pro': 'Pro User'
  };
  return badges[user_tier] || 'Free Tier';
}

function estimatePageCount(filing) {
  // Estimate pages based on content length
  const contentLength = filing.ai_summary?.length || 0;
  if (contentLength < 1000) return '1 page';
  if (contentLength < 3000) return '2-3 pages';
  if (contentLength < 5000) return '4-5 pages';
  return '6+ pages';
}

function truncateAISummary(summary, user_tier) {
  if (user_tier !== 'free' || !summary) {
    return { visible: summary || '', hidden: '' };
  }
  
  // For free tier, show a very limited preview before blurring
  const freeTierVisibleLength = 70; // Adjust this value as needed
  const visible = summary.substring(0, freeTierVisibleLength);
  const hidden = summary.substring(freeTierVisibleLength);

  return {
    visible: visible.trim(),
    hidden: hidden.trim()
  };
}

function extractKeyArguments(aiKeyPoints) {
  if (!aiKeyPoints) return '';
  
  // Handle array format
  if (Array.isArray(aiKeyPoints)) {
    return aiKeyPoints.join(', ');
  }
  
  // Handle string format
  if (typeof aiKeyPoints === 'string') {
    return aiKeyPoints;
  }
  
  return '';
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate daily digest email with dual-mode support (dark/light)
 */
export function generateDailyDigest(userEmail, filings, options = {}) {
  const {
    brandName = 'DocketCC',
    supportEmail = 'support@simpledcc.com',
    unsubscribeBaseUrl = 'https://simpledcc.pages.dev',
    user_tier = 'free',
    theme = 'dark',
    digest_type = 'daily'
  } = options;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const filingsByDocket = groupFilingsByDocket(filings);
  const totalFilings = filings.length;
  const uniqueDockets = Object.keys(filingsByDocket).length;

  const subject = `${brandName}: ${totalFilings} new filing${totalFilings !== 1 ? 's' : ''} across ${uniqueDockets} docket${uniqueDockets !== 1 ? 's' : ''} - ${today}`;

  return {
    subject,
    html: theme === 'dark' 
      ? generateDarkDailyDigestHTML(userEmail, filingsByDocket, { brandName, supportEmail, unsubscribeBaseUrl, today, user_tier, digest_type, totalFilings, uniqueDockets })
      : generateLightDailyDigestHTML(userEmail, filingsByDocket, { brandName, supportEmail, unsubscribeBaseUrl, today, user_tier, digest_type, totalFilings, uniqueDockets }),
    text: generateDailyDigestText(userEmail, filingsByDocket, { brandName, supportEmail, unsubscribeBaseUrl, today, user_tier, digest_type, totalFilings, uniqueDockets })
  };
}

/**
 * Generate dark mode daily digest HTML
 */
function generateDarkDailyDigestHTML(userEmail, filingsByDocket, options) {
  const { brandName, supportEmail, unsubscribeBaseUrl, today, user_tier, totalFilings, uniqueDockets } = options;

  let docketSectionsHtml = '';
  for (const docketNumber in filingsByDocket) {
    const filingsInDocket = filingsByDocket[docketNumber];
    let filingCardsHtml = '';
    for (const filing of filingsInDocket) {
      const pageCount = estimatePageCount(filing);
      const timeAgo = formatTimeAgo(new Date(filing.date_received).getTime());
      filingCardsHtml += `
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="font-size: 16px; font-weight: 600; color: #e2e8f0; margin: 0 0 8px 0;">${escapeHtml(filing.title)}</h3>
          <p style="font-size: 13px; color: #94a3b8; margin-bottom: 12px;">
            <strong>${escapeHtml(filing.author)}</strong> • ${escapeHtml(filing.filing_type)} • ${pageCount} • Filed ${timeAgo}
          </p>
          ${generateAIContent(filing, user_tier, unsubscribeBaseUrl, 'dark')}
          <div style="text-align: right; margin-top: 16px;">
            <a href="${filing.filing_url}" style="display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; transition: all 0.2s;">
              View Filing →
            </a>
          </div>
        </div>
      `;
    }
    docketSectionsHtml += `
      <div style="margin-bottom: 40px; border-bottom: 1px solid #334155; padding-bottom: 32px;">
        <div style="background: #0f172a; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="font-size: 18px; font-weight: 700; color: #f8fafc; margin: 0 0 4px 0;">Docket: ${docketNumber}</h2>
          <p style="font-size: 14px; color: #94a3b8; margin: 0;">${filingsInDocket.length} new filing${filingsInDocket.length !== 1 ? 's' : ''}</p>
        </div>
        ${filingCardsHtml}
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} Daily Digest - ${today}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; line-height: 1.6; color: #f8fafc; margin: 0; padding: 0; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); min-height: 100vh; }
    .email-container { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); border: 1px solid #1e293b; }
    .email-header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 32px 24px; text-align: center; position: relative; }
    .email-header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%); }
    .email-header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em; }
    .email-header .subtitle { margin: 8px 0 0 0; font-size: 16px; opacity: 0.9; font-weight: 400; }
    .email-content { padding: 32px 24px; }
    .summary-box { background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 20px; margin-bottom: 32px; }
    .summary-box h2 { margin: 0 0 12px 0; font-size: 18px; color: #059669; font-weight: 600; }
    .summary-stats { display: flex; gap: 24px; margin-bottom: 16px; }
    .stat-item { text-align: center; flex: 1; }
    .stat-number { display: block; font-size: 24px; font-weight: 700; color: #10b981; line-height: 1; }
    .stat-label { font-size: 14px; color: #94a3b8; margin-top: 4px; }
    .docket-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .docket-header { background: #0f172a; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
    .docket-number { font-size: 18px; font-weight: 700; color: #f8fafc; margin: 0 0 4px 0; }
    .docket-meta { font-size: 14px; color: #94a3b8; margin: 0; }
    .filing-card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin-bottom: 16px; transition: all 0.2s ease; }
    .filing-card:last-child { margin-bottom: 0; }
    .filing-title { font-size: 16px; font-weight: 600; color: #e2e8f0; margin: 0 0 8px 0; line-height: 1.4; }
    .filing-meta { display: flex; gap: 16px; font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
    .filing-meta span { display: flex; align-items: center; gap: 4px; }
    .btn-view-filing { display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; transition: all 0.2s; }
    .btn-view-filing:hover { background: #0284c7; }
    .footer { background: #1e293b; padding: 16px 24px; text-align: center; border-top: 1px solid #334155; }
    .footer a { color: #94a3b8; text-decoration: none; font-size: 12px; margin: 0 8px; transition: color 0.2s; }
    .footer a:hover { color: #10b981; }
    @media only screen and (max-width: 600px) { .email-container { border-radius: 0; } .email-header { padding: 24px 16px; } .email-content { padding: 24px 16px; } .summary-stats { flex-direction: column; gap: 16px; } .stat-item { text-align: left; } }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>📡 ${brandName} Daily Digest</h1>
      <p class="subtitle">${totalFilings} new filing${totalFilings !== 1 ? 's' : ''} across ${uniqueDockets} docket${uniqueDockets !== 1 ? 's' : ''}</p>
      <p class="subtitle">${today}</p>
    </div>
    
    <div class="email-content">
      ${generateTierSpecificBanner(user_tier, unsubscribeBaseUrl, 'dark')}

      <div class="summary-box">
        <h2>Daily Overview</h2>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-number">${totalFilings}</span>
            <span class="stat-label">New Filings</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${uniqueDockets}</span>
            <span class="stat-label">Unique Dockets</span>
          </div>
        </div>
        <p style="font-size: 14px; color: #e2e8f0; margin-bottom: 16px;">
          Here's a summary of the latest activity from your monitored dockets.
        </p>
        <a href="${unsubscribeBaseUrl}/manage" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px;">
          View Dashboard
        </a>
      </div>
      
      ${docketSectionsHtml}
    </div>
    
    <div class="footer">
      <p style="margin-bottom: 8px; color: #cbd5e1; font-size: 13px;">Manage your subscriptions and preferences:</p>
      <a href="${unsubscribeBaseUrl}/manage">Manage Subscriptions</a> • 
      <a href="${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}">Unsubscribe All</a> • 
      <a href="mailto:${supportEmail}">Support</a>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate light mode daily digest HTML
 */
function generateLightDailyDigestHTML(userEmail, filingsByDocket, options) {
  const { brandName, supportEmail, unsubscribeBaseUrl, today, user_tier, totalFilings, uniqueDockets } = options;

  let docketSectionsHtml = '';
  for (const docketNumber in filingsByDocket) {
    const filingsInDocket = filingsByDocket[docketNumber];
    let filingCardsHtml = '';
    for (const filing of filingsInDocket) {
      const pageCount = estimatePageCount(filing);
      const timeAgo = formatTimeAgo(new Date(filing.date_received).getTime());
      filingCardsHtml += `
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;">${escapeHtml(filing.title)}</h3>
          <p style="font-size: 13px; color: #6b7280; margin-bottom: 12px;">
            <strong>${escapeHtml(filing.author)}</strong> • ${escapeHtml(filing.filing_type)} • ${pageCount} • Filed ${timeAgo}
          </p>
          ${generateAIContent(filing, user_tier, unsubscribeBaseUrl, 'light')}
          <div style="text-align: right; margin-top: 16px;">
            <a href="${filing.filing_url}" style="display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; transition: all 0.2s;">
              View Filing →
            </a>
          </div>
        </div>
      `;
    }
    docketSectionsHtml += `
      <div style="margin-bottom: 40px; border-bottom: 1px solid #e5e7eb; padding-bottom: 32px;">
        <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">Docket: ${docketNumber}</h2>
          <p style="font-size: 14px; color: #6b7280; margin: 0;">${filingsInDocket.length} new filing${filingsInDocket.length !== 1 ? 's' : ''}</p>
        </div>
        ${filingCardsHtml}
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} Daily Digest - ${today}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; line-height: 1.6; color: #0f172a; margin: 0; padding: 0; background-color: #f8fafc; min-height: 100vh; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
    .email-header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 32px 24px; text-align: center; position: relative; }
    .email-header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%); }
    .email-header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em; }
    .email-header .subtitle { margin: 8px 0 0 0; font-size: 16px; opacity: 0.9; font-weight: 400; }
    .email-content { padding: 32px 24px; }
    .summary-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 32px; }
    .summary-box h2 { margin: 0 0 12px 0; font-size: 18px; color: #065f46; font-weight: 600; }
    .summary-stats { display: flex; gap: 24px; margin-bottom: 16px; }
    .stat-item { text-align: center; flex: 1; }
    .stat-number { display: block; font-size: 24px; font-weight: 700; color: #059669; line-height: 1; }
    .stat-label { font-size: 14px; color: #374151; margin-top: 4px; }
    .docket-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .docket-header { background-color: #f8fafc; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
    .docket-number { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
    .docket-meta { font-size: 14px; color: #6b7280; margin: 0; }
    .filing-card { background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px; transition: all 0.2s ease; }
    .filing-card:last-child { margin-bottom: 0; }
    .filing-title { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0; line-height: 1.4; }
    .filing-meta { display: flex; gap: 16px; font-size: 13px; color: #6b7280; margin-bottom: 16px; }
    .filing-meta span { display: flex; align-items: center; gap: 4px; }
    .btn-view-filing { display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; transition: all 0.2s; }
    .btn-view-filing:hover { background: #0284c7; }
    .footer { background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer a { color: #6b7280; text-decoration: none; font-size: 12px; margin: 0 8px; transition: color 0.2s; }
    .footer a:hover { color: #10b981; }
    @media only screen and (max-width: 600px) { .email-container { border-radius: 0; } .email-header { padding: 24px 16px; } .email-content { padding: 24px 16px; } .summary-stats { flex-direction: column; gap: 16px; } .stat-item { text-align: left; } }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>📡 ${brandName} Daily Digest</h1>
      <p class="subtitle">${totalFilings} new filing${totalFilings !== 1 ? 's' : ''} across ${uniqueDockets} docket${uniqueDockets !== 1 ? 's' : ''}</p>
      <p class="subtitle">${today}</p>
    </div>
    
    <div class="email-content">
      ${generateTierSpecificBanner(user_tier, unsubscribeBaseUrl, 'light')}

      <div class="summary-box">
        <h2>Daily Overview</h2>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-number">${totalFilings}</span>
            <span class="stat-label">New Filings</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${uniqueDockets}</span>
            <span class="stat-label">Unique Dockets</span>
          </div>
        </div>
        <p style="font-size: 14px; color: #374151; margin-bottom: 16px;">
          Here's a summary of the latest activity from your monitored dockets.
        </p>
        <a href="${unsubscribeBaseUrl}/manage" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px;">
          View Dashboard
        </a>
      </div>
      
      ${docketSectionsHtml}
    </div>
    
    <div class="footer">
      <p style="margin-bottom: 8px; color: #6b7280; font-size: 13px;">Manage your subscriptions and preferences:</p>
      <a href="${unsubscribeBaseUrl}/manage">Manage Subscriptions</a> • 
      <a href="${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}">Unsubscribe All</a> • 
      <a href="mailto:${supportEmail}">Support</a>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate daily digest plain text version
 */
function generateDailyDigestText(userEmail, filingsByDocket, options) {
  const { brandName, supportEmail, unsubscribeBaseUrl, today, user_tier, totalFilings, uniqueDockets } = options;
  
  let text = `📡 ${brandName} Daily Digest - ${today}\n\n`;
  text += `Summary: ${totalFilings} new filing${totalFilings !== 1 ? 's' : ''} across ${uniqueDockets} unique docket${uniqueDockets !== 1 ? 's' : ''}.\n\n`;
  
  // Tier-specific banner for text version
  text += generateTierSpecificBannerText(user_tier, unsubscribeBaseUrl) + '\n';

  for (const docketNumber in filingsByDocket) {
    const filingsInDocket = filingsByDocket[docketNumber];
    text += `--- Docket: ${docketNumber} (${filingsInDocket.length} new filing${filingsInDocket.length !== 1 ? 's' : ''}) ---\n\n`;
    for (const filing of filingsInDocket) {
      const pageCount = estimatePageCount(filing);
      const timeAgo = formatTimeAgo(new Date(filing.date_received).getTime());
      text += `Title: ${filing.title}\n`;
      text += `Author: ${filing.author}\n`;
      text += `Type: ${filing.filing_type}\n`;
      text += `Pages: ${pageCount}\n`;
      text += `Filed: ${formatDate(filing.date_received)} (${timeAgo})\n`;
      
      // AI Summary (tier-based)
      if (user_tier === 'free') {
        const truncatedContent = truncateAISummary(filing.ai_summary, user_tier);
        if (truncatedContent.visible) {
          text += `AI Summary Preview: ${truncatedContent.visible}... [Upgrade to unlock full summary]\n`;
        }
      } else if (filing.ai_summary) {
        text += `AI Summary: ${filing.ai_summary}\n`;
        if (filing.ai_key_points) {
          text += `Key Points: ${extractKeyArguments(filing.ai_key_points)}\n`;
        }
      }
      text += `View Filing: ${filing.filing_url}\n\n`;
    }
  }
  
  text += `\n----------------------------------------\n`;
  text += `Manage your subscriptions and preferences:\n`;
  text += `Manage: ${unsubscribeBaseUrl}/manage\n`;
  text += `Unsubscribe All: ${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}\n`;
  text += `Support: ${supportEmail}\n`;

  return text;
}

/**
 * Helper function to group filings by docket number
 */
function groupFilingsByDocket(filings) {
  return filings.reduce((acc, filing) => {
    const docketNumber = filing.docket_number || 'Unknown Docket';
    if (!acc[docketNumber]) {
      acc[docketNumber] = [];
    }
    acc[docketNumber].push(filing);
    return acc;
  }, {});
}

/**
 * Generate tier-specific banner for plain text version (adapted for daily digest)
 */
function generateTierSpecificBannerText(user_tier, unsubscribeBaseUrl) {
  if (user_tier === 'trial') {
    return `
----------------------------------------
Trial Active: You're enjoying full AI summaries. Continue with Pro: ${unsubscribeBaseUrl}/pricing
----------------------------------------
    `;
  } else if (user_tier === 'free') {
    return `
----------------------------------------
Upgrade to Pro for full AI summaries and advanced features: ${unsubscribeBaseUrl}/pricing
----------------------------------------
    `;
  }
  return '';
} 

/**
 * Generate seed digest email (welcome email with initial filing) with dual-mode support
 */
export function generateSeedDigest(userEmail, filing, options = {}) {
  const {
    brandName = 'DocketCC',
    supportEmail = 'support@simpledcc.com',
    unsubscribeBaseUrl = 'https://simpledcc.pages.dev',
    user_tier = 'free',
    theme = 'dark'
  } = options;

  if (!filing || !filing.docket_number) {
    throw new Error('Filing and docket number must be provided for seed digest');
  }

  const subject = `🎉 Welcome to ${brandName}! Your monitoring for docket ${filing.docket_number} starts now`;

  return {
    subject,
    html: theme === 'dark' 
      ? generateDarkSeedDigestHTML(userEmail, filing, { brandName, supportEmail, unsubscribeBaseUrl, user_tier })
      : generateLightSeedDigestHTML(userEmail, filing, { brandName, supportEmail, unsubscribeBaseUrl, user_tier }),
    text: generateSeedDigestText(userEmail, filing, { brandName, supportEmail, unsubscribeBaseUrl, user_tier })
  };
}

/**
 * Generate dark mode seed digest HTML
 */
function generateDarkSeedDigestHTML(userEmail, filing, options) {
  const { brandName, supportEmail, unsubscribeBaseUrl, user_tier } = options;
  const pageCount = estimatePageCount(filing);
  const timeAgo = formatTimeAgo(new Date(filing.date_received).getTime());

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${brandName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; line-height: 1.6; color: #f8fafc; margin: 0; padding: 0; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); min-height: 100vh; }
    .email-container { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); border: 1px solid #1e293b; }
    .welcome-header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 24px; text-align: center; position: relative; }
    .welcome-icon { font-size: 48px; margin-bottom: 16px; }
    .welcome-title { margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.025em; }
    .welcome-subtitle { margin: 8px 0 0 0; font-size: 18px; opacity: 0.9; }
    .email-content { padding: 32px 24px; }
    .welcome-message { background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 24px; margin-bottom: 32px; text-align: center; color: #e2e8f0; }
    .welcome-message h2 { margin: 0 0 12px 0; color: #059669; }
    .seed-intro { background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 20px; margin-bottom: 32px; color: #e2e8f0; }
    .seed-intro h3 { margin: 0 0 12px 0; color: #fbbf24; }
    .filing-card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .filing-header { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #334155; }
    .filing-title { font-size: 16px; font-weight: 600; color: #e2e8f0; margin: 0 0 8px 0; }
    .filing-meta { font-size: 14px; color: #94a3b8; margin: 0; }
    .next-steps { background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; padding: 24px; margin: 32px 0; text-align: center; color: #e2e8f0; }
    .next-steps h3 { margin: 0 0 16px 0; color: #60a5fa; }
    .cta-button { display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 8px; transition: background-color 0.2s; }
    .cta-button:hover { background-color: #059669; }
    .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 14px; border-top: 1px solid #334155; }
    .footer a { color: #94a3b8; text-decoration: none; transition: color 0.2s; }
    .footer a:hover { color: #10b981; }
    @media only screen and (max-width: 600px) { .email-container { border-radius: 0; } .welcome-header { padding: 32px 16px; } .email-content { padding: 24px 16px; } }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="welcome-header">
      <div class="welcome-icon">🎉</div>
      <h1 class="welcome-title">Welcome to ${brandName}!</h1>
      <p class="welcome-subtitle">Your monitoring for docket ${escapeHtml(filing.docket_number)} is now active</p>
    </div>
    
    <div class="email-content">
      ${generateTierSpecificBanner(user_tier, unsubscribeBaseUrl, 'dark')}

      <div class="welcome-message">
        <h2>You're all set!</h2>
        <p>We'll monitor docket ${escapeHtml(filing.docket_number)} and send you AI-powered summaries when new filings are submitted. Here's the most recent filing to get you started:</p>
      </div>
      
      <div class="seed-intro">
        <h3>🚀 Getting You Up to Speed</h3>
        <p>This is the latest filing from docket ${escapeHtml(filing.docket_number)}. It includes our AI-powered summary to help you quickly understand the key points and regulatory implications.</p>
      </div>
      
      <div class="filing-card">
        <div class="filing-header">
          <h3 class="filing-title">${escapeHtml(filing.title)}</h3>
          <p class="filing-meta">
            👤 ${escapeHtml(filing.author)} • 
            📝 ${escapeHtml(filing.filing_type)} • 
            📅 ${formatDate(filing.date_received)} (${timeAgo}) •
            📄 ${pageCount}
          </p>
        </div>
        ${generateAIContent(filing, user_tier, unsubscribeBaseUrl, 'dark')}
        <div style="text-align: right; margin-top: 16px;">
          <a href="${filing.filing_url}" class="cta-button">View Filing →</a>
        </div>
      </div>
      
      <div class="next-steps">
        <h3>What happens next?</h3>
        <p>Going forward, we'll send you updates only when <strong>new</strong> filings are submitted to docket ${escapeHtml(filing.docket_number)}. You'll never miss important regulatory developments!</p>
        <a href="${unsubscribeBaseUrl}/manage" class="cta-button">Manage Subscriptions</a>
        <a href="https://publicapi.fcc.gov/ecfs/dockets/${escapeHtml(filing.docket_number)}" class="cta-button" target="_blank">View Docket</a>
      </div>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you subscribed to monitoring for docket ${escapeHtml(filing.docket_number)}.</p>
      <p>
        <a href="${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&docket=${escapeHtml(filing.docket_number)}">Unsubscribe from this docket</a> |
        <a href="${unsubscribeBaseUrl}/manage">Manage all subscriptions</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate light mode seed digest HTML
 */
function generateLightSeedDigestHTML(userEmail, filing, options) {
  const { brandName, supportEmail, unsubscribeBaseUrl, user_tier } = options;
  const pageCount = estimatePageCount(filing);
  const timeAgo = formatTimeAgo(new Date(filing.date_received).getTime());

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${brandName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; line-height: 1.6; color: #0f172a; margin: 0; padding: 0; background-color: #f8fafc; min-height: 100vh; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
    .welcome-header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 24px; text-align: center; position: relative; }
    .welcome-icon { font-size: 48px; margin-bottom: 16px; }
    .welcome-title { margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.025em; }
    .welcome-subtitle { margin: 8px 0 0 0; font-size: 18px; opacity: 0.9; }
    .email-content { padding: 32px 24px; }
    .welcome-message { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 24px; margin-bottom: 32px; text-align: center; color: #374151; }
    .welcome-message h2 { margin: 0 0 12px 0; color: #065f46; }
    .seed-intro { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 32px; color: #92400e; }
    .seed-intro h3 { margin: 0 0 12px 0; color: #92400e; }
    .filing-card { background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .filing-header { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
    .filing-title { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0; }
    .filing-meta { font-size: 14px; color: #6b7280; margin: 0; }
    .next-steps { background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 24px; margin: 32px 0; text-align: center; color: #374151; }
    .next-steps h3 { margin: 0 0 16px 0; color: #1e40af; }
    .cta-button { display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 8px; transition: background-color 0.2s; }
    .cta-button:hover { background-color: #059669; }
    .footer { text-align: center; padding: 24px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
    .footer a { color: #6b7280; text-decoration: none; transition: color 0.2s; }
    .footer a:hover { color: #10b981; }
    @media only screen and (max-width: 600px) { .email-container { border-radius: 0; } .welcome-header { padding: 32px 16px; } .email-content { padding: 24px 16px; } }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="welcome-header">
      <div class="welcome-icon">🎉</div>
      <h1 class="welcome-title">Welcome to ${brandName}!</h1>
      <p class="welcome-subtitle">Your monitoring for docket ${escapeHtml(filing.docket_number)} is now active</p>
    </div>
    
    <div class="email-content">
      ${generateTierSpecificBanner(user_tier, unsubscribeBaseUrl, 'light')}

      <div class="welcome-message">
        <h2>You're all set!</h2>
        <p>We'll monitor docket ${escapeHtml(filing.docket_number)} and send you AI-powered summaries when new filings are submitted. Here's the most recent filing to get you started:</p>
      </div>
      
      <div class="seed-intro">
        <h3>🚀 Getting You Up to Speed</h3>
        <p>This is the latest filing from docket ${escapeHtml(filing.docket_number)}. It includes our AI-powered summary to help you quickly understand the key points and regulatory implications.</p>
      </div>
      
      <div class="filing-card">
        <div class="filing-header">
          <h3 class="filing-title">${escapeHtml(filing.title)}</h3>
          <p class="filing-meta">
            👤 ${escapeHtml(filing.author)} • 
            📝 ${escapeHtml(filing.filing_type)} • 
            📅 ${formatDate(filing.date_received)} (${timeAgo}) •
            📄 ${pageCount}
          </p>
        </div>
        ${generateAIContent(filing, user_tier, unsubscribeBaseUrl, 'light')}
        <div style="text-align: right; margin-top: 16px;">
          <a href="${filing.filing_url}" class="cta-button">View Filing →</a>
        </div>
      </div>
      
      <div class="next-steps">
        <h3>What happens next?</h3>
        <p>Going forward, we'll send you updates only when <strong>new</strong> filings are submitted to docket ${escapeHtml(filing.docket_number)}. You'll never miss important regulatory developments!</p>
        <a href="${unsubscribeBaseUrl}/manage" class="cta-button">Manage Subscriptions</a>
        <a href="https://publicapi.fcc.gov/ecfs/dockets/${escapeHtml(filing.docket_number)}" class="cta-button" target="_blank">View Docket</a>
      </div>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you subscribed to monitoring for docket ${escapeHtml(filing.docket_number)}.</p>
      <p>
        <a href="${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&docket=${escapeHtml(filing.docket_number)}">Unsubscribe from this docket</a> |
        <a href="${unsubscribeBaseUrl}/manage">Manage all subscriptions</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate plain text seed digest
 */
function generateSeedDigestText(userEmail, filing, options) {
  const { brandName, supportEmail, unsubscribeBaseUrl, user_tier } = options;
  const pageCount = estimatePageCount(filing);
  const timeAgo = formatTimeAgo(new Date(filing.date_received).getTime());

  let text = `🎉 WELCOME TO ${brandName.toUpperCase()}!\n\n`;
  text += `Your monitoring for docket ${filing.docket_number} is now active!\n\n`;
  text += generateTierSpecificBannerText(user_tier, unsubscribeBaseUrl) + '\n';

  text += `--- Latest Filing for Docket ${filing.docket_number} ---\n\n`;
  text += `Title: ${filing.title}\n`;
  text += `Author: ${filing.author}\n`;
  text += `Type: ${filing.filing_type}\n`;
  text += `Pages: ${pageCount}\n`;
  text += `Filed: ${formatDate(filing.date_received)} (${timeAgo})\n`;

  // AI Summary (tier-based)
  if (user_tier === 'free') {
    const truncatedContent = truncateAISummary(filing.ai_summary, user_tier);
    if (truncatedContent.visible) {
      text += `AI Summary Preview: ${truncatedContent.visible}... [Upgrade to unlock full summary]\n`;
    }
  } else if (filing.ai_summary) {
    text += `AI Summary: ${filing.ai_summary}\n`;
    if (filing.ai_key_points) {
      text += `Key Points: ${extractKeyArguments(filing.ai_key_points)}\n`;
    }
  }
  text += `View Filing: ${filing.filing_url}\n\n`;

  text += `\n----------------------------------------\n`;
  text += `What happens next?\n`;
  text += `Going forward, we'll send you updates only when NEW filings are submitted to docket ${filing.docket_number}. You'll never miss important regulatory developments!\n\n`;
  text += `Manage your subscriptions: ${unsubscribeBaseUrl}/manage\n`;
  text += `View Docket: https://publicapi.fcc.gov/ecfs/dockets/${filing.docket_number}\n\n`;
  text += `You're receiving this because you subscribed to monitoring for docket ${filing.docket_number}.\n`;
  text += `Unsubscribe from this docket: ${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&docket=${filing.docket_number}\n`;
  text += `Manage all subscriptions: ${unsubscribeBaseUrl}/manage\n`;

  return text;
} 

/**
 * Generate tier-specific promotional banner for HTML emails
 */
function generateTierSpecificBanner(user_tier, unsubscribeBaseUrl, theme = 'dark') {
  const isDark = theme === 'dark';
  const bgGradient = isDark 
    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
    : 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)';
  const textColor = isDark ? 'white' : 'white';
  const buttonBg = isDark ? 'white' : 'white';
  const buttonColor = isDark ? '#1d4ed8' : '#3b82f6';
  
  switch (user_tier) {
    case 'free':
      return `
        <div style="background: ${bgGradient}; color: ${textColor}; padding: 24px; border-radius: 8px; margin-bottom: 32px; text-align: center;">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">🚀 Upgrade to Pro for Full AI Summaries</h3>
          <p style="margin: 0 0 16px 0; font-size: 14px; opacity: 0.9;">
            Free users see basic filing metadata. Upgrade to Pro for AI-powered summaries that help you quickly understand key regulatory developments.
          </p>
          <a href="${unsubscribeBaseUrl}/pricing" style="display: inline-block; background-color: ${buttonBg}; color: ${buttonColor}; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
            Upgrade to Pro →
          </a>
        </div>
      `;
    
    case 'trial':
      const trialBgGradient = isDark 
        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
        : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
      const trialButtonColor = isDark ? '#d97706' : '#f59e0b';
      
      return `
        <div style="background: ${trialBgGradient}; color: ${textColor}; padding: 24px; border-radius: 8px; margin-bottom: 32px; text-align: center;">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">⏰ Trial Active - Full AI Access</h3>
          <p style="margin: 0 0 16px 0; font-size: 14px; opacity: 0.9;">
            You're enjoying full AI summaries during your trial. Don't miss out on continued access to detailed regulatory insights.
          </p>
          <a href="${unsubscribeBaseUrl}/pricing" style="display: inline-block; background-color: ${buttonBg}; color: ${trialButtonColor}; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
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
 * Generate initial welcome email (confirmation without filing data) with dual-mode support
 */
export function generateWelcomeEmail(userEmail, docketNumber, options = {}) {
  const {
    brandName = 'DocketCC',
    supportEmail = 'support@simpledcc.com',
    unsubscribeBaseUrl = 'https://simpledcc.pages.dev',
    user_tier = 'free',
    theme = 'dark'
  } = options;

  const subject = `Welcome to ${brandName} - Now monitoring FCC Docket ${docketNumber}`;

  return {
    subject,
    html: theme === 'dark' 
      ? generateDarkWelcomeHTML(userEmail, docketNumber, { brandName, supportEmail, unsubscribeBaseUrl, user_tier })
      : generateLightWelcomeHTML(userEmail, docketNumber, { brandName, supportEmail, unsubscribeBaseUrl, user_tier }),
    text: generateWelcomeText(userEmail, docketNumber, { brandName, supportEmail, unsubscribeBaseUrl, user_tier })
  };
}

/**
 * Generate dark mode welcome email HTML
 */
function generateDarkWelcomeHTML(userEmail, docketNumber, options) {
  const { brandName, supportEmail, unsubscribeBaseUrl, user_tier } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${brandName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; line-height: 1.6; color: #f8fafc; margin: 0; padding: 0; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); min-height: 100vh; }
    .email-container { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); border: 1px solid #1e293b; }
    .welcome-header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 24px; text-align: center; position: relative; }
    .welcome-icon { font-size: 48px; margin-bottom: 16px; }
    .welcome-title { margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.025em; }
    .welcome-subtitle { margin: 8px 0 0 0; font-size: 18px; opacity: 0.9; }
    .email-content { padding: 32px 24px; }
    .docket-badge { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 18px; text-align: center; margin: 24px 0; }
    .features { background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 24px; margin: 24px 0; color: #e2e8f0; }
    .features h3 { color: #10b981; margin-top: 0; }
    .feature-list { list-style: none; padding: 0; }
    .feature-list li { margin: 12px 0; padding-left: 24px; position: relative; }
    .feature-list li:before { content: "✅"; position: absolute; left: 0; }
    .next-steps { background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; padding: 24px; margin: 24px 0; color: #e2e8f0; }
    .next-steps h3 { color: #60a5fa; margin-top: 0; }
    .cta-button { display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-align: center; margin: 16px 0; transition: background-color 0.2s; }
    .cta-button:hover { background-color: #059669; }
    .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 14px; border-top: 1px solid #334155; }
    .footer a { color: #94a3b8; text-decoration: none; transition: color 0.2s; }
    .footer a:hover { color: #10b981; }
    @media only screen and (max-width: 600px) { .email-container { border-radius: 0; } .welcome-header { padding: 32px 16px; } .email-content { padding: 24px 16px; } }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="welcome-header">
      <div class="welcome-icon">🎉</div>
      <h1 class="welcome-title">Welcome to ${brandName}!</h1>
      <p class="welcome-subtitle">Professional FCC Regulatory Monitoring</p>
    </div>
    
    <div class="email-content">
      ${generateTierSpecificBanner(user_tier, unsubscribeBaseUrl, 'dark')}

      <p style="margin-bottom: 20px; color: #e2e8f0;">Thank you for subscribing to our FCC docket monitoring service. You're now actively monitoring:</p>
      
      <div class="docket-badge">
        📋 FCC Docket ${escapeHtml(docketNumber)}
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
      
      <div class="next-steps">
        <h3>Next Steps:</h3>
        <p>Your first digest will arrive within 24 hours if there are new filings in docket ${escapeHtml(docketNumber)}. Our AI system will analyze each filing and provide concise summaries to help you quickly understand key regulatory developments.</p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${unsubscribeBaseUrl}/manage" class="cta-button">
          Manage Your Subscriptions
        </a>
      </div>
      
      <p style="color: #94a3b8;">If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:${supportEmail}" style="color: #10b981;">${supportEmail}</a>.</p>
    </div>
    
    <div class="footer">
      <p>You can <a href="${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&docket=${encodeURIComponent(docketNumber)}">unsubscribe from this docket</a> or <a href="${unsubscribeBaseUrl}/manage">manage all subscriptions</a> at any time.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate light mode welcome email HTML
 */
function generateLightWelcomeHTML(userEmail, docketNumber, options) {
  const { brandName, supportEmail, unsubscribeBaseUrl, user_tier } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${brandName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; line-height: 1.6; color: #0f172a; margin: 0; padding: 0; background-color: #f8fafc; min-height: 100vh; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
    .welcome-header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 24px; text-align: center; position: relative; }
    .welcome-icon { font-size: 48px; margin-bottom: 16px; }
    .welcome-title { margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.025em; }
    .welcome-subtitle { margin: 8px 0 0 0; font-size: 18px; opacity: 0.9; }
    .email-content { padding: 32px 24px; }
    .docket-badge { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 18px; text-align: center; margin: 24px 0; }
    .features { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 24px; margin: 24px 0; color: #374151; }
    .features h3 { color: #065f46; margin-top: 0; }
    .feature-list { list-style: none; padding: 0; }
    .feature-list li { margin: 12px 0; padding-left: 24px; position: relative; }
    .feature-list li:before { content: "✅"; position: absolute; left: 0; }
    .next-steps { background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 24px; margin: 24px 0; color: #374151; }
    .next-steps h3 { color: #1e40af; margin-top: 0; }
    .cta-button { display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-align: center; margin: 16px 0; transition: background-color 0.2s; }
    .cta-button:hover { background-color: #059669; }
    .footer { text-align: center; padding: 24px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
    .footer a { color: #6b7280; text-decoration: none; transition: color 0.2s; }
    .footer a:hover { color: #10b981; }
    @media only screen and (max-width: 600px) { .email-container { border-radius: 0; } .welcome-header { padding: 32px 16px; } .email-content { padding: 24px 16px; } }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="welcome-header">
      <div class="welcome-icon">🎉</div>
      <h1 class="welcome-title">Welcome to ${brandName}!</h1>
      <p class="welcome-subtitle">Professional FCC Regulatory Monitoring</p>
    </div>
    
    <div class="email-content">
      ${generateTierSpecificBanner(user_tier, unsubscribeBaseUrl, 'light')}

      <p style="margin-bottom: 20px;">Thank you for subscribing to our FCC docket monitoring service. You're now actively monitoring:</p>
      
      <div class="docket-badge">
        📋 FCC Docket ${escapeHtml(docketNumber)}
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
      
      <div class="next-steps">
        <h3>Next Steps:</h3>
        <p>Your first digest will arrive within 24 hours if there are new filings in docket ${escapeHtml(docketNumber)}. Our AI system will analyze each filing and provide concise summaries to help you quickly understand key regulatory developments.</p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${unsubscribeBaseUrl}/manage" class="cta-button">
          Manage Your Subscriptions
        </a>
      </div>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:${supportEmail}" style="color: #10b981;">${supportEmail}</a>.</p>
    </div>
    
    <div class="footer">
      <p>You can <a href="${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&docket=${encodeURIComponent(docketNumber)}">unsubscribe from this docket</a> or <a href="${unsubscribeBaseUrl}/manage">manage all subscriptions</a> at any time.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate plain text welcome email
 */
function generateWelcomeText(userEmail, docketNumber, options) {
  const { brandName, supportEmail, unsubscribeBaseUrl, user_tier } = options;

  let text = `Welcome to ${brandName.toUpperCase()}!\n\n`;
  text += `Thank you for subscribing to our FCC docket monitoring service.\n\n`;
  text += `You're now monitoring: FCC Docket ${docketNumber}\n\n`;
  
  // Add tier-specific banner for text version
  text += generateTierSpecificBannerText(user_tier, unsubscribeBaseUrl) + '\n';

  text += `WHAT YOU'LL RECEIVE:\n`;
  text += `${'-'.repeat(20)}\n`;
  text += `• Daily digest emails with new filings\n`;
  text += `• AI-powered summaries of regulatory documents\n`;
  text += `• Real-time notifications for important developments\n`;
  text += `• Direct links to official FCC documents\n`;
  text += `• Professional formatting for regulatory professionals\n\n`;

  text += `NEXT STEPS:\n`;
  text += `${'-'.repeat(11)}\n`;
  text += `Your first digest will arrive within 24 hours if there are new filings.\n\n`;

  text += `Manage subscriptions: ${unsubscribeBaseUrl}/manage\n`;
  text += `Support: ${supportEmail}\n`;
  text += `Unsubscribe: ${unsubscribeBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&docket=${encodeURIComponent(docketNumber)}\n\n`;

  text += `${brandName} - Professional FCC Regulatory Monitoring\n`;

  return text;
}