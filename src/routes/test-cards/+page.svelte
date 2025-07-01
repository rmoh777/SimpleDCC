<script>
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
</script>

<div class="container" style="padding: 2rem;">
  <h1>Card Component Tests</h1>
  
  <section style="margin: 2rem 0;">
    <h2>Default Cards</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin: 1rem 0;">
      <Card>
        <h3>Default Card</h3>
        <p>This is a default card with standard styling.</p>
      </Card>
      
      <Card padding="lg" elevation="md">
        <h3>Large Padding & Elevation</h3>
        <p>This card has more padding and elevation.</p>
      </Card>
      
      <Card hover>
        <h3>Hover Card</h3>
        <p>This card has hover effects. Try hovering over it!</p>
      </Card>
    </div>
  </section>
  
  <section style="margin: 2rem 0;">
    <h2>Feature Cards</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin: 1rem 0;">
      <Card variant="feature" hover>
        <div style="text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 1rem;">📡</div>
          <h3>Real-time Monitoring</h3>
          <p>Get instant notifications when new FCC docket filings are published.</p>
        </div>
      </Card>
      
      <Card variant="feature" hover>
        <div style="text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 1rem;">🤖</div>
          <h3>AI Summaries</h3>
          <p>Receive AI-powered summaries of complex regulatory documents.</p>
        </div>
      </Card>
      
      <Card variant="feature" hover>
        <div style="text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 1rem;">🔒</div>
          <h3>Enterprise Security</h3>
          <p>Government-grade security for your regulatory intelligence.</p>
        </div>
      </Card>
    </div>
  </section>
  
  <section style="margin: 2rem 0;">
    <h2>Pricing Cards</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin: 1rem 0;">
      <Card variant="pricing" padding="lg">
        <div style="text-align: center;">
          <h3>Free</h3>
          <div style="font-size: 2rem; font-weight: bold; margin: 1rem 0;">$0<span style="font-size: 1rem; color: var(--color-text-muted);">/month</span></div>
          <p>Perfect for getting started</p>
          <Button variant="outline" style="margin-top: 1rem;">Get Started</Button>
        </div>
      </Card>
      
      <Card variant="pricing" padding="lg" class="card--featured">
        <div style="text-align: center;">
          <h3>Pro</h3>
          <div style="font-size: 2rem; font-weight: bold; margin: 1rem 0;">$49<span style="font-size: 1rem; color: var(--color-text-muted);">/month</span></div>
          <p>For regulatory professionals</p>
          <Button variant="primary" style="margin-top: 1rem;">Start Pro Trial</Button>
        </div>
      </Card>
      
      <Card variant="pricing" padding="lg">
        <div style="text-align: center;">
          <h3>Enterprise</h3>
          <div style="font-size: 2rem; font-weight: bold; margin: 1rem 0;">Custom</div>
          <p>For large organizations</p>
          <Button variant="secondary" style="margin-top: 1rem;">Contact Sales</Button>
        </div>
      </Card>
    </div>
  </section>
  
  <section style="margin: 2rem 0;">
    <h2>Stats Cards</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0;">
      <Card variant="stats" padding="md">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="width: 3rem; height: 3rem; background: var(--color-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">
            👥
          </div>
          <div>
            <div style="font-size: 1.5rem; font-weight: bold;">1,247</div>
            <div style="color: var(--color-text-muted); font-size: 0.875rem;">Active Users</div>
          </div>
        </div>
      </Card>
      
      <Card variant="stats" padding="md">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="width: 3rem; height: 3rem; background: var(--color-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">
            📋
          </div>
          <div>
            <div style="font-size: 1.5rem; font-weight: bold;">89</div>
            <div style="color: var(--color-text-muted); font-size: 0.875rem;">Active Dockets</div>
          </div>
        </div>
      </Card>
    </div>
  </section>
</div> 