<script>
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
</script>

<svelte:head>
  <title>Verifying Sign In - DocketCC</title>
</svelte:head>

<main class="main">
  <div class="container">
    <div class="verification-card">
      <div class="logo">
        <div class="logo-icon">📡</div>
        <div class="logo-text">Docket<span class="cc">CC</span></div>
      </div>
      
      <h1>Verifying Sign In</h1>
      <p>Please wait while we securely sign you in...</p>
      
      <LoadingSpinner />
    </div>
  </div>
</main>

<style>
  .main {
    background: linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .container {
    max-width: 500px;
    width: 100%;
  }

  .verification-card {
    background: white;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.1);
    border: 1px solid #e5e7eb;
    padding: 3rem;
    text-align: center;
  }

  .verification-card::before {
    content: '';
    display: block;
    height: 4px;
    background: linear-gradient(90deg, #10b981, #059669);
    margin: -3rem -3rem 2rem -3rem;
    border-radius: 24px 24px 0 0;
  }

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 2rem;
  }

  .logo-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
  }

  .logo-text {
    font-size: 2.2rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
  }

  .logo-text .cc {
    color: #10b981;
  }

  h1 {
    font-size: 1.8rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 1rem 0;
  }

  p {
    color: #6b7280;
    font-size: 1rem;
    margin: 0 0 2rem 0;
    line-height: 1.6;
  }

  @media (max-width: 600px) {
    .main {
      padding: 1rem;
    }
    
    .verification-card {
      padding: 2rem;
    }
    
    .logo-text {
      font-size: 1.8rem;
    }
    
    .logo-icon {
      width: 50px;
      height: 50px;
      font-size: 1.5rem;
    }
  }
</style> 