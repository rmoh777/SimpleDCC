<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let docketNumber: string = '';
  export let userEmail: string = '';
  export let showModal: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  let isProcessing = false;
  
  // Sample AI content for demonstration
  const sampleContent = getSampleContent(docketNumber);
  
  async function acceptTrial() {
    if (isProcessing) return;
    isProcessing = true;
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_trial',
          email: userEmail
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        dispatch('trial-started', result);
        closeModal();
      } else {
        const error = await response.json();
        console.error('Trial activation failed:', error);
        alert('Failed to start trial. Please try again.');
      }
    } catch (error) {
      console.error('Trial activation error:', error);
      alert('Network error. Please try again.');
    } finally {
      isProcessing = false;
    }
  }
  
  function declineTrial() {
    dispatch('trial-declined');
    closeModal();
  }
  
  function closeModal() {
    showModal = false;
    isProcessing = false;
  }
  
  function getSampleContent(docket: string) {
    const samples: { [key: string]: any } = {
      '11-42': {
        title: 'Schools and Libraries Universal Service Support',
        summary: 'This filing addresses proposed changes to the E-rate program funding mechanism, specifically targeting improved broadband access for educational institutions in underserved areas. The filing suggests modifications to the current application process that could streamline funding distribution while maintaining program integrity.',
        keyPoints: [
          'Proposes simplified E-rate application process',
          'Focuses on underserved educational institutions', 
          'Maintains current funding caps while improving efficiency'
        ],
        stakeholders: 'Educational institutions, Service providers, Rural communities'
      },
      'default': {
        title: 'Sample Regulatory Proceeding',
        summary: 'This sample demonstrates the comprehensive AI analysis you\'ll receive with Pro monitoring. Our AI processes the full document content to provide clear, actionable insights about regulatory changes and their potential impact.',
        keyPoints: [
          'AI analyzes complete document content, not just metadata',
          'Identifies key stakeholders and affected parties',
          'Assesses regulatory impact and timeline implications'
        ],
        stakeholders: 'Industry participants, Related businesses, Advocacy organizations'
      }
    };
    
    return samples[docket] || samples['default'];
  }
</script>

{#if showModal}
  <div class="modal-overlay" on:click={closeModal} role="button" tabindex="0">
    <div class="modal-content" on:click|stopPropagation role="dialog">
      <button class="modal-close" on:click={closeModal} aria-label="Close modal">×</button>
      
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>🚀 Unlock AI-Powered Analysis</h2>
        <p class="subtitle">See what you'd get with Pro monitoring for Docket {docketNumber}</p>
      </div>
      
      <!-- Sample Email Preview -->
      <div class="email-preview-section">
        <h3>📧 Your Pro Email Would Look Like This:</h3>
        <div class="email-preview">
          <div class="email-header">
            <strong>Subject:</strong> 🤖 AI Analysis: New filing in {docketNumber}
          </div>
          <div class="email-body">
            <h4>📋 {sampleContent.title}</h4>
            
            <div class="ai-summary-block">
              <div class="ai-badge">🤖 AI Summary</div>
              <p>{sampleContent.summary}</p>
            </div>
            
            <div class="key-points-block">
              <h5>🎯 Key Points:</h5>
              <ul>
                {#each sampleContent.keyPoints as point}
                  <li>{point}</li>
                {/each}
              </ul>
            </div>
            
            <div class="stakeholders-block">
              <h5>👥 Primary Stakeholders:</h5>
              <p>{sampleContent.stakeholders}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Feature Comparison -->
      <div class="feature-comparison">
        <div class="comparison-grid">
          <div class="free-tier">
            <h4>Free (What you'll get now)</h4>
            <ul class="feature-list">
              <li class="basic-feature">📄 Basic filing metadata</li>
              <li class="basic-feature">📧 Daily digest only</li>
              <li class="basic-feature">🔗 Links to view full documents</li>
            </ul>
          </div>
          
          <div class="pro-tier">
            <h4>Pro Trial (Upgrade now)</h4>
            <ul class="feature-list">
              <li class="pro-feature">🤖 AI-powered summaries</li>
              <li class="pro-feature">⚡ Hourly + immediate notifications</li>
              <li class="pro-feature">📋 Full document analysis</li>
              <li class="pro-feature">🎯 Stakeholder identification</li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Call to Action -->
      <div class="cta-section">
        <div class="trial-offer">
          <h3>🎁 Start Your 30-Day FREE Trial</h3>
          <p>Get full Pro features for 30 days. No commitment required.</p>
          <p class="trial-note">💳 Credit card required (Phase 2.5 - Stripe integration)</p>
        </div>
        
        <div class="action-buttons">
          <button 
            class="btn-trial-accept" 
            on:click={acceptTrial}
            disabled={isProcessing}
          >
            {isProcessing ? 'Starting Trial...' : 'Start 30-Day Free Trial'}
          </button>
          
          <button 
            class="btn-trial-decline" 
            on:click={declineTrial}
            disabled={isProcessing}
          >
            Continue with Free
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    margin: 1rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  
  .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
    padding: 0.5rem;
    border-radius: 50%;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal-close:hover {
    background: #f3f4f6;
  }
  
  .modal-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .modal-header h2 {
    margin: 0 0 0.5rem 0;
    color: #111827;
    font-size: 1.5rem;
  }
  
  .subtitle {
    color: #6b7280;
    margin: 0;
  }
  
  .email-preview {
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.5rem;
    background: #f9fafb;
    margin: 1rem 0;
  }
  
  .email-header {
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }
  
  .ai-badge {
    display: inline-block;
    background: #10b981;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  .ai-summary-block, .key-points-block, .stakeholders-block {
    background: white;
    border-radius: 6px;
    padding: 1rem;
    margin: 1rem 0;
    border-left: 4px solid #10b981;
  }
  
  .comparison-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin: 1.5rem 0;
  }
  
  .free-tier, .pro-tier {
    padding: 1.5rem;
    border-radius: 8px;
    border: 2px solid #e5e7eb;
  }
  
  .free-tier {
    background: #f9fafb;
  }
  
  .pro-tier {
    background: #ecfdf5;
    border-color: #10b981;
  }
  
  .feature-list {
    list-style: none;
    padding: 0;
    margin: 1rem 0;
  }
  
  .feature-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .feature-list li:last-child {
    border-bottom: none;
  }
  
  .pro-feature {
    color: #065f46;
    font-weight: 500;
  }
  
  .basic-feature {
    color: #6b7280;
  }
  
  .cta-section {
    text-align: center;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .trial-offer h3 {
    color: #111827;
    margin-bottom: 1rem;
  }
  
  .trial-note {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.5rem;
  }
  
  .action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
  }
  
  .btn-trial-accept {
    background: #10b981;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .btn-trial-accept:hover:not(:disabled) {
    background: #059669;
  }
  
  .btn-trial-accept:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  .btn-trial-decline {
    background: white;
    color: #6b7280;
    border: 2px solid #e5e7eb;
    padding: 1rem 2rem;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-trial-decline:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
  
  .btn-trial-decline:disabled {
    color: #9ca3af;
    cursor: not-allowed;
  }
  
  @media (max-width: 640px) {
    .modal-content {
      padding: 1rem;
      margin: 0.5rem;
    }
    
    .comparison-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .action-buttons {
      flex-direction: column;
    }
  }
</style> 