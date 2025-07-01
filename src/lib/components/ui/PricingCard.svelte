<script lang="ts">
  export let plan: {
    name: string;
    price: string | number;
    period?: string;
    description: string;
    features: string[];
    buttonText: string;
    buttonType: 'primary' | 'secondary';
    featured?: boolean;
    isFree?: boolean;
  };
  
  export let onSelectPlan: ((planName: string) => void) | undefined = undefined;
  
  $: isFeatured = plan.featured;
  $: displayPrice = plan.isFree ? 'Free' : (typeof plan.price === 'number' ? `$${plan.price}` : plan.price);
</script>

<div class="pricing-card" class:featured={isFeatured}>
  {#if isFeatured}
    <div class="featured-badge">MOST POPULAR</div>
  {/if}
  
  <div class="plan-header">
    <h3 class="plan-name">{plan.name}</h3>
    <p class="plan-description">{plan.description}</p>
    <div class="plan-price">
      {#if plan.isFree}
        <span class="free-badge">{displayPrice}</span>
      {:else}
        <span class="price-amount">{displayPrice}</span>
        {#if plan.period}
          <span class="price-period">/{plan.period}</span>
        {/if}
      {/if}
    </div>
  </div>

  <ul class="features-list">
    {#each plan.features as feature}
      <li>{@html feature}</li>
    {/each}
  </ul>

  <button 
    class="cta-button {plan.buttonType}" 
    on:click={() => onSelectPlan?.(plan.name)}
  >
    {plan.buttonText}
  </button>
</div>

<style>
  .pricing-card {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 3rem;
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    min-height: 600px;
  }

  .pricing-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 50px 100px rgba(0, 0, 0, 0.25);
  }

  .pricing-card.featured {
    border: 2px solid #10b981;
    transform: scale(1.05);
  }

  .pricing-card.featured:hover {
    transform: scale(1.05) translateY(-8px);
  }

  .featured-badge {
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    background: #10b981;
    color: #0f172a;
    padding: 0.75rem;
    font-weight: 700;
    font-size: 0.8rem;
    text-align: center;
    border-radius: 24px 24px 0 0;
  }

  .plan-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .plan-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 0.5rem;
  }

  .plan-description {
    color: #6b7280;
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }

  .plan-price {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.25rem;
    margin-bottom: 2rem;
  }

  .price-amount {
    font-size: 3rem;
    font-weight: 900;
    color: #0f172a;
  }

  .price-period {
    font-size: 1.1rem;
    color: #6b7280;
    font-weight: 600;
  }

  .free-badge {
    font-size: 2.5rem;
    font-weight: 900;
    color: #10b981;
  }

  .features-list {
    list-style: none;
    padding: 0;
    margin-bottom: 2.5rem;
    flex-grow: 1;
  }

  .features-list li {
    display: flex;
    align-items: flex-start;
    margin-bottom: 1rem;
    font-size: 1rem;
    line-height: 1.5;
  }

  .features-list li::before {
    content: '✓';
    color: #10b981;
    font-weight: 700;
    margin-right: 0.75rem;
    font-size: 1.1rem;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  .cta-button {
    width: 100%;
    padding: 1.25rem 2rem;
    font-size: 1.1rem;
    font-weight: 700;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    position: relative;
    overflow: hidden;
  }

  .cta-button.primary {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  .cta-button.secondary {
    background: transparent;
    color: #0f172a;
    border: 2px solid #0f172a;
  }

  .cta-button:hover {
    transform: translateY(-3px);
  }

  .cta-button.primary:hover {
    box-shadow: 0 20px 40px rgba(16, 185, 129, 0.4);
  }

  .cta-button.secondary:hover {
    background: #0f172a;
    color: white;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.3);
  }

  .cta-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }

  .cta-button:hover::before {
    left: 100%;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .pricing-card {
      padding: 2rem 1.5rem;
      min-height: auto;
    }

    .pricing-card.featured {
      transform: none;
    }

    .pricing-card.featured:hover {
      transform: translateY(-8px);
    }

    .price-amount {
      font-size: 2.5rem;
    }

    .free-badge {
      font-size: 2rem;
    }
  }
</style> 