<script>
  // Ramp-inspired modern about page with email showcase
</script>

<svelte:head>
  <title>About - DocketCC</title>
  <meta name="description" content="Professional FCC docket monitoring service that delivers actionable insights from complex regulatory documents directly to your inbox." />
</svelte:head>

<div class="about-page">
  <!-- Hero Section with Gradient -->
  <div class="hero-section">
    <div class="hero-gradient"></div>
    <div class="container">
      <div class="hero-content">
        <h1>Never miss a critical FCC filing again</h1>
        <p class="hero-description">FCC docket monitoring service that delivers actionable insights from complex regulatory filings directly to your inbox.</p>
      </div>
    </div>
  </div>

  <div class="container">
    <!-- Email Showcase Section -->
    <div class="showcase-section">
      <div class="showcase-header">
        <div class="section-tag">Live Example</div>
        <h2>See what Pro subscribers receive</h2>
        <p>Real-time alerts with AI-powered analysis that cuts through regulatory complexity</p>
      </div>

      <!-- Email Preview - Ramp Style -->
      <div class="email-showcase">
        <div class="email-device">
          <div class="device-header">
            <div class="device-controls">
              <div class="control red"></div>
              <div class="control yellow"></div>
              <div class="control green"></div>
            </div>
            <div class="device-title">Email Client</div>
          </div>
          
          <div class="email-viewport">
            <div class="email-card">
              <!-- Email Header -->
              <div class="email-header">
                <div class="sender-section">
                  <div class="sender-avatar">
                    <div class="avatar-gradient"></div>
                    <span>D</span>
                  </div>
                  <div class="sender-info">
                    <div class="sender-name">DocketCC <span class="verified">✓</span></div>
                    <div class="sender-email">noreply@docketcc.com</div>
                  </div>
                </div>
                <div class="email-actions">
                  <div class="pro-badge">
                    <span class="pro-icon">★</span>
                    <span>PRO</span>
                  </div>
                  <div class="timestamp">12:01 PM</div>
                </div>
              </div>

              <!-- Alert Banner -->
              <div class="alert-banner">
                <div class="alert-content">
                  <div class="alert-icon">🚨</div>
                  <div class="alert-text">
                    <h3>New Filing Alert</h3>
                    <p>Docket 25-192 • Filed 1 hour ago</p>
                  </div>
                </div>
                <div class="priority-indicator high"></div>
              </div>

              <!-- Filing Details Card -->
              <div class="filing-card">
                <div class="filing-header">
                  <div class="docket-tag">25-192</div>
                  <div class="filing-type">Coalition Letter</div>
                </div>
                <h4 class="filing-title">Coalition_Letter_8.7.25_FINAL.pdf</h4>
                <div class="filing-metadata">
                  <div class="metadata-item">
                    <span class="label">Filer:</span>
                    <span class="value">Rural Wireless Association, Inc.</span>
                  </div>
                  <div class="metadata-item">
                    <span class="label">Type:</span>
                    <span class="value">LETTER • 17 pages</span>
                  </div>
                </div>
              </div>

              <!-- AI Analysis Section -->
              <div class="ai-analysis">
                <div class="analysis-header">
                  <div class="ai-badge">
                    <div class="ai-icon">🤖</div>
                    <span>AI Analysis</span>
                  </div>
                </div>

                <div class="analysis-content">
                  <div class="executive-summary">
                    <h5>Executive Summary</h5>
                    <p>This FCC filing is a coalition letter from the Rural Wireless Association, Open Technology Institute, Benton Institute, and Communications Workers of America opposing the delegation of authority to FCC staff to review and approve several license transfer applications involving T-Mobile, Verizon, US Cellular, and AT&T. The coalition argues these transactions are interdependent and require full Commission review due to potential negative impacts on competition, rural service, and the public interest.</p>
                  </div>

                  <div class="key-insights">
                    <h5>Key Points</h5>
                    <div class="insight-points">
                      <div class="insight-point">
                        <div class="point-marker">•</div>
                        <div class="point-text"><strong>Opposition to Staff Delegation:</strong> The coalition strongly opposes the delegation of authority to FCC staff to review and approve the license transfer applications, demanding instead a full Commission review.</div>
                      </div>
                      <div class="insight-point">
                        <div class="point-marker">•</div>
                        <div class="point-text"><strong>Interdependency of Transactions:</strong> The coalition emphasizes the interdependent nature of the T-Mobile/US Cellular, Verizon/US Cellular, and AT&T/US Cellular transactions, arguing that a holistic review is necessary to assess their cumulative impact.</div>
                      </div>
                      <div class="insight-point">
                        <div class="point-marker">•</div>
                        <div class="point-text"><strong>Competition and Rural Service Concerns:</strong> The coalition raises concerns about the potential negative effects of these transactions on competition, particularly in rural areas, as well as on consumer welfare and the labor market.</div>
                      </div>
                      <div class="insight-point">
                        <div class="point-marker">•</div>
                        <div class="point-text"><strong>Legal and Factual Errors:</strong> The coalition points to previously identified legal and factual errors in related applications as further justification for full Commission review.</div>
                      </div>
                    </div>
                  </div>

                  <div class="impact-assessment">
                    <div class="impact-header">
                      <h5>Business Impact</h5>
                      <div class="impact-level high">High</div>
                    </div>
                    <p>This filing could significantly delay approval timelines for major carrier consolidation efforts. Companies involved in these transactions should prepare for extended review periods and potential additional regulatory scrutiny. Rural service providers and competitors may see increased opportunities if transactions are blocked or modified.</p>
                  </div>
                </div>
              </div>

              <!-- Action Section -->
              <div class="action-section">
                <button class="primary-action">
                  <span>View Full Filing</span>
                  <span class="action-icon">→</span>
                </button>
                <button class="secondary-action">
                  <span>📎</span>
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Grid -->
    <div class="features-section">
      <div class="features-header">
        <h2>Save time - let DocketCC keep you plugged in while you work</h2>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>Real-time Monitoring</h3>
          <p>Automated tracking of all FCC dockets with instant notifications when relevant filings are submitted.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🧠</div>
          <h3>AI-Powered Analysis</h3>
          <p>Advanced language models extract key insights, business impacts, and actionable intelligence from complex documents.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3>Smart Filtering</h3>
          <p>Customizable alerts based on your industry, interests, and business priorities. No noise, just signal.</p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .about-page {
    min-height: 100vh;
    background: #fafbfc;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-8);
  }

  /* Hero Section */
  .hero-section {
    position: relative;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    padding: 6rem 0 4rem;
    overflow: hidden;
  }

  .hero-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
  }



  .hero-content h1 {
    font-size: 4rem;
    font-weight: 700;
    color: white;
    line-height: 1.1;
    margin-bottom: 1.5rem;
    letter-spacing: -0.02em;
  }

  .hero-description {
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
    margin-bottom: 2rem;
  }



  /* Showcase Section */
  .showcase-section {
    padding: 6rem 0;
  }

  .showcase-header {
    text-align: center;
    margin-bottom: 4rem;
  }

  .section-tag {
    display: inline-block;
    background: var(--color-primary-light);
    color: var(--color-primary);
    padding: 0.375rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
  }

  .showcase-header h2 {
    font-size: 3rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 1rem;
    line-height: 1.2;
  }

  .showcase-header p {
    font-size: 1.25rem;
    color: var(--color-text-secondary);
    max-width: 600px;
    margin: 0 auto;
  }

  /* Email Showcase */
  .email-showcase {
    display: flex;
    justify-content: center;
    margin-bottom: 4rem;
  }

  .email-device {
    background: #1e293b;
    border-radius: 16px;
    padding: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    max-width: 900px;
    width: 100%;
  }

  .device-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .device-controls {
    display: flex;
    gap: 0.5rem;
  }

  .control {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .control.red { background: #ef4444; }
  .control.yellow { background: #f59e0b; }
  .control.green { background: #10b981; }

  .device-title {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .email-viewport {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .email-card {
    background: white;
  }

  /* Email Header */
  .email-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f1f5f9;
    background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
  }

  .sender-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .sender-avatar {
    position: relative;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 1.25rem;
    overflow: hidden;
  }

  .avatar-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--color-primary) 0%, #059669 100%);
  }

  .sender-avatar span {
    position: relative;
    z-index: 2;
  }

  .sender-name {
    font-weight: 600;
    color: var(--color-text-primary);
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .verified {
    color: var(--color-primary);
    font-size: 0.875rem;
  }

  .sender-email {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .email-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .pro-badge {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
    padding: 0.375rem 0.75rem;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .pro-icon {
    font-size: 0.875rem;
  }

  .timestamp {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  /* Alert Banner */
  .alert-banner {
    position: relative;
    background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
    border-left: 4px solid #f59e0b;
    padding: 1.5rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .alert-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .alert-icon {
    font-size: 1.5rem;
  }

  .alert-text h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 0.25rem 0;
  }

  .alert-text p {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .priority-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .priority-indicator.high {
    background: #ef4444;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Filing Card */
  .filing-card {
    padding: 2rem;
    border-bottom: 1px solid #f1f5f9;
  }

  .filing-header {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .docket-tag {
    background: var(--color-primary);
    color: white;
    padding: 0.375rem 0.875rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .filing-type {
    background: #e2e8f0;
    color: var(--color-text-secondary);
    padding: 0.375rem 0.875rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .filing-title {
    font-size: 1.375rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 1rem;
    line-height: 1.4;
  }

  .filing-metadata {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .metadata-item {
    display: flex;
    gap: 0.75rem;
  }

  .metadata-item .label {
    font-weight: 600;
    color: var(--color-text-secondary);
    min-width: 60px;
  }

  .metadata-item .value {
    color: var(--color-text-primary);
  }

  /* AI Analysis */
  .ai-analysis {
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    padding: 2rem;
    border-left: 4px solid var(--color-primary);
  }

  .analysis-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .ai-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--color-primary);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .ai-icon {
    font-size: 1rem;
  }



  .analysis-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .executive-summary h5,
  .key-insights h5,
  .impact-assessment h5 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 0.75rem;
  }

  .executive-summary p,
  .impact-assessment p {
    color: var(--color-text-primary);
    line-height: 1.6;
  }

  .insight-points {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .insight-point {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    background: white;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #d1fae5;
  }

  .point-marker {
    color: var(--color-primary);
    font-weight: 700;
    font-size: 1.125rem;
    line-height: 1.4;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  .point-text {
    color: var(--color-text-primary);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .point-text strong {
    color: var(--color-text-primary);
    font-weight: 600;
  }

  .impact-assessment {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #d1fae5;
  }

  .impact-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .impact-level {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .impact-level.high {
    background: #fee2e2;
    color: #dc2626;
  }

  /* Action Section */
  .action-section {
    padding: 2rem;
    background: #fafbfc;
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .primary-action {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--color-primary);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-normal);
    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
  }

  .primary-action:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 6px 12px -1px rgba(16, 185, 129, 0.3);
  }

  .secondary-action {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    padding: 1rem 2rem;
    border-radius: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-normal);
  }

  .secondary-action:hover {
    background: #f8fafc;
    border-color: var(--color-primary);
  }

  .action-icon {
    font-size: 1.125rem;
  }

  /* Features Section */
  .features-section {
    padding: 4rem 0 6rem;
  }

  .features-header {
    text-align: center;
    margin-bottom: 4rem;
  }

  .features-header h2 {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-text-primary);
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.3;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
  }

  .feature-card {
    background: white;
    padding: 2.5rem;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--color-border);
    transition: all var(--transition-normal);
  }

  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }

  .feature-icon {
    font-size: 3rem;
    margin-bottom: 1.5rem;
  }

  .feature-card h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 1rem;
  }

  .feature-card p {
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin-bottom: 0;
  }



  /* Responsive */
  @media (max-width: 768px) {
    .container {
      padding: 0 var(--spacing-4);
    }
    
    .hero-content h1 {
      font-size: 2.5rem;
    }



    .showcase-header h2 {
      font-size: 2rem;
    }

    .email-device {
      padding: 0.75rem;
    }

    .email-header {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .email-actions {
      align-self: flex-end;
    }

    .filing-card,
    .ai-analysis,
    .action-section {
      padding: 1.5rem;
    }

    .insight-points {
      gap: 0.75rem;
    }

    .insight-point {
      padding: 0.75rem;
    }

    .action-section {
      flex-direction: column;
    }

    .features-grid {
      grid-template-columns: 1fr;
    }

    .feature-card {
      padding: 2rem;
    }
  }
</style>