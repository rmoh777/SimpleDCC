<script lang="ts">
  import { subscribe } from '$lib/api';

  let email: string = '';
  let docketNumber: string = '';
  let isLoading: boolean = false;
  let message: string = '';
  let messageType: string = ''; // 'success' or 'error'
  let emailError: string = '';
  let docketError: string = '';

  // Email validation
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Docket number validation (X-X to XXX-XXX format)
  function validateDocket(docket: string): boolean {
    const docketRegex = /^\d{1,3}-\d{1,3}$/;
    return docketRegex.test(docket);
  }

  // Real-time validation
  $: {
    if (email && !validateEmail(email)) {
      emailError = 'Please enter a valid email address';
    } else {
      emailError = '';
    }
  }

  $: {
    if (docketNumber && !validateDocket(docketNumber)) {
      docketError = 'Docket format should be X-X to XXX-XXX (e.g., 11-42, 23-456)';
    } else {
      docketError = '';
    }
  }

  async function handleSubmit() {
    // Clear previous messages
    message = '';
    messageType = '';

    // Validate before submission
    if (!email || !validateEmail(email)) {
      emailError = 'Please enter a valid email address';
      return;
    }

    if (!docketNumber || !validateDocket(docketNumber)) {
      docketError = 'Docket format should be X-X to XXX-XXX (e.g., 11-42, 23-456)';
      return;
    }

    isLoading = true;

    try {
      const result = await subscribe(email, docketNumber);
      
      switch (result.status) {
        case 201:
          message = 'Successfully subscribed to docket notifications!';
          messageType = 'success';
          // Clear form on success
          email = '';
          docketNumber = '';
          break;
        case 409:
          message = 'You are already subscribed to this docket.';
          messageType = 'error';
          break;
        case 400:
          message = result.data.error || 'Invalid input. Please check your email and docket number.';
          messageType = 'error';
          break;
        default:
          message = 'An error occurred. Please try again.';
          messageType = 'error';
      }
    } catch (error) {
      message = 'Network error. Please check your connection and try again.';
      messageType = 'error';
    } finally {
      isLoading = false;
    }
  }


</script>

<div class="subscribe-form">
  <div class="form-header">
    <h2>Add Docket Subscription</h2>
    <p>Subscribe to FCC docket updates for monitoring.</p>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-group">
      <label for="email">Email address *</label>
      <input
        id="email"
        type="email"
        bind:value={email}
        placeholder="your.email@example.com"
        class="form-input"
        class:error={!!emailError}
        disabled={isLoading}
        required
      />
      {#if emailError}
        <span class="error-text">{emailError}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="docket">Docket number *</label>
      <input
        id="docket"
        type="text"
        bind:value={docketNumber}
        placeholder="XX-XXX"
        maxlength="7"
        class="form-input"
        class:error={!!docketError}
        disabled={isLoading}
        required
      />
      {#if docketError}
        <span class="error-text">{docketError}</span>
      {:else}
        <span class="help-text">Enter with dash: X-X to XXX-XXX (e.g., 11-42, 23-456)</span>
      {/if}
    </div>

    <button
      type="submit"
      class="submit-btn"
      disabled={isLoading || !!emailError || !!docketError || !email || !docketNumber}
    >
      {#if isLoading}
        <span class="loading-spinner"></span>
        Subscribing...
      {:else}
        Subscribe
      {/if}
    </button>

    {#if message}
      <div class="message {messageType}">
        {message}
      </div>
    {/if}
  </form>
</div>

<style>
  .subscribe-form {
    background: white;
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    max-width: 500px;
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

  .form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-weight: 500;
    color: #374151;
    font-size: 14px;
  }

  .form-input {
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

  .form-input.error:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .form-input:disabled {
    background-color: #f9fafb;
    cursor: not-allowed;
  }

  .error-text {
    color: #ef4444;
    font-size: 12px;
    font-weight: 500;
  }

  .help-text {
    color: #6b7280;
    font-size: 12px;
  }

  .submit-btn {
    background: #4f46e5;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 8px;
  }

  .submit-btn:hover:not(:disabled) {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .submit-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .message {
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
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

  /* Responsive design */
  @media (max-width: 640px) {
    .subscribe-form {
      padding: 24px 20px;
      margin: 0 16px;
    }

    .form-header h2 {
      font-size: 20px;
    }

    .form-input, .submit-btn {
      font-size: 16px; /* Prevent zoom on iOS */
    }
  }
</style> 