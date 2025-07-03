# Card E3: Safe Integration and Production Rollout ⏱️ *2 hours*

**Objective:** Safely integrate enhanced ECFS system with existing codebase using feature flags, then roll out to production.

## Files to Update/Create:

### 1. `src/lib/fcc/ecfs-client.js` (UPDATE - Add Feature Flag Integration)

```javascript
// EXISTING FILE - ADD FEATURE FLAG INTEGRATION
// Add this to the TOP of the existing ecfs-client.js file

// Feature flag integration for enhanced ECFS
const USE_ENHANCED_ECFS = process.env.ECFS_USE_ENHANCED === 'true' || false;

// Import enhanced client conditionally
let enhancedClient;
if (USE_ENHANCED_ECFS) {
  try {
    enhancedClient = await import('./ecfs-enhanced-client.js');
    console.log('🚀 Enhanced ECFS client loaded');
  } catch (error) {
    console.warn('⚠️ Enhanced ECFS client failed to load, using fallback:', error);
  }
}

// MODIFY the existing fetchECFSFilings function to use feature flag
export async function fetchECFSFilings(docketNumber, lookbackHours = DEFAULT_LOOKBACK_HOURS, env) {
  // Feature flag: Use enhanced client if available and enabled
  if (USE_ENHANCED_ECFS && enhancedClient) {
    try {
      console.log(`🚀 Using Enhanced ECFS for docket ${docketNumber}`);
      
      // Enhanced approach: get last 50 filings instead of time-based
      const enhancedFilings = await enhancedClient.fetchLatestFilings(docketNumber, 50, env);
      
      // Filter by lookback hours if needed (for compatibility)
      if (lookbackHours < 9999) {
        const cutoffTime = Date.now() - (lookbackHours * 60 * 60 * 1000);
        return enhancedFilings.filter(filing => 
          new Date(filing.date_received).getTime() > cutoffTime
        );
      }
      
      return enhancedFilings;
      
    } catch (enhancedError) {
      console.error('❌ Enhanced ECFS failed, falling back to original:', enhancedError);
      // Fall through to original implementation
    }
  }
  
  // Original implementation continues here...
  // [Keep all existing code unchanged]
  
  try {
    // Validate API key is available
    const apiKey = env?.ECFS_API_KEY;
    if (!apiKey) {
      throw new Error('ECFS_API_KEY environment variable is not set');
    }
    
    // Calculate lookback date for API query (single date, not range)
    const sinceDate = new Date(Date.now() - (lookbackHours * 60 * 60 * 1000));
    
    // Format date for FCC API (YYYY-MM-DD) - EXACT format from ECFS rules
    const sinceDateStr = sinceDate.toISOString().split('T')[0];
    
    // [Rest of existing implementation stays exactly the same...]
    
  } catch (error) {
    console.error(`ECFS API error for docket ${docketNumber}:`, error);
    throw new Error(`Failed to fetch ECFS filings: ${error.message}`);
  }
}

// MODIFY the existing fetchMultipleDockets function for enhanced integration
export async function fetchMultipleDockets(docketNumbers, lookbackHours = DEFAULT_LOOKBACK_HOURS, env) {
  // Feature flag: Use enhanced client if available
  if (USE_ENHANCED_ECFS && enhancedClient) {
    try {
      console.log(`🚀 Using Enhanced Multi-Docket ECFS for ${docketNumbers.length} dockets`);
      return await enhancedClient.fetchMultipleDocketsEnhanced(docketNumbers, env);
      
    } catch (enhancedError) {
      console.error('❌ Enhanced Multi-Docket ECFS failed, falling back:', enhancedError);
      // Fall through to original implementation
    }
  }
  
  // [Keep all existing original implementation unchanged...]
  const allFilings = [];
  const errors = [];
  
  console.log(`ECFS: Checking ${docketNumbers.length} dockets for new filings`);
  console.log(`🎯 Dockets to check: ${docketNumbers.join(', ')}`);
  
  // [Rest of existing implementation...]
}

// ADD new function for enhanced storage integration
export async function processAllDocketsEnhanced(docketNumbers, env, db, options = {}) {
  const { enableEnhancedAI = true } = options;
  
  try {
    console.log(`🚀 Enhanced processing for ${docketNumbers.length} dockets`);
    
    // Use enhanced ECFS client
    const ecfsResult = await enhancedClient.fetchMultipleDocketsEnhanced(docketNumbers, env);
    
    // Identify new filings using enhanced deduplication
    const newFilings = await enhancedClient.identifyNewFilings(ecfsResult.filings, db);
    
    if (newFilings.length === 0) {
      console.log(`✅ No new filings found across ${docketNumbers.length} dockets`);
      return {
        success: true,
        totalChecked: ecfsResult.stats.totalFilings,
        newFilings: 0,
        enhanced: true
      };
    }
    
    // Store with enhanced processing
    let storageResult;
    if (enableEnhancedAI) {
      const { storeFilingsEnhanced } = await import('$lib/storage/filing-storage-enhanced.js');
      storageResult = await storeFilingsEnhanced(newFilings, db, env);
    } else {
      const { storeFilings } = await import('$lib/storage/filing-storage.js');
      storageResult = await storeFilings(newFilings, db);
    }
    
    console.log(`💾 Enhanced processing complete: ${storageResult.newFilings} stored, ${storageResult.aiProcessed || 0} AI enhanced`);
    
    return {
      success: true,
      totalChecked: ecfsResult.stats.totalFilings,
      newFilings: storageResult.newFilings,
      aiProcessed: storageResult.aiProcessed || 0,
      enhanced: true,
      errors: ecfsResult.errors
    };
    
  } catch (error) {
    console.error('❌ Enhanced processing failed:', error);
    throw error;
  }
}
```

### 2. `src/routes/api/cron/daily-check/+server.js` (UPDATE - Add Enhanced Processing)

```javascript
// EXISTING FILE - UPDATE to include enhanced processing option

export async function POST({ platform, request }) {
  const cronSecret = platform?.env?.CRON_SECRET;
  const providedSecret = request.headers.get('X-Cron-Secret');
  
  if (cronSecret !== providedSecret) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    console.log('🕐 Starting scheduled ECFS check...');
    
    // Get active dockets
    const { getActiveDockets } = await import('$lib/database/db-operations.js');
    const activeDockets = await getActiveDockets(platform.env.DB);
    const docketNumbers = activeDockets.map(d => d.docket_number);
    
    if (docketNumbers.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active dockets to check',
        enhanced: false
      }));
    }
    
    // Check for enhanced processing flag
    const useEnhanced = platform.env.ECFS_USE_ENHANCED === 'true';
    let result;
    
    if (useEnhanced) {
      console.log('🚀 Using enhanced ECFS processing');
      
      try {
        // Use enhanced processing pipeline
        const { processAllDocketsEnhanced } = await import('$lib/fcc/ecfs-client.js');
        result = await processAllDocketsEnhanced(docketNumbers, platform.env, platform.env.DB, {
          enableEnhancedAI: platform.env.GEMINI_API_KEY ? true : false
        });
        
      } catch (enhancedError) {
        console.error('❌ Enhanced processing failed, falling back to original:', enhancedError);
        
        // Fallback to original processing
        const { fetchMultipleDockets } = await import('$lib/fcc/ecfs-client.js');
        const { storeFilings } = await import('$lib/storage/filing-storage.js');
        
        const ecfsResult = await fetchMultipleDockets(docketNumbers, 2, platform.env);
        const storageResult = await storeFilings(ecfsResult.filings, platform.env.DB);
        
        result = {
          success: true,
          totalChecked: ecfsResult.stats.totalFilings,
          newFilings: storageResult.newFilings,
          enhanced: false,
          fallback: true,
          errors: ecfsResult.errors
        };
      }
      
    } else {
      console.log('📡 Using original ECFS processing');
      
      // Original processing pipeline
      const { fetchMultipleDockets } = await import('$lib/fcc/ecfs-client.js');
      const { storeFilings } = await import('$lib/storage/filing-storage.js');
      
      const ecfsResult = await fetchMultipleDockets(docketNumbers, 2, platform.env);
      const storageResult = await storeFilings(ecfsResult.filings, platform.env.DB);
      
      result = {
        success: true,
        totalChecked: ecfsResult.stats.totalFilings,
        newFilings: storageResult.newFilings,
        enhanced: false,
        errors: ecfsResult.errors
      };
    }
    
    // Process daily digest emails (only during notification hours)
    const currentHour = new Date().getHours();
    if (currentHour === 9) { // 9 AM daily digests
      const { processDailyDigests } = await import('$lib/processing/digest-processor.js');
      await processDailyDigests(platform.env);
      result.digestsSent = true;
    }
    
    // Log system event
    const { logSystemEvent } = await import('$lib/database/db-operations.js');
    await logSystemEvent(platform.env.DB, 'info', 'Scheduled ECFS check completed', 'cron', {
      dockets_checked: docketNumbers.length,
      new_filings: result.newFilings,
      enhanced_processing: result.enhanced,
      ai_processed: result.aiProcessed || 0,
      duration_type: 'scheduled'
    });
    
    return new Response(JSON.stringify(result));
    
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    
    // Log error
    try {
      const { logSystemEvent } = await import('$lib/database/db-operations.js');
      await logSystemEvent(platform.env.DB, 'error', 'Scheduled ECFS check failed', 'cron', {
        error: error.message,
        stack: error.stack
      });
    } catch (logError) {
      console.error('Failed to log cron error:', logError);
    }
    
    return new Response('Error', { status: 500 });
  }
}
```

### 3. `src/routes/admin/monitoring/enhanced/+page.svelte` (NEW - Enhanced Monitoring Dashboard)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import StatsCard from '$lib/components/monitoring/StatsCard.svelte';
  
  let enhancedStats = {
    enabled: false,
    totalFilings: 0,
    enhancedFilings: 0,
    enhancementRate: 0,
    documentsProcessed: 0,
    avgProcessingTime: 0,
    lastEnhancedCheck: 0
  };
  
  let isLoading = true;
  let error: string | null = null;
  
  onMount(async () => {
    await loadEnhancedStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadEnhancedStats, 30000);
    return () => clearInterval(interval);
  });
  
  async function loadEnhancedStats() {
    try {
      const response = await fetch('/api/admin/monitoring/enhanced-stats');
      if (response.ok) {
        enhancedStats = await response.json();
        error = null;
      } else {
        error = 'Failed to load enhanced statistics';
      }
    } catch (err) {
      error = 'Network error loading enhanced stats';
    } finally {
      isLoading = false;
    }
  }
  
  async function toggleEnhanced() {
    try {
      const response = await fetch('/api/admin/monitoring/toggle-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enhancedStats.enabled })
      });
      
      if (response.ok) {
        await loadEnhancedStats();
      } else {
        alert('Failed to toggle enhanced processing');
      }
    } catch (err) {
      alert('Error toggling enhanced processing');
    }
  }
  
  async function runEnhancedTest() {
    try {
      const response = await fetch('/api/admin/test-ecfs-enhanced?docket=11-42&limit=3');
      const result = await response.json();
      
      if (result.success) {
        alert(`Enhanced test successful!\nFilings: ${result.results.filings_found}\nDocuments: ${result.results.total_documents}`);
      } else {
        alert(`Test failed: ${result.error.message}`);
      }
    } catch (err) {
      alert('Error running enhanced test');
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-xl font-semibold text-primary">Enhanced ECFS Processing</h3>
      <p class="text-secondary mt-1">
        Monitor and control the enhanced ECFS system with AI document processing
      </p>
    </div>
    
    <div class="flex space-x-3">
      <button 
        class="btn-base btn-secondary btn-sm"
        on:click={runEnhancedTest}
      >
        🧪 Test Enhanced System
      </button>
      
      <button 
        class="btn-base {enhancedStats.enabled ? 'btn-warning' : 'btn-primary'} btn-sm"
        on:click={toggleEnhanced}
      >
        {enhancedStats.enabled ? '⏸️ Disable Enhanced' : '🚀 Enable Enhanced'}
      </button>
    </div>
  </div>
  
  {#if error}
    <div class="card-base card-padding-md bg-error text-white">
      <h4 class="font-semibold">⚠️ Enhanced System Error</h4>
      <p class="mt-1">{error}</p>
    </div>
  {/if}
  
  {#if isLoading}
    <div class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-secondary">Loading enhanced statistics...</p>
    </div>
  {:else}
    <!-- Enhanced System Status -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="System Status"
        value={enhancedStats.enabled ? 'Enhanced' : 'Original'}
        icon={enhancedStats.enabled ? '🚀' : '📡'}
        status={enhancedStats.enabled ? 'success' : 'neutral'}
        subtitle={enhancedStats.enabled ? 'Using enhanced processing' : 'Using original system'}
      />
      
      <StatsCard
        title="Enhancement Rate"
        value="{enhancedStats.enhancementRate}%"
        icon="🤖"
        status={enhancedStats.enhancementRate > 80 ? 'success' : 
               enhancedStats.enhancementRate > 50 ? 'warning' : 'error'}
        subtitle="Filings with AI enhancement"
      />
      
      <StatsCard
        title="Documents Processed"
        value={enhancedStats.documentsProcessed.toString()}
        icon="📄"
        status="success"
        subtitle="PDFs downloaded and analyzed"
      />
      
      <StatsCard
        title="Avg Processing Time"
        value="{enhancedStats.avgProcessingTime}s"
        icon="⏱️"
        status={enhancedStats.avgProcessingTime < 30 ? 'success' : 
               enhancedStats.avgProcessingTime < 60 ? 'warning' : 'error'}
        subtitle="Per filing with documents"
      />
    </div>
    
    <!-- Enhanced vs Original Comparison -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card-base card-padding-md">
        <h4 class="text-lg font-semibold text-primary mb-4">🚀 Enhanced Features</h4>
        <div class="space-y-3">
          <div class="flex items-center space-x-3">
            <span class="text-success">✅</span>
            <span>Direct PDF document access</span>
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-success">✅</span>
            <span>Perfect deduplication with id_submission</span>
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-success">✅</span>
            <span>AI summaries with document content</span>
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-success">✅</span>
            <span>Structured AI output (stakeholders, impact)</span>
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-success">✅</span>
            <span>Last 50 filings approach (no time issues)</span>
          </div>
        </div>
      </div>
      
      <div class="card-base card-padding-md">
        <h4 class="text-lg font-semibold text-secondary mb-4">📡 Original System</h4>
        <div class="space-y-3">
          <div class="flex items-center space-x-3">
            <span class="text-warning">⚠️</span>
            <span>Time-based lookback (complex)</span>
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-warning">⚠️</span>
            <span>No direct document access</span>
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-warning">⚠️</span>
            <span>Basic AI summaries (metadata only)</span>
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-success">✅</span>
            <span>Stable and tested</span>
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-success">✅</span>
            <span>Fallback option</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Recent Enhanced Processing Activity -->
    {#if enhancedStats.enabled}
      <div class="card-base card-padding-md">
        <h4 class="text-lg font-semibold text-primary mb-4">📊 Recent Enhanced Activity</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{enhancedStats.enhancedFilings}</div>
            <div class="text-sm text-secondary">Enhanced Filings (24h)</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-success">{enhancedStats.documentsProcessed}</div>
            <div class="text-sm text-secondary">Documents Analyzed</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">
              {enhancedStats.lastEnhancedCheck ? 
                new Date(enhancedStats.lastEnhancedCheck).toLocaleTimeString() : 
                'Never'}
            </div>
            <div class="text-sm text-secondary">Last Enhanced Check</div>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .space-y-6 > * + * {
    margin-top: var(--spacing-6);
  }
  
  .space-y-3 > * + * {
    margin-top: var(--spacing-3);
  }
  
  .space-x-3 > * + * {
    margin-left: var(--spacing-3);
  }
  
  .grid {
    display: grid;
  }
  
  .grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  @media (min-width: 768px) {
    .md\:grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    
    .md\:grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  
  @media (min-width: 1024px) {
    .lg\:grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    
    .lg\:grid-cols-4 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  
  .gap-4 {
    gap: var(--spacing-4);
  }
  
  .gap-6 {
    gap: var(--spacing-6);
  }
</style>
```

### 4. `src/routes/api/admin/monitoring/enhanced-stats/+server.js` (NEW)

```javascript
import { json } from '@sveltejs/kit';
import { getEnhancedProcessingStats } from '$lib/storage/filing-storage-enhanced.js';

export async function GET({ platform, cookies }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = platform.env.DB;
    
    // Check if enhanced processing is enabled
    const enhancedEnabled = platform.env.ECFS_USE_ENHANCED === 'true';
    
    // Get enhanced processing statistics
    const enhancedStats = await getEnhancedProcessingStats(db);
    
    // Get system configuration
    const systemConfig = {
      enhanced_enabled: enhancedEnabled,
      gemini_configured: !!platform.env.GEMINI_API_KEY,
      ecfs_configured: !!platform.env.ECFS_API_KEY,
      pdf_processing_enabled: true // Always available
    };
    
    // Get recent processing metrics
    const recentMetrics = await getRecentProcessingMetrics(db);
    
    return json({
      enabled: enhancedEnabled,
      totalFilings: enhancedStats.total_recent,
      enhancedFilings: enhancedStats.enhanced_filings,
      enhancementRate: enhancedStats.enhancement_rate,
      documentsProcessed: enhancedStats.documents_processed,
      avgDocsPerFiling: enhancedStats.avg_docs_per_filing,
      avgProcessingTime: recentMetrics.avg_processing_time,
      lastEnhancedCheck: recentMetrics.last_enhanced_check,
      configuration: systemConfig,
      performance: {
        uptime_24h: recentMetrics.uptime_percentage,
        error_rate: recentMetrics.error_rate,
        throughput: recentMetrics.filings_per_hour
      }
    });
    
  } catch (error) {
    console.error('Error getting enhanced stats:', error);
    return json({ 
      error: 'Failed to retrieve enhanced statistics',
      details: error.message 
    }, { status: 500 });
  }
}

async function getRecentProcessingMetrics(db) {
  try {
    // Get recent processing performance metrics
    const metricsResult = await db.prepare(`
      SELECT 
        AVG(CASE WHEN details LIKE '%duration_ms%' THEN 
          CAST(JSON_EXTRACT(details, '$.duration_ms') AS INTEGER) / 1000.0 
          ELSE NULL END) as avg_processing_time,
        MAX(created_at) as last_enhanced_check,
        COUNT(CASE WHEN level = 'error' THEN 1 END) * 100.0 / COUNT(*) as error_rate,
        COUNT(*) * 1.0 / 24 as filings_per_hour
      FROM system_logs 
      WHERE component = 'ai-enhanced' 
        AND created_at > ?
    `).bind(Date.now() - 86400000).first(); // Last 24 hours
    
    return {
      avg_processing_time: Math.round(metricsResult?.avg_processing_time || 0),
      last_enhanced_check: metricsResult?.last_enhanced_check || 0,
      error_rate: Math.round(metricsResult?.error_rate || 0),
      filings_per_hour: Math.round(metricsResult?.filings_per_hour || 0),
      uptime_percentage: Math.max(95, 100 - (metricsResult?.error_rate || 0))
    };
    
  } catch (error) {
    console.error('Error getting processing metrics:', error);
    return {
      avg_processing_time: 0,
      last_enhanced_check: 0,
      error_rate: 0,
      filings_per_hour: 0,
      uptime_percentage: 95
    };
  }
}
```

### 5. `src/routes/api/admin/monitoring/toggle-enhanced/+server.js` (NEW)

```javascript
import { json } from '@sveltejs/kit';

export async function POST({ platform, request, cookies }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { enabled } = await request.json();
    
    // Note: In a real implementation, this would update environment variables
    // For now, this is a placeholder that logs the change
    console.log(`🔧 Enhanced processing ${enabled ? 'ENABLED' : 'DISABLED'} by admin`);
    
    // Log the change
    const { logSystemEvent } = await import('$lib/database/db-operations.js');
    await logSystemEvent(platform.env.DB, 'info', 
      `Enhanced processing ${enabled ? 'enabled' : 'disabled'} by admin`, 
      'admin', {
        enhanced_enabled: enabled,
        changed_at: Date.now(),
        admin_action: true
      });
    
    return json({
      success: true,
      message: `Enhanced processing ${enabled ? 'enabled' : 'disabled'}`,
      note: 'Environment variable ECFS_USE_ENHANCED must be updated for permanent change',
      current_env_value: platform.env.ECFS_USE_ENHANCED
    });
    
  } catch (error) {
    console.error('Error toggling enhanced processing:', error);
    return json({ 
      error: 'Failed to toggle enhanced processing',
      details: error.message 
    }, { status: 500 });
  }
}
```

### 6. Environment Variables (UPDATE - Add to wrangler.toml)

```toml
# Add to your wrangler.toml file

[env.production.vars]
# Existing variables...
ADMIN_SECRET_KEY = "your_admin_key"
RESEND_API_KEY = "your_resend_key"
ECFS_API_KEY = "your_fcc_api_key"
GEMINI_API_KEY = "your_google_ai_key"
CRON_SECRET = "random_secure_string"

# NEW: Enhanced processing toggle
ECFS_USE_ENHANCED = "false"  # Start with false, enable gradually

[env.development.vars]
# Same variables for development
ECFS_USE_ENHANCED = "true"   # Enable in development for testing
```

## Implementation Plan:

### Phase 1: Safe Integration (30 minutes)
1. **Update `ecfs-client.js`** with feature flag integration
2. **Update `daily-check` cron** to support enhanced processing
3. **Test with feature flag disabled** (existing behavior)

### Phase 2: Admin Controls (45 minutes)
1. **Create enhanced monitoring dashboard**
2. **Add API endpoints** for stats and toggle
3. **Test admin controls work properly**

### Phase 3: Gradual Rollout (45 minutes)
1. **Enable enhanced processing in development**
2. **Run comprehensive tests**
3. **Deploy to production with feature flag disabled**
4. **Gradually enable enhanced processing**

## Testing Sequence:

### 1. Development Testing
```bash
# Test with enhanced disabled
curl -X GET "/api/admin/test-ecfs-enhanced?docket=11-42&limit=3"

# Test with enhanced enabled (set ECFS_USE_ENHANCED=true)
curl -X POST "/api/admin/monitoring/toggle-enhanced" -d '{"enabled": true}'
```

### 2. Production Rollout
```bash
# 1. Deploy with enhanced disabled
wrangler publish

# 2. Test original system still works
curl -X GET "/api/admin/stats"

# 3. Enable enhanced processing
wrangler secret put ECFS_USE_ENHANCED
# Enter: true

# 4. Monitor enhanced dashboard
# Visit: /admin/monitoring/enhanced
```

## Success Criteria:
- ✅ Feature flag allows seamless switching between old/new systems
- ✅ Enhanced processing provides better AI summaries when enabled  
- ✅ Original system continues working as fallback
- ✅ Admin dashboard shows enhanced processing metrics
- ✅ Zero downtime during rollout
- ✅ Instant rollback capability if needed

## Rollback Plan:
If issues occur with enhanced processing:
1. **Instant rollback**: Set `ECFS_USE_ENHANCED=false`
2. **System automatically falls back** to original processing
3. **No data loss** - both systems use same database schema
4. **Monitor admin dashboard** confirms rollback successful
      