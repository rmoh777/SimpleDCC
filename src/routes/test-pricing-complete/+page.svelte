<script lang="ts">
  import PricingCard from '$lib/components/ui/PricingCard.svelte';
  import FAQSection from '$lib/components/sections/FAQSection.svelte';
  
  const plans = [
    {
      name: 'Free',
      price: 0,
      period: 'month',
      description: 'Perfect for getting started with FCC docket monitoring',
      features: [
        'Monitor up to 3 dockets',
        'Email notifications',
        'Basic search functionality',
        'Community support',
        'Standard security'
      ],
      buttonText: 'Start Free',
      buttonVariant: 'outline' as const
    },
    {
      name: 'Pro',
      price: 49,
      period: 'month',
      description: 'For regulatory professionals who need comprehensive monitoring',
      features: [
        'Unlimited docket monitoring',
        'AI-powered summaries',
        'SMS & email notifications',
        'Advanced search & filtering',
        'Priority support',
        'API access',
        'Custom reports',
        'Team collaboration'
      ],
      buttonText: 'Start Pro Trial',
      buttonVariant: 'primary' as const,
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations with complex regulatory needs',
      features: [
        'Everything in Pro',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantees',
        'Advanced analytics',
        'Bulk user management',
        'Custom training',
        'White-label options'
      ],
      buttonText: 'Contact Sales',
      buttonVariant: 'secondary' as const,
      enterprise: true
    }
  ];
  
  const pricingFAQs = [
    {
      question: "How does the free plan work?",
      answer: "The free plan allows you to monitor up to 3 FCC dockets with basic email notifications. You'll receive updates when new filings are published, but won't have access to AI summaries or advanced filtering."
    },
    {
      question: "What makes the Pro plan worth $49/month?",
      answer: "The Pro plan includes unlimited docket monitoring, AI-powered summaries that save hours of reading time, SMS notifications for urgent updates, advanced search capabilities, API access, and priority support."
    },
    {
      question: "Is there really a free trial with no credit card required?",
      answer: "Yes! You can start a 14-day free trial of the Pro plan without providing a credit card. You'll have full access to all Pro features during the trial period."
    },
    {
      question: "Can I cancel my Pro subscription anytime?",
      answer: "Absolutely. You can cancel your Pro subscription at any time through your account dashboard. No cancellation fees or penalties."
    },
    {
      question: "What's included in Enterprise pricing?",
      answer: "Enterprise plans are customized based on your organization's needs. This typically includes everything in Pro plus dedicated account management, custom integrations, SLA guarantees, and advanced analytics."
    }
  ];
  
  function handlePlanSelection(planName: string) {
    console.log('Selected plan:', planName);
    
    // Simulate different actions based on plan
    switch (planName) {
      case 'Free':
        alert('🎉 Welcome to DocketCC Free! You can start monitoring up to 3 dockets immediately.');
        break;
      case 'Pro':
        alert('🚀 Starting your 14-day Pro trial! No credit card required.');
        break;
      case 'Enterprise':
        alert('📞 Our sales team will contact you within 24 hours to discuss your Enterprise needs.');
        break;
      default:
        alert(`You selected the ${planName} plan!`);
    }
  }
</script>

<svelte:head>
  <title>DocketCC Pricing - Complete Test</title>
  <meta name="description" content="Test page for DocketCC pricing components" />
</svelte:head>

<div class="pricing-page">
  <!-- Hero Section -->
  <section class="pricing-hero">
    <div class="container">
      <div class="hero-content">
        <h1 class="hero-title">Choose Your Plan</h1>
        <p class="hero-subtitle">
          Professional FCC docket monitoring tailored to your needs. 
          Start with our free plan or unlock advanced features with Pro.
        </p>
        <div class="hero-badge">
          <span class="badge-icon">🎯</span>
          <span class="badge-text">14-day free trial • No credit card required</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing Cards Section -->
  <section class="pricing-section">
    <div class="container">
      <div class="pricing-grid">
        {#each plans as plan}
          <PricingCard {plan} onSelectPlan={handlePlanSelection} />
        {/each}
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <FAQSection 
    faqs={pricingFAQs}
    title="Frequently Asked Questions"
    subtitle="Get answers to common questions about DocketCC pricing and features"
  />

  <!-- Bottom CTA Section -->
  <section class="bottom-cta">
    <div class="container">
      <div class="cta-content">
        <h2 class="cta-title">Ready to get started?</h2>
        <p class="cta-text">
          Join thousands of regulatory professionals who trust DocketCC 
          for timely, accurate FCC filing notifications.
        </p>
        <div class="cta-buttons">
          <button class="cta-button cta-button--primary" on:click={() => handlePlanSelection('Pro')}>
            Start Free Trial
          </button>
          <button class="cta-button cta-button--secondary" on:click={() => handlePlanSelection('Enterprise')}>
            Talk to Sales
          </button>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  .pricing-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  }

  .container {
    max-width: var(--max-width-content);
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
  }

  /* Hero Section */
  .pricing-hero {
    padding: var(--spacing-3xl) 0 var(--spacing-2xl);
    text-align: center;
  }

  .hero-content {
    max-width: 700px;
    margin: 0 auto;
  }

  .hero-title {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-black);
    color: var(--color-secondary);
    margin-bottom: var(--spacing-md);
    line-height: 1.1;
  }

  .hero-subtitle {
    font-size: var(--font-size-xl);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-lg);
    line-height: 1.5;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    background: var(--color-primary-light);
    color: var(--color-primary);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius-xl);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
  }

  .badge-icon {
    font-size: var(--font-size-base);
  }

  /* Pricing Section */
  .pricing-section {
    padding: var(--spacing-2xl) 0;
  }

  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: var(--spacing-xl);
    align-items: start;
  }

  /* Bottom CTA */
  .bottom-cta {
    padding: var(--spacing-3xl) 0;
    background: var(--color-secondary);
    color: white;
    text-align: center;
  }

  .cta-content {
    max-width: 600px;
    margin: 0 auto;
  }

  .cta-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-md);
  }

  .cta-text {
    font-size: var(--font-size-lg);
    opacity: 0.9;
    margin-bottom: var(--spacing-xl);
    line-height: 1.6;
  }

  .cta-buttons {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
    flex-wrap: wrap;
  }

  .cta-button {
    padding: var(--spacing-md) var(--spacing-xl);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    border: 2px solid transparent;
    border-radius: var(--border-radius-lg);
    cursor: pointer;
    transition: all var(--transition-normal);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 160px;
  }

  .cta-button--primary {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  .cta-button--primary:hover {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .cta-button--secondary {
    background: transparent;
    color: white;
    border-color: white;
  }

  .cta-button--secondary:hover {
    background: white;
    color: var(--color-secondary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .hero-title {
      font-size: var(--font-size-3xl);
    }

    .hero-subtitle {
      font-size: var(--font-size-lg);
    }

    .pricing-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }

    .cta-buttons {
      flex-direction: column;
      align-items: center;
    }

    .cta-button {
      width: 100%;
      max-width: 280px;
    }
  }
</style> 