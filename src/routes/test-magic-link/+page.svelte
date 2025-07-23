<script>
  let email = 'test@example.com';
  let magicLink = 'http://localhost:5175/auth/verify?token=123e4567-e89b-12d3-a456-426614174000&email=test%40example.com';
  let expiryMinutes = 15;
</script>

<svelte:head>
  <title>Magic Link Demo - DocketCC</title>
</svelte:head>

<main class="main">
  <div class="container">
    <h1>Magic Link Email Preview</h1>
    <p>This is how the magic link email will look:</p>
    
    <div class="email-preview">
      <!-- Email Template Preview -->
      <div class="email-container">
        <div class="header">
          <div class="logo">
            <div class="logo-icon">📡</div>
            <div class="logo-text">Docket<span class="cc">CC</span></div>
          </div>
          
          <h1>Sign in to Your Account</h1>
          <p>Click the button below to securely access your subscription dashboard.</p>
          
          <a href={magicLink} class="magic-link-button">
            🔓 Sign In to DocketCC
          </a>
          
          <div class="expiry-notice">
            ⏱️ This link expires in {expiryMinutes} minutes for your security.
          </div>
          
          <div class="security-note">
            🛡️ This is a secure, one-time sign-in link. If you didn't request this, you can safely ignore this email.
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>DocketCC - Professional FCC Intelligence</p>
        <p>This email was sent to {email}</p>
      </div>
    </div>
    
    <div class="demo-controls">
      <h2>Test the Magic Link Flow</h2>
      <p>Click the magic link button above to test the verification flow!</p>
      
      <div class="demo-info">
        <h3>Magic Link Features:</h3>
        <ul>
          <li>✅ 15-minute expiry for security</li>
          <li>✅ Single-use tokens</li>
          <li>✅ Rate limiting: 5 requests per 15 minutes</li>
          <li>✅ Clean DocketCC branding</li>
          <li>✅ Mobile-responsive design</li>
        </ul>
      </div>
    </div>
  </div>
</main>

<style>
  .main {
    background: linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%);
    min-height: 100vh;
    padding: 2rem;
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 1rem;
    text-align: center;
  }

  .container > p {
    text-align: center;
    color: #6b7280;
    margin-bottom: 3rem;
    font-size: 1.1rem;
  }

  .email-preview {
    background: #f8fafc;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 3rem;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  }

  /* Email Template Styles (copied from magic-link.ts) */
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

  .demo-controls {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  }

  .demo-controls h2 {
    color: #0f172a;
    margin-bottom: 1rem;
  }

  .demo-info {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #f0fdf4;
    border-radius: 12px;
    border: 1px solid #10b981;
  }

  .demo-info h3 {
    color: #059669;
    margin-bottom: 1rem;
  }

  .demo-info ul {
    list-style: none;
    padding: 0;
  }

  .demo-info li {
    margin-bottom: 0.5rem;
    color: #374151;
  }
</style> 