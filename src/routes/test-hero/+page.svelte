<script lang="ts">
  import HeroSection from '$lib/components/sections/HeroSection.svelte';
</script>

<svelte:head>
  <title>Hero Section Test - DocketCC</title>
  <meta name="description" content="Test page for the new HeroSection component" />
</svelte:head>

<HeroSection />

<style>
  /* This page is just for testing the HeroSection component */
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style> 