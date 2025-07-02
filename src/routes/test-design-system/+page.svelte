<script>
  // Example data for testing (matches MonitoringStats interface)
  const mockStats = {
    systemHealth: 'healthy',
    activeJobs: 42,
    lastCheck: Date.now(),
    totalFilings: 1337
  };
</script>

<div class="test-container">
  <h1>Design System Foundation Test</h1>
  <p class="text-secondary">Testing the emerald-themed design system components</p>
  
  <!-- Card Components -->
  <section>
    <h2>Card Components</h2>
    <div class="grid">
      <div class="card-base card-hover card-padding-md">
        <h3>Basic Card</h3>
        <p class="text-secondary">This is a basic card with hover effect</p>
      </div>
      
      <div class="card-base card-padding-sm">
        <h3>Compact Card</h3>
        <p class="text-muted">Smaller padding for compact layouts</p>
      </div>
      
      <div class="card-base card-padding-lg">
        <h3>Spacious Card</h3>
        <p>More padding for detailed content</p>
      </div>
    </div>
  </section>
  
  <!-- Button Components -->
  <section>
    <h2>Button Components</h2>
    <div class="button-group">
      <button class="btn-base btn-primary btn-lg">Primary Large</button>
      <button class="btn-base btn-primary btn-md">Primary Medium</button>
      <button class="btn-base btn-primary btn-sm">Primary Small</button>
    </div>
    <div class="button-group">
      <button class="btn-base btn-secondary btn-lg">Secondary Large</button>
      <button class="btn-base btn-secondary btn-md">Secondary Medium</button>
      <button class="btn-base btn-secondary btn-sm">Secondary Small</button>
    </div>
  </section>
  
  <!-- Status Indicators -->
  <section>
    <h2>Status Indicators</h2>
    <div class="status-grid">
      <div class="status-success card-padding-sm rounded-base">
        <strong>System Health:</strong> {mockStats.systemHealth}
      </div>
      <div class="status-info card-padding-sm rounded-base">
        <strong>Active Jobs:</strong> {mockStats.activeJobs}
      </div>
      <div class="status-warning card-padding-sm rounded-base">
        <strong>Last Check:</strong> {new Date(mockStats.lastCheck).toLocaleString()}
      </div>
      <div class="status-error card-padding-sm rounded-base">
        <strong>Total Filings:</strong> {mockStats.totalFilings}
      </div>
    </div>
  </section>
  
  <!-- Typography -->
  <section>
    <h2>Typography Scale</h2>
    <div class="card-base card-padding-md">
      <h1>Heading 1 - 3xl</h1>
      <h2>Heading 2 - 2xl</h2>
      <h3>Heading 3 - xl</h3>
      <p class="text-primary">Primary text color</p>
      <p class="text-secondary">Secondary text color</p>
      <p class="text-muted">Muted text color</p>
    </div>
  </section>
</div>

<style>
  .test-container {
    max-width: var(--max-width-content);
    margin: 0 auto;
    padding: var(--spacing-8);
  }
  
  section {
    margin-bottom: var(--spacing-12);
  }
  
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-6);
    margin-top: var(--spacing-6);
  }
  
  .button-group {
    display: flex;
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-4);
    flex-wrap: wrap;
  }
  
  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
    margin-top: var(--spacing-6);
  }
</style> 