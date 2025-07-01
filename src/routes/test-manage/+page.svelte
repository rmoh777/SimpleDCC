<script>
  import ManageSubscriptions from '$lib/components/ManageSubscriptions.svelte';
</script>

<svelte:head>
  <title>ManageSubscriptions Component Test</title>
</svelte:head>

<div class="container" style="padding: 2rem; min-height: 100vh; background: var(--color-background);">
  <h1 style="margin-bottom: 2rem; color: var(--color-secondary);">ManageSubscriptions Component Tests</h1>
  
  <section style="margin: 2rem 0;">
    <h2 style="color: var(--color-text-primary); margin-bottom: 1rem;">Full Component</h2>
    <div style="max-width: 800px;">
      <ManageSubscriptions />
    </div>
  </section>
  
  <section style="margin: 2rem 0;">
    <h2 style="color: var(--color-text-primary); margin-bottom: 1rem;">Compact Version</h2>
    <div style="max-width: 600px;">
      <ManageSubscriptions compact={true} />
    </div>
  </section>
  
  <section style="margin: 2rem 0; padding: 1rem; background: var(--color-surface); border-radius: var(--border-radius); border: 1px solid var(--color-border);">
    <h2 style="color: var(--color-text-primary); margin-bottom: 1rem;">Test Instructions</h2>
    <ul style="color: var(--color-text-secondary); line-height: 1.6;">
      <li>Test email lookup with valid and invalid email addresses</li>
      <li>Verify subscription list displays correctly after successful lookup</li>
      <li>Test unsubscribe functionality for individual dockets</li>
      <li>Verify loading states work for both lookup and unsubscribe</li>
      <li>Test empty state when no subscriptions are found</li>
      <li>Test responsive layout on mobile (input group should stack)</li>
      <li>Verify upgrade link to pricing page works</li>
      <li>Check that Enter key triggers lookup</li>
      <li>Verify message auto-clear after 5 seconds for success messages</li>
    </ul>
  </section>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  h1 {
    font-size: 2.5rem;
    font-weight: var(--font-weight-bold);
  }
  
  h2 {
    font-size: 1.5rem;
    font-weight: var(--font-weight-semibold);
  }
  
  ul {
    margin: 0;
    padding-left: 1.5rem;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
</style> 