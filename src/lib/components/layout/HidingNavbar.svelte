<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import DocketCCLogo from '$lib/components/ui/DocketCCLogo.svelte';

  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger);

  let navbar: HTMLElement;
  let isHidden = false;
  let lastScrollY = 0;
  let ticking = false;

  onMount(() => {
    // Ensure navbar exists
    if (!navbar) {
      console.error('Navbar element not found!');
      return;
    }

    console.log('Navbar element found:', navbar);

    // Set initial state
    gsap.set(navbar, {
      y: 0,
      opacity: 1,
      transformOrigin: "center top"
    });

    function updateNavbar() {
      const scrollY = window.scrollY;
      const scrollThreshold = 80; // Start hiding after 80px scroll
      
      console.log('Scroll Y:', scrollY, 'Last:', lastScrollY, 'Hidden:', isHidden); // Debug log

      // Simplified and more reliable logic
      if (scrollY > scrollThreshold) {
        if (scrollY > lastScrollY && !isHidden) {
          // Scrolling down - hide navbar
          console.log('Hiding navbar'); // Debug log
          gsap.to(navbar, {
            y: -navbar.offsetHeight,
            duration: 0.4,
            ease: "power2.out"
          });
          isHidden = true;
        } else if (scrollY < lastScrollY && isHidden) {
          // Scrolling up - show navbar
          console.log('Showing navbar'); // Debug log
          gsap.to(navbar, {
            y: 0,
            duration: 0.4,
            ease: "power2.out"
          });
          isHidden = false;
        }
      } else if (isHidden) {
        // Near the top - always show
        console.log('Near top, showing navbar'); // Debug log
        gsap.to(navbar, {
          y: 0,
          duration: 0.4,
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

<!-- Government Banner (separate from navbar) - DISABLED FOR NOW -->
<!-- <div class="gov-banner">
  <div class="container">
    🇺🇸 An FCC docket monitoring service - Not affiliated with the Federal Communications Commission
  </div>
</div> -->

<!-- Header with original styling -->
<header bind:this={navbar} class="header">
  <div class="container">
    <nav class="nav">
      <div class="logo-section">
        <a href="/" class="logo-link">
          <DocketCCLogo size="medium" />
        </a>
      </div>
      
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
    </nav>
  </div>
</header>

<style>
  /* Government Banner - DISABLED */
  /* .gov-banner {
    background: var(--color-secondary);
    color: white;
    padding: 0.5rem 0;
    font-size: var(--font-size-sm);
    text-align: center;
    border-bottom: 1px solid #334155;
  } */

  .header {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    padding: 1rem 0;
    box-shadow: var(--shadow-lg);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    border-bottom: 4px solid var(--color-primary);
    will-change: transform;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .container {
    max-width: var(--max-width-content);
    margin: 0 auto;
    padding: 0 var(--spacing-8);
  }

  .logo-link {
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
  }

  .nav-link {
    color: #374151;
    text-decoration: none;
    font-weight: var(--font-weight-semibold);
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    transition: all var(--transition-normal);
  }

  .nav-link:hover,
  .nav-link.active {
    background: var(--color-secondary);
    color: white;
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }



  /* Mobile responsive */
  @media (max-width: 768px) {
    .nav-container {
      padding: var(--spacing-3) var(--spacing-4);
    }

    .nav-links {
      display: none; /* Will implement mobile menu later */
    }

    /* Logo scales down on mobile via component props */

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
    padding-top: 80px; /* Reduced since no government banner */
  }
</style> 