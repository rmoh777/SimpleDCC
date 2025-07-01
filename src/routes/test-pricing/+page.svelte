<script lang="ts">
  import PricingCard from '$lib/components/ui/PricingCard.svelte';
  
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
  
  function handlePlanSelection(planName: string) {
    console.log('Selected plan:', planName);
    alert(`You selected the ${planName} plan!`);
  }
</script>

<div class="container" style="padding: 2rem;">
  <h1>Pricing Card Component Tests</h1>
  
  <section style="margin: 2rem 0;">
    <h2>All Plans</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 2rem 0;">
      {#each plans as plan}
        <PricingCard {plan} onSelectPlan={handlePlanSelection} />
      {/each}
    </div>
  </section>
  
  <section style="margin: 2rem 0;">
    <h2>Individual Plan Tests</h2>
    
    <h3>Popular Plan (Pro)</h3>
    <div style="max-width: 400px; margin: 1rem 0;">
      <PricingCard plan={plans[1]} onSelectPlan={handlePlanSelection} />
    </div>
    
    <h3>Enterprise Plan</h3>
    <div style="max-width: 400px; margin: 1rem 0;">
      <PricingCard plan={plans[2]} onSelectPlan={handlePlanSelection} />
    </div>
  </section>
</div> 