<script>
  import { goto } from '$app/navigation';
  
  let email = 'admin@simpledcc.com';
  let password = '';
  let error = '';
  let isLoading = false;
  
  async function handleLogin(e) {
    e.preventDefault();
    isLoading = true;
    error = '';
    
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        goto('/admin');
      } else {
        const data = await response.json();
        error = data.error || 'Login failed';
      }
    } catch (err) {
      error = 'Network error occurred';
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Admin Login - SimpleDCC</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="max-w-md w-full space-y-8 p-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        SimpleDCC Admin
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Sign in to access the admin dashboard
      </p>
    </div>
    
    <form on:submit={handleLogin} class="mt-8 space-y-6">
      <div class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            bind:value={email}
            type="email"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Email address"
          />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            bind:value={password}
            type="password"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Password"
          />
        </div>
      </div>
      
      {#if error}
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      {/if}
      
      <div>
        <button
          type="submit"
          disabled={isLoading}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
      
      <div class="text-sm text-gray-500 text-center">
        Default: admin@simpledcc.com / admin123
      </div>
    </form>
  </div>
</div> 