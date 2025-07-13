<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';

  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger);

  let navbar: HTMLElement;
  let isHidden = false;
  let lastScrollY = 0;
  let ticking = false;

  onMount(() => {
    // Ensure navbar exists
    if (!navbar) return;

    // Set initial state with enhanced properties for smooth animations
    gsap.set(navbar, {
      y: 0,
      opacity: 1,
      scale: 1,
      transformOrigin: "center top"
    });

    function updateNavbar() {
      const scrollY = window.scrollY;
      const scrollThreshold = 100; // Start hiding after 100px scroll
      const scrollDelta = scrollY - lastScrollY;
      const scrollSpeed = Math.abs(scrollDelta);

      // Enhanced logic for smoother transitions
      if (scrollY > scrollThreshold) {
        if (scrollY > lastScrollY && !isHidden && scrollSpeed > 2) {
          // Scrolling down - hide navbar with smooth animation
          gsap.to(navbar, {
            y: -navbar.offsetHeight - 10,
            opacity: 0.8,
            scale: 0.95,
            duration: 0.6,
            ease: "power3.out"
          });
          isHidden = true;
        } else if (scrollY < lastScrollY && isHidden) {
          // Scrolling up - show navbar with bounce-back effect
          gsap.to(navbar, {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            ease: "back.out(1.2)"
          });
          isHidden = false;
        }
      } else if (isHidden) {
        // Near the top - always show with smooth transition
        gsap.to(navbar, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "power2.out"
        });
        isHidden = false;
      }

      lastScrollY = scrollY;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    }

    // Add scroll listener with passive for better performance
    window.addEventListener('scroll', onScroll, { passive: true });

    // Cleanup function
    return () => {
      window.removeEventListener('scroll', onScroll);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  });
</script>

<!-- Navigation HTML -->
<nav 
  bind:this={navbar} 
  class="navbar"
>
  <!-- Government Banner inside navbar -->
  <div class="gov-banner">
    <div class="container">
      🇺🇸 An FCC docket monitoring service - Not affiliated with the Federal Communications Commission
    </div>
  </div>
  <div class="nav-container">
    <!-- Logo -->
    <div class="logo-section">
      <a href="/" class="logo-link">
        <div class="logo-graphic">
          <div class="logo-icon">📡</div>
          <div class="logo-text">
            Docket<span class="logo-cc">CC</span>
          </div>
        </div>
      </a>
    </div>

    <!-- Navigation Links -->
    <div class="nav-links">
      <a href="/about" class="nav-link" class:active={$page.url.pathname === '/about'}>
        About
      </a>
      <a href="/manage" class="nav-link" class:active={$page.url.pathname === '/manage'}>
        My Subscriptions
      </a>
      <a href="/pricing" class="nav-link" class:active={$page.url.pathname === '/pricing'}>
        Pricing
      </a>
    </div>

    <!-- CTA Button -->
    <div class="nav-cta">
      <a href="/" class="btn-primary">Get Started</a>
    </div>
  </div>
</nav>

<style>
  /* Government Banner */
  .gov-banner {
    background: var(--color-secondary);
    color: white;
    padding: 0.5rem 0;
    font-size: var(--font-size-sm);
    text-align: center;
    border-bottom: 1px solid #334155;
  }

  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform, opacity;
  }

  .navbar::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    pointer-events: none;
  }

  .nav-container {
    max-width: var(--max-width-content);
    margin: 0 auto;
    padding: var(--spacing-4) var(--spacing-8);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
  }

  .logo-section {
    display: flex;
    align-items: center;
  }

  .logo-link {
    text-decoration: none;
    color: inherit;
    transition: transform 0.3s ease;
  }

  .logo-link:hover {
    transform: translateY(-1px);
  }

  .logo-graphic {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    border-radius: var(--border-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .logo-icon:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
  }

  .logo-text {
    font-size: var(--font-size-2xl);
    font-weight: 800;
    color: var(--color-text-primary);
    letter-spacing: -0.5px;
  }

  .logo-cc {
    color: var(--color-primary);
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: var(--spacing-8);
  }

  .nav-link {
    text-decoration: none;
    color: var(--color-text-secondary);
    font-weight: 500;
    font-size: var(--font-size-base);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    padding: var(--spacing-3) var(--spacing-5);
    border-radius: var(--border-radius-lg);
  }

  .nav-link:hover {
    color: var(--color-primary);
    background: rgba(16, 185, 129, 0.08);
    transform: translateY(-1px);
  }

  .nav-link.active {
    color: var(--color-primary);
    background: rgba(16, 185, 129, 0.12);
    font-weight: 600;
  }

  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    width: 0;
    height: 2px;
    background: var(--color-primary);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateX(-50%);
  }

  .nav-link:hover::after,
  .nav-link.active::after {
    width: 80%;
  }

  .nav-cta {
    display: flex;
    align-items: center;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    color: white;
    padding: var(--spacing-3) var(--spacing-6);
    border-radius: var(--border-radius-xl);
    text-decoration: none;
    font-weight: 600;
    font-size: var(--font-size-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    position: relative;
    overflow: hidden;
  }

  .btn-primary::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .btn-primary:hover::before {
    left: 100%;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
  }

  .btn-primary:active {
    transform: translateY(0);
  }

  .container {
    max-width: var(--max-width-content);
    margin: 0 auto;
    padding: 0 var(--spacing-8);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .nav-container {
      padding: var(--spacing-3) var(--spacing-4);
    }

    .nav-links {
      display: none; /* Will implement mobile menu later */
    }

    .logo-icon {
      width: 35px;
      height: 35px;
      font-size: 1rem;
    }

    .logo-text {
      font-size: var(--font-size-xl);
    }

    .btn-primary {
      padding: var(--spacing-2) var(--spacing-4);
      font-size: var(--font-size-xs);
    }
  }

  /* Ensure smooth scrolling and prevent layout shift */
  :global(html) {
    scroll-behavior: smooth;
  }

  /* Add top margin to body content to account for fixed navbar */
  :global(body) {
    padding-top: 120px;
  }
</style> 