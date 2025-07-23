interface MagicLinkEmailData {
  email: string;
  magicLink: string;
  expiryMinutes: number;
}

function createMagicLinkEmail(data: MagicLinkEmailData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign in to DocketCC</title>
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
          max-width: 500px; 
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
          margin-bottom: 24px;
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
          margin: 0 0 12px 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
        }
        
        .header p {
          color: #6b7280;
          font-size: 1rem;
          margin: 0 0 32px 0;
        }
        
        .magic-link-button {
          display: inline-block;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1.1rem;
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
          margin: 0 0 24px 0;
          transition: all 0.2s ease;
        }
        
        .magic-link-button:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-1px);
        }
        
        .expiry-notice {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 12px 16px;
          margin: 24px 0;
          font-size: 0.9rem;
          color: #92400e;
        }
        
        .security-note {
          font-size: 0.85rem;
          color: #6b7280;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          line-height: 1.5;
        }
        
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 0.8rem;
          color: #9ca3af;
        }
        
        @media (max-width: 600px) {
          .email-container { 
            padding: 10px; 
          }
          .header { 
            padding: 30px 20px; 
          }
          .logo-text {
            font-size: 1.6rem;
          }
          .logo-icon {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }
          .magic-link-button {
            padding: 14px 24px;
            font-size: 1rem;
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
          
          <h1>Sign in to Your Account</h1>
          <p>Click the button below to securely access your subscription dashboard.</p>
          
          <a href="${data.magicLink}" class="magic-link-button">
            🔓 Sign In to DocketCC
          </a>
          
          <div class="expiry-notice">
            ⏱️ This link expires in ${data.expiryMinutes} minutes for your security.
          </div>
          
          <div class="security-note">
            🛡️ This is a secure, one-time sign-in link. If you didn't request this, you can safely ignore this email.
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>DocketCC - Professional FCC Intelligence</p>
        <p>This email was sent to ${data.email}</p>
      </div>
    </body>
    </html>
  `;

  const text = `
DocketCC - Sign In Request

Hi there,

Click the link below to sign in to your DocketCC account:
${data.magicLink}

This link will expire in ${data.expiryMinutes} minutes for security.

If you didn't request this sign-in link, you can safely ignore this email.

---
DocketCC - Professional FCC Intelligence
This email was sent to ${data.email}
  `;

  return {
    subject: 'Sign in to DocketCC',
    html,
    text
  };
}

export async function sendMagicLinkEmail(
  email: string, 
  magicLink: string, 
  env: any,
  expiryMinutes: number = 15
): Promise<{ success: boolean; error?: string }> {
  try {
    // Skip email sending if no API key
    if (!env.RESEND_API_KEY) {
      console.log('No RESEND_API_KEY - skipping magic link email');
      return { success: false, error: 'Email service not configured' };
    }

    const emailData = createMagicLinkEmail({
      email,
      magicLink,
      expiryMinutes
    });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${env.FROM_NAME || 'DocketCC'} <${env.FROM_EMAIL || 'noreply@docketcc.com'}>`,
        to: email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Magic link email sent to ${email}`);
      console.log(`📧 Resend Email ID: ${result.id}`);
      return { success: true };
    } else {
      const error = await response.text();
      console.error('❌ Magic link email send failed:', response.status, error);
      return { success: false, error: 'Email delivery failed' };
    }
  } catch (error) {
    console.error('Magic link email error:', error);
    return { success: false, error: 'Email service error' };
  }
} 