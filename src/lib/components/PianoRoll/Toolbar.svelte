<script>
    import { CONFIG, DYNAMICS } from "$lib/workers/notationProcessor";

    let {
        tempo,
        dur,
        dotted,
        dyn,
        canplay,
        isplaying,
        ontempchange,
        ondurchange,
        ondottedtoggle,
        ondynchange,
        onrest,
        onundo,
        onclear,
        onplay
    } = $props();

    function handleTempo(ev) {
        const v = Math.max(30, Math.min(250, +ev.target.value))
        ontempchange(v);
        ev.target.value = v;
    }
</script>

<!-- TODO restructure later to be more semantic -->
<div class="toolbar">
    <div class="group">
        <span class="label">bpm</span>
        <input class="tb-input" type="number" value={tempo} min="30" max="250" onchange={handleTempo} />
    </div>

    <div class="sep"></div>

    <div class="group">
        <span class="label">dyn</span>
        {#each DYNAMICS as dynamic}
            <button class="tb-btn" class:on={dyn === dynamic} onclick={() => ondynchange(dynamic)}>{dynamic}</button>
        {/each}
    </div>

    <div class="sep"></div>

    <div class="group">
        <button class="tb-btn" onclick={onrest}>rest</button>
        <button class="tb-btn" onclick={onundo}>undo</button>
        <button class="tb-btn" onclick={onclear}>clear</button>
    </div>

    <div class="sep"></div>

    <div class="group">
        <button
                class="tb-btn play-btn"
                class:playing={isplaying}
                onclick={onplay}
                disabled={!canplay}
        >
            {isplaying ? 'stop' : 'play'}
        </button>
    </div>
</div>

<style>
    .toolbar {
        background-color: var(--color-bg-sunken);
        border-bottom: 1px solid var(--color-surface-low);
        padding: 8px 12px;
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
    }

    .sep {
        width: 1px;
        height: 20px;
        background: var(--color-surface-low);
        margin: 0 4px;
    }

    .label {
        cursor: default;
        font-size: var(--font-mono-size);
        color: var(--color-text-muted);
        margin-right: 2px;
        font-family: var(--font-mono);
    }

    .tb-btn {
        padding: 3px 9px;
        border-radius: 4px;
        border: 1px solid var(--color-surface-mid);
        background: var(--color-bg-deep);
        color: var(--color-text-muted);
        font-size: var(--font-mono-size);
        cursor: pointer;
        font-family: var(--font-mono);
        transition: all 0.1s;

        &.on {
            background: var(--color-accent-green);
            border-color: var(--color-accent-green);
            color: var(--color-bg-deep);
        }
    }

    .tb-btn:hover:not(:disabled) {
        background: var(--color-surface-low);
        color: var(--color-text-primary);
    }

    .tb-btn:disabled {
        opacity: 0.4;
        cursor: default;
    }

    .play-btn {
        border-color: var(--color-accent-green);
        color: var(--color-accent-green);

        &.playing {
            background: var(--color-surface-low);
        }
    }

    .tb-input {
        width: 85px;
        padding: 3px 6px;
        border-radius: 4px;
        border: 1px solid var(--color-surface-mid);
        background: var(--color-bg-deep);
        color: var(--color-text-primary);
        font-size: var(--font-mono-size);
        font-family: var(--font-mono);
        text-align: center;
    }
</style>