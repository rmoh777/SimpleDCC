<script>
  import { onMount } from 'svelte';
  
  let subscriptions = [];
  let isLoading = true;
  let error = '';
  let searchEmail = '';
  let selectedDocket = '';
  let sortBy = 'created_at';
  let sortOrder = 'desc';
  
  // Pagination
  let currentPage = 1;
  let itemsPerPage = 20;
  let totalItems = 0;
  
  // Stats
  let stats = {
    totalSubscriptions: 0,
    uniqueEmails: 0,
    uniqueDockets: 0
  };
  
  onMount(async () => {
    await loadSubscriptions();
    await loadStats();
  });
  
  async function loadSubscriptions() {
    isLoading = true;
    error = '';
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sort: sortBy,
        order: sortOrder
      });
      
      if (searchEmail) params.append('email', searchEmail);
      if (selectedDocket) params.append('docket', selectedDocket);
      
      const response = await fetch(`/api/admin/subscriptions?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        subscriptions = data.subscriptions || [];
        totalItems = data.total || 0;
      } else {
        error = 'Failed to load subscriptions';
      }
    } catch (err) {
      error = 'Network error loading subscriptions';
      console.error('Subscriptions error:', err);
    } finally {
      isLoading = false;
    }
  }
  
  async function loadStats() {
    try {
      const response = await fetch('/api/admin/subscriptions/stats');
      if (response.ok) {
        stats = await response.json();
      }
    } catch (err) {
      console.error('Stats error:', err);
    }
  }
  
  async function deleteSubscription(subscription) {
    if (!confirm(`Delete subscription for ${subscription.email} to docket ${subscription.docket_number}?`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: subscription.email,
          docket_number: subscription.docket_number
        })
      });
      
      if (response.ok) {
        await loadSubscriptions();
        await loadStats();
      } else {
        alert('Failed to delete subscription');
      }
    } catch (err) {
      alert('Error deleting subscription');
    }
  }
  
  function handleSearch() {
    currentPage = 1;
    loadSubscriptions();
  }
  
  function handleSort(newSortBy) {
    if (sortBy === newSortBy) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = newSortBy;
      sortOrder = 'desc';
    }
    currentPage = 1;
    loadSubscriptions();
  }
  
  function changePage(newPage) {
    currentPage = newPage;
    loadSubscriptions();
  }
  
  function formatDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  $: totalPages = Math.ceil(totalItems / itemsPerPage);
  $: startItem = (currentPage - 1) * itemsPerPage + 1;
  $: endItem = Math.min(currentPage * itemsPerPage, totalItems);
</script>

<svelte:head>
  <title>Subscription Management - SimpleDCC Admin</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-semibold text-gray-900">Subscription Management</h1>
    <p class="mt-1 text-sm text-gray-600">
      View and manage all user subscriptions to FCC dockets
    </p>
  </div>
  
  <!-- Stats Cards -->
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span class="text-white text-sm">📧</span>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">
                Total Subscriptions
              </dt>
              <dd class="text-lg font-medium text-gray-900">
                {stats.totalSubscriptions}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span class="text-white text-sm">👥</span>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">
                Unique Users
              </dt>
              <dd class="text-lg font-medium text-gray-900">
                {stats.uniqueEmails}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <span class="text-white text-sm">📋</span>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">
                Active Dockets
              </dt>
              <dd class="text-lg font-medium text-gray-900">
                {stats.uniqueDockets}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Search and Filters -->
  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div class="sm:col-span-2">
          <label for="email-search" class="block text-sm font-medium text-gray-700">
            Search by Email
          </label>
          <input
            id="email-search"
            type="email"
            bind:value={searchEmail}
            on:keydown={(e) => e.key === 'Enter' && handleSearch()}
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="user@example.com"
          />
        </div>
        
        <div>
          <label for="docket-filter" class="block text-sm font-medium text-gray-700">
            Filter by Docket
          </label>
          <input
            id="docket-filter"
            type="text"
            bind:value={selectedDocket}
            on:keydown={(e) => e.key === 'Enter' && handleSearch()}
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="23-108"
          />
        </div>
        
        <div class="flex items-end">
          <button
            on:click={handleSearch}
            class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  </div>
  
  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      {error}
    </div>
  {/if}
  
  <!-- Subscriptions Table -->
  <div class="bg-white shadow rounded-lg overflow-hidden">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">
        Subscriptions
        {#if totalItems > 0}
          <span class="text-sm font-normal text-gray-500">
            ({startItem}-{endItem} of {totalItems})
          </span>
        {/if}
      </h3>
    </div>
    
    {#if isLoading}
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">Loading subscriptions...</p>
      </div>
    {:else if subscriptions.length === 0}
      <div class="text-center py-12">
        <p class="text-gray-500">No subscriptions found</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                on:click={() => handleSort('email')}
              >
                Email
                {#if sortBy === 'email'}
                  <span class="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                on:click={() => handleSort('docket_number')}
              >
                Docket
                {#if sortBy === 'docket_number'}
                  <span class="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                on:click={() => handleSort('created_at')}
              >
                Subscribed
                {#if sortBy === 'created_at'}
                  <span class="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each subscriptions as subscription}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {subscription.email}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {subscription.docket_number}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(subscription.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    on:click={() => deleteSubscription(subscription)}
                    class="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              on:click={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              on:click={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing <span class="font-medium">{startItem}</span> to <span class="font-medium">{endItem}</span> of <span class="font-medium">{totalItems}</span> results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  on:click={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return page;
                }) as page}
                  <button
                    on:click={() => changePage(page)}
                    class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
                    class:bg-blue-50={page === currentPage}
                    class:text-blue-600={page === currentPage}
                    class:text-gray-500={page !== currentPage}
                  >
                    {page}
                  </button>
                {/each}
                
                <button
                  on:click={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div> 