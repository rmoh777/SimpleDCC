<script lang="ts">
  import PricingCard from '$lib/components/ui/PricingCard.svelte';
  import FAQSection from '$lib/components/sections/FAQSection.svelte';
  
  const plans = [
    {
      name: 'Free',
      price: 0,
      description: 'Perfect for getting started with FCC monitoring',
      features: [
        '<strong>1 docket subscription</strong>',
        'Daily or weekly notification frequency',
        'Real-time filing alerts',
        'Basic email notifications',
        'Standard support'
      ],
      buttonText: 'Start Free Monitoring',
      buttonType: 'secondary' as const,
      isFree: true
    },
    {
      name: 'Pro',
      price: 2.99,
      period: 'month',
      description: 'Complete regulatory intelligence for professionals',
      features: [
        '<strong>Unlimited docket subscriptions</strong>',
        '<span style="background: linear-gradient(135deg, #10b981, #059669); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 600;">AI overview summaries</span> - who, what, when, where, why',
        'Real-time filing alerts',
        'Daily or weekly notifications',
        'Priority support'
      ],
      buttonText: 'Start Pro Monitoring',
      buttonType: 'primary' as const,
      featured: true
    }
  ];
  
  function handlePlanSelection(planName: string) {
    switch (planName) {
      case 'Free':
        alert('Redirecting to free docket monitoring signup...');
        break;
      case 'Pro':
        alert('Redirecting to Pro monitoring signup...');
        break;
      default:
        alert(`You selected the ${planName} plan!`);
    }
  }
</script>

<svelte:head>
  <title>DocketCC - Pricing Plans (Fixed)</title>
  <meta name="description" content="Choose Your Intelligence Plan - Exact replica of the HTML design" />
</svelte:head>

<div class="pricing-page">
  <!-- Service Banner -->
  <div class="gov-banner">
    <span class="flag">📡</span>
    Independent FCC docket monitoring and intelligence service
  </div>

  <!-- Header -->
  <header class="header">
    <nav class="nav">
      <div class="logo-section">
        <div class="logo-graphic">
          <div class="icon">📡</div>
          <div class="text">Docket<span class="cc">CC</span></div>
        </div>
      </div>
      <ul class="nav-links">
        <li><a href="#">About</a></li>
        <li><a href="#">My Subscriptions</a></li>
        <li><a href="#" class="active">Pricing</a></li>
      </ul>
    </nav>
  </header>

  <!-- Hero Section -->
  <section class="pricing-hero">
    <h1>Choose Your <span class="highlight">Intelligence</span> Plan</h1>
    <p class="subtitle">
      Start monitoring FCC proceedings for free, or unlock the full power of AI-driven 
      regulatory intelligence with unlimited docket tracking and overview summaries.
    </p>
  </section>

  <!-- Pricing Cards -->
  <section class="pricing-section">
    <div class="pricing-grid">
      {#each plans as plan}
        <PricingCard {plan} onSelectPlan={handlePlanSelection} />
      {/each}
    </div>
  </section>

  <!-- FAQ Section -->
  <FAQSection />

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-grid">
        <div class="footer-brand">
          <h3>DocketCC</h3>
          <p>Professional FCC docket monitoring and intelligence service trusted by legal professionals, regulatory experts, and enterprise teams nationwide.</p>
          <p style="color: #10b981; font-weight: 600;">Stay ahead of regulatory changes that impact your business.</p>
        </div>
        
        <div class="footer-section">
          <h4>Product</h4>
          <a href="#">Features</a>
          <a href="#">Pricing</a>
          <a href="#">API Access</a>
          <a href="#">Enterprise</a>
          <a href="#">Security</a>
        </div>
        
        <div class="footer-section">
          <h4>Resources</h4>
          <a href="#">Documentation</a>
          <a href="#">FCC Guide</a>
          <a href="#">Best Practices</a>
          <a href="#">Case Studies</a>
          <a href="#">Blog</a>
        </div>
        
        <div class="footer-section">
          <h4>Support</h4>
          <a href="#">Help Center</a>
          <a href="#">Contact Support</a>
          <a href="#">System Status</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; 2024 DocketCC. Professional regulatory intelligence service. Not affiliated with the Federal Communications Commission.</p>
      </div>
    </div>
  </footer>
</div>

<style>
  .pricing-page {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #1f2937;
    min-height: 100vh;
  }

  /* Government banner */
  .gov-banner {
    background: #0f172a;
    color: white;
    padding: 0.5rem 0;
    font-size: 0.85rem;
    text-align: center;
    border-bottom: 1px solid #334155;
  }

  .gov-banner .flag {
    display: inline-block;
    margin-right: 0.5rem;
  }

  /* Header */
  .header {
    background: rgba(255,255,255,0.98);
    backdrop-filter: blur(20px);
    padding: 1rem 0;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 4px solid #10b981;
  }

  .nav {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .logo-graphic {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .logo-graphic .icon {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .logo-graphic .text {
    font-size: 1.6rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
  }

  .logo-graphic .text .cc {
    color: #10b981;
  }

  .nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
  }

  .nav-links a {
    color: #374151;
    text-decoration: none;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .nav-links a:hover, .nav-links a.active {
    background: #0f172a;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.3);
  }

  /* Hero section */
  .pricing-hero {
    padding: 4rem 2rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
  }

  .pricing-hero h1 {
    font-size: 3.5rem;
    font-weight: 900;
    color: white;
    line-height: 1.1;
    margin-bottom: 1.5rem;
    text-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }

  .pricing-hero .highlight {
    color: #10b981;
    text-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
  }

  .pricing-hero .subtitle {
    font-size: 1.3rem;
    color: rgba(255,255,255,0.9);
    margin-bottom: 3rem;
    line-height: 1.6;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }

  /* Pricing Cards Section */
  .pricing-section {
    padding: 2rem;
    max-width: 1000px;
    margin: 0 auto;
  }

  .pricing-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    align-items: start;
  }

  /* Footer */
  .footer {
    background: #0f172a;
    color: white;
    padding: 4rem 2rem 2rem;
  }

  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 3rem;
    margin-bottom: 3rem;
  }

  .footer-brand h3 {
    color: #10b981;
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 1rem;
  }

  .footer-brand p {
    color: rgba(255,255,255,0.8);
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }

  .footer-section h4 {
    color: white;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  .footer-section a {
    color: rgba(255,255,255,0.7);
    text-decoration: none;
    display: block;
    margin-bottom: 0.5rem;
    transition: color 0.3s;
  }

  .footer-section a:hover {
    color: #10b981;
  }

  .footer-bottom {
    border-top: 1px solid #334155;
    padding-top: 2rem;
    text-align: center;
    color: rgba(255,255,255,0.6);
    font-size: 0.9rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .pricing-hero h1 {
      font-size: 2.5rem;
    }

    .pricing-hero .subtitle {
      font-size: 1.1rem;
    }

    .pricing-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .nav-links {
      gap: 1rem;
    }

    .nav-links a {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    .footer-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .pricing-section {
      padding: 2rem 1rem;
    }
  }
</style> 