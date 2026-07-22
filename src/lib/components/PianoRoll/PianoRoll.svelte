<script>
    import { buildRows, cellKey, CONFIG } from "$lib/workers/notationProcessor";
    import { onMount, tick } from "svelte";

    let { grid, oncellclick, onpaintstart, onpaintover, onpaintend } = $props();

    const rows = buildRows();
    const cols = Array.from({ length: CONFIG.COLS }, (_, i) => i);
    const ROW_HEIGHT = 24;
    const C4_INDEX = rows.findIndex(r => r.note === 'C' && r.oct === 4);

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

    function centerOnC4() {
        if (!scrollEl || !keysEl || C4_INDEX < 0 || !scrollEl.clientHeight) return false;

        const c4Center = C4_INDEX * ROW_HEIGHT + ROW_HEIGHT / 2;
        const target = c4Center - scrollEl.clientHeight / 2;
        const maxScrollTop = scrollEl.scrollHeight - scrollEl.clientHeight;
        const scrollTop = Math.max(0, Math.min(target, maxScrollTop));

        scrollEl.scrollTop = scrollTop;
        keysEl.scrollTop = scrollTop;

        return true;
    }

    onMount(async () => {
        let observer;

        tick().then(() => {
            if (centerOnC4()) return;

            observer = new ResizeObserver(() => {
                if (centerOnC4()) {
                    observer.disconnect();
                }
            });

            if (scrollEl) {
                observer.observe(scrollEl);
            }
        });

        return () => {
            observer?.disconnect();
        }
    });

    function onGridScroll(ev) {
        if (keysEl) keysEl.scrollTop = ev.target.scrollTop;
    }

    function onKeysScroll(ev) {
        if (scrollEl) scrollEl.scrollTop = ev.target.scrollTop;
    }
</script>

<svelte:window onmouseup={onpaintend} />

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
                            onmousedown={(e) => { e.preventDefault(); onpaintstart(ri, col); }}
                            onmouseenter={(e) => { if (e.buttons === 1) onpaintover(ri, col); }}
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
        border-right: 1px solid var(--color-surface-low);
        scrollbar-width: none;
    }
    .keys::-webkit-scrollbar { display: none; }

    .key {
        height: 24px; display: flex; align-items: center; justify-content: flex-end;
        padding-right: 8px; font-size: 10px; border-bottom: 1px solid var(--color-surface-low);
        user-select: none; font-family: var(--font-mono);
    }
    .key.white { background: var(--color-surface-low); color: var(--color-text-muted); }
    .key.black { background: var(--color-bg-deep); color: var(--color-surface-high); }
    .key.c-note { color: var(--color-text-primary); }

    .grid-scroll { flex: 1; overflow: auto; }
    .grid-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
    .grid-scroll::-webkit-scrollbar-track { background: var(--color-bg-sunken); }
    .grid-scroll::-webkit-scrollbar-thumb { background: var(--color-surface-mid); border-radius: 3px; }

    .grid { position: relative; display: grid; user-select: none; }

    .cell {
        height: 24px; border-bottom: 1px solid var(--color-surface-low); border-right: 1px solid var(--color-surface-mid);
        cursor: pointer;
    }
    .cell.beat { border-right: 1px solid var(--color-surface-mid); }
    .cell.bar { border-right: 1px solid var(--color-surface-high); }
    .cell.black-row { background: var(--color-bg-deep); }
    .cell.filled { background: var(--color-accent-green); border-color: var(--color-accent-green); border-radius: 2px; z-index: 1; }
    .cell.filled:hover { background: var(--color-accent-green); filter: brightness(1.2); }
    .cell.chord-fill { background: var(--color-accent-lavender); border-color: var(--color-accent-lavender); border-radius: 2px; z-index: 1; }
    .cell.chord-fill:hover { background: var(--color-accent-lavender); filter: brightness(1.2); }
    .cell:not(.filled):not(.chord-fill):hover { background: var(--color-surface-low); }
</style>
