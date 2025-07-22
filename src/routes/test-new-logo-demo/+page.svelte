<script lang="ts">
  import { onMount } from 'svelte';
  
  let docketSearch = '';
  let emailInput = '';
  let selectedDocket = '';
  let selectedName = '';
  let showSuggestions = false;
  let showPreview = false;
  let showEmailSection = false;
  let isSubscribing = false;
  let subscriptionStatus = '';
  let currentStep = 1;
  
  const mockSuggestions = [
    { number: '02-6', name: 'Schools and Libraries Universal Service Support Mechanism' },
    { number: '21-450', name: 'Affordable Connectivity Program' },
    { number: '11-42', name: 'Connect America Fund/Universal Service Reform' }
  ];
  
  function handleSearchInput() {
    if (docketSearch.length > 0) {
      showSuggestions = true;
      currentStep = 1;
    } else {
      showSuggestions = false;
      currentStep = 1;
    }
  }
  
  function selectDocket(docket: any) {
    docketSearch = docket.number;
    selectedDocket = docket.number;
    selectedName = docket.name;
    showSuggestions = false;
    showPreview = true;
    showEmailSection = true;
    currentStep = 2;
  }
  
  function hidePreview() {
    showPreview = false;
    showEmailSection = false;
    selectedDocket = '';
    selectedName = '';
    currentStep = 1;
  }
  
  async function subscribe() {
    if (!emailInput || !selectedDocket) return;
    
    isSubscribing = true;
    currentStep = 3;
    
    // Simulate subscription
    setTimeout(() => {
      subscriptionStatus = 'success';
      currentStep = 4;
      isSubscribing = false;
    }, 2000);
  }
</script>

<svelte:head>
  <title>DocketCC - New Logo Demo - FCC Docket Monitoring Service</title>
  <meta name="description" content="Demo showcasing the new professional folder-based logo design for DocketCC" />
</svelte:head>

<!-- Demo Navbar with New Logo -->
<header class="demo-header">
  <div class="container">
    <nav class="nav">
      <div class="logo-section">
        <a href="/" class="logo-link">
          <div class="new-logo">
            <!-- New Professional Folder Icon -->
            <div class="folder-icon">
              <div class="folder-tab"></div>
              <div class="folder-back"></div>
              <div class="folder-front"></div>
              <div class="documents">
                <div class="doc doc1">
                  <div class="doc-lines">
                    <div class="doc-line"></div>
                    <div class="doc-line"></div>
                    <div class="doc-line"></div>
                  </div>
                </div>
                <div class="doc doc2">
                  <div class="doc-lines">
                    <div class="doc-line"></div>
                    <div class="doc-line"></div>
                    <div class="doc-line"></div>
                  </div>
                </div>
                <div class="doc doc3">
                  <div class="doc-lines">
                    <div class="doc-line"></div>
                    <div class="doc-line"></div>
                    <div class="doc-line"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="logo-text">
              Docket<span class="logo-cc">CC</span>
            </div>
          </div>
        </a>
      </div>
      
      <div class="nav-links">
        <a href="/about" class="nav-link">About</a>
        <a href="/manage" class="nav-link">My Subscriptions</a>
        <a href="/pricing" class="nav-link">Pricing</a>
      </div>
    </nav>
  </div>
</header>

<!-- Hero Section with Large New Logo -->
<section class="hero">
  <div class="hero-container">
    <div class="hero-content">
      <!-- Large Hero Logo -->
      <div class="hero-logo">
        <div class="hero-folder-icon">
          <div class="hero-folder-tab"></div>
          <div class="hero-folder-back"></div>
          <div class="hero-folder-front"></div>
          <div class="hero-documents">
            <div class="hero-doc hero-doc1">
              <div class="hero-doc-lines">
                <div class="hero-doc-line"></div>
                <div class="hero-doc-line"></div>
                <div class="hero-doc-line"></div>
              </div>
            </div>
            <div class="hero-doc hero-doc2">
              <div class="hero-doc-lines">
                <div class="hero-doc-line"></div>
                <div class="hero-doc-line"></div>
                <div class="hero-doc-line"></div>
              </div>
            </div>
            <div class="hero-doc hero-doc3">
              <div class="hero-doc-lines">
                <div class="hero-doc-line"></div>
                <div class="hero-doc-line"></div>
                <div class="hero-doc-line"></div>
              </div>
            </div>
          </div>
        </div>
        <h1>Docket<span class="highlight">CC</span></h1>
      </div>
      
      <p class="subtitle">
        Independent monitoring service for Federal Communications Commission proceedings. 
        Stay informed with automated alerts and AI-powered analysis of FCC filings.
      </p>
      
      <div class="authority">
        <h3>Professional Monitoring Service</h3>
        <p>
          Access real-time FCC filing notifications with enterprise-grade reliability 
          and advanced security standards.
        </p>
      </div>
    </div>

    <div class="search-card">
      <!-- Progress Bar -->
      <div class="progress-stepper">
        <div class="progress-container">
          <div class="progress-fill" style="width: {(currentStep / 4) * 100}%">
            <div class="progress-segments">
              <div class="progress-segment"></div>
              <div class="progress-segment"></div>
              <div class="progress-segment"></div>
              <div class="progress-segment"></div>
            </div>
          </div>
        </div>
        <div class="progress-labels">
          <span class="progress-label" class:active={currentStep === 1} class:completed={currentStep > 1}>Search</span>
          <span class="progress-label" class:active={currentStep === 2} class:completed={currentStep > 2}>Select</span>
          <span class="progress-label" class:active={currentStep === 3} class:completed={currentStep > 3}>Subscribe</span>
          <span class="progress-label" class:active={currentStep === 4}>Complete</span>
        </div>
      </div>
      
      <h2>Begin Monitoring</h2>
      <p class="subtitle">Enter an FCC proceeding number to start receiving intelligence</p>
      
      <div class="form-group">
        <label class="form-label" for="docketSearch">FCC Proceeding Number</label>
        <div class="form-help">Format: XX-XXX (e.g., 02-6, 21-450)</div>
        
        <div class="search-container">
          <input 
            type="text" 
            class="search-input" 
            placeholder="Enter proceeding number"
            id="docketSearch"
            bind:value={docketSearch}
            on:input={handleSearchInput}
          />
          <div class="search-icon">⚡</div>
          
          <!-- Suggestions Dropdown -->
          {#if showSuggestions}
            <div class="suggestions">
              {#each mockSuggestions as suggestion}
                <div class="suggestion-item" on:click={() => selectDocket(suggestion)}>
                  <div class="docket-number">{suggestion.number}</div>
                  <div class="docket-name">{suggestion.name}</div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Preview Card -->
      {#if showPreview}
        <div class="preview-card show">
          <div class="preview-header">
            <div class="status">✓ DOCKET MONITORING ACTIVATED</div>
            <h3>Proceeding {selectedDocket}</h3>
            {#if selectedName}
              <div class="selected-name">{selectedName}</div>
            {/if}
          </div>
          
          <div class="benefits">
            <div class="benefit">
              <span class="benefit-icon">🔔</span>
              Real-time filing alerts
            </div>
            <div class="benefit">
              <span class="benefit-icon">📊</span>
              AI-powered summaries
            </div>
            <div class="benefit">
              <span class="benefit-icon">🔒</span>
              Enterprise-grade secure delivery
            </div>
          </div>
        </div>
      {/if}

      <!-- Email Section -->
      {#if showEmailSection}
        <div class="email-section show">
          <div class="form-group">
            <label class="form-label" for="emailInput">Official Email Address</label>
            <input 
              type="email" 
              class="email-input" 
              placeholder="your.email@organization.gov"
              id="emailInput"
              bind:value={emailInput}
            />
          </div>
          <button 
            class="btn-primary" 
            on:click={subscribe}
            disabled={isSubscribing || !emailInput}
            class:loading={isSubscribing}
          >
            {#if isSubscribing}
              <div class="loading-content">
                <div class="spinner"></div>
                <span>Activating Monitoring...</span>
              </div>
            {:else}
              <span>Activate Docket Monitoring</span>
            {/if}
          </button>
          
          {#if subscriptionStatus}
            <div class="status-message success">
              ✅ Successfully subscribed to proceeding {selectedDocket}! Demo complete.
            </div>
          {/if}
        </div>
      {:else if !showPreview}
        <div class="initial-cta">
          <button class="btn-secondary" disabled>
            Select Proceeding Number Above
          </button>
        </div>
      {/if}
    </div>
  </div>
</section>

<!-- Demo Notice -->
<div class="demo-notice">
  <div class="container">
    <div class="notice-content">
      <h3>🎨 New Logo Design Demo</h3>
      <p>This page showcases the professional folder-based logo design integrated into your DocketCC website. The new logo represents document organization and regulatory intelligence.</p>
      <a href="/" class="back-link">← Back to Current Version</a>
    </div>
  </div>
</div>

<style>
  /* Demo Header */
  .demo-header {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    padding: 1rem 0;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    border-bottom: 4px solid #10b981;
  }

  .nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  /* New Logo Styles - Navbar Version */
  .logo-link {
    text-decoration: none;
  }

  .new-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .folder-icon {
    position: relative;
    width: 48px;
    height: 40px;
  }

  .folder-back {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 48px;
    height: 32px;
    background: #0f172a;
    border: 2px solid #475569;
    border-radius: 0 4px 4px 4px;
  }

  .folder-tab {
    position: absolute;
    top: 4px;
    left: 0;
    width: 20px;
    height: 12px;
    background: #0f172a;
    border: 2px solid #475569;
    border-bottom: none;
    border-radius: 2px 2px 0 0;
  }

  .folder-front {
    position: absolute;
    bottom: 0;
    left: 1px;
    width: 46px;
    height: 28px;
    background: #0f172a;
    border: 1px solid #475569;
    border-radius: 1px;
  }

  .documents {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 32px;
    height: 24px;
  }

  .doc {
    position: absolute;
    width: 16px;
    height: 20px;
    border-radius: 1px;
    border: 1px solid #0f172a;
  }

  .doc1 {
    background: #10b981;
    left: 0;
    top: 0;
    z-index: 3;
  }

  .doc2 {
    background: #34d399;
    left: 8px;
    top: 1px;
    z-index: 2;
  }

  .doc3 {
    background: #6ee7b7;
    left: 16px;
    top: 2px;
    z-index: 1;
  }

  .doc-lines {
    position: absolute;
    top: 4px;
    left: 2px;
    right: 2px;
  }

  .doc-line {
    height: 1px;
    background: #0f172a;
    margin-bottom: 1px;
    border-radius: 0.5px;
  }

  .doc-line:nth-child(2) {
    width: 80%;
  }

  .doc-line:nth-child(3) {
    width: 60%;
  }

  .logo-text {
    font-size: 1.8rem;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.5px;
  }

  .logo-cc {
    color: #10b981;
  }

  .nav-links {
    display: flex;
    gap: 2rem;
  }

  .nav-link {
    color: #374151;
    text-decoration: none;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    transition: all 0.3s;
  }

  .nav-link:hover {
    background: #0f172a;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  }

  /* Hero Section */
  .hero {
    padding: 8rem 0 4rem;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    min-height: 90vh;
    display: flex;
    align-items: center;
  }

  .hero-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
    width: 100%;
  }

  /* Hero Logo - Large Version */
  .hero-logo {
    display: flex;
    align-items: center;
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .hero-folder-icon {
    position: relative;
    width: 120px;
    height: 100px;
  }

  .hero-folder-back {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 120px;
    height: 78px;
    background: #0f172a;
    border: 3px solid #475569;
    border-radius: 0 8px 8px 8px;
  }

  .hero-folder-tab {
    position: absolute;
    top: 8px;
    left: 0;
    width: 48px;
    height: 26px;
    background: #0f172a;
    border: 3px solid #475569;
    border-bottom: none;
    border-radius: 6px 6px 0 0;
  }

  .hero-folder-front {
    position: absolute;
    bottom: 0;
    left: 3px;
    width: 114px;
    height: 68px;
    background: #0f172a;
    border: 2px solid #475569;
    border-radius: 3px;
  }

  .hero-documents {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 84px;
    height: 58px;
  }

  .hero-doc {
    position: absolute;
    width: 42px;
    height: 52px;
    border-radius: 3px;
    border: 3px solid #0f172a;
  }

  .hero-doc1 {
    background: #10b981;
    left: 0;
    top: 0;
    z-index: 3;
  }

  .hero-doc2 {
    background: #34d399;
    left: 21px;
    top: 3px;
    z-index: 2;
  }

  .hero-doc3 {
    background: #6ee7b7;
    left: 42px;
    top: 6px;
    z-index: 1;
  }

  .hero-doc-lines {
    position: absolute;
    top: 10px;
    left: 6px;
    right: 6px;
  }

  .hero-doc-line {
    height: 3px;
    background: #0f172a;
    margin-bottom: 4px;
    border-radius: 1px;
  }

  .hero-doc-line:nth-child(2) {
    width: 80%;
  }

  .hero-doc-line:nth-child(3) {
    width: 60%;
  }

  .hero-logo h1 {
    font-size: 4rem;
    font-weight: 900;
    color: white;
    line-height: 1.1;
    text-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }

  .hero-content .highlight {
    color: #10b981;
    text-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
  }

  .hero-content .subtitle {
    font-size: 1.3rem;
    color: rgba(255,255,255,0.9);
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .hero-content .authority {
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    border-left: 4px solid #10b981;
  }

  .hero-content .authority h3 {
    color: #10b981;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    font-weight: 700;
  }

  .hero-content .authority p {
    color: rgba(255,255,255,0.8);
    font-size: 0.95rem;
    margin: 0;
  }

  /* Search Card Styles (copied from original) */
  .search-card {
    background: rgba(255,255,255,0.98);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 3rem;
    box-shadow: 0 40px 80px rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.3);
    position: relative;
  }

  .search-card h2 {
    font-size: 1.8rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 0.5rem;
  }

  .search-card .subtitle {
    color: #6b7280;
    margin-bottom: 2rem;
    font-size: 1rem;
  }

  /* Progress Bar */
  .progress-stepper {
    margin-bottom: 1.5rem;
    padding: 0;
  }

  .progress-container {
    background: #f3f4f6;
    border-radius: 8px;
    height: 8px;
    overflow: hidden;
    margin-bottom: 1rem;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #059669);
    border-radius: 8px;
    transition: width 0.5s ease;
    position: relative;
  }

  .progress-segments {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
  }

  .progress-segment {
    flex: 1;
    border-right: 2px solid white;
  }

  .progress-segment:last-child {
    border-right: none;
  }

  .progress-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
  }

  .progress-label {
    transition: color 0.3s ease;
  }

  .progress-label.active {
    color: #10b981;
    font-weight: 600;
  }

  .progress-label.completed {
    color: #10b981;
  }

  .form-group {
    margin-bottom: 2rem;
  }

  .form-label {
    display: block;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.75rem;
    font-size: 1rem;
  }

  .form-help {
    font-size: 0.9rem;
    color: #6b7280;
    margin-bottom: 0.75rem;
  }

  .search-container {
    position: relative;
  }

  .search-input {
    width: 100%;
    padding: 1.25rem 4rem 1.25rem 1.5rem;
    font-size: 1.1rem;
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    outline: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: #f9fafb;
    font-weight: 500;
  }

  .search-input:focus {
    border-color: #10b981;
    background: white;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1), 0 10px 25px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }

  .search-icon {
    position: absolute;
    right: 1.5rem;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    background: #0f172a;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.9rem;
    transition: all 0.3s;
  }

  .suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    z-index: 10;
    max-height: 300px;
    overflow-y: auto;
    margin-top: 0.5rem;
  }

  .suggestion-item {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer;
    transition: all 0.2s;
  }

  .suggestion-item:hover {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: white;
    transform: translateX(4px);
  }

  .docket-number {
    font-weight: 700;
    color: #0f172a;
    font-size: 1.1rem;
    transition: color 0.2s;
  }

  .suggestion-item:hover .docket-number {
    color: #10b981;
  }

  .docket-name {
    font-size: 0.9rem;
    color: #6b7280;
    margin-top: 0.25rem;
    transition: color 0.2s;
  }

  .suggestion-item:hover .docket-name {
    color: rgba(255,255,255,0.9);
  }

  /* Preview card */
  .preview-card {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: white;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2rem;
    position: relative;
    overflow: hidden;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .preview-card::before {
    content: '✓ DOCKET MONITORING ACTIVATED';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    background: #10b981;
    color: #0f172a;
    padding: 0.5rem;
    font-weight: 700;
    font-size: 0.8rem;
    text-align: center;
    border-radius: 16px 16px 0 0;
  }

  .preview-card.show {
    opacity: 1;
    transform: translateY(0);
  }

  .preview-header {
    margin: 1rem 0 1.5rem;
  }

  .preview-header h3 {
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
  }

  .selected-name {
    opacity: 0.9;
    font-weight: 500;
  }

  .benefits {
    display: grid;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .benefit {
    display: flex;
    align-items: center;
    font-size: 1rem;
    font-weight: 500;
  }

  .benefit-icon {
    margin-right: 0.75rem;
    font-size: 1.2rem;
    color: #10b981;
  }

  /* Email section */
  .email-section {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .email-section.show {
    opacity: 1;
    transform: translateY(0);
  }

  .email-input {
    width: 100%;
    padding: 1.25rem 1.5rem;
    font-size: 1.1rem;
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    outline: none;
    margin-bottom: 1.5rem;
    transition: all 0.3s;
    font-weight: 500;
  }

  .email-input:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
  }

  .btn-primary {
    width: 100%;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 1.25rem 2rem;
    border-radius: 16px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(16, 185, 129, 0.4);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary.loading {
    position: relative;
    overflow: hidden;
  }

  .loading-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .btn-secondary {
    width: 100%;
    background: rgba(107, 114, 128, 0.1);
    color: #6b7280;
    border: 2px solid rgba(107, 114, 128, 0.2);
    padding: 1.25rem 2rem;
    border-radius: 16px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: not-allowed;
  }

  .initial-cta {
    text-align: center;
  }

  .status-message {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 12px;
    font-weight: 600;
    text-align: center;
  }

  .status-message.success {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  /* Demo Notice */
  .demo-notice {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    padding: 2rem 0;
    border-top: 4px solid #f59e0b;
  }

  .notice-content {
    text-align: center;
  }

  .notice-content h3 {
    color: #92400e;
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 1rem;
  }

  .notice-content p {
    color: #92400e;
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }

  .back-link {
    color: #92400e;
    text-decoration: none;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 12px;
    transition: all 0.3s;
  }

  .back-link:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: translateY(-2px);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .hero {
      padding: 6rem 0 2rem;
    }
    
    .hero-container {
      grid-template-columns: 1fr;
      gap: 3rem;
      padding: 0 1rem;
    }

    .hero-logo {
      flex-direction: column;
      text-align: center;
      gap: 1.5rem;
    }

    .hero-logo h1 {
      font-size: 2.5rem;
    }

    .search-card {
      padding: 2rem 1.5rem;
    }

    .nav-links {
      display: none;
    }

    .folder-icon,
    .hero-folder-icon {
      transform: scale(0.8);
    }

    .progress-labels {
      font-size: 0.7rem;
    }
  }
</style> 