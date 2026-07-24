<script>
  let { tracks, currentTrack, onselect, onadd, ondelete } = $props();
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
    >
      {track.name}
    </div>
    {#if i === currentTrack}
      <button
              class="close-btn"
              onclick={(e) => {e.stopPropagation(); ondelete(i);}}
              aria-label="Delete track"
      >⨯</button>
    {/if}
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
  .close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-bg-sunken);
    color: var(--color-text-primary);
    border: none;
    border-right: 1px solid var(--color-surface-low);
    cursor: pointer;

    &:hover {
      background-color: var(--color-error);
    }
  }

  .tracks {
    display: flex;
    border-bottom: 1px solid var(--color-surface-low);
  }

  .tab {
    display: flex;
    align-items: center;
    padding: 0 14px;
    font-size: var(--font-mono-size);
    color: var(--color-text-muted);
    cursor: pointer;
    background: var(--color-bg-deep);
    font-family: var(--font-mono);
    user-select: none;

    &:hover {
      color: var(--color-text-primary);
    }

    &.active {
      background: var(--color-bg-sunken);
      color: var(--color-text-primary);
      border-bottom: 1px solid var(--color-bg-sunken);
    }

    &.add {
      color: var(--color-surface-high);
      padding: 5px 10px;

      &:hover {
        color: var(--color-text-muted);
      }
    }
  }
</style>