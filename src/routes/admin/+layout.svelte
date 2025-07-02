<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  let isAuthenticated = false;
  let isLoading = true;
  
  onMount(async () => {
    await checkAuth();
  });
  
  async function checkAuth() {
    try {
      const response = await fetch('/api/admin/auth/check');
      isAuthenticated = response.ok;
      
      if (!isAuthenticated && $page.url.pathname !== '/admin/login') {
        goto('/admin/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      isAuthenticated = false;
      if ($page.url.pathname !== '/admin/login') {
        goto('/admin/login');
      }
    } finally {
      isLoading = false;
    }
  }
  
  async function logout() {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      goto('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
      goto('/admin/login');
    }
  }
  
  // Navigation items with new monitoring section
  const navigationItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/subscriptions', label: 'Subscriptions', icon: '👥' },
    { href: '/admin/monitoring', label: 'Monitoring', icon: '📡' },
    { href: '/admin/database/migrate', label: 'Database', icon: '🗄️' },
  ];
  
  $: currentPath = $page.url.pathname;
</script>

{#if isLoading}
  <div class="min-h-screen bg-background flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-muted">Loading...</p>
    </div>
  </div>
{:else if isAuthenticated}
  <div class="min-h-screen bg-background">
    <!-- Admin Header -->
    <header class="bg-surface border-b border-base">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-primary">
              SimpleDCC Admin
            </h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <span class="text-sm text-secondary">Administrator</span>
            <button 
              on:click={logout}
              class="btn-base btn-secondary btn-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Navigation Tabs -->
    <nav class="bg-surface border-b border-base">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-8">
          {#each navigationItems as item}
            <a 
              href={item.href}
              class="flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors
                {currentPath === item.href 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-secondary hover:text-primary hover:border-gray-300'}"
            >
              <span class="mr-2">{item.icon}</span>
              {item.label}
            </a>
          {/each}
        </div>
      </div>
    </nav>
    
    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
{:else}
  <slot />
{/if}

<style>
  /* Use design system variables */
  .min-h-screen {
    min-height: 100vh;
  }
  
  .max-w-7xl {
    max-width: var(--max-width-content);
  }
  
  .border-primary {
    border-color: var(--color-primary);
  }
  
  .text-primary {
    color: var(--color-primary);
  }
  
  .text-secondary {
    color: var(--color-text-secondary);
  }
  
  .text-muted {
    color: var(--color-text-muted);
  }
  
  .bg-background {
    background-color: var(--color-background);
  }
  
  .bg-surface {
    background-color: var(--color-surface);
  }
  
  .border-base {
    border-color: var(--color-border);
  }
  
  .btn-base {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--border-radius);
    font-size: var(--font-size-sm);
    font-weight: 500;
    border: 1px solid;
    transition: var(--transition-fast);
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-secondary {
    background-color: var(--color-surface);
    border-color: var(--color-border);
    color: var(--color-text-secondary);
  }
  
  .btn-secondary:hover {
    background-color: var(--color-background);
    color: var(--color-text-primary);
  }
  
  .btn-sm {
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-xs);
  }
  
  .space-x-4 > * + * {
    margin-left: var(--spacing-4);
  }
  
  .space-x-8 > * + * {
    margin-left: var(--spacing-8);
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style> 