<script>
  import { onMount } from 'svelte';
  import { generateDailyDigest, generateWelcomeEmail, generateFilingAlert } from '$lib/email/daily-digest.js';
  import { generateSampleEmailData, generateEmailPreview, generateDocketCCSampleData } from '$lib/email/email-preview.js';
  
  let selectedTemplate = 'docketcc-filing-alert-dark';
  let emailPreview = null;
  let loading = false;
  
  const templateOptions = [
    { value: 'docketcc-filing-alert-dark', label: 'DocketCC Filing Alert (Dark)' },
    { value: 'docketcc-filing-alert-light', label: 'DocketCC Filing Alert (Light)' },
    { value: 'daily-digest', label: 'Daily Digest (Legacy)' },
    { value: 'welcome', label: 'Welcome Email (Legacy)' },
    { value: 'filing-alert', label: 'Filing Alert (Legacy)' }
  ];
  
  onMount(() => {
    generatePreview();
  });
  
  async function generatePreview() {
    loading = true;
    
    try {
      let emailData;
      
      console.log('Generating preview for template:', selectedTemplate);
      
      switch (selectedTemplate) {
        case 'docketcc-filing-alert-dark':
        case 'docketcc-filing-alert-light':
          // Import DocketCC templates dynamically
          const { generateFilingAlert: generateDocketCCFilingAlert } = await import('$lib/email/docketcc-templates.js');
          const sampleData = generateDocketCCSampleData();
          const theme = selectedTemplate.includes('dark') ? 'dark' : 'light';
          
          console.log('Sample data:', sampleData);
          console.log('Theme:', theme);
          
          emailData = generateDocketCCFilingAlert(sampleData.userEmail, sampleData.filing, {
            ...sampleData.options,
            user_tier: 'free',
            theme: theme
          });
          break;
          
        case 'daily-digest':
          const digestSampleData = generateSampleEmailData();
          emailData = generateDailyDigest(digestSampleData.userEmail, digestSampleData.filings, digestSampleData.options);
          break;
          
        case 'welcome':
          const welcomeSampleData = generateSampleEmailData();
          emailData = generateWelcomeEmail(welcomeSampleData.userEmail, '23-108', welcomeSampleData.options);
          break;
          
        case 'filing-alert':
          const alertSampleData = generateSampleEmailData();
          emailData = generateFilingAlert(alertSampleData.userEmail, alertSampleData.filings[0], alertSampleData.options);
          break;
          
        default:
          throw new Error('Unknown template type');
      }
      
      console.log('Generated email data:', emailData);
      emailPreview = generateEmailPreview(emailData, selectedTemplate);
      
    } catch (error) {
      console.error('Failed to generate email preview:', error);
      emailPreview = { error: error.message };
    } finally {
      loading = false;
    }
  }
  
  function handleTemplateChange() {
    generatePreview();
  }
</script>

<svelte:head>
  <title>Email Preview - DocketCC Admin</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold text-primary">Email Template Preview</h2>
    <p class="text-secondary mt-1">
      Preview and test email templates with sample data - New DocketCC designs available
    </p>
  </div>
  
  <!-- Template Selector -->
  <div class="card-base card-padding-md">
    <div class="flex items-center space-x-4">
      <label for="template-select" class="text-sm font-medium text-secondary">
        Template:
      </label>
      <select 
        id="template-select"
        bind:value={selectedTemplate}
        on:change={handleTemplateChange}
        class="border border-base rounded px-3 py-2 text-sm"
      >
        {#each templateOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
      
      <button 
        class="btn-base btn-secondary btn-sm"
        on:click={generatePreview}
        disabled={loading}
      >
        {loading ? 'Generating...' : '🔄 Refresh Preview'}
      </button>
    </div>
  </div>
  
  {#if loading}
    <div class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-secondary">Generating email preview...</p>
    </div>
  {:else if emailPreview?.error}
    <div class="card-base card-padding-md bg-error text-white">
      <h3 class="font-semibold">Preview Error</h3>
      <p>{emailPreview.error}</p>
    </div>
  {:else if emailPreview}
    <!-- Email Preview -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- HTML Preview -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-primary">HTML Version</h3>
        <div class="card-base card-padding-sm">
          <div class="text-sm text-secondary mb-2">Subject: {emailPreview.subject}</div>
          <iframe 
            srcDoc={emailPreview.html}
            class="w-full h-96 border border-base rounded"
            title="Email HTML Preview"
          ></iframe>
        </div>
      </div>
      
      <!-- Text Preview -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-primary">Text Version</h3>
        <div class="card-base card-padding-md">
          <div class="text-sm text-secondary mb-2">Subject: {emailPreview.subject}</div>
          <pre class="text-sm text-primary whitespace-pre-wrap font-mono bg-background p-4 rounded overflow-auto max-h-96">
{emailPreview.text}
          </pre>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .space-y-4 > * + * {
    margin-top: var(--spacing-4);
  }
  
  .space-y-6 > * + * {
    margin-top: var(--spacing-6);
  }
  
  .space-x-4 > * + * {
    margin-left: var(--spacing-4);
  }
  
  .grid {
    display: grid;
  }
  
  .grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  @media (min-width: 1024px) {
    .lg\:grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  
  .gap-6 {
    gap: var(--spacing-6);
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .whitespace-pre-wrap {
    white-space: pre-wrap;
  }
  
  .font-mono {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  }
  
  .max-h-96 {
    max-height: 24rem;
  }
  
  .overflow-auto {
    overflow: auto;
  }
</style> 