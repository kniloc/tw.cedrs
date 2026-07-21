<script>
    import { buildRows, cellKey, CONFIG } from "$lib/workers/notationProcessor";
    import { onMount } from "svelte";

    let { grid, oncellclick } = $props();

    const rows = buildRows();
    const cols = Array.from({ length: CONFIG.COLS }, (_, i) => i);

    function cellClass(row, col, grid) {
        const classes = ['cell'];
        if (row.black) classes.push('black-row');
        if (col % 16 === 15) classes.push('bar');
        else if (col % 4 === 3) classes.push('beat');

        const k = cellKey(rows.indexOf(row), col);
        if(grid[k]) {
            const isChord = Object.keys(grid).some(other => {
                const [, c] = other.split(',').map(Number);
                return c === col && other !== k;
            })
            classes.push(isChord ? 'chord-fill': 'filled');
        }

        return classes.join(' ');
    }

    let scrollEl = $state(null);
    let keysEl = $state(null);

    onMount(() => {
        if (scrollEl && keysEl) {
            const target = rows.findIndex(r => r.note === 'C' && r.oct === 4) * 24;
            scrollEl.scrollTop = target;
            keysEl.scrollTop = target;
        }
    });

    function onGridScroll(ev) {
        if (keysEl) keysEl.scrollTop = ev.target.scrollTop;
    }

    function onKeysScroll(ev) {
        if (scrollEl) scrollEl.scrollTop = ev.target.scrollTop;
    }
</script>

<div class="roll-area">
    <div class="keys" bind:this={keysEl} onscroll={onKeysScroll}>
        {#each rows as row}
            <div class="key {row.black ? 'black' : 'white'} {row.note === 'C' ? 'c-note' : ''}">
                {row.note === 'C' ? `C${row.oct}` : row.note}
            </div>
        {/each}
    </div>

    <div class="grid-scroll" bind:this={scrollEl} onscroll={onGridScroll}>
        <div class="grid" style="grid-template-columns: repeat({CONFIG.COLS}, 30px); grid-template-rows: repeat({rows.length}, 24px);">
            {#each rows as row, ri}
                {#each cols as col}
                    <div
                        class={cellClass(row, col, grid)}
                        onclick={() => oncellclick(ri, col)}
                        role="button"
                        tabindex="0"
                        aria-label="{row.note}{row.oct} col {col}"
                        onkeydown={(e) => e.key === 'Enter' && oncellclick(ri, col)}
                    ></div>
                {/each}
            {/each}
        </div>
    </div>
</div>

<style>
  .roll-area { display: flex; flex: 1; overflow: hidden; }
 
  .keys {
    width: 60px;
    flex-shrink: 0;
    overflow-y: auto;
    border-right: 1px solid var(--surface0);
    scrollbar-width: none;
  }
  .keys::-webkit-scrollbar { display: none; }
 
  .key {
    height: 24px; display: flex; align-items: center; justify-content: flex-end;
    padding-right: 8px; font-size: 10px; border-bottom: 1px solid var(--surface0);
    user-select: none; font-family: var(--font-mono);
  }
  .key.white { background: var(--surface0); color: var(--subtext); }
  .key.black { background: var(--crust); color: var(--surface2); }
  .key.c-note { color: var(--text); }
 
  .grid-scroll { flex: 1; overflow: auto; }
  .grid-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
  .grid-scroll::-webkit-scrollbar-track { background: var(--mantle); }
  .grid-scroll::-webkit-scrollbar-thumb { background: var(--surface1); border-radius: 3px; }
 
  .grid { position: relative; display: grid; }
 
  .cell {
    height: 24px; border-bottom: 1px solid var(--surface0); border-right: 1px solid var(--surface1);
    cursor: pointer;
  }
  .cell.beat { border-right: 1px solid var(--surface1); }
  .cell.bar { border-right: 1px solid var(--surface2); }
  .cell.black-row { background: var(--crust); }
  .cell.filled { background: var(--green); border-color: var(--green); border-radius: 2px; z-index: 1; }
  .cell.filled:hover { background: var(--green); filter: brightness(1.2); }
  .cell.chord-fill { background: var(--lavender); border-color: var(--lavender); border-radius: 2px; z-index: 1; }
  .cell.chord-fill:hover { background: var(--lavender); filter: brightness(1.2); }
  .cell:not(.filled):not(.chord-fill):hover { background: var(--surface0); }
</style>
