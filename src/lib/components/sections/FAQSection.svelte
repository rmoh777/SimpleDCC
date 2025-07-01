<script lang="ts">
  interface FAQ {
    question: string;
    answer: string;
  }
  
  export let faqs: FAQ[] = [
    {
      question: "What's included in the AI overview summaries?",
      answer: "Our AI analyzes each filing to provide clear summaries covering the essential elements: who filed it, what they're requesting, when it was submitted, where it applies, and why it matters to the proceeding."
    },
    {
      question: "How quickly will I receive notifications?",
      answer: "Free users receive daily or weekly digest emails. Pro users get the same frequency options but with enhanced AI summaries included in each notification."
    },
    {
      question: "Can I upgrade or downgrade my plan?",
      answer: "Yes, you can upgrade from Free to Pro at any time. Pro users can cancel their subscription and continue with free monitoring of one docket."
    },
    {
      question: "What does \"unlimited\" mean for Pro subscriptions?",
      answer: "Pro users can monitor as many FCC dockets as needed for professional use. Fair use policies apply to ensure service quality for all users."
    },
    {
      question: "How do I cancel my Pro subscription?",
      answer: "You can cancel your Pro subscription at any time through your account dashboard. You'll continue to have Pro access until the end of your billing period, then automatically move to the Free plan."
    }
  ];
  
  export let title: string = "Frequently Asked Questions";
  export let subtitle: string = "";
</script>

<section class="faq-section">
  <div class="faq-container">
    <div class="faq-header">
      <h2>{title}</h2>
      {#if subtitle}
        <p class="faq-subtitle">{subtitle}</p>
      {/if}
    </div>
    
    {#each faqs as faq}
      <div class="faq-item">
        <h3 class="faq-question">{faq.question}</h3>
        <p class="faq-answer">{faq.answer}</p>
      </div>
    {/each}
  </div>
</section>

<style>
  .faq-section {
    background: white;
    padding: 4rem 2rem;
    margin-top: 4rem;
  }

  .faq-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .faq-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .faq-header h2 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 1rem;
  }

  .faq-subtitle {
    font-size: 1.2rem;
    color: #6b7280;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .faq-item {
    border-bottom: 1px solid #e5e7eb;
    padding: 1.5rem 0;
  }

  .faq-question {
    font-size: 1.1rem;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 0.75rem;
    margin: 0 0 0.75rem 0;
  }

  .faq-answer {
    color: #6b7280;
    line-height: 1.6;
    margin: 0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .faq-section {
      padding: 3rem 1rem;
    }

    .faq-header h2 {
      font-size: 2rem;
    }

    .faq-subtitle {
      font-size: 1rem;
    }

    .faq-question {
      font-size: 1rem;
    }

    .faq-answer {
      font-size: 0.9rem;
    }
  }
</style> 