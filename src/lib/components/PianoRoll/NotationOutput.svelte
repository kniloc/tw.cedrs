<script>
  let { notation, action } = $props();

  let copied = $state(false);

  async function copy() {
    if (!notation) return;
    await navigator.clipboard.writeText(notation);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }
</script>

<div class="output">
  <div class="notation" class:empty={!notation}>
    {notation || 'notation will appear here…'}
  </div>
  {@render action?.()}
  <button class="btn" onclick={copy} disabled={!notation}>
    {copied ? 'copied' : 'copy'}
  </button>
</div>

<style>
  .output {
    background: var(--crust);
    border-top: 1px solid var(--surface0);
    padding: 8px 12px;
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .notation {
    flex: 1; font-size: 11px; color: var(--green);
    font-family: var(--font-mono); word-break: break-all;
    line-height: 1.5; min-height: 20px;
  }
  .notation.empty { 
    color: var(--surface2);
  }
  .btn {
    padding: 4px 12px; border-radius: 4px; border: 1px solid var(--surface1);
    background: transparent; font-size: 11px; color: var(--subtext); cursor: pointer;
    font-family: var(--font-mono); transition: all 0.1s;
  }
  .btn:hover:not(:disabled) { 
    background: var(--surface0); color: var(--text); 
  }
  .btn:disabled { 
    opacity: 0.4; cursor: default;
  }
</style>