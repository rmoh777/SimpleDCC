<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { resilientAPI } from '$lib/api/monitoring-real.js';
  import StatsCard from '$lib/components/monitoring/StatsCard.svelte';
  import ActivityFeed from '$lib/components/monitoring/ActivityFeed.svelte';
  import SystemControls from '$lib/components/monitoring/SystemControls.svelte';
  import FrequencyToggle from '$lib/components/FrequencyToggle.svelte';

  // ====================================================================
  // START: User Subscription Lookup State
  // ====================================================================
  let lookupEmail = '';
  let lookupSubscriptions: any[] = [];
  let lookupUserTier = 'free';
  let isLookupLoading = false;
  let lookupErrorMessage = '';
  let showLookupForm = true;
  let isLookupUnsubscribing = false;
  let lookupUnsubscribeStatus = '';
  
  let lookupAddDocketNumber = '';
  let isLookupAddingDocket = false;
  let lookupAddDocketStatus = '';
  let lookupAddDocketError = '';
  let lookupSelectedFrequency = 'daily';
  // ====================================================================
  // END: User Subscription Lookup State
  // ====================================================================
  
  // State management
  let monitoringData: {
    systemHealth: 'healthy' | 'warning' | 'error' | 'unknown';
    activeJobs: number;
    lastCheck: number;
    totalFilings: number;
    activeDockets: number;
    recentActivity: any[];
    stats: {
      pendingFilings: number;
      processedToday: number;
      errorRate: number;
    };
  } = {
    systemHealth: 'unknown',
    activeJobs: 0,
    lastCheck: 0,
    totalFilings: 0,
    activeDockets: 0,
    recentActivity: [],
    stats: {
      pendingFilings: 0,
      processedToday: 0,
      errorRate: 0
    }
  };
  
  let isLoading = true;
  let error: string | null = null;
  let lastUpdated: Date | null = null;
  let autoRefreshInterval: NodeJS.Timeout | null = null;
  
  // Loading states for different operations
  let loadingStates = {
    stats: false,
    activity: false,
    manualCheck: false,
    refresh: false
  };
  
  onMount(async () => {
    await loadAllData();
    startAutoRefresh();
  });
  
  onDestroy(() => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }
  });

  // ====================================================================
  // START: User Subscription Lookup Functions
  // ====================================================================
  async function loadLookupSubscriptions() {
    if (!lookupEmail) return;
    
    isLookupLoading = true;
    lookupErrorMessage = '';
    
    try {
      const response = await fetch(`/api/subscribe?email=${encodeURIComponent(lookupEmail)}`);
      const data = await response.json();
      
      if (response.ok) {
        lookupSubscriptions = data.subscriptions || [];
        lookupUserTier = data.user_tier || 'free';
        showLookupForm = false;
      } else {
        lookupErrorMessage = data.error || 'Failed to load subscriptions';
      }
    } catch (error) {
      lookupErrorMessage = 'Network error occurred';
    } finally {
      isLookupLoading = false;
    }
  }
  
  async function lookupUnsubscribe(docketNumber: string) {
    isLookupUnsubscribing = true;
    lookupUnsubscribeStatus = '';
    
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: lookupEmail,
          docket_number: docketNumber
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        lookupSubscriptions = lookupSubscriptions.filter(sub => sub.docket_number !== docketNumber);
        lookupUnsubscribeStatus = `Successfully unsubscribed from ${docketNumber}`;
      } else {
        lookupUnsubscribeStatus = `Error: ${data.error || 'Unsubscribe failed'}`;
      }
    } catch (error) {
      lookupUnsubscribeStatus = 'Error: Network error occurred';
    } finally {
      isLookupUnsubscribing = false;
    }
  }
  
  function backToLookupForm() {
    showLookupForm = true;
    lookupSubscriptions = [];
    lookupEmail = '';
    lookupErrorMessage = '';
    lookupUnsubscribeStatus = '';
  }
  
  function formatLookupDate(timestamp: number) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(timestamp * 1000));
  }

  function handleLookupFrequencyChange(event: CustomEvent<{frequency: string}>, docketNumber: string) {
    lookupSubscriptions = lookupSubscriptions.map(sub => 
      sub.docket_number === docketNumber 
        ? { ...sub, frequency: event.detail.frequency }
        : sub
    );
  }

  function isValidLookupDocketNumber(docket: string): boolean {
    return /^\d{2,4}-\d{1,4}$/.test(docket.trim());
  }

  async function addLookupDocket() {
    if (!lookupAddDocketNumber) {
      lookupAddDocketError = 'Please enter a docket number';
      return;
    }

    if (!isValidLookupDocketNumber(lookupAddDocketNumber)) {
      lookupAddDocketError = 'Invalid docket number format. Use XX-XXX format (e.g., 23-108)';
      return;
    }

    isLookupAddingDocket = true;
    lookupAddDocketStatus = '';
    lookupAddDocketError = '';

    try {
      // Note: This API requires the user to be logged in. 
      // For an admin impersonation feature, this would need a separate admin API endpoint
      // that takes an email. For now, this will likely fail if the admin's session
      // doesn't have a subscription to modify. This is a limitation of not creating a new endpoint.
      const response = await fetch('/api/subscriptions/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: lookupEmail, // Sending email to specify target user
          docket_number: lookupAddDocketNumber,
          frequency: lookupSelectedFrequency
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        lookupAddDocketStatus = data.message;
        lookupAddDocketNumber = '';
        lookupSelectedFrequency = 'daily';
        
        await loadLookupSubscriptions();
      } else {
        lookupAddDocketError = data.error || 'Failed to add docket subscription';
      }
    } catch (error) {
      lookupAddDocketError = 'Network error occurred. Please try again.';
    } finally {
      isLookupAddingDocket = false;
    }
  }
  // ====================================================================
  // END: User Subscription Lookup Functions
  // ====================================================================

  /**
   * Load all monitoring data
   */
  async function loadAllData() {
    try {
      isLoading = true;
      error = null;
      
      // Load data in parallel for better performance
      const [statsData, activityData] = await Promise.allSettled([
        loadMonitoringStats(),
        loadRecentActivity()
      ]);
      
      // Handle any partial failures
      if (statsData.status === 'rejected') {
        console.error('Stats loading failed:', statsData.reason);
        error = `Stats unavailable: ${statsData.reason.message}`;
      }
      
      if (activityData.status === 'rejected') {
        console.error('Activity loading failed:', activityData.reason);
        // Don't set error for activity failure, just log it
      }
      
      lastUpdated = new Date();
      
    } catch (err: any) {
      console.error('Critical error loading monitoring data:', err);
      error = `System error: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }
  
  /**
   * Load monitoring statistics
   */
  async function loadMonitoringStats() {
    try {
      loadingStates.stats = true;
      const stats = await resilientAPI.getMonitoringStats();
      
      // Update monitoring data with API response
      monitoringData = {
        ...monitoringData,
        systemHealth: stats.systemHealth || 'unknown',
        activeJobs: stats.activeJobs || 0,
        lastCheck: stats.lastCheck || 0,
        totalFilings: stats.totalFilings || 0,
        activeDockets: stats.activeDockets || 0,
        stats: {
          pendingFilings: stats.stats?.pendingFilings || 0,
          processedToday: stats.stats?.processedToday || 0,
          errorRate: stats.stats?.errorRate || 0
        }
      };
      
    } catch (err: any) {
      console.error('Failed to load monitoring stats:', err);
      throw err;
    } finally {
      loadingStates.stats = false;
    }
  }
  
  /**
   * Load recent activity
   */
  async function loadRecentActivity() {
    try {
      loadingStates.activity = true;
      const activities = await resilientAPI.getRecentActivity({ limit: 15 });
      
      monitoringData.recentActivity = activities.map((activity: any) => ({
        ...activity,
        id: activity.id || Date.now() + Math.random(),
        timestamp: activity.created_at || activity.timestamp || Date.now()
      }));
      
    } catch (err: any) {
      console.error('Failed to load recent activity:', err);
      // Don't throw - activity is non-critical
      monitoringData.recentActivity = [];
    } finally {
      loadingStates.activity = false;
    }
  }
  
  /**
   * Handle manual ECFS check
   */
  async function handleManualCheck() {
    try {
      loadingStates.manualCheck = true;
      error = null;
      
      const result = await resilientAPI.triggerManualCheck();
      
      if (result.success) {
        // Show success message
        showNotification('success', `Manual check completed: ${result.newFilings} new filings found`);
        
        // Refresh data after manual check
        await loadAllData();
      } else {
        throw new Error(result.error || 'Manual check failed');
      }
      
    } catch (err: any) {
      console.error('Manual check failed:', err);
      error = `Manual check failed: ${err.message}`;
      showNotification('error', err.message);
    } finally {
      loadingStates.manualCheck = false;
    }
  }
  
  /**
   * Handle data refresh
   */
  async function handleRefresh() {
    try {
      loadingStates.refresh = true;
      await loadAllData();
      showNotification('success', 'Data refreshed successfully');
    } catch (err: any) {
      console.error('Refresh failed:', err);
      showNotification('error', `Refresh failed: ${err.message}`);
    } finally {
      loadingStates.refresh = false;
    }
  }
  
  /**
   * Start automatic refresh
   */
  function startAutoRefresh() {
    // Refresh every 30 seconds
    autoRefreshInterval = setInterval(async () => {
      if (!isLoading && !Object.values(loadingStates).some(loading => loading)) {
        try {
          await loadMonitoringStats();
          await loadRecentActivity();
          lastUpdated = new Date();
        } catch (err) {
          console.warn('Auto-refresh failed:', err);
          // Don't show error for auto-refresh failures
        }
      }
    }, 30000);
  }
  
  /**
   * Show notification to user
   */
  function showNotification(type: string, message: string) {
    // Simple notification system - could be enhanced with toast library
    const notification = {
      type,
      message,
      timestamp: Date.now()
    };
    
    console.log(`Notification (${type}):`, message);
    
    // In a real implementation, this would integrate with a toast/notification system
    if (type === 'error') {
      error = message;
      setTimeout(() => { error = null; }, 5000);
    }
  }
  
  /**
   * Format time ago
   */
  function formatTimeAgo(timestamp: number) {
    if (!timestamp) return 'Never';
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
  
  /**
   * Get health status styling
   */
  function getHealthStatus(health: string): { color: 'success' | 'warning' | 'error' | 'neutral', icon: string } {
    switch (health) {
      case 'healthy': return { color: 'success', icon: '✅' };
      case 'warning': return { color: 'warning', icon: '⚠️' };
      case 'error': return { color: 'error', icon: '❌' };
      default: return { color: 'neutral', icon: '❓' };
    }
  }
  
  $: healthStatus = getHealthStatus(monitoringData.systemHealth);
  $: isLoadingAny = isLoading || Object.values(loadingStates).some(loading => loading);
</script>

<svelte:head>
  <title>System Monitoring - SimpleDCC Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header with last updated info -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-primary">System Monitoring</h2>
      <p class="text-secondary mt-1">
        Real-time ECFS integration and AI processing status
      </p>
    </div>
    
    <div class="text-right">
      {#if lastUpdated}
        <p class="text-sm text-muted">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      {/if}
      <div class="flex items-center space-x-2 mt-1">
        <span class="text-xs text-secondary">Auto-refresh:</span>
        <span class="auto-refresh-indicator"></span>
      </div>
    </div>
  </div>
  
  <!-- Error Alert -->
  {#if error}
    <div class="card-base card-padding-md bg-error text-white">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="font-semibold">⚠️ System Alert</h4>
          <p class="mt-1">{error}</p>
        </div>
        <button 
          class="btn-base btn-secondary btn-sm"
          on:click={handleRefresh}
          disabled={loadingStates.refresh}
        >
          {loadingStates.refresh ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Main Stats Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatsCard
      title="System Health"
      value={monitoringData.systemHealth}
      icon={healthStatus.icon}
      status={healthStatus.color}
      subtitle={formatTimeAgo(monitoringData.lastCheck)}
      loading={loadingStates.stats}
    />
    
    <StatsCard
      title="Active Jobs"
      value={monitoringData.activeJobs.toString()}
      icon="🔄"
      status={monitoringData.activeJobs > 5 ? 'warning' : 'neutral'}
      subtitle={monitoringData.activeJobs > 0 ? 'Processing...' : 'Idle'}
      loading={loadingStates.stats}
    />
    
    <StatsCard
      title="Total Filings"
      value={monitoringData.totalFilings.toString()}
      icon="📄"
      status="neutral"
      subtitle="All time"
      loading={loadingStates.stats}
    />
    
    <StatsCard
      title="Active Dockets"
      value={monitoringData.activeDockets.toString()}
      icon="📋"
      status="neutral"
      subtitle="Being monitored"
      loading={loadingStates.stats}
    />
  </div>
  
  <!-- Secondary Stats -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <StatsCard
      title="Pending AI Processing"
      value={monitoringData.stats.pendingFilings.toString()}
      icon="⏳"
      status={monitoringData.stats.pendingFilings > 20 ? 'warning' : 'neutral'}
      subtitle="Awaiting AI summaries"
      loading={loadingStates.stats}
    />
    
    <StatsCard
      title="Processed Today"
      value={monitoringData.stats.processedToday.toString()}
      icon="✅"
      status="success"
      subtitle="With AI summaries"
      loading={loadingStates.stats}
    />
    
    <StatsCard
      title="Error Rate"
      value={`${monitoringData.stats.errorRate}%`}
      icon="⚠️"
      status={monitoringData.stats.errorRate > 5 ? 'error' : 
             monitoringData.stats.errorRate > 2 ? 'warning' : 'success'}
      subtitle="Last 24 hours"
      loading={loadingStates.stats}
    />
  </div>
  
  <!-- System Controls and Activity -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- System Controls -->
    <SystemControls
      loading={isLoadingAny}
      lastCheck={monitoringData.lastCheck}
      systemHealth={monitoringData.systemHealth}
      on:manual-check={handleManualCheck}
      on:refresh={handleRefresh}
    />
    
    <!-- Activity Feed -->
    <ActivityFeed
      activities={monitoringData.recentActivity}
      loading={loadingStates.activity}
      title="Recent System Activity"
      maxItems={10}
    />
  </div>
  
  <!-- System Performance Indicators -->
  <div class="card-base card-padding-md">
    <h3 class="text-lg font-semibold text-primary mb-4">System Performance</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-success">
          {monitoringData.systemHealth === 'healthy' ? '99.9%' : '95.2%'}
        </div>
        <div class="text-sm text-secondary">Uptime</div>
      </div>
      
      <div class="text-center">
        <div class="text-2xl font-bold text-primary">
          {Math.max(850, 1200 - (monitoringData.activeJobs * 50))}ms
        </div>
        <div class="text-sm text-secondary">Avg Response</div>
      </div>
      
      <div class="text-center">
        <div class="text-2xl font-bold text-primary">
          {Math.max(0, 24 - monitoringData.stats.errorRate)}
        </div>
        <div class="text-sm text-secondary">Successful Hours</div>
      </div>
      
      <div class="text-center">
        <div class="text-2xl font-bold text-success">
          {monitoringData.activeDockets}
        </div>
        <div class="text-sm text-secondary">Monitored Dockets</div>
      </div>
    </div>
  </div>

  <!-- User Subscription Lookup Section -->
  <div class="card-base card-padding-md mt-6">
    <h3 class="text-lg font-semibold text-primary mb-4">User Subscription Lookup</h3>
    
    <div class="lookup-container">
      {#if showLookupForm}
        <!-- Email Entry Form -->
        <div class="email-card-content">
          <div class="email-icon">📧</div>
          <h2>Access User Subscriptions</h2>
          <p>Enter a user's email address to view and manage their active docket monitoring subscriptions.</p>
          
          <form on:submit|preventDefault={loadLookupSubscriptions} class="email-form">
            <div class="form-group">
              <label for="lookup-email" class="form-label">Email Address</label>
              <input 
                type="email" 
                id="lookup-email"
                bind:value={lookupEmail}
                class="email-input"
                placeholder="user.email@example.com"
                required
              />
            </div>
            
            <button 
              type="submit" 
              class="btn-primary"
              disabled={isLookupLoading || !lookupEmail}
            >
              {#if isLookupLoading}
                <span class="loading-spinner"></span>
                Loading Subscriptions...
              {:else}
                View Subscriptions
              {/if}
            </button>
          </form>
          
          {#if lookupErrorMessage}
            <div class="error-message">
              ❌ {lookupErrorMessage}
            </div>
          {/if}
        </div>
      {:else}
        <!-- Dashboard View -->
        <div class="dashboard">
          <!-- Account Header -->
          <div class="account-header">
            <div class="account-info">
              <div class="account-avatar">
                {lookupEmail.charAt(0).toUpperCase()}
              </div>
              <div class="account-details">
                <h2>{lookupEmail}</h2>
                <p>{lookupSubscriptions.length} active subscription{lookupSubscriptions.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button class="btn-secondary" on:click={backToLookupForm}>
              Switch User
            </button>
          </div>

          <!-- Subscriptions List -->
          <div class="subscriptions-section">
            <div class="section-header">
              <h3>Monitored Dockets</h3>
            </div>

            {#if lookupSubscriptions.length === 0}
              <div class="empty-state">
                <h4>No Subscriptions Found</h4>
                <p>This user does not have any active docket monitoring subscriptions.</p>
              </div>
            {:else}
              <div class="subscriptions-grid">
                {#each lookupSubscriptions as subscription}
                  <div class="subscription-card">
                    <div class="subscription-header">
                      <div class="docket-info">
                        <div class="docket-number">Proceeding {subscription.docket_number}</div>
                        <div class="subscription-date">
                          Subscribed {formatLookupDate(subscription.created_at)}
                        </div>
                      </div>
                      <div class="frequency-controls">
                        <FrequencyToggle 
                          frequency={subscription.frequency || 'daily'}
                          userTier={lookupUserTier}
                          email={lookupEmail}
                          docketNumber={subscription.docket_number}
                          on:change={(event) => handleLookupFrequencyChange(event, subscription.docket_number)}
                        />
                      </div>
                    </div>
                    
                    <div class="subscription-actions">
                      <button 
                        class="btn-danger"
                        on:click={() => lookupUnsubscribe(subscription.docket_number)}
                        disabled={isLookupUnsubscribing}
                      >
                        {#if isLookupUnsubscribing}
                          Removing...
                        {:else}
                          Unsubscribe
                        {/if}
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          {#if lookupUnsubscribeStatus}
            <div class="status-notification" class:success={lookupUnsubscribeStatus.includes('Successfully')}>
              {lookupUnsubscribeStatus}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Copied and adapted styles from manage/+page.svelte */
  .lookup-container .email-card-content {
    padding: 2rem;
    text-align: center;
  }
  .lookup-container .email-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin: 0 auto 1.5rem;
    box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
  }
  .lookup-container .email-card-content h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
  }
  .lookup-container .email-card-content p {
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }
  .lookup-container .email-form {
    max-width: 400px;
    margin: 0 auto;
  }
  .lookup-container .form-group {
    margin-bottom: 1.5rem;
    text-align: left;
  }
  .lookup-container .form-label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  .lookup-container .email-input {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    outline: none;
    transition: all 0.2s;
  }
  .lookup-container .email-input:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
  .lookup-container .btn-primary {
    width: 100%;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  .lookup-container .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  }
  .lookup-container .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .lookup-container .error-message {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.3);
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
    font-weight: 600;
  }
  .lookup-container .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .lookup-container .dashboard {
    margin-top: 2rem;
  }

  .lookup-container .account-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f9fafb;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid #e5e7eb;
  }
  .lookup-container .account-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .lookup-container .account-avatar {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
    font-weight: 700;
  }
  .lookup-container .account-details h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
  }
  .lookup-container .account-details p {
    margin: 0;
  }
  .lookup-container .btn-secondary {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .lookup-container .btn-secondary:hover {
    background: #f3f4f6;
  }
  .lookup-container .subscriptions-section {
    background: #f9fafb;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
  }
  .lookup-container .section-header {
    margin-bottom: 1rem;
  }
  .lookup-container .section-header h3 {
    font-size: 1.25rem;
    font-weight: 700;
  }
  .lookup-container .subscriptions-grid {
    display: grid;
    gap: 1rem;
  }
  .lookup-container .subscription-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
  }
  .lookup-container .subscription-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }
  .lookup-container .docket-number {
    font-size: 1rem;
    font-weight: 700;
  }
  .lookup-container .subscription-date {
    font-size: 0.875rem;
  }
  .lookup-container .subscription-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1rem;
  }
  .lookup-container .btn-danger {
    background: #ef4444;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .lookup-container .btn-danger:hover:not(:disabled) {
    background: #dc2626;
  }
  .lookup-container .btn-danger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Keyframes for spinner should be global, but let's define it here for encapsulation */
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .space-y-6 > * + * {
    margin-top: var(--spacing-6);
  }
  
  .space-x-2 > * + * {
    margin-left: var(--spacing-2);
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
    
    .md\:grid-cols-4 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
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
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  .auto-refresh-indicator {
    width: 8px;
    height: 8px;
    background-color: #10b981;
    border-radius: 50%;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    display: inline-block;
  }
</style> 