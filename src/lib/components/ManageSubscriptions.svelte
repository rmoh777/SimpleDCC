<script lang="ts">
  import { getSubscriptions, unsubscribe } from '$lib/api';
  import type { Subscription } from '$lib/api';

  let email: string = '';
  let subscriptions: Subscription[] = [];
  let isLoading: boolean = false;
  let isUnsubscribing: string = '';
  let message: string = '';
  let messageType: string = '';
  let emailError: string = '';
  let showConfirmDialog: boolean = false;
  let subscriptionToDelete: Subscription | null = null;

  // Email validation
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Real-time email validation
  $: {
    if (email && !validateEmail(email)) {
      emailError = 'Please enter a valid email address';
    } else {
      emailError = '';
    }
  }

  async function loadSubscriptions() {
    if (!email || !validateEmail(email)) {
      emailError = 'Please enter a valid email address';
      return;
    }

    message = '';
    messageType = '';
    isLoading = true;

    try {
      const result = await getSubscriptions(email);
      
      if (result.status === 200) {
        subscriptions = result.data.subscriptions || [];
        if (subscriptions.length === 0) {
          message = 'No subscriptions found for this email address.';
          messageType = 'info';
        }
      } else {
        message = 'Error loading subscriptions. Please try again.';
        messageType = 'error';
        subscriptions = [];
      }
    } catch (error) {
      message = 'Network error. Please check your connection and try again.';
      messageType = 'error';
      subscriptions = [];
    } finally {
      isLoading = false;
    }
  }

  function showUnsubscribeConfirm(subscription: Subscription): void {
    subscriptionToDelete = subscription;
    showConfirmDialog = true;
  }

  function cancelUnsubscribe() {
    showConfirmDialog = false;
    subscriptionToDelete = null;
  }

  async function confirmUnsubscribe() {
    if (!subscriptionToDelete) return;

    const docketNumber = subscriptionToDelete.docket_number;
    isUnsubscribing = docketNumber;
    
    try {
      const result = await unsubscribe(email, docketNumber);
      
      if (result.status === 200) {
        // Remove from local list
        subscriptions = subscriptions.filter(sub => sub.docket_number !== docketNumber);
        message = `Successfully unsubscribed from docket ${docketNumber}`;
        messageType = 'success';
      } else {
        message = result.data.error || 'Error unsubscribing. Please try again.';
        messageType = 'error';
      }
    } catch (error) {
      message = 'Network error. Please try again.';
      messageType = 'error';
    } finally {
      isUnsubscribing = '';
      showConfirmDialog = false;
      subscriptionToDelete = null;
    }
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<div class="manage-subscriptions">
  <div class="form-header">
    <h2>Manage Subscriptions</h2>
    <p>View and modify your existing docket subscriptions.</p>
  </div>

  <div class="email-section">
    <div class="form-group">
      <label for="manage-email">Email address *</label>
      <div class="email-input-group">
        <input
          id="manage-email"
          type="email"
          bind:value={email}
          placeholder="your.email@example.com"
          class="form-input"
                     class:error={!!emailError}
          disabled={isLoading}
        />
        <button
          type="button"
          on:click={loadSubscriptions}
          class="load-btn"
          disabled={isLoading || !!emailError || !email}
        >
          {#if isLoading}
            <span class="loading-spinner"></span>
            Loading...
          {:else}
            Load Subscriptions
          {/if}
        </button>
      </div>
      {#if emailError}
        <span class="error-text">{emailError}</span>
      {/if}
    </div>
  </div>

  {#if message}
    <div class="message {messageType}">
      {message}
    </div>
  {/if}

  {#if subscriptions.length > 0}
    <div class="subscriptions-section">
      <h3>Your Subscriptions ({subscriptions.length})</h3>
      <div class="subscriptions-list">
        {#each subscriptions as subscription (subscription.id)}
          <div class="subscription-item">
            <div class="subscription-info">
              <div class="docket-number">Docket {subscription.docket_number}</div>
              <div class="subscribe-date">Subscribed on {formatDate(subscription.created_at)}</div>
            </div>
            <button
              type="button"
              on:click={() => showUnsubscribeConfirm(subscription)}
              class="unsubscribe-btn"
              disabled={isUnsubscribing === subscription.docket_number}
            >
              {#if isUnsubscribing === subscription.docket_number}
                <span class="loading-spinner small"></span>
                Removing...
              {:else}
                Unsubscribe
              {/if}
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Confirmation Dialog -->
{#if showConfirmDialog && subscriptionToDelete}
  <div 
    class="dialog-overlay" 
    role="button" 
    tabindex="0"
    on:click={cancelUnsubscribe}
    on:keydown={(e) => e.key === 'Escape' && cancelUnsubscribe()}
  >
         <div 
       class="dialog" 
       role="dialog"
       aria-modal="true"
       aria-labelledby="dialog-title"
       tabindex="-1"
       on:click|stopPropagation
       on:keydown|stopPropagation
     >
      <div class="dialog-header">
        <h3 id="dialog-title">Confirm Unsubscribe</h3>
      </div>
      <div class="dialog-content">
        <p>Are you sure you want to unsubscribe from <strong>Docket {subscriptionToDelete.docket_number}</strong>?</p>
        <p class="dialog-subtitle">You will no longer receive notifications for this docket.</p>
      </div>
      <div class="dialog-actions">
        <button type="button" on:click={cancelUnsubscribe} class="cancel-btn">
          Cancel
        </button>
        <button type="button" on:click={confirmUnsubscribe} class="confirm-btn">
          Unsubscribe
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .manage-subscriptions {
    background: white;
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    max-width: 600px;
    margin: 0 auto;
  }

  .form-header {
    margin-bottom: 24px;
    text-align: center;
  }

  .form-header h2 {
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  .form-header p {
    color: #6b7280;
    font-size: 14px;
    margin: 0;
  }

  .email-section {
    margin-bottom: 24px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  label {
    font-weight: 500;
    color: #374151;
    font-size: 14px;
  }

  .email-input-group {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .form-input {
    flex: 1;
    padding: 12px 16px;
    border: 1.5px solid #d1d5db;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.2s ease;
    background: white;
  }

  .form-input:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  .form-input.error {
    border-color: #ef4444;
  }

  .form-input:disabled {
    background-color: #f9fafb;
    cursor: not-allowed;
  }

  .load-btn {
    background: #4f46e5;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }

  .load-btn:hover:not(:disabled) {
    background: #4338ca;
  }

  .load-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .error-text {
    color: #ef4444;
    font-size: 12px;
    font-weight: 500;
  }

  .message {
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    margin-bottom: 20px;
  }

  .message.success {
    background: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  .message.error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .message.info {
    background: #eff6ff;
    color: #1e40af;
    border: 1px solid #bfdbfe;
  }

  .subscriptions-section h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 16px 0;
  }

  .subscriptions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .subscription-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fafafa;
    transition: all 0.2s ease;
  }

  .subscription-item:hover {
    border-color: #d1d5db;
    background: #f9fafb;
  }

  .subscription-info {
    flex: 1;
  }

  .docket-number {
    font-weight: 500;
    color: #1f2937;
    font-size: 16px;
  }

  .subscribe-date {
    color: #6b7280;
    font-size: 14px;
    margin-top: 4px;
  }

  .unsubscribe-btn {
    background: #ef4444;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .unsubscribe-btn:hover:not(:disabled) {
    background: #dc2626;
  }

  .unsubscribe-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-spinner.small {
    width: 12px;
    height: 12px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Dialog Styles */
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
  }

  .dialog {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 400px;
    width: 100%;
  }

  .dialog-header {
    padding: 24px 24px 0 24px;
  }

  .dialog-header h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .dialog-content {
    padding: 16px 24px;
  }

  .dialog-content p {
    color: #374151;
    margin: 0 0 8px 0;
    line-height: 1.5;
  }

  .dialog-subtitle {
    color: #6b7280 !important;
    font-size: 14px;
  }

  .dialog-actions {
    padding: 0 24px 24px 24px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .cancel-btn {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cancel-btn:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  .confirm-btn {
    background: #ef4444;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .confirm-btn:hover {
    background: #dc2626;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .manage-subscriptions {
      padding: 24px 20px;
      margin: 0 16px;
    }

    .form-header h2 {
      font-size: 20px;
    }

    .email-input-group {
      flex-direction: column;
      align-items: stretch;
    }

    .load-btn {
      justify-content: center;
    }

    .subscription-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .unsubscribe-btn {
      align-self: flex-end;
    }

    .dialog {
      margin: 16px;
    }

    .dialog-actions {
      flex-direction: column-reverse;
    }

    .cancel-btn, .confirm-btn {
      width: 100%;
      justify-content: center;
    }
  }
</style> 