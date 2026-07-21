<script>
    import { CONFIG } from "$lib/workers/notationProcessor";

    let {
        tempo,
        dur,
        dotted,
        dyn,
        ontempchange,
        ondurchange,
        ondottedtoggle,
        ondynchange,
        onrest,
        onundo,
        onclear
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
        {#each CONFIG.DYNAMICS as dynamic}
            <button class="tb-btn" class:on={dyn === dynamic} onclick={() => ondynchange(dynamic)}>{dynamic}</button>
        {/each}
    </div>

    <div class="sep"></div>

    <div class="group">
        <button class="tb-btn" onclick={onrest}>rest</button>
        <button class="tb-btn" onclick={onundo}>undo</button>
        <button class="tb-btn" onclick={onclear}>clear</button>
    </div>
</div>

<style>
    .toolbar {
        background-color: var(--mantle);
        border-bottom: 1px solid var(--surface0);
        padding: 8px 12px;
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
    }
    .sep { width: 1px; height: 20px; background: var(--surface0); margin: 0 4px; }
    .label { font-size: 11px; color: var(--subtext); margin-right: 2px; font-family: var(--font-mono); }
    .tb-btn {
        padding: 3px 9px; border-radius: 4px; border: 1px solid var(--surface1);
        background: var(--crust); color: var(--subtext); font-size: 11px; cursor: pointer;
        font-family: var(--font-mono); transition: all 0.1s;
    }
    .tb-btn:hover { background: var(--surface0); color: var(--text); }
    .tb-btn.on { background: var(--green); border-color: var(--green); color: var(--crust); }
    .tb-input {
        width: 85px; padding: 3px 6px; border-radius: 4px; border: 1px solid var(--surface1);
        background: var(--crust); color: var(--text); font-size: 11px;
        font-family: var(--font-mono); text-align: center;
    }
</style>