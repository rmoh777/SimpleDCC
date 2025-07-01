<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  export let type: 'fade' | 'slide' = 'fade';
  export let duration: number = 300;
  export let delay: number = 0;
</script>

{#if type === 'fade'}
  <div 
    in:fade={{ duration, delay }}
    out:fade={{ duration: duration / 2 }}
  >
    <slot />
  </div>
{:else if type === 'slide'}
  <div 
    in:fly={{ y: 20, duration, delay, easing: quintOut }}
    out:fly={{ y: -20, duration: duration / 2, easing: quintOut }}
  >
    <slot />
  </div>
{/if} 