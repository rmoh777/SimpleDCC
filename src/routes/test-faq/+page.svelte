<script lang="ts">
  import FAQSection from '$lib/components/sections/FAQSection.svelte';
  
  const customFAQs = [
    {
      question: "How does DocketCC compare to other regulatory monitoring services?",
      answer: "DocketCC specializes specifically in FCC filings with AI-powered summaries, real-time notifications within 5-15 minutes, and a user-friendly interface designed for both legal professionals and general users. Unlike generic legal databases, we focus exclusively on telecommunications regulatory matters."
    },
    {
      question: "What types of FCC proceedings can I monitor?",
      answer: "You can monitor all types of FCC proceedings including rulemaking dockets, enforcement actions, spectrum auctions, merger reviews, licensing proceedings, and policy statements. Our system tracks everything from major telecom policy changes to local broadcast licensing."
    },
    {
      question: "Can I get alerts for specific keywords or topics?",
      answer: "Yes! Pro users can set up custom keyword alerts, topic filters, and specific participant monitoring. For example, you can receive notifications whenever your company is mentioned, specific technologies are discussed, or certain legal issues arise."
    }
  ];
</script>

<div style="padding: 2rem 0; background: #f8fafc;">
  <div class="container" style="padding: 2rem;">
    <h1>FAQ Section Component Tests</h1>
    
    <section style="margin: 2rem 0;">
      <h2>Default FAQ Section</h2>
      <FAQSection />
    </section>
    
    <section style="margin: 2rem 0;">
      <h2>Custom FAQ Section</h2>
      <FAQSection 
        faqs={customFAQs}
        title="Custom FAQ Test"
        subtitle="Testing the FAQ component with custom questions and title"
      />
    </section>
    
    <section style="margin: 2rem 0;">
      <h2>FAQ Section with Custom Styling</h2>
      <div style="background: white; border-radius: 1rem; padding: 2rem; margin: 1rem 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <FAQSection 
          faqs={customFAQs.slice(0, 2)}
          title="Pricing FAQ"
          subtitle="Quick answers about our pricing plans"
        />
      </div>
    </section>
  </div>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  h1 {
    color: #0f172a;
    margin-bottom: 2rem;
  }
  
  h2 {
    color: #374151;
    margin: 2rem 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #10b981;
  }
</style> 