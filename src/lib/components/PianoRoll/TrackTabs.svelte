<script>
  let { tracks, currentTrack, onselect, onadd } = $props();
</script>

<div class="tracks">
  {#each tracks as track, i}
    <div
      class="tab"
      class:active={i === currentTrack}
      onclick={() => onselect(i)}
      role="tab"
      tabindex="0"
      aria-selected={i === currentTrack}
      onkeydown={(e) => e.key === 'Enter' && onselect(i)}
    >{track.name}</div>
  {/each}
  <div
    class="tab add"
    onclick={onadd}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Enter' && onadd()}
  >+ track</div>
</div>

<style>
  .tracks {
    display: flex;
    border-bottom: 1px solid var(--color-surface-low);
  }
  .tab {
    padding: 5px 14px; font-size: 11px; color: var(--color-text-muted); cursor: pointer;
    border-right: 1px solid var(--color-surface-low); background: var(--color-bg-deep);
    font-family: var(--font-mono); user-select: none;
  }
  .tab:hover { 
    color: var(--color-text-primary);
  }
  .tab.active { 
    background: var(--color-bg-sunken); color: var(--color-text-primary); border-bottom: 1px solid var(--color-bg-sunken);
  }
  .tab.add {
    color: var(--color-surface-high); padding: 5px 10px;
  }
  .tab.add:hover {
    color: var(--color-text-muted);
  }
</style>