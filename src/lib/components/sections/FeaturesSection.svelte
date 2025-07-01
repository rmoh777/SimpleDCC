<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  interface Feature {
    icon: string;
    title: string;
    description: string;
    details: string[];
    popular?: boolean;
  }
  
  const features: Feature[] = [
    {
      icon: '📡',
      title: 'Real-time Docket Monitoring',
      description: 'Get instant notifications when new FCC docket filings are published. Our system monitors all active proceedings 24/7.',
      details: [
        'Instant email notifications',
        'SMS alerts for urgent filings',
        'Customizable notification preferences',
        'Multi-docket subscription management'
      ],
      popular: true
    },
    {
      icon: '🤖',
      title: 'AI-Powered Summaries',
      description: 'Receive intelligent summaries of complex regulatory documents written in plain English.',
      details: [
        'Key points extraction',
        'Impact analysis',
        'Timeline tracking',
        'Stakeholder identification'
      ]
    },
    {
      icon: '🔒',
      title: 'Enterprise Security',
      description: 'Government-grade security and compliance for your regulatory intelligence needs.',
      details: [
        'SOC 2 Type II certified',
        'End-to-end encryption',
        'GDPR compliant',
        'Private data handling'
      ]
    },
    {
      icon: '📊',
      title: 'Analytics & Insights',
      description: 'Track regulatory trends and analyze filing patterns with comprehensive reporting tools.',
      details: [
        'Custom dashboard views',
        'Trend analysis',
        'Export capabilities',
        'API access'
      ]
    },
    {
      icon: '⚡',
      title: 'Fast Integration',
      description: 'Connect DocketCC to your existing workflow with our robust API and integrations.',
      details: [
        'REST API access',
        'Webhook notifications',
        'Slack integration',
        'Email system integration'
      ]
    },
    {
      icon: '🎯',
      title: 'Precision Filtering',
      description: 'Advanced filtering and search capabilities to focus on exactly what matters to your organization.',
      details: [
        'Boolean search operators',
        'Date range filtering',
        'Document type filters',
        'Relevance scoring'
      ]
    }
  ];
  
  let activeFeature: number | null = null;
  
  function handleFeatureClick(index: number) {
    activeFeature = activeFeature === index ? null : index;
  }
</script>

<section class="features-section">
  <div class="container">
    <!-- Section Header -->
    <div class="features-header">
      <h2>
        <span class="highlight">Professional-Grade</span> Regulatory Intelligence
      </h2>
      <p>
        Built for legal professionals, policy experts, and enterprise teams who need 
        reliable, comprehensive FCC docket monitoring and analysis.
      </p>
    </div>
    
    <!-- Features Grid -->
    <div class="features-grid">
      {#each features as feature, index}
        <Card 
          variant="feature" 
          hover 
          padding="lg"
          class={feature.popular ? 'popular-feature' : ''}
          on:click={() => handleFeatureClick(index)}
        >
          {#if feature.popular}
            <div class="popular-badge">Most Popular</div>
          {/if}
          
          <div class="feature-content">
            <div class="feature-icon" role="img" aria-label={feature.title}>
              {feature.icon}
            </div>
            
            <h3 class="feature-title">{feature.title}</h3>
            <p class="feature-description">{feature.description}</p>
            
            {#if activeFeature === index}
              <div class="feature-details">
                <h4>Key Features:</h4>
                <ul class="feature-list">
                  {#each feature.details as detail}
                    <li>{detail}</li>
                  {/each}
                </ul>
                <Button variant="outline" size="sm" style="margin-top: 1rem;">
                  Learn More
                </Button>
              </div>
            {:else}
              <button class="expand-button" on:click|stopPropagation={() => handleFeatureClick(index)}>
                <span>View Details</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/>
                </svg>
              </button>
            {/if}
          </div>
        </Card>
      {/each}
    </div>
    
    <!-- Trust Indicators -->
    <div class="trust-section">
      <h3>Trusted by Industry Leaders</h3>
      <div class="trust-grid">
        <div class="trust-item">
          <div class="trust-icon">🏛️</div>
          <div class="trust-content">
            <h4>Government Contractors</h4>
            <p>Meeting compliance requirements for federal projects</p>
          </div>
        </div>
        <div class="trust-item">
          <div class="trust-icon">⚖️</div>
          <div class="trust-content">
            <h4>Legal Firms</h4>
            <p>Regulatory expertise for telecommunications law</p>
          </div>
        </div>
        <div class="trust-item">
          <div class="trust-icon">🏢</div>
          <div class="trust-content">
            <h4>Enterprise Teams</h4>
            <p>Strategic planning and competitive intelligence</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .features-section {
    background: var(--color-surface);
    padding: var(--spacing-3xl) 0;
  }
  
  .features-header {
    text-align: center;
    margin-bottom: var(--spacing-2xl);
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .features-header h2 {
    font-size: 3rem;
    font-weight: var(--font-weight-black);
    color: var(--color-secondary);
    margin-bottom: var(--spacing-md);
    line-height: 1.2;
  }
  
  .highlight {
    color: var(--color-primary);
  }
  
  .features-header p {
    font-size: var(--font-size-xl);
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0;
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-2xl);
  }
  
  .popular-feature {
    position: relative;
  }
  
  .popular-badge {
    position: absolute;
    top: -1px;
    right: var(--spacing-md);
    background: var(--color-primary);
    color: white;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: 0 0 var(--border-radius) var(--border-radius);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    z-index: 10;
  }
  
  .feature-content {
    text-align: center;
    position: relative;
  }
  
  .feature-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);
    display: block;
  }
  
  .feature-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-secondary);
    margin-bottom: var(--spacing-sm);
  }
  
  .feature-description {
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin-bottom: var(--spacing-md);
  }
  
  .feature-details {
    text-align: left;
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-border);
  }
  
  .feature-details h4 {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    margin-bottom: var(--spacing-sm);
  }
  
  .feature-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .feature-list li {
    display: flex;
    align-items: center;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size-sm);
  }
  
  .feature-list li::before {
    content: '✓';
    color: var(--color-primary);
    font-weight: var(--font-weight-bold);
    margin-right: var(--spacing-xs);
    font-size: var(--font-size-sm);
  }
  
  .expand-button {
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: var(--spacing-xs) var(--spacing-sm);
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-normal);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin: 0 auto;
  }
  
  .expand-button:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
  
  .trust-section {
    text-align: center;
    padding-top: var(--spacing-2xl);
    border-top: 1px solid var(--color-border);
  }
  
  .trust-section h3 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-secondary);
    margin-bottom: var(--spacing-xl);
  }
  
  .trust-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-lg);
  }
  
  .trust-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--color-background);
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--color-border);
  }
  
  .trust-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }
  
  .trust-content {
    text-align: left;
  }
  
  .trust-content h4 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-secondary);
    margin-bottom: 0.25rem;
  }
  
  .trust-content p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .features-grid {
      grid-template-columns: 1fr;
    }
    
    .features-header h2 {
      font-size: 2rem;
    }
    
    .trust-grid {
      grid-template-columns: 1fr;
    }
    
    .trust-item {
      flex-direction: column;
      text-align: center;
    }
    
    .trust-content {
      text-align: center;
    }
  }
</style>