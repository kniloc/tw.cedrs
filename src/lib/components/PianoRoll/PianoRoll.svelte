<script>
    import {buildRows, CONFIG} from "$lib/workers/notationProcessor.js";
    import {onMount} from "svelte";

    let {grid, sub, onplace, ondelete} = $props();

    const rows = buildRows();
    const cols = $derived(Array.from({ length: CONFIG.COLS / sub }, (_, i) => i));
    const cellPx = $derived(sub * 20);

    let dragAnchor = $state(null);
    let dragEndCol = $state(null);

    const overlays = $derived(
        Object.entries(grid).filter(([, v]) => v.type !== 'rest')
            .map(([k, v]) => {
                const [ri, col] = k.split(',').map(Number);
                const isChord = Object.keys(grid).some(other => {
                    const [, c] = other.split(',').map(Number);
                    return +c === col && other !== k;
                });
                return {ri, col, span: v.span ?? 4, isChord};
            })
    );

    const dragPreview = $derived(
        dragAnchor ? {
            ri: dragAnchor.ri,
            col: dragAnchor.col,
            span: Math.max(1, (dragEndCol ?? dragAnchor.col) - dragAnchor.col + 1)
        } : null
    );

    let scrollEl = $state(null);
    let keysEl = $state(null);

    onMount(() => {
        if (scrollEl && keysEl) {
            const target = rows.findIndex(r => r.note === 'C' && r.oct === 4) * 24;
            scrollEl.scrollTop = target;
            keysEl.scrollTop = target;
        }

        function handleWindowMouseUp() {
            if (dragAnchor) {
                const span = Math.max(1, (dragEndCol ?? dragAnchor.col) - dragAnchor.col + 1);
                onplace(dragAnchor.ri, dragAnchor.col, span);
                dragAnchor = null;
                dragEndCol = null;
            }
        }

        window.addEventListener('mouseup', handleWindowMouseUp);
        return () => window.removeEventListener('mouseup', handleWindowMouseUp);
    });

    function onGridScroll(ev) {
        if (keysEl) keysEl.scrollTop = ev.target.scrollTop;
    }

    function onKeysScroll(ev) {
        if (scrollEl) scrollEl.scrollTop = ev.target.scrollTop;
    }

    function handleCellMousedown(ri, absCol) {
        dragAnchor = { ri, col: absCol };
        dragEndCol = absCol + sub - 1;
    }

    function handleCellMouseenter(ri, vi) {
        if (!dragAnchor || dragAnchor.ri !== ri) return;
        const absEnd = vi * sub + (sub - 1);
        dragEndCol = Math.max(dragAnchor.col + sub - 1, absEnd);
    }

    function cellClass(row, vi) {
        const classes = ['cell'];
        if (row.black) classes.push('black-row');

        const barInt = 16 / sub;
        const beatInt = 4 / sub;

        if (vi & barInt - 1) {
            classes.push('bar');
        } else if (beatInt >= 2 && vi % beatInt === beatInt - 1) {
            classes.push('beat');
        }

        return classes.join(' ');
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
        <div class="grid" style="grid-template-columns: repeat({CONFIG.COLS / sub}, {cellPx}px); grid-template-rows: repeat({rows.length}, 24px);">
            {#each rows as row, ri}
                {#each cols as vi}
                    <div
                        class={cellClass(row, vi)}
                        onmousedown={() => handleCellMousedown(ri, vi * sub)}
                        onmouseenter={() => handleCellMouseenter(ri, vi)}
                        role="button"
                        tabindex="0"
                        aria-label="{row.note}{row.oct} col {vi * sub}"
                        onkeydown={(e) => e.key === 'Enter' && onplace(ri, vi * sub, sub)}
                    ></div>
                {/each}
            {/each}

            {#each overlays as o (`${o.ri},${o.col}`)}
                <div class="note-overlay {o.isChord ? 'chord' : ''}"
                     style="left: {o.col * 20}px; top: {o.ri * 24}px; width: {o.span * 20 - 2}px; height: 23px; pointer-events: {dragAnchor ? 'none' : 'auto'};"
                     onmousedown={(e) => { e.stopPropagation(); ondelete(o.ri, o.col); }}
                ></div>
            {/each}

            {#if dragPreview}
                <div class="note-overlay preview"
                    style="left: {dragPreview.col * 20}px; top: {dragPreview.ri * 24}px; width: {dragPreview.span * 20 - 2}px; height: 23px; pointer-events: none;"
                ></div>
            {/if}
        </div>
    </div>
</div>

<style>
    .roll-area {
        display: flex;
        flex: 1;
        overflow: hidden;
    }

    .keys {
        width: 60px;
        flex-shrink: 0;
        overflow-y: auto;
        border-right: 1px solid var(--color-surface-low);
        scrollbar-width: none;

        &::-webkit-scrollbar {
            display: none;
        }
    }

    .key {
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 8px;
        font-size: 10px;
        border-bottom: 1px solid var(--color-surface-low);
        user-select: none;
        font-family: var(--font-mono);

        &.white {
            background: var(--color-surface-low);
            color: var(--color-text-muted);
        }

        &.black {
            background: var(--color-bg-deep);
            color: var(--color-surface-high);
        }

        &.c-note {
            color: var(--color-text-primary);
        }
    }

    .grid-scroll {
        flex: 1; overflow: auto;

        &::-webkit-scrollbar {
            height: 6px;
            width: 6px;
        }

        &::-webkit-scrollbar-track {
            background: var(--color-bg-sunken);
        }

        &::-webkit-scrollbar-thumb {
            background: var(--color-surface-mid);
            border-radius: 3px;
        }
    }

    .grid {
        position: relative;
        display: grid;
        user-select: none;
    }

    .cell {
        height: 24px;
        border-bottom: 1px solid var(--color-surface-low);
        border-right: 1px solid var(--color-surface-mid);
        cursor: pointer;

        &.beat {
            border-right: 1px solid var(--color-surface-mid);
        }

        &.bar {
            border-right: 1px solid var(--color-surface-high);
        }

        &.black-row {
            background: var(--color-bg-deep);
        }

        &.filled {
            background: var(--color-accent-green);
            border-color: var(--color-accent-green);
            border-radius: 2px;
            z-index: 1;

            &:hover {
                background: var(--color-accent-green);
                filter: brightness(1.2)
            }
        }

        &.chord-fill {
            background: var(--color-accent-lavender);
            border-color: var(--color-accent-lavender);
            border-radius: 2px;
            z-index: 1;

            &:hover {
                background: var(--color-accent-lavender);
                filter: brightness(1.2);
            }
        }

        &:not(.filled):not(.chord-fill):hover {
            background: var(--color-surface-low);
        }
    }

    .note-overlay {
        position: absolute;
        background: var(--color-accent-green);
        border-radius: 2px;
        z-index: 2;
        cursor: pointer;

        &.chord {
            background: var(--color-accent-lavender);
        }

        &.preview {
            background: var(--color-accent-green);
            opacity: 0.4;
            cursor: crosshair;
        }

        &:not(.preview):hover {
            filter: brightness(1.2);
        }
    }
</style>