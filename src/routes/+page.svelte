<script lang="ts">
  import { onMount } from 'svelte';
  import DocketCCLogo from '$lib/components/ui/DocketCCLogo.svelte';
  
  let docketSearch = '';
  let emailInput = '';
  let selectedDocket = '';
  let selectedName = '';
  let showSuggestions = false;
  let showPreview = false;
  let showEmailSection = false;
  let isSubscribing = false;
  let subscriptionStatus = '';
  let showSuccessModal = false;
  let subscriptionDetails: {
    docket: string;
    name: string;
    email: string;
    date: string;
    time: string;
  } = {
    docket: '',
    name: '',
    email: '',
    date: '',
    time: ''
  };
  let currentStep = 1; // 1: Search, 2: Select, 3: Subscribe, 4: Success
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  
  // User session state
  let isLoggedIn = false;
  let currentUser: any = null;
  let sessionCheckComplete = false;
  
  const mockSuggestions = [
    { number: '02-6', name: 'Schools and Libraries Universal Service Support Mechanism' },
    { number: '21-450', name: 'Affordable Connectivity Program' },
    { number: '11-42', name: 'Connect America Fund/Universal Service Reform' }
  ];
  
  // Check if user is already logged in on page load
  onMount(async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'GET',
        credentials: 'include' // Include cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user && data.isLoggedIn) {
          isLoggedIn = true;
          currentUser = data.user;
        }
      }
    } catch (error) {
      console.log('Session check failed:', error);
      // Fail silently - user is not logged in
    } finally {
      sessionCheckComplete = true;
    }
  });
  
  function isValidDocketNumber(docket: string): boolean {
    const docketRegex = /^\d{2,4}-\d{1,4}$/;
    return docketRegex.test(docket.trim());
  }

  function handleSearchInput() {
    if (debounceTimer) clearTimeout(debounceTimer);
    
    const isMock = mockSuggestions.some(s => s.number === docketSearch.trim());
    
    if (docketSearch.length > 0) {
      showSuggestions = true;
      hidePreview();
      currentStep = 1;
    } else {
      showSuggestions = false;
      hidePreview();
      currentStep = 1;
    }

    if (isValidDocketNumber(docketSearch) && !isMock) {
      debounceTimer = setTimeout(() => {
        selectCustomDocket(docketSearch);
      }, 1000);
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
  
  function selectCustomDocket(docketNumber: string) {
    docketSearch = docketNumber;
    selectedDocket = docketNumber;
    selectedName = '';
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
    showSuccessModal = false;
    currentStep = 1;
  }
  
  function closeSuccessModal() {
    showSuccessModal = false;
    // Reset form for new subscription
    docketSearch = '';
    emailInput = '';
    hidePreview();
  }
  
  function goToSubscriptions() {
    window.location.href = '/manage';
  }
  
  function goToDashboard() {
    window.location.href = '/manage';
  }
  
  async function subscribe() {
    if (!emailInput || !selectedDocket) return;
    
    isSubscribing = true;
    subscriptionStatus = '';
    currentStep = 3;
    
    try {
      const response = await fetch('/api/create-pending-signup', {
        method: 'POST',   
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailInput,
          docket_number: selectedDocket
        })
      });
      
      // Handle redirect response (302) vs error responses
      if (response.redirected || response.status === 302) {
        // Success - redirect to upgrade page
        window.location.href = response.url || '/upgrade';
        return;
      }
      
      // Handle error responses (non-redirect)
      if (!response.ok) {
        const data = await response.json();
        subscriptionStatus = `Error: ${data.error || 'Signup failed'}`;
        currentStep = 2; // Go back to selection step
      }
    } catch (error) {
      console.error('Signup error:', error);
      subscriptionStatus = 'Error: Network error occurred';
      currentStep = 2; // Go back to selection step
    } finally {
      isSubscribing = false;
    }
  }
</script>

<svelte:head>
  <title>DocketCC - FCC Docket Monitoring Service</title>
  <meta name="description" content="Professional FCC docket monitoring service with AI-powered summaries. Trusted by legal professionals, regulatory experts, and enterprise teams." />
</svelte:head>

<!-- Hero Section -->
<section class="hero">
  <div class="hero-container">
    <div class="hero-content">
    <!-- Large Hero Logo -->
    <div class="hero-logo">
      <div class="desktop-logo">
        <DocketCCLogo size="large" variant="light" />
      </div>
      <div class="mobile-logo">
        <DocketCCLogo size="medium" variant="light" />
      </div>
    </div>
    
    <h1>F<span class="highlight">CC</span> Docket Intelligence</h1>
    <p class="subtitle">
      Monitoring service for Federal Communications Commission proceedings. 
      Stay informed with real-time email alerts, AI-powered summaries + analysis of FCC filings.
    </p>
    
    <div class="hero-cta">
      <a href="/about" class="btn-learn-more">
        Learn More
      </a>
    </div>

  </div>

  <div class="search-card">
    <!-- Show different content based on login status -->
    {#if sessionCheckComplete}
      {#if isLoggedIn}
        <!-- Logged-in user content -->
        <div class="welcome-section">
          <div class="welcome-icon">👋</div>
          <h2>Welcome back, {currentUser?.email || 'User'}!</h2>
          <p class="subtitle">You're already signed in. Access your subscription dashboard to manage your docket monitoring.</p>
          
          <div class="user-info">
            <div class="user-details">
              <div class="user-tier">
                <span class="tier-label">Current Plan:</span>
                <span class="tier-value {currentUser?.user_tier || 'free'}">{(currentUser?.user_tier || 'free').toUpperCase()}</span>
              </div>
            </div>
          </div>
          
          <button class="btn-primary dashboard-btn" on:click={goToDashboard}>
            <span>Go to Dashboard</span>
            <span class="arrow">→</span>
          </button>
          
          <div class="quick-action">
            <p>Or continue below to add new docket monitoring</p>
          </div>
        </div>
        
        <!-- Still show the form below for adding new subscriptions -->
        <div class="divider"></div>
        <div class="add-new-section">
          <h3>Add New Docket Monitoring</h3>
        </div>
      {:else}
        <!-- New user content -->
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
      {/if}
    {:else}
      <!-- Loading state -->
      <div class="loading-section">
        <div class="loading-spinner"></div>
        <p>Checking session...</p>
      </div>
    {/if}
    
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
         
         <!-- Preview Card - Absolutely Positioned -->
         {#if showPreview}
           <div class="preview-card show">
             <div class="preview-header">
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
       </div>
     </div>

    <!-- Email Section -->
    {#if showEmailSection}
      <div class="email-section show">
        <div class="form-group">
                     <label class="form-label" for="emailInput">Your Email Address</label>
          <input 
            type="email" 
            class="email-input" 
            placeholder="your.email@domain.com"
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
          <div class="status-message" class:success={subscriptionStatus === 'success'}>
            {#if subscriptionStatus === 'success'}
              ✅ Successfully subscribed to proceeding {selectedDocket}! Check your email.
            {:else}
              ❌ {subscriptionStatus}
            {/if}
          </div>
        {/if}
      </div>
    {:else if !showPreview && !isLoggedIn}
      <div class="initial-cta">
        <button class="btn-secondary" disabled>
          Select Proceeding Number Above
        </button>
      </div>
    {/if}
    

  </div>
  </div>
</section>

<!-- Features Section -->
<section class="features-section">
  <div class="features-container">
    <div class="features-header">
      <h2>Regulatory <span class="highlight">Intelligence</span> Platform</h2>
      <p>Designed for legal, regulatory, and public interest professionals to stay ahead of FCC developments that impact the proceedings and programs they work with.</p>
    </div>

    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>Real-Time Monitoring</h3>
        <p>Automated surveillance of FCC proceedings with instant notifications when new filings, comments, or orders are published.</p>
        <ul class="feature-list">
          <li>24/7 automated monitoring</li>
          <li>Instant email alerts</li>
          <li>Customizable notification frequency</li>
          <li>Multi-docket tracking</li>
        </ul>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🤖</div>
        <h3>AI-Powered Analysis</h3>
        <p>Advanced natural language processing transforms complex regulatory documents into clear, actionable intelligence.</p>
        <ul class="feature-list">
          <li>Executive summaries</li>
          <li>Key stakeholder identification</li>
          <li>Impact assessment</li>
          <li>Deadline tracking</li>
        </ul>
      </div>

             <div class="feature-card">
         <div class="feature-icon">🔒</div>
         <h3>Enterprise Security</h3>
         <p>Bank-grade security infrastructure ensures your monitoring activities and data remain completely confidential with industry-leading protection standards.</p>
         <ul class="feature-list">
           <li>End-to-end encryption</li>
           <li>SOC 2 compliance</li>
           <li>GDPR compliant</li>
           <li>Private data handling</li>
         </ul>
       </div>
    </div>
  </div>
</section>

<!-- Success Modal -->
{#if showSuccessModal && subscriptionDetails}
  <div class="modal-overlay" on:click={closeSuccessModal}>
    <div class="success-modal" on:click|stopPropagation>
      <div class="modal-header">
        <div class="success-icon">🎉</div>
        <h2>Subscription Activated!</h2>
        <button class="close-btn" on:click={closeSuccessModal}>×</button>
      </div>
      
      <div class="modal-body">
        <div class="subscription-details">
          <h3>Monitoring Details</h3>
          <div class="detail-row">
            <span class="label">Docket:</span>
            <span class="value">{subscriptionDetails.docket}</span>
          </div>
          <div class="detail-row">
            <span class="label">Proceeding:</span>
            <span class="value">{subscriptionDetails.name}</span>
          </div>
          <div class="detail-row">
            <span class="label">Email:</span>
            <span class="value">{subscriptionDetails.email}</span>
          </div>
          <div class="detail-row">
            <span class="label">Activated:</span>
            <span class="value">{subscriptionDetails.date} at {subscriptionDetails.time}</span>
          </div>
        </div>
        
        <div class="next-steps">
          <h3>What Happens Next</h3>
          <div class="step-item">
            <span class="step-icon">📧</span>
            <span>Confirmation email sent to {subscriptionDetails.email}</span>
          </div>
          <div class="step-item">
            <span class="step-icon">🔔</span>
            <span>You'll receive alerts when new filings are published</span>
          </div>
          <div class="step-item">
            <span class="step-icon">📊</span>
            <span>AI summaries will be included with each notification</span>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" on:click={closeSuccessModal}>
          Subscribe to Another Docket
        </button>
        <button class="btn-primary" on:click={goToSubscriptions}>
          Manage My Subscriptions
        </button>
      </div>
    </div>
  </div>
{/if}



<style>
  /* Global mobile overflow prevention */
  :global(html) {
    overflow-x: hidden;
  }

  :global(body) {
    overflow-x: hidden;
    width: 100%;
    margin: 0;
    padding: 0;
  }

  /* Hero section */
  .hero {
    padding: 4rem 0;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    min-height: 90vh;
    display: flex;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
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
    box-sizing: border-box;
  }

  .hero-logo {
    margin-bottom: 2rem;
    display: flex;
    justify-content: flex-start;
  }

  .mobile-logo {
    display: none;
  }

  .desktop-logo {
    display: block;
  }

  .hero-content h1 {
    font-size: 3.5rem;
    font-weight: 900;
    color: white;
    line-height: 1.1;
    margin-bottom: 1.5rem;
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

  .hero-cta {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 2rem;
  }

  .btn-learn-more {
    display: inline-flex;
    align-items: center;
    background: rgba(16, 185, 129, 0.15);
    backdrop-filter: blur(10px);
    color: #10b981;
    text-decoration: none;
    padding: 0.875rem 1.75rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    border: 1px solid rgba(16, 185, 129, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  .btn-learn-more:hover {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.4);
    color: #059669;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.2);
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

  /* Modern government form card */
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

  .search-input:focus + .search-icon {
    background: #10b981;
    transform: translateY(-50%) scale(1.1);
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

  .suggestion-item:hover .docket-number {
    color: #10b981;
  }

  .suggestion-item:hover .docket-name {
    color: rgba(255,255,255,0.9);
  }

  .docket-number {
    font-weight: 700;
    color: #0f172a;
    font-size: 1.1rem;
    transition: color 0.2s;
  }

  .docket-name {
    font-size: 0.9rem;
    color: #6b7280;
    margin-top: 0.25rem;
    transition: color 0.2s;
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
     max-height: 0;
     transform: translateY(0);
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
     max-height: 500px;
     transform: translateY(0);
   }

     .preview-header {
     margin: 0 0 1.5rem;
   }

  .preview-header h3 {
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
  }

  .preview-title {
    font-size: 1.1rem;
    color: rgba(255,255,255,0.9);
    margin-top: 0.5rem;
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

  /* Enhanced Loading States */
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

  .status-message:not(.success) {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  /* Features section */
  .features-section {
    background: #f8fafc;
    padding: 6rem 2rem;
  }

  .features-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .features-header {
    text-align: center;
    margin-bottom: 4rem;
  }

  .features-header h2 {
    font-size: 2.75rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 1rem;
  }

  .features-header .highlight {
    color: #10b981;
  }

  .features-header p {
    font-size: 1.2rem;
    color: #6b7280;
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 3rem;
    margin-bottom: 4rem;
  }

  .feature-card {
    background: #f8fafc;
    border-radius: 20px;
    padding: 2.5rem;
    border: 2px solid #e5e7eb;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .feature-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #10b981, #059669);
  }

  .feature-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 25px 50px rgba(0,0,0,0.15);
    border-color: #10b981;
  }

  .feature-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  }

  .feature-card h3 {
    font-size: 1.4rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 1rem;
  }

  .feature-card p {
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }

  .feature-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .feature-list li {
    display: flex;
    align-items: center;
    color: #374151;
    margin-bottom: 0.75rem;
    font-weight: 500;
  }

  .feature-list li::before {
    content: '✓';
    color: #10b981;
    font-weight: 700;
    margin-right: 0.75rem;
    font-size: 1.1rem;
  }



  /* Mobile responsive */
  @media (max-width: 768px) {
    /* Prevent horizontal overflow */
    body {
      overflow-x: hidden;
    }
    
    .hero {
      padding: 2rem 0;
      min-height: 100vh;
      overflow-x: hidden;
    }
    
    .hero-container {
      grid-template-columns: 1fr;
      gap: 2rem;
      padding: 0 1rem;
      max-width: 100vw;
      box-sizing: border-box;
    }

    .hero-logo {
      justify-content: center;
      margin-bottom: 1rem;
    }

    .mobile-logo {
      display: block;
    }

    .desktop-logo {
      display: none;
    }

    .hero-content {
      text-align: center;
      max-width: 100%;
      overflow-wrap: break-word;
    }

    .hero-content h1 {
      font-size: 2.2rem;
      line-height: 1.2;
    }

    .search-card {
      padding: 1.5rem 1rem;
      margin: 0;
      max-width: 100%;
      box-sizing: border-box;
    }

    .search-input {
      font-size: 1rem;
      padding: 1rem 3.5rem 1rem 1rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .btn-primary {
      font-size: 1rem;
      padding: 1rem 1.5rem;
    }

    .btn-learn-more {
      font-size: 0.9rem;
      padding: 0.75rem 1.5rem;
    }

    .features-section {
      padding: 3rem 1rem;
      overflow-x: hidden;
    }

    .features-container {
      max-width: 100%;
      box-sizing: border-box;
    }

    .features-header h2 {
      font-size: 2rem;
    }

    .features-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .progress-labels {
      font-size: 0.65rem;
    }

    /* Ensure all containers respect viewport width */
    * {
      max-width: 100vw;
      box-sizing: border-box;
    }
  }

  /* Success Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .success-modal {
    background: white;
    border-radius: 24px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    animation: slideUp 0.3s ease;
    position: relative;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal-header {
    padding: 2rem 2rem 1rem;
    text-align: center;
    position: relative;
    border-bottom: 1px solid #f3f4f6;
  }

  .success-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: bounce 0.6s ease;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }

  .modal-header h2 {
    color: #0f172a;
    margin: 0;
    font-size: 1.8rem;
    font-weight: 800;
  }

  .close-btn {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background: none;
    border: none;
    font-size: 2rem;
    color: #6b7280;
    cursor: pointer;
    transition: color 0.2s;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .close-btn:hover {
    color: #374151;
    background: #f3f4f6;
  }

  .modal-body {
    padding: 2rem;
  }

  .subscription-details {
    background: #f8fafc;
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .subscription-details h3 {
    color: #0f172a;
    margin-bottom: 1rem;
    font-size: 1.2rem;
    font-weight: 700;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-row .label {
    font-weight: 600;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .detail-row .value {
    font-weight: 600;
    color: #0f172a;
    font-size: 0.9rem;
    text-align: right;
  }

  .next-steps h3 {
    color: #0f172a;
    margin-bottom: 1rem;
    font-size: 1.2rem;
    font-weight: 700;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .step-item:last-child {
    border-bottom: none;
  }

  .step-icon {
    font-size: 1.2rem;
    width: 30px;
    text-align: center;
  }

  .step-item span:last-child {
    color: #374151;
    font-weight: 500;
    line-height: 1.5;
  }

  .modal-footer {
    padding: 1.5rem 2rem 2rem;
    display: flex;
    gap: 1rem;
    border-top: 1px solid #f3f4f6;
  }

  .modal-footer .btn-secondary {
    flex: 1;
    margin: 0;
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #e5e7eb;
  }

  .modal-footer .btn-secondary:hover {
    background: #e5e7eb;
    transform: translateY(-1px);
  }

  .modal-footer .btn-primary {
    flex: 1;
    margin: 0;
  }

  /* Mobile Modal Styles */
  @media (max-width: 768px) {
    .success-modal {
      width: 95%;
      margin: 1rem;
    }

    .modal-header,
    .modal-body,
    .modal-footer {
      padding: 1.5rem;
    }

    .modal-footer {
      flex-direction: column;
    }

    .progress-labels {
      font-size: 0.7rem;
    }
  }

  /* New styles for user detection */
  .welcome-section {
    text-align: center;
    margin-bottom: 2rem;
  }

  .welcome-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: wave 2s ease-in-out infinite;
  }

  @keyframes wave {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(20deg); }
    75% { transform: rotate(-10deg); }
  }

  .user-info {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 12px;
    padding: 1rem;
    margin: 1.5rem 0;
  }

  .user-details {
    text-align: center;
  }

  .user-tier {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
  }

  .tier-label {
    color: #6b7280;
    font-weight: 500;
  }

  .tier-value {
    font-weight: 700;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
  }

  .tier-value.free {
    background: #f3f4f6;
    color: #374151;
  }

  .tier-value.trial {
    background: #fef3c7;
    color: #92400e;
  }

  .tier-value.pro {
    background: #d1fae5;
    color: #065f46;
  }

  .dashboard-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .dashboard-btn .arrow {
    transition: transform 0.2s;
  }

  .dashboard-btn:hover .arrow {
    transform: translateX(4px);
  }

  .quick-action {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .quick-action p {
    color: #6b7280;
    font-size: 0.9rem;
    margin: 0;
  }

  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
    margin: 2rem 0;
  }

  .add-new-section {
    margin-bottom: 1rem;
  }

  .add-new-section h3 {
    color: #374151;
    font-size: 1.2rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .loading-section {
    text-align: center;
    padding: 3rem 1rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f4f6;
    border-top: 3px solid #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  .loading-section p {
    color: #6b7280;
    font-size: 1rem;
  }
</style>