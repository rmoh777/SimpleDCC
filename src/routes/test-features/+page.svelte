<script>
  import FeaturesSection from '$lib/components/sections/FeaturesSection.svelte';
</script>

<svelte:head>
  <title>Features Section Test - DocketCC</title>
</svelte:head>

<div class="test-page">
  <div style="padding: 2rem 0; text-align: center; background: var(--color-background);">
    <h1>Features Section Test</h1>
    <p>Testing the interactive features section component</p>
  </div>
  
  <FeaturesSection />
  
  <div style="padding: 2rem; text-align: center; background: var(--color-background);">
    <h2>Test Checklist</h2>
    <ul style="text-align: left; max-width: 600px; margin: 0 auto; list-style: none;">
      <li>📡 Verify "Most Popular" badge appears on Real-time Docket Monitoring</li>
      <li>👆 Click feature cards to expand/collapse details</li>
      <li>📋 Test "View Details" buttons show feature lists with checkmarks</li>
      <li>🔗 Test "Learn More" buttons in expanded state</li>
      <li>🏛️ Verify trust indicators section displays at bottom</li>
      <li>📱 Test responsive behavior on mobile (resize window)</li>
    </ul>
  </div>
</div>

<style>
  .test-page {
    min-height: 100vh;
  }
</style> 