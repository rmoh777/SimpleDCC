<script>
  import { onMount } from 'svelte';
  
  let selectedTemplate = 'filing-alert-dark'; 
  /** @type {{ subject: string, html: string, text: string, error?: string } | null } */
  let emailPreview = null;
  let loading = false;
  let selectedTier = 'free';
  
  // Define available templates and their themes/modes
  /**
   * @typedef {'generateFilingAlert' | 'generateDailyDigest' | 'generateSeedDigest'} TemplateFunctionName
   */

  /**
   * @typedef {import('$lib/types/storage.js').FilingData} Filing
   */

  /**
   * @typedef {Filing | Array<Filing>} EmailContentArg
   */

  /**
   * @type {Array<{ value: string, label: string, template: TemplateFunctionName, theme: 'dark' | 'light' }>} 
   */
  const templateOptions = [
    { value: 'filing-alert-dark', label: 'Filing Alert (Dark)', template: 'generateFilingAlert', theme: 'dark' },
    { value: 'filing-alert-light', label: 'Filing Alert (Light)', template: 'generateFilingAlert', theme: 'light' },
    { value: 'daily-digest-dark', label: 'Daily Digest (Dark)', template: 'generateDailyDigest', theme: 'dark' },
    { value: 'daily-digest-light', label: 'Daily Digest (Light)', template: 'generateDailyDigest', theme: 'light' },
    { value: 'seed-digest-dark', label: 'Welcome Email - Seed (Dark)', template: 'generateSeedDigest', theme: 'dark' },
    { value: 'seed-digest-light', label: 'Welcome Email - Seed (Light)', template: 'generateSeedDigest', theme: 'light' },
    { value: 'welcome-email-dark', label: 'Welcome Email - Initial (Dark)', template: 'generateWelcomeEmail', theme: 'dark' },
    { value: 'welcome-email-light', label: 'Welcome Email - Initial (Light)', template: 'generateWelcomeEmail', theme: 'light' },
  ];

  const tierOptions = [
    { value: 'free', label: 'Free Tier' },
    { value: 'trial', label: 'Trial Tier' },
    { value: 'pro', label: 'Pro Tier' }
  ];
  
  onMount(() => {
    generatePreview();
  });
  
  async function generatePreview() {
    loading = true;
    
    try {
      const currentTemplateDef = templateOptions.find(opt => opt.value === selectedTemplate);
      if (!currentTemplateDef) {
        throw new Error('Selected template not found.');
      }

      // Dynamically import the template function
      const templateModule = /** @type {any} */ (await import('$lib/email/docketcc-templates.js'));
      const generateFunction = templateModule[currentTemplateDef.template];
      
      if (typeof generateFunction !== 'function') {
        throw new Error(`Template function '$${currentTemplateDef.template}' not found or not a function.`);
      }

      // Prepare sample data based on template type (extend this as needed)
      let sampleData;
      /** @type {EmailContentArg | undefined} */
      let contentArg;

      if (currentTemplateDef.template === 'generateFilingAlert') {
        const filingSampleData = (await import('$lib/email/email-preview.js')).generateDocketCCSampleData();
        sampleData = {
          userEmail: filingSampleData.userEmail,
          options: filingSampleData.options
        };
        contentArg = filingSampleData.filing;
      } else if (currentTemplateDef.template === 'generateDailyDigest') {
        const dailyDigestSampleData = (await import('$lib/email/email-preview.js')).generateDailyDigestSampleData();
        sampleData = {
          userEmail: dailyDigestSampleData.userEmail,
          options: dailyDigestSampleData.options
        };
        contentArg = dailyDigestSampleData.filings;
      } else if (currentTemplateDef.template === 'generateSeedDigest') {
        const seedDigestSampleData = (await import('$lib/email/email-preview.js')).generateSeedDigestSampleData();
        sampleData = {
          userEmail: seedDigestSampleData.userEmail,
          options: seedDigestSampleData.options
        };
        contentArg = seedDigestSampleData.filing;
      } else if (currentTemplateDef.template === 'generateWelcomeEmail') {
        // Welcome email needs userEmail, docketNumber, options
        sampleData = {
          userEmail: 'user@example.com',
          docketNumber: '23-108',
          options: {
            brandName: 'DocketCC',
            supportEmail: 'support@simpledcc.com',
            unsubscribeBaseUrl: 'https://simpledcc.pages.dev'
          }
        };
        
        emailPreview = generateFunction(sampleData.userEmail, sampleData.docketNumber, {
          ...sampleData.options,
          user_tier: selectedTier,
          theme: currentTemplateDef.theme
        });
      } else {
        // Default or other template specific sample data
        sampleData = {
          userEmail: 'user@example.com',
          options: {
            brandName: 'DocketCC',
            supportEmail: 'support@simpledcc.com',
            unsubscribeBaseUrl: 'https://simpledcc.pages.dev'
          }
        };
        contentArg = undefined; // No specific content for unknown templates
        
        // Ensure contentArg is defined before passing to generateFunction
        if (contentArg === undefined) {
          throw new Error(`No sample data defined for template type: ${currentTemplateDef.template}`);
        }

        emailPreview = generateFunction(sampleData.userEmail, contentArg, {
          ...sampleData.options,
          user_tier: selectedTier,
          theme: currentTemplateDef.theme
        });
      }
      
    } catch (error) {
      console.error('Error generating preview:', error);
      emailPreview = { 
        subject: 'Error', 
        html: '<div style="color: red;">Error generating email preview. Please check the console.</div>', 
        text: `Error generating email preview: ${/** @type {Error} */ (error).message}`,
        error: /** @type {Error} */ (error).message 
      };
    } finally {
      loading = false;
    }
  }

  async function testWithRealDatabaseStructure() {
    loading = true;
    
    try {
      // Create a sample filing with REAL database structure
      const realDbFiling = {
        id: '20250715123456',
        docket_number: '23-108',
        title: 'Comments on Broadband Infrastructure Deployment (TEST WITH REAL DB STRUCTURE)',
        author: 'National Telecommunications Association',
        filing_type: 'comment',
        date_received: '2025-07-15T14:30:00.000Z',
        filing_url: 'https://www.fcc.gov/ecfs/filing/20250715123456',
        documents: JSON.stringify([
          {
            "filename": "NTA_Broadband_Comments.pdf",
            "doc_type": "pdf",
            "size_estimate": "~45 pages"
          }
        ]),
        raw_data: JSON.stringify({"fcc_metadata": "sample"}),
        ai_summary: 'This filing advocates for streamlined permitting processes to accelerate broadband deployment in underserved areas. Key recommendations include standardizing municipal approval timelines, reducing regulatory barriers for infrastructure projects, and establishing federal preemption for certain deployment activities.',
        ai_key_points: 'Streamlined Permitting, Municipal Approval Timelines, Regulatory Barrier Reduction, Federal Preemption Authority, Infrastructure Investment Focus',
        ai_stakeholders: 'Municipal Governments, Telecom Operators, Rural Communities, Federal Regulators',
        ai_regulatory_impact: 'Proposed changes could reduce deployment timelines by 6-12 months and lower costs by 15-20%',
        ai_document_analysis: 'Document contains 45 pages of technical analysis, cost projections, and regulatory recommendations based on 24-month deployment study',
        ai_confidence: 'high',
        ai_enhanced: 1,
        documents_processed: 1,
        status: 'completed',
        created_at: Math.floor(Date.now() / 1000),
        processed_at: Math.floor(Date.now() / 1000)
      };

      // Test Filing Alert with real DB structure
      const templateModule = /** @type {any} */ (await import('$lib/email/docketcc-templates.js'));
      const generateFilingAlert = templateModule.generateFilingAlert;
      
      emailPreview = generateFilingAlert('test@example.com', realDbFiling, {
        brandName: 'DocketCC',
        unsubscribeBaseUrl: 'https://simpledcc.pages.dev',
        user_tier: selectedTier,
        theme: selectedTemplate.includes('dark') ? 'dark' : 'light'
      });
      
      // Add indicator that this is real DB test
      emailPreview.subject = `[REAL DB TEST] ${emailPreview.subject}`;
      
    } catch (error) {
      console.error('Error testing with real DB structure:', error);
      emailPreview = { 
        subject: 'Error', 
        html: '<div style="color: red;">Error testing with real database structure. Please check the console.</div>', 
        text: `Error: ${/** @type {Error} */ (error).message}`,
        error: /** @type {Error} */ (error).message 
      };
    } finally {
      loading = false;
    }
  }
  
  async function runEmailPipelineSimulation() {
    loading = true;
    
    try {
      console.log('🧪 Running Email Pipeline Simulation...');
      
      // Real database filing structure
      const mockFiling = {
        id: '20250715123456',
        docket_number: '23-108',
        title: 'Comments on Broadband Infrastructure Deployment',
        author: 'National Telecommunications Association',
        filing_type: 'comment',
        date_received: '2025-07-15T14:30:00.000Z',
        filing_url: 'https://www.fcc.gov/ecfs/filing/20250715123456',
        documents: '[]',
        raw_data: '{}',
        ai_summary: 'This filing advocates for streamlined permitting processes to accelerate broadband deployment.',
        ai_key_points: 'Streamlined Permitting, Municipal Approval, Regulatory Reform',
        status: 'completed'
      };

      const templateModule = await import('$lib/email/docketcc-templates.js');
      
      // Test 1: Filing Alert
      const filingAlert = templateModule.generateFilingAlert('test@example.com', mockFiling, {
        user_tier: 'pro',
        unsubscribeBaseUrl: 'https://simpledcc.pages.dev',
        theme: 'dark'
      });
      console.log('✅ Filing Alert generated successfully');

      // Test 2: Daily Digest
      const dailyDigest = templateModule.generateDailyDigest('test@example.com', [mockFiling], {
        user_tier: 'pro',
        unsubscribeBaseUrl: 'https://simpledcc.pages.dev',
        theme: 'dark'
      });
      console.log('✅ Daily Digest generated successfully');

      // Test 3: Seed Digest
      const seedDigest = templateModule.generateSeedDigest('test@example.com', mockFiling, {
        user_tier: 'pro',
        unsubscribeBaseUrl: 'https://simpledcc.pages.dev',
        theme: 'dark'
      });
      console.log('✅ Seed Digest generated successfully');

      // Display the filing alert as preview
      emailPreview = {
        ...filingAlert,
        subject: `[PIPELINE TEST] ${filingAlert.subject}`
      };
      
      console.log('🎉 Email Pipeline Simulation PASSED - All templates working!');
      
    } catch (error) {
      console.error('❌ Email Pipeline Simulation FAILED:', error);
      emailPreview = { 
        subject: 'Pipeline Test Failed', 
        html: `<div style="color: red;"><h3>Pipeline Test Failed</h3><p>${error.message}</p></div>`, 
        text: `Pipeline Test Failed: ${error.message}`,
        error: error.message 
      };
    } finally {
      loading = false;
    }
  }
  
  function handleTemplateChange() {
    generatePreview();
  }

  function handleTierChange() {
    generatePreview();
  }
</script>

<svelte:head>
  <title>Email Template Preview - DocketCC Admin</title>
</svelte:head>

<div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
  <h1 style="color: #10b981; margin-bottom: 20px;">DocketCC Email Template Preview</h1>
  
  <!-- Template Selector -->
  <div style="margin-bottom: 20px; padding: 20px; background: #f8fafc; border-radius: 8px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
    <div>
      <label for="template-select" style="margin-right: 10px; font-weight: bold;">Template:</label>
      <select 
        id="template-select"
        bind:value={selectedTemplate}
        on:change={handleTemplateChange}
        style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
      >
        {#each templateOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>

    <div>
      <label for="tier-select" style="margin-right: 10px; font-weight: bold;">User Tier:</label>
      <select 
        id="tier-select"
        bind:value={selectedTier}
        on:change={handleTierChange}
        style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
      >
        {#each tierOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>
    
    <button 
      on:click={generatePreview}
      disabled={loading}
      style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;"
    >
      {loading ? 'Loading...' : '🔄 Refresh'}
    </button>
    
    <button 
      on:click={testWithRealDatabaseStructure}
      disabled={loading}
      style="padding: 8px 16px; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer;"
    >
      {loading ? 'Testing...' : '🧪 Test Real DB'}
    </button>

    <button 
      on:click={runEmailPipelineSimulation}
      disabled={loading}
      style="padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;"
    >
      {loading ? 'Simulating...' : '🧪 Run Pipeline'}
    </button>
  </div>
  
  {#if loading}
    <div style="text-align: center; padding: 40px;">
      <div style="border: 4px solid #f3f4f6; border-top: 4px solid #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
      <p>Generating email preview...</p>
    </div>
  {:else if emailPreview?.error}
    <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; color: #dc2626;">
      <h3 style="margin-top: 0;">Preview Error</h3>
      <p>{emailPreview.error}</p>
    </div>
  {:else if emailPreview}
    <!-- Email Preview -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <!-- HTML Preview -->
      <div>
        <h3 style="color: #374151; margin-bottom: 10px;">HTML Version</h3>
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="padding: 10px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
            Subject: {emailPreview.subject}
          </div>
          <iframe 
            srcDoc={emailPreview.html}
            style="width: 100%; height: 600px; border: none;"
            title="Email HTML Preview"
          ></iframe>
        </div>
      </div>
      
      <!-- Text Preview -->
      <div>
        <h3 style="color: #374151; margin-bottom: 10px;">Text Version</h3>
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="padding: 10px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
            Subject: {emailPreview.subject}
          </div>
          <pre style="margin: 0; padding: 20px; background: white; font-family: monospace; font-size: 12px; line-height: 1.4; white-space: pre-wrap; max-height: 600px; overflow: auto;">
{emailPreview.text}
          </pre>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    div[style*="grid-template-columns: 1fr 1fr"] {
      grid-template-columns: 1fr !important;
    }
  }
</style> 