<script>
  import HidingNavbar from '$lib/components/layout/HidingNavbar.svelte';
</script>

<svelte:head>
  <title>Mobile Navbar Test - DocketCC</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</svelte:head>

<!-- Only show the navbar for testing -->
<HidingNavbar />

<!-- Add some content to test scroll behavior -->
<div class="test-content">
  <div class="content-section">
    <h1>Mobile Navbar Test</h1>
    <p>This page shows the new mobile navbar with abbreviated labels.</p>
    
    <div class="test-info">
      <h2>📱 Mobile View (≤768px):</h2>
      <ul>
        <li>✅ "About" link is hidden</li>
        <li>✅ "My Subscriptions" shows as "Manage"</li>
        <li>✅ "Pricing" stays the same</li>
        <li>✅ Crisp text with font smoothing</li>
        <li>✅ Perfect alignment and spacing</li>
      </ul>
      
      <h2>🖥️ Desktop View (>768px):</h2>
      <ul>
        <li>✅ All original links visible</li>
        <li>✅ "My Subscriptions" shows full text</li>
        <li>✅ Same behavior as before</li>
      </ul>
    </div>
    
    <div class="scroll-test">
      <h2>🔄 Scroll Test</h2>
      <p>Scroll down to test the hide/show behavior. The navbar should hide when scrolling down and reappear when scrolling up, just like before.</p>
      
      <!-- Add lots of content to enable scrolling -->
      <div class="spacer"></div>
      <p>Scroll down more...</p>
      <div class="spacer"></div>
      <p>Keep scrolling...</p>
      <div class="spacer"></div>
      <p>Almost there...</p>
      <div class="spacer"></div>
      <p>Now scroll back up to see the navbar reappear!</p>
      <div class="spacer"></div>
    </div>
  </div>
</div>

<style>
  .test-content {
    margin-top: 100px; /* Account for fixed navbar */
    padding: 2rem;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .content-section {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }
  
  .test-info {
    background: #f8fafc;
    padding: 1.5rem;
    border-radius: 8px;
    margin: 1.5rem 0;
    border-left: 4px solid #10b981;
  }
  
  .test-info h2 {
    margin-top: 0;
    color: #1f2937;
    font-size: 1.25rem;
  }
  
  .test-info ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }
  
  .test-info li {
    margin: 0.5rem 0;
    color: #374151;
  }
  
  .scroll-test {
    background: #fef3c7;
    padding: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid #f59e0b;
  }
  
  .scroll-test h2 {
    margin-top: 0;
    color: #92400e;
  }
  
  .spacer {
    height: 300px;
    background: linear-gradient(to bottom, #e5e7eb, #f3f4f6);
    margin: 2rem 0;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    font-style: italic;
  }
  
  .spacer::after {
    content: "Scroll content area";
  }
  
  h1 {
    color: #1f2937;
    margin-bottom: 1rem;
  }
  
  p {
    color: #374151;
    line-height: 1.6;
  }
</style> 