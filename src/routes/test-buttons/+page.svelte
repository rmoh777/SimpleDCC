<script>
  import Button from '$lib/components/ui/Button.svelte';
  
  let loading = false;
  
  function handleClick() {
    console.log('Button clicked!');
  }
  
  function handleLoadingTest() {
    loading = true;
    setTimeout(() => {
      loading = false;
    }, 2000);
  }
</script>

<div class="container" style="padding: 2rem;">
  <h1>Button Component Tests</h1>
  
  <section style="margin: 2rem 0;">
    <h2>Variants</h2>
    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0;">
      <Button variant="primary" on:click={handleClick}>Primary Button</Button>
      <Button variant="secondary" on:click={handleClick}>Secondary Button</Button>
      <Button variant="outline" on:click={handleClick}>Outline Button</Button>
      <Button variant="ghost" on:click={handleClick}>Ghost Button</Button>
    </div>
  </section>
  
  <section style="margin: 2rem 0;">
    <h2>Sizes</h2>
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin: 1rem 0;">
      <Button size="sm" on:click={handleClick}>Small</Button>
      <Button size="md" on:click={handleClick}>Medium</Button>
      <Button size="lg" on:click={handleClick}>Large</Button>
    </div>
  </section>
  
  <section style="margin: 2rem 0;">
    <h2>States</h2>
    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0;">
      <Button disabled on:click={handleClick}>Disabled</Button>
      <Button {loading} on:click={handleLoadingTest}>
        {loading ? 'Loading...' : 'Test Loading'}
      </Button>
    </div>
  </section>
  
  <section style="margin: 2rem 0;">
    <h2>As Link</h2>
    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0;">
      <Button href="/" variant="primary">Link Button</Button>
    </div>
  </section>
</div> 