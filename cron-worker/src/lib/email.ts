interface WelcomeEmailData {
  email: string;
  docketNumber: string;
  unsubscribeUrl: string;
}

function createWelcomeEmail(data: WelcomeEmailData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to DocketCC</title>
      <style>
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
          line-height: 1.6; 
          color: #1f2937; 
          margin: 0; 
          padding: 0; 
          background-color: #f8fafc;
        }
        
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #f8fafc;
          padding: 20px;
        }
        
        .header { 
          background: white;
          border-radius: 16px;
          padding: 40px 30px; 
          text-align: center; 
          margin-bottom: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .logo-text {
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        
        .logo-text .cc {
          color: #10b981;
        }
        
        .header h1 {
          margin: 0 0 8px 0;
          font-size: 1.8rem;
          font-weight: 700;
          color: #0f172a;
        }
        
        .header p {
          color: #6b7280;
          font-size: 1rem;
          margin: 0;
        }
        
        .card { 
          background: white;
          border-radius: 16px;
          padding: 30px; 
          margin-bottom: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .card h2 {
          color: #0f172a;
          margin: 0 0 20px 0;
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        .status-badge {
          display: inline-block;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          margin: 20px 0;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .docket-highlight {
          background: #f0fdf4;
          padding: 20px;
          border-radius: 12px;
          margin: 25px 0;
          border: 2px solid #10b981;
          text-align: center;
        }
        
        .docket-highlight strong {
          color: #059669;
          font-size: 1.1rem;
          font-weight: 700;
        }
        
        .feature-list { 
          background: #f8fafc; 
          padding: 25px; 
          border-left: 4px solid #10b981; 
          margin: 25px 0; 
          border-radius: 0 12px 12px 0;
        }
        
        .feature-list h3 {
          margin: 0 0 15px 0;
          color: #059669;
          font-size: 1.2rem;
          font-weight: 700;
        }
        
        .feature-list ul {
          margin: 15px 0;
          padding-left: 20px;
        }
        
        .feature-list li {
          margin-bottom: 12px;
          color: #374151;
        }
        
        .feature-list li strong {
          color: #0f172a;
        }
        
        .commitment-box {
          background: #0f172a;
          color: white;
          padding: 25px;
          border-radius: 12px;
          margin: 25px 0;
        }
        
        .commitment-box p {
          margin: 0;
          font-size: 1rem;
          line-height: 1.6;
        }
        
        .commitment-box strong {
          color: #10b981;
        }
        
        .footer-card { 
          background: white;
          border-radius: 16px;
          padding: 30px; 
          text-align: center; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .footer-card h3 {
          color: #0f172a;
          font-size: 1.3rem;
          font-weight: 700;
          margin: 0 0 15px 0;
        }
        
        .unsubscribe-button { 
          display: inline-block; 
          padding: 14px 28px; 
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white; 
          text-decoration: none; 
          border-radius: 12px; 
          font-weight: 600;
          font-size: 1rem;
          margin: 20px 0;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          transition: all 0.2s ease;
        }
        
        .unsubscribe-button:hover {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          transform: translateY(-1px);
        }
        
        .disclaimer {
          font-size: 0.8rem; 
          color: #6b7280;
          margin-top: 25px;
          line-height: 1.5;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-emerald {
          color: #10b981;
        }
        
        .font-semibold {
          font-weight: 600;
        }
        
        @media (max-width: 600px) {
          .email-container { 
            padding: 10px; 
          }
          .header, .card, .footer-card { 
            padding: 20px; 
          }
          .logo-text {
            font-size: 1.6rem;
          }
          .logo-icon {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">
            <div class="logo-icon">📡</div>
            <div class="logo-text">Docket<span class="cc">CC</span></div>
          </div>
          <h1>Welcome to Professional FCC Intelligence</h1>
          <p>Your independent docket monitoring service is now active</p>
        </div>
        
        <div class="card">
          <div class="text-center">
            <div class="status-badge">✅ Subscription Confirmed</div>
          </div>
          
          <p>Thank you for subscribing to DocketCC! You're now part of our professional intelligence network monitoring FCC proceedings with enterprise-grade reliability.</p>
          
          <div class="docket-highlight">
            <strong>📋 Now Monitoring: FCC Docket ${data.docketNumber}</strong>
          </div>
          
          <div class="feature-list">
            <h3>🚀 What happens next?</h3>
            <ul>
              <li><strong>24/7 Automated Monitoring</strong> - We track FCC Docket ${data.docketNumber} around the clock for new filings and updates</li>
              <li><strong>Instant Email Alerts</strong> - Get notified immediately when something important happens</li>
              <li><strong>Direct Document Links</strong> - Quick access to all new filings and official documents</li>
              <li><strong>Professional Intelligence</strong> - Clear, actionable information formatted for regulatory professionals</li>
            </ul>
          </div>
          
          <div class="commitment-box">
            <p><strong>Our Professional Commitment:</strong> We only send notifications when there are actual regulatory developments. No spam, no unnecessary emails - just the critical FCC intelligence you need to stay ahead of regulatory changes that impact your business.</p>
          </div>
          
          <p>Questions about DocketCC? Visit our website at <strong class="text-emerald">docketcc.com</strong> or reply to this email for support.</p>
        </div>
        
        <div class="footer-card">
          <h3>🔧 Manage Your Intelligence Subscription</h3>
          <p>You have complete control over your docket monitoring preferences. You can unsubscribe from this specific docket monitoring at any time:</p>
          <a href="${data.unsubscribeUrl}" class="unsubscribe-button">Unsubscribe from Docket ${data.docketNumber}</a>
          
          <div class="disclaimer">
            This is an automated message from DocketCC Professional Intelligence Service.<br>
            <strong>🇺🇸 An independent FCC docket monitoring service</strong> - Not affiliated with the Federal Communications Commission.<br>
            Trusted by legal professionals, regulatory experts, and enterprise teams nationwide.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
📡 DocketCC - Professional FCC Intelligence

WELCOME TO PROFESSIONAL FCC INTELLIGENCE
Your independent docket monitoring service is now active

✅ SUBSCRIPTION CONFIRMED

Thank you for subscribing to DocketCC! You're now part of our professional intelligence network monitoring FCC proceedings with enterprise-grade reliability.

📋 NOW MONITORING: FCC DOCKET ${data.docketNumber}

🚀 WHAT HAPPENS NEXT?
• 24/7 Automated Monitoring - We track FCC Docket ${data.docketNumber} around the clock for new filings and updates
• Instant Email Alerts - Get notified immediately when something important happens  
• Direct Document Links - Quick access to all new filings and official documents
• Professional Intelligence - Clear, actionable information formatted for regulatory professionals

OUR PROFESSIONAL COMMITMENT: We only send notifications when there are actual regulatory developments. No spam, no unnecessary emails - just the critical FCC intelligence you need to stay ahead of regulatory changes that impact your business.

Questions about DocketCC? Visit our website at docketcc.com or reply to this email for support.

🔧 MANAGE YOUR INTELLIGENCE SUBSCRIPTION
You have complete control over your docket monitoring preferences. You can unsubscribe from this specific docket monitoring at any time: ${data.unsubscribeUrl}

This is an automated message from DocketCC Professional Intelligence Service.
🇺🇸 An independent FCC docket monitoring service - Not affiliated with the Federal Communications Commission.
Trusted by legal professionals, regulatory experts, and enterprise teams nationwide.
  `.trim();

  return {
    subject: `DocketCC: Now monitoring FCC Docket ${data.docketNumber}`,
    html,
    text
  };
}

export async function sendWelcomeEmail(
  email: string, 
  docketNumber: string, 
  env: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Skip email sending if no API key (don't break subscriptions)
    if (!env.RESEND_API_KEY) {
      console.log('No RESEND_API_KEY - skipping welcome email');
      return { success: true };
    }

    // Check domain verification status
    console.log('🔍 Checking domain verification...');
    try {
      const domainCheck = await fetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (domainCheck.ok) {
        const domains = await domainCheck.json();
        const docketccDomain = domains.data?.find((d: any) => d.name === 'docketcc.com');
        if (docketccDomain) {
          console.log(`🌐 Domain docketcc.com status: ${docketccDomain.status}`);
          if (docketccDomain.status !== 'verified') {
            console.log('⚠️  Domain not verified - emails may go to spam!');
          }
        } else {
          console.log('⚠️  Domain docketcc.com not found in Resend account');
        }
      }
    } catch (domainError) {
      console.log('Could not check domain status:', domainError);
    }

    const appUrl = env.APP_URL || 'http://localhost:8788';
    const unsubscribeUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(email)}&docket=${encodeURIComponent(docketNumber)}`;
    
    const emailData = createWelcomeEmail({
      email,
      docketNumber,
      unsubscribeUrl
    });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${env.FROM_NAME || 'DocketCC'} <${env.FROM_EMAIL || 'docketsignup@docketcc.com'}>`,
        to: email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Welcome email sent to ${email} for docket ${docketNumber}`);
      console.log(`📧 Resend Email ID: ${result.id}`);
      console.log(`🎯 From: ${env.FROM_NAME || 'DocketCC'} <${env.FROM_EMAIL || 'docketsignup@docketcc.com'}>`);
      console.log(`📝 Subject: ${emailData.subject}`);
      console.log(`⚠️  If email not received, check Gmail spam folder!`);
      return { success: true };
    } else {
      const error = await response.text();
      console.error('❌ Email send failed:', response.status, error);
      return { success: false, error: 'Email delivery failed' };
    }
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: 'Email service error' };
  }
} 

/**
 * Generic email sending function for cron-worker notifications
 */
export async function sendEmail(
  to: string, 
  subject: string, 
  html: string, 
  text: string, 
  env: any
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not found. Skipping email send.');
    return { success: false, error: 'No API key' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${env.FROM_NAME || 'DocketCC'} <${env.FROM_EMAIL || 'notifications@docketcc.com'}>`,
        to: to,
        subject: subject,
        html: html,
        text: text,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Email sent to ${to}: ${subject} (ID: ${result.id})`);
      return { success: true, id: result.id };
    } else {
      const error = await response.text();
      console.error(`❌ Email failed to ${to}:`, response.status, error);
      return { success: false, error: `Email delivery failed: ${response.status}` };
    }
  } catch (error) {
    console.error(`❌ Email error for ${to}:`, error);
    return { success: false, error: `Email service error: ${error.message}` };
  }
} 