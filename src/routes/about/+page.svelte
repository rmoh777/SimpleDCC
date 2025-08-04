<script>
  // About page - basic structure with no content yet
</script>

<svelte:head>
  <title>About - DocketCC</title>
  <meta name="description" content="Learn more about DocketCC's professional FCC docket monitoring service." />
</svelte:head>

<div class="about-page">
  <div class="container">
    <div class="content">
      <h1>About</h1>
      <!-- Content will be added here in the future -->
    </div>
  </div>
</div>

<style>
  .about-page {
    min-height: 80vh;
    padding: 6rem 0 4rem;
  }

  .container {
    max-width: var(--max-width-content);
    margin: 0 auto;
    padding: 0 var(--spacing-8);
  }

  .content {
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    color: var(--color-text-primary);
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: 2rem;
    text-align: center;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .about-page {
      padding: 4rem 0 2rem;
    }
    
    .container {
      padding: 0 var(--spacing-4);
    }
    
    h1 {
      font-size: var(--font-size-2xl);
    }
  }
</style>