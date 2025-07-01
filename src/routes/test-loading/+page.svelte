<script lang="ts">
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
  import PageTransition from '$lib/components/ui/PageTransition.svelte';
  import ErrorBoundary from '$lib/components/ui/ErrorBoundary.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  
  let showContent = true;
  let showError = false;
  let simulatedError: Error | null = null;
  
  function toggleContent() {
    showContent = !showContent;
  }
  
  function triggerError() {
    simulatedError = new Error('This is a simulated error for testing purposes');
    showError = true;
  }
  
  function clearError() {
    simulatedError = null;
    showError = false;
  }
</script>

<div class="container" style="padding: 2rem;">
  <h1>Loading States and Transitions Tests</h1>
  
  <section style="margin: 2rem 0;">
    <h2>Loading Spinners</h2>
    
    <h3>Sizes</h3>
    <div style="display: flex; gap: 2rem; align-items: center; margin: 1rem 0;">
      <div>
        <p>Small:</p>
        <LoadingSpinner size="sm" />
      </div>
      <div>
        <p>Medium:</p>
        <LoadingSpinner size="md" />
      </div>
      <div>
        <p>Large:</p>
        <LoadingSpinner size="lg" />
      </div>
    </div>
    
    <h3>Colors</h3>
    <div style="display: flex; gap: 2rem; align-items: center; margin: 1rem 0;">
      <div>
        <p>Primary:</p>
        <LoadingSpinner color="primary" />
      </div>
      <div>
        <p>Secondary:</p>
        <LoadingSpinner color="secondary" />
      </div>
      <div style="background: #333; padding: 1rem; border-radius: 8px;">
        <p style="color: white;">White:</p>
        <LoadingSpinner color="white" />
      </div>
    </div>
    
    <h3>Inline Spinner</h3>
    <div style="margin: 1rem 0;">
      This text has an inline spinner: <LoadingSpinner size="sm" inline /> loading...
    </div>
  </section>
  
  <section style="margin: 2rem 0;">
    <h2>Page Transitions</h2>
    <div style="margin: 1rem 0;">
      <Button on:click={toggleContent}>Toggle Content</Button>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 1rem 0;">
      <div>
        <h3>Fade Transition</h3>
        {#if showContent}
          <PageTransition type="fade">
            <Card padding="md">
              <p>This content fades in and out smoothly.</p>
              <p>The fade transition is subtle and professional.</p>
            </Card>
          </PageTransition>
        {/if}
      </div>
      
      <div>
        <h3>Slide Transition</h3>
        {#if showContent}
          <PageTransition type="slide" duration={400}>
            <Card padding="md">
              <p>This content slides in from below.</p>
              <p>The slide transition adds a sense of movement.</p>
            </Card>
          </PageTransition>
        {/if}
      </div>
    </div>
  </section>
  
  <section style="margin: 2rem 0;">
    <h2>Error Boundary</h2>
    <div style="margin: 1rem 0;">
      <Button variant="secondary" on:click={triggerError}>Trigger Error</Button>
      <Button variant="outline" on:click={clearError}>Clear Error</Button>
    </div>
    
    <div style="margin: 1rem 0;">
      <ErrorBoundary fallback={showError} error={simulatedError}>
        <Card padding="lg">
          <h3>Protected Content</h3>
          <p>This content is wrapped in an ErrorBoundary component.</p>
          <p>If an error occurs, users will see a helpful error message instead of a broken page.</p>
          <p>The error boundary includes options to retry and report issues.</p>
        </Card>
      </ErrorBoundary>
    </div>
  </section>
  
  <section style="margin: 2rem 0;">
    <h2>Loading Button States</h2>
    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0;">
      <Button loading>Loading Button</Button>
      <Button variant="secondary" loading>Secondary Loading</Button>
      <Button variant="outline" loading>Outline Loading</Button>
    </div>
  </section>
</div> 