<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  
  let searchQuery = '';
  let isSearching = false;
  
  async function handleSearch() {
    if (!searchQuery.trim()) return;
    
    isSearching = true;
    try {
      // This would integrate with existing search functionality
      console.log('Searching for:', searchQuery);
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      isSearching = false;
    }
  }
  
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSearch();
    }
  }
</script>

<section class="hero">
  <div class="hero-background">
    <!-- Background gradient with subtle pattern -->
  </div>
  
  <div class="container">
    <div class="hero-grid">
      <!-- Left: Content -->
      <div class="hero-content">
        <h1 class="hero-title">
          Monitor FCC Filings with <span class="highlight">AI Intelligence</span>
        </h1>
        
        <p class="hero-subtitle">
          Stay ahead of regulatory changes. Get AI-powered summaries of FCC docket 
          filings delivered to your inbox. Never miss important telecommunications policy 
          updates again.
        </p>
        
        <div class="authority-badge">
          <div class="authority-icon">🏛️</div>
          <div class="authority-content">
            <h3>Trusted by Regulatory Professionals</h3>
            <p>Government-grade monitoring for legal teams, policy experts, and enterprise compliance departments.</p>
          </div>
        </div>
        
        <div class="hero-stats">
          <div class="stat">
            <div class="stat-number">2,500+</div>
            <div class="stat-label">Active Dockets Monitored</div>
          </div>
          <div class="stat">
            <div class="stat-number">15,000+</div>
            <div class="stat-label">Regulatory Updates Sent</div>
          </div>
          <div class="stat">
            <div class="stat-number">99.9%</div>
            <div class="stat-label">Uptime Reliability</div>
          </div>
        </div>
      </div>
      
      <!-- Right: Search Card -->
      <div class="hero-form">
        <Card variant="default" padding="lg" elevation="lg">
          <div class="search-card-header">
            <h2>Start Monitoring Dockets</h2>
            <p>Enter a docket number or search term to begin tracking FCC filings</p>
          </div>
          
          <div class="search-form">
            <div class="search-input-group">
              <label for="docket-search" class="search-label">
                Docket Number or Keywords
              </label>
              <input
                id="docket-search"
                type="text"
                class="search-input"
                placeholder="e.g., 21-402 or broadband policy"
                bind:value={searchQuery}
                on:keypress={handleKeyPress}
                disabled={isSearching}
              />
            </div>
            
            <Button 
              variant="primary" 
              size="lg" 
              loading={isSearching}
              disabled={!searchQuery.trim() || isSearching}
              on:click={handleSearch}
              style="width: 100%; margin-top: 1rem;"
            >
              {isSearching ? 'Searching...' : 'Start Monitoring'}
            </Button>
          </div>
          
          <div class="search-examples">
            <p class="examples-label">Popular searches:</p>
            <div class="example-tags">
              <button class="example-tag" on:click={() => searchQuery = '21-402'}>21-402</button>
              <button class="example-tag" on:click={() => searchQuery = 'broadband'}>Broadband</button>
              <button class="example-tag" on:click={() => searchQuery = 'net neutrality'}>Net Neutrality</button>
              <button class="example-tag" on:click={() => searchQuery = '5G'}>5G Policy</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    padding: var(--spacing-3xl) 0;
    min-height: 80vh;
    display: flex;
    align-items: center;
    overflow: hidden;
  }
  
  .hero-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, var(--color-secondary) 0%, #1e293b 100%);
    z-index: -1;
  }
  
  .hero-background::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
  }
  
  .hero-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-xl);
    align-items: center;
    min-height: 70vh;
  }
  
  .hero-content {
    color: white;
  }
  
  .hero-title {
    font-size: 3.5rem;
    font-weight: var(--font-weight-black);
    line-height: 1.1;
    margin-bottom: var(--spacing-md);
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  
  .highlight {
    color: var(--color-primary);
    text-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
  }
  
  .hero-subtitle {
    font-size: var(--font-size-xl);
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: var(--spacing-lg);
    line-height: 1.6;
  }
  
  .authority-badge {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    border-left: 4px solid var(--color-primary);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }
  
  .authority-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }
  
  .authority-content h3 {
    color: var(--color-primary);
    font-size: var(--font-size-lg);
    margin-bottom: 0.5rem;
    font-weight: var(--font-weight-bold);
  }
  
  .authority-content p {
    color: rgba(255, 255, 255, 0.8);
    font-size: var(--font-size-sm);
    margin: 0;
  }
  
  .hero-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
    margin-top: var(--spacing-lg);
  }
  
  .stat {
    text-align: center;
  }
  
  .stat-number {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-black);
    color: var(--color-primary);
    line-height: 1;
  }
  
  .stat-label {
    font-size: var(--font-size-sm);
    color: rgba(255, 255, 255, 0.7);
    margin-top: 0.25rem;
  }
  
  .search-card-header {
    text-align: center;
    margin-bottom: var(--spacing-lg);
  }
  
  .search-card-header h2 {
    color: var(--color-secondary);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-sm);
  }
  
  .search-card-header p {
    color: var(--color-text-secondary);
    margin: 0;
  }
  
  .search-label {
    display: block;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size-sm);
  }
  
  .search-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 2px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    font-size: var(--font-size-base);
    font-family: var(--font-family);
    transition: all var(--transition-normal);
    background: var(--color-surface);
  }
  
  .search-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
  
  .search-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .search-examples {
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-border);
  }
  
  .examples-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-xs);
  }
  
  .example-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }
  
  .example-tag {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: 0.25rem var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .example-tag:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .hero-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
      text-align: center;
    }
    
    .hero-title {
      font-size: 2.5rem;
    }
    
    .hero-stats {
      grid-template-columns: 1fr;
      gap: var(--spacing-sm);
    }
    
    .authority-badge {
      flex-direction: column;
      text-align: center;
      gap: var(--spacing-sm);
    }
  }
</style> 