<script lang="ts">
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let showText: boolean = true;
  export let variant: 'light' | 'dark' = 'dark';
  
  // Size configurations
  const sizes = {
    small: {
      width: 32,
      height: 26,
      textSize: '1.2rem',
      gap: '0.5rem'
    },
    medium: {
      width: 48,
      height: 40,
      textSize: '1.8rem',
      gap: '0.75rem'
    },
    large: {
      width: 120,
      height: 100,
      textSize: '4rem',
      gap: '2rem'
    }
  };
  
  $: config = sizes[size];
  $: textColor = variant === 'light' ? '#ffffff' : '#0f172a';
  $: accentColor = '#10b981';
</script>

<div class="logo-container" style="gap: {config.gap}">
  <!-- Professional Folder Icon -->
  <div class="folder-icon" style="width: {config.width}px; height: {config.height}px;">
    <div class="folder-tab" class:small={size === 'small'} class:medium={size === 'medium'} class:large={size === 'large'}></div>
    <div class="folder-back" class:small={size === 'small'} class:medium={size === 'medium'} class:large={size === 'large'}></div>
    <div class="folder-front" class:small={size === 'small'} class:medium={size === 'medium'} class:large={size === 'large'}></div>
    <div class="documents" class:small={size === 'small'} class:medium={size === 'medium'} class:large={size === 'large'}>
      <div class="doc doc1" class:small={size === 'small'} class:medium={size === 'medium'} class:large={size === 'large'}>
        <div class="doc-lines" class:small={size === 'small'} class:medium={size === 'medium'} class:large={size === 'large'}>
          <div class="doc-line"></div>
          <div class="doc-line short"></div>
          <div class="doc-line shorter"></div>
        </div>
      </div>
      <div class="doc doc2" class:small={size === 'small'} class:medium={size === 'medium'} class:large={size === 'large'}>
        <div class="doc-lines" class:small={size === 'small'} class:medium={size === 'medium'} class:large={size === 'large'}>
          <div class="doc-line"></div>
          <div class="doc-line short"></div>
          <div class="doc-line shorter"></div>
        </div>
      </div>
      <div class="doc doc3" class:small={size === 'small'} class:medium={size === 'medium'} class:large={size === 'large'}>
        <div class="doc-lines" class:small={size === 'small'} class:medium={size === 'medium'} class:large={size === 'large'}>
          <div class="doc-line"></div>
          <div class="doc-line short"></div>
          <div class="doc-line shorter"></div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Logo Text -->
  {#if showText}
    <div class="logo-text" style="font-size: {config.textSize}; color: {textColor};">
      Docket<span class="logo-cc" style="color: {accentColor};">CC</span>
    </div>
  {/if}
</div>

<style>
  .logo-container {
    display: flex;
    align-items: center;
    user-select: none;
  }
  
  .folder-icon {
    position: relative;
    flex-shrink: 0;
  }
  
  /* Small size styles */
  .folder-back.small {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 32px;
    height: 20px;
    background: #0f172a;
    border: 1px solid #475569;
    border-radius: 0 3px 3px 3px;
  }
  
  .folder-tab.small {
    position: absolute;
    top: 2px;
    left: 0;
    width: 12px;
    height: 8px;
    background: #0f172a;
    border: 1px solid #475569;
    border-bottom: none;
    border-radius: 1px 1px 0 0;
  }
  
  .folder-front.small {
    position: absolute;
    bottom: 0;
    left: 1px;
    width: 30px;
    height: 18px;
    background: #0f172a;
    border: 1px solid #475569;
    border-radius: 1px;
  }
  
  .documents.small {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 14px;
  }
  
  .doc.small {
    position: absolute;
    width: 10px;
    height: 12px;
    border-radius: 1px;
    border: 1px solid #0f172a;
  }
  
  .doc-lines.small {
    position: absolute;
    top: 2px;
    left: 1px;
    right: 1px;
  }
  
  .doc-lines.small .doc-line {
    height: 1px;
    background: #0f172a;
    margin-bottom: 1px;
    border-radius: 0.5px;
  }
  
  /* Medium size styles */
  .folder-back.medium {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 48px;
    height: 32px;
    background: #0f172a;
    border: 2px solid #475569;
    border-radius: 0 4px 4px 4px;
  }
  
  .folder-tab.medium {
    position: absolute;
    top: 4px;
    left: 0;
    width: 20px;
    height: 12px;
    background: #0f172a;
    border: 2px solid #475569;
    border-bottom: none;
    border-radius: 2px 2px 0 0;
  }
  
  .folder-front.medium {
    position: absolute;
    bottom: 0;
    left: 1px;
    width: 46px;
    height: 28px;
    background: #0f172a;
    border: 1px solid #475569;
    border-radius: 1px;
  }
  
  .documents.medium {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 32px;
    height: 24px;
  }
  
  .doc.medium {
    position: absolute;
    width: 16px;
    height: 20px;
    border-radius: 1px;
    border: 1px solid #0f172a;
  }
  
  .doc-lines.medium {
    position: absolute;
    top: 4px;
    left: 2px;
    right: 2px;
  }
  
  .doc-lines.medium .doc-line {
    height: 1px;
    background: #0f172a;
    margin-bottom: 1px;
    border-radius: 0.5px;
  }
  
  /* Large size styles */
  .folder-back.large {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 120px;
    height: 78px;
    background: #0f172a;
    border: 3px solid #475569;
    border-radius: 0 8px 8px 8px;
  }
  
  .folder-tab.large {
    position: absolute;
    top: 8px;
    left: 0;
    width: 48px;
    height: 26px;
    background: #0f172a;
    border: 3px solid #475569;
    border-bottom: none;
    border-radius: 6px 6px 0 0;
  }
  
  .folder-front.large {
    position: absolute;
    bottom: 0;
    left: 3px;
    width: 114px;
    height: 68px;
    background: #0f172a;
    border: 2px solid #475569;
    border-radius: 3px;
  }
  
  .documents.large {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 84px;
    height: 58px;
  }
  
  .doc.large {
    position: absolute;
    width: 42px;
    height: 52px;
    border-radius: 3px;
    border: 3px solid #0f172a;
  }
  
  .doc-lines.large {
    position: absolute;
    top: 10px;
    left: 6px;
    right: 6px;
  }
  
  .doc-lines.large .doc-line {
    height: 3px;
    background: #0f172a;
    margin-bottom: 4px;
    border-radius: 1px;
  }
  
  /* Document positioning for all sizes */
  .doc1 {
    background: #10b981;
    left: 0;
    top: 0;
    z-index: 3;
  }
  
  .doc2 {
    background: #34d399;
    z-index: 2;
  }
  
  .doc3 {
    background: #6ee7b7;
    z-index: 1;
  }
  
  /* Document positioning adjustments by size */
  .doc2.small {
    left: 5px;
    top: 1px;
  }
  
  .doc3.small {
    left: 10px;
    top: 2px;
  }
  
  .doc2.medium {
    left: 8px;
    top: 1px;
  }
  
  .doc3.medium {
    left: 16px;
    top: 2px;
  }
  
  .doc2.large {
    left: 21px;
    top: 3px;
  }
  
  .doc3.large {
    left: 42px;
    top: 6px;
  }
  
  /* Line variations */
  .doc-line.short {
    width: 80%;
  }
  
  .doc-line.shorter {
    width: 60%;
  }
  
  /* Logo text */
  .logo-text {
    font-weight: 900;
    letter-spacing: -0.5px;
    transition: all 0.3s ease;
  }
  
  .logo-cc {
    transition: color 0.3s ease;
  }
  
  /* Hover effects */
  .logo-container:hover .folder-icon {
    transform: scale(1.05);
    transition: transform 0.3s ease;
  }
  
  .logo-container:hover .logo-text {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style> 