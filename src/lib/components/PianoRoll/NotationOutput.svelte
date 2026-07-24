<script>
  let { notation } = $props();
</script>

<div class="output">
  <div class="notation" class:empty={!notation}>
    {notation || 'notation will appear here…'}
  </div>
</div>

<style>
  .output {
    background: var(--color-bg-deep);
    border-top: 1px solid var(--color-surface-low);
    padding: 8px 12px;
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .notation {
    flex: 1;
    font-size: var(--font-mono-size);
    color: var(--color-accent-green);
    font-family: var(--font-mono);
    word-break: break-all;
    line-height: 1.5;
    min-height: 20px;

    &.empty {
      color: var(--color-surface-high);
    }
  }
</style>