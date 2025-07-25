<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Import our three toggle components (we'll create them in the components folder)
  import FrequencyToggleCreative from '$lib/components/FrequencyToggle_Creative.svelte';
  import FrequencyToggleSaaS from '$lib/components/FrequencyToggle_SaaS.svelte';
  import FrequencyToggleClassic from '$lib/components/FrequencyToggle_Classic.svelte';
  
  // State for each toggle
  let creativeFreq = 'daily';
  let saasFreq = 'immediate';
  let classicFreq = 'daily';
  
  // Different user tiers for testing
  let userTier = 'pro'; // Change to 'free' to test restrictions
  
  function handleCreativeChange(event) {
    creativeFreq = event.detail.frequency;
    console.log('Creative toggle changed to:', creativeFreq);
  }
  
  function handleSaasChange(event) {
    saasFreq = event.detail.frequency;
    console.log('SaaS toggle changed to:', saasFreq);
  }
  
  function handleClassicChange(event) {
    classicFreq = event.detail.frequency;
    console.log('Classic toggle changed to:', classicFreq);
  }
  
  function toggleUserTier() {
    userTier = userTier === 'free' ? 'pro' : 'free';
  }
</script>

<svelte:head>
  <title>Frequency Toggle Design Comparison - SimpleDCC</title>
</svelte:head>

<div class="demo-page">
  <div class="demo-header">
    <h1>🎛️ Frequency Toggle Design Comparison</h1>
    <p class="subtitle">Three different approaches to solve the UX issues with the current toggle</p>
    
    <div class="controls">
      <button class="tier-toggle" on:click={toggleUserTier}>
        Current User Tier: <strong>{userTier.toUpperCase()}</strong>
        (Click to switch)
      </button>
    </div>
  </div>
  
  <div class="comparison-grid">
    <!-- Creative Approach -->
    <div class="approach-card">
      <div class="approach-header">
        <h2>🎨 Creative Approach</h2>
        <div class="badges">
          <span class="badge recommended">Recommended</span>
          <span class="badge animated">Animated</span>
        </div>
      </div>
      
      <div class="approach-description">
        <p><strong>Animated pill toggle</strong> with sliding emerald background</p>
        <ul>
          <li>✅ Clear active state (white text on emerald)</li>
          <li>✅ Smooth animations provide feedback</li>
          <li>✅ Icons reinforce meaning</li>
          <li>✅ Compact and modern</li>
        </ul>
      </div>
      
      <div class="demo-area">
        <div class="demo-label">Current: {creativeFreq}</div>
        <FrequencyToggleCreative 
          frequency={creativeFreq}
          {userTier}
          email="demo@example.com"
          docketNumber="11-42"
          on:change={handleCreativeChange}
        />
      </div>
    </div>
    
    <!-- SaaS Approach -->
    <div class="approach-card">
      <div class="approach-header">
        <h2>💼 Modern SaaS Approach</h2>
        <div class="badges">
          <span class="badge descriptive">Descriptive</span>
          <span class="badge professional">Professional</span>
        </div>
      </div>
      
      <div class="approach-description">
        <p><strong>Side-by-side cards</strong> with detailed descriptions</p>
        <ul>
          <li>✅ Self-explanatory with descriptive text</li>
          <li>✅ Professional SaaS appearance</li>
          <li>✅ Clear value proposition</li>
          <li>✅ Excellent accessibility</li>
        </ul>
      </div>
      
      <div class="demo-area">
        <div class="demo-label">Current: {saasFreq}</div>
        <FrequencyToggleSaaS 
          frequency={saasFreq}
          {userTier}
          email="demo@example.com"
          docketNumber="11-42"
          on:change={handleSaasChange}
        />
      </div>
    </div>
    
    <!-- Classic Approach -->
    <div class="approach-card">
      <div class="approach-header">
        <h2>🏛️ Classic Approach</h2>
        <div class="badges">
          <span class="badge accessible">Accessible</span>
          <span class="badge familiar">Familiar</span>
        </div>
      </div>
      
      <div class="approach-description">
        <p><strong>Enhanced radio buttons</strong> in semantic fieldset</p>
        <ul>
          <li>✅ Familiar interaction pattern</li>
          <li>✅ Maximum accessibility</li>
          <li>✅ Clear semantic structure</li>
          <li>✅ Detailed explanations</li>
        </ul>
      </div>
      
      <div class="demo-area">
        <div class="demo-label">Current: {classicFreq}</div>
        <FrequencyToggleClassic 
          frequency={classicFreq}
          {userTier}
          email="demo@example.com"
          docketNumber="11-42"
          on:change={handleClassicChange}
        />
      </div>
    </div>
  </div>
  
  <!-- Current Issues Section -->
  <div class="issues-section">
    <h2>🚨 Issues with Current Toggle</h2>
    <div class="issues-grid">
      <div class="issue-card">
        <h3>Poor Visual Hierarchy</h3>
        <p>Unclear which setting is currently active</p>
      </div>
      <div class="issue-card">
        <h3>Confusing Color Logic</h3>
        <p>Green for Daily, Grey for Hourly doesn't make sense</p>
      </div>
      <div class="issue-card">
        <h3>Small Interaction Area</h3>
        <p>Toggle is quite small and hard to click</p>
      </div>
      <div class="issue-card">
        <h3>Weak Active State</h3>
        <p>Active state doesn't stand out enough</p>
      </div>
    </div>
  </div>
  
  <!-- Technical Notes -->
  <div class="tech-notes">
    <h2>🔧 Technical Implementation</h2>
    <div class="tech-grid">
      <div class="tech-card">
        <h3>API Compatibility</h3>
        <p>All three use the same API endpoints and props</p>
      </div>
      <div class="tech-card">
        <h3>Drop-in Replacement</h3>
        <p>Identical component interface for easy swapping</p>
      </div>
      <div class="tech-card">
        <h3>Responsive Design</h3>
        <p>All approaches work perfectly on mobile</p>
      </div>
      <div class="tech-card">
        <h3>Brand Consistency</h3>
        <p>Uses SimpleDCC's emerald color scheme</p>
      </div>
    </div>
  </div>
</div>

<style>
  .demo-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 2rem;
  }
  
  .demo-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .demo-header h1 {
    font-size: 2.5rem;
    font-weight: 800;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    font-size: 1.2rem;
    color: #64748b;
    margin-bottom: 2rem;
  }
  
  .controls {
    margin-bottom: 2rem;
  }
  
  .tier-toggle {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  .tier-toggle:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }
  
  .comparison-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
    margin-bottom: 4rem;
  }
  
  .approach-card {
    background: white;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    border: 2px solid #e2e8f0;
    transition: all 0.3s ease;
  }
  
  .approach-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    border-color: #10b981;
  }
  
  .approach-header {
    margin-bottom: 1.5rem;
  }
  
  .approach-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.75rem;
  }
  
  .badges {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .badge.recommended {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }
  
  .badge.animated {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
  }
  
  .badge.descriptive {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
  }
  
  .badge.professional {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: white;
  }
  
  .badge.accessible {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
  }
  
  .badge.familiar {
    background: linear-gradient(135deg, #84cc16, #65a30d);
    color: white;
  }
  
  .approach-description {
    margin-bottom: 2rem;
  }
  
  .approach-description p {
    font-size: 1rem;
    color: #374151;
    margin-bottom: 1rem;
    font-weight: 500;
  }
  
  .approach-description ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .approach-description li {
    font-size: 0.9rem;
    color: #64748b;
    margin-bottom: 0.5rem;
    padding-left: 0;
  }
  
  .demo-area {
    background: #f8fafc;
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
  }
  
  .demo-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .issues-section {
    margin-bottom: 4rem;
  }
  
  .issues-section h2 {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .issues-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }
  
  .issue-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    border-left: 4px solid #ef4444;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .issue-card h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #dc2626;
    margin-bottom: 0.5rem;
  }
  
  .issue-card p {
    font-size: 0.9rem;
    color: #64748b;
    margin: 0;
  }
  
  .tech-notes {
    margin-bottom: 2rem;
  }
  
  .tech-notes h2 {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .tech-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }
  
  .tech-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    border-left: 4px solid #10b981;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .tech-card h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #059669;
    margin-bottom: 0.5rem;
  }
  
  .tech-card p {
    font-size: 0.9rem;
    color: #64748b;
    margin: 0;
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .demo-page {
      padding: 1rem;
    }
    
    .demo-header h1 {
      font-size: 2rem;
    }
    
    .comparison-grid {
      grid-template-columns: 1fr;
    }
    
    .approach-card {
      padding: 1.5rem;
    }
  }
</style> 