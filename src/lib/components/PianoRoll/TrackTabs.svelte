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
    border-bottom: 1px solid var(--surface0);
  }
  .tab {
    padding: 5px 14px; font-size: 11px; color: var(--subtext); cursor: pointer;
    border-right: 1px solid var(--surface0); background: var(--crust);
    font-family: var(--font-mono); user-select: none;
  }
  .tab:hover { 
    color: var(--text); 
  }
  .tab.active { 
    background: var(--mantle); color: var(--text); border-bottom: 1px solid var(--mantle);
  }
  .tab.add {
    color: var(--surface2); padding: 5px 10px;
  }
  .tab.add:hover {
    color: var(--subtext);
  }
</style>