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
</script>

{#if isLoading}
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
{:else if isAuthenticated}
  <div class="min-h-screen bg-gray-50">
    <!-- Admin Navigation -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-8">
            <a href="/admin" class="text-xl font-bold text-blue-600">
              SimpleDCC Admin
            </a>
            <div class="flex space-x-4">
              <a 
                href="/admin" 
                class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                class:text-blue-600={$page.url.pathname === '/admin'}
              >
                Dashboard
              </a>
              <a 
                href="/admin/subscriptions" 
                class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                class:text-blue-600={$page.url.pathname === '/admin/subscriptions'}
              >
                Subscriptions
              </a>
              <a 
                href="/admin/system" 
                class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                class:text-blue-600={$page.url.pathname === '/admin/system'}
              >
                System
              </a>
            </div>
          </div>
          <div class="flex items-center">
            <button 
              on:click={logout}
              class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
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