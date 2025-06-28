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
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f8f9fa;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #007cba 0%, #005a8a 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
          font-size: 16px;
        }
        .content { 
          padding: 40px 30px; 
        }
        .content h2 {
          color: #333;
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 24px;
        }
        .docket-box { 
          background: #f8f9fa; 
          padding: 25px; 
          border-left: 4px solid #007cba; 
          margin: 25px 0; 
          border-radius: 0 8px 8px 0;
        }
        .docket-box h3 {
          margin-top: 0;
          color: #007cba;
          font-size: 18px;
        }
        .docket-box ul {
          margin: 15px 0;
          padding-left: 20px;
        }
        .docket-box li {
          margin-bottom: 8px;
        }
        .docket-highlight {
          background: white;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          border: 2px solid #007cba;
          text-align: center;
        }
        .docket-highlight strong {
          color: #007cba;
          font-size: 18px;
        }
        .footer { 
          background: #f8f9fa;
          padding: 30px; 
          text-align: center; 
          border-top: 1px solid #dee2e6;
        }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #dc3545; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: 500;
          margin: 15px 0;
        }
        .button:hover {
          background-color: #c82333;
        }
        .disclaimer {
          font-size: 12px; 
          color: #6c757d;
          margin-top: 25px;
          line-height: 1.4;
        }
        @media (max-width: 600px) {
          .container { margin: 0; }
          .header, .content, .footer { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to DocketCC!</h1>
          <p>Your FCC docket monitoring service</p>
        </div>
        
        <div class="content">
          <h2>Subscription Confirmed</h2>
          <p>Thank you for subscribing! You're now monitoring FCC docket activity and will receive timely notifications.</p>
          
          <div class="docket-highlight">
            <strong>Monitoring Docket: ${data.docketNumber}</strong>
          </div>
          
          <div class="docket-box">
            <h3>What happens next?</h3>
            <ul>
              <li><strong>We monitor</strong> FCC Docket ${data.docketNumber} 24/7 for new filings and updates</li>
              <li><strong>You get notified</strong> via email when something important happens</li>
              <li><strong>Direct links</strong> to all new documents and filings are included</li>
              <li><strong>Easy management</strong> - you can unsubscribe at any time</li>
            </ul>
          </div>
          
          <p><strong>Our commitment:</strong> We only send notifications when there are actual updates to your subscribed dockets. No spam, no unnecessary emails, just the regulatory information you need.</p>
          
          <p>Questions about DocketCC? Visit our website or reply to this email.</p>
        </div>
        
        <div class="footer">
          <p><strong>Managing your subscription</strong></p>
          <p>You can unsubscribe from this specific docket at any time:</p>
          <a href="${data.unsubscribeUrl}" class="button">Unsubscribe from Docket ${data.docketNumber}</a>
          
          <div class="disclaimer">
            This is an automated message from DocketCC (docketcc.com).<br>
            DocketCC is an independent service and is not affiliated with the Federal Communications Commission.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to DocketCC!
Your FCC docket monitoring service

SUBSCRIPTION CONFIRMED

Thank you for subscribing! You're now monitoring FCC docket activity and will receive timely notifications.

MONITORING DOCKET: ${data.docketNumber}

What happens next?
- We monitor FCC Docket ${data.docketNumber} 24/7 for new filings and updates
- You get notified via email when something important happens  
- Direct links to all new documents and filings are included
- Easy management - you can unsubscribe at any time

Our commitment: We only send notifications when there are actual updates to your subscribed dockets. No spam, no unnecessary emails, just the regulatory information you need.

Questions about DocketCC? Visit our website or reply to this email.

MANAGING YOUR SUBSCRIPTION
You can unsubscribe from this specific docket at any time: ${data.unsubscribeUrl}

This is an automated message from DocketCC (docketcc.com).
DocketCC is an independent service and is not affiliated with the Federal Communications Commission.
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