<script>
  import Toolbar from '$lib/components/PianoRoll/Toolbar.svelte';
  import TrackTabs from '$lib/components/PianoRoll/TrackTabs.svelte';
  import PianoRoll from '$lib/components/PianoRoll/PianoRoll.svelte';
  import NotationOutput from '$lib/components/PianoRoll/NotationOutput.svelte';
  import { buildNotation, cellKey, gridToEvents, durBeats, midiToFreq, noteToMidi, DYN_GAIN, buildRows } from '$lib/workers/notationProcessor';
  import Title from '$lib/components/Title.svelte';

  // Toolbar state
  let tempo = $state(120);
  let dur = $state('q');
  let dotted = $state(false);
  let dyn = $state('mf');

  // Tracks — each has a name and a grid { "r,c": cellData }
  let tracks = $state([{ name: 'track 1', _grid: {} }]);
  let currentTrack = $state(0);

  const notation = $derived(buildNotation(tempo, tracks));
  const titleText = "Neil banging out the tunes.";
  const rows = buildRows();

  function currentGrid() {
    return tracks[currentTrack]._grid;
  }

  function setGrid(updatedGrid) {
    tracks = tracks.map((t, i) =>
            i === currentTrack ? { ...t, _grid: updatedGrid } : t
    );
  }

  let paintMode = $state(null); // 'add' | 'remove' | null while dragging

  function applyPaint(ri, col, mode) {
    const k = cellKey(ri, col);
    const exists = !!currentGrid()[k];
    if ((mode === 'add' && exists) || (mode === 'remove' && !exists)) return;
    const g = { ...currentGrid() };
    if (mode === 'add') {
      g[k] = {
        note: rows[ri].note,
        oct: rows[ri].oct,
        row: ri,
        dur,
        dotted,
        dyn,
      };
    } else {
      delete g[k];
    }
    setGrid(g);
  }

  function handleCellClick(ri, col) {
    applyPaint(ri, col, currentGrid()[cellKey(ri, col)] ? 'remove' : 'add');
  }

  function handlePaintStart(ri, col) {
    paintMode = currentGrid()[cellKey(ri, col)] ? 'remove' : 'add';
    applyPaint(ri, col, paintMode);
  }

  function handlePaintOver(ri, col) {
    if (paintMode) applyPaint(ri, col, paintMode);
  }

  function handlePaintEnd() {
    paintMode = null;
  }

  function handleRest() {
    const g = { ...currentGrid() };
    const usedCols = new Set(Object.keys(g).map(k => +k.split(',')[1]));
    let col = 0;
    while (usedCols.has(col)) col++;
    g[cellKey(-1, col)] = { type: 'rest', dur, dotted, dyn, chord: false };
    setGrid(g);
  }

  function handleUndo() {
    const g = { ...currentGrid() };
    const keys = Object.keys(g);
    if (!keys.length) return;
    delete g[keys[keys.length - 1]];
    setGrid(g);
  }

  function handleClear() {
    setGrid({});
  }

  function handleAddTrack() {
    if (tracks.length >= 16) return;
    tracks = [...tracks, { name: `track ${tracks.length + 1}`, _grid: {} }];
    currentTrack = tracks.length - 1;
  }

  function handleSelectTrack(i) {
    currentTrack = i;
  }

  // Playback
  let audioCtx = null;
  let isPlaying = $state(false);
  let stopSig = false;

  function getCtx() {
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx;
  }

  function schedNote(ctx, freq, gain, t, dur) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain * 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.93);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  async function handlePlay() {
    if (isPlaying) {
      stopSig = true;
      if (audioCtx) {
        await audioCtx.close();
        audioCtx = null;
      }
      isPlaying = false;
      return;
    }
    if (!notation) return;
    isPlaying = true;
    stopSig = false;

    const ctx = getCtx();
    if (ctx.state === 'suspended') await ctx.resume();

    const secPerBeat = 60 / tempo;
    const allEvents = tracks.map(t => gridToEvents(t._grid || {})).filter(e => e.length);
    const maxLen = Math.max(...allEvents.map(evs => evs.reduce((s, e) => s + durBeats(e.dur, e.dotted) * secPerBeat, 0)
    ));

    for (const evs of allEvents) {
      let t = ctx.currentTime + 0.05;
      for (const ev of evs) {
        if (stopSig) break;

        const d = durBeats(ev.dur, ev.dotted) * secPerBeat;
        const gain = DYN_GAIN[ev.dyn] || 0.65;

        if (ev.type === 'note') {
          schedNote(ctx, midiToFreq(noteToMidi(ev.note, ev.acc, ev.oct)), gain, t, d);
        } else if (ev.type === 'chord') {
          ev.pitches.forEach(p =>
                  schedNote(ctx, midiToFreq(noteToMidi(p.note, p.acc, p.oct)), gain / ev.pitches.length, t, d)
          );
        }
        t += d;
      }
    }

    await new Promise(r => setTimeout(r, maxLen * 1000 + 200));
    isPlaying = false;
    stopSig = false;
  }
</script>

<Title text={titleText}/>

<div class="app">
  <Toolbar
          {tempo}
          {dur}
          {dotted}
          {dyn}
          canplay={!!notation}
          isplaying={isPlaying}
          ontempchange={(v) => (tempo = v)}
          ondurchange={(d) => (dur = d)}
          ondottedtoggle={() => (dotted = !dotted)}
          ondynchange={(d) => (dyn = d)}
          onrest={handleRest}
          onundo={handleUndo}
          onclear={handleClear}
          onplay={handlePlay}
  />

  <TrackTabs
          {tracks}
          {currentTrack}
          onselect={handleSelectTrack}
          onadd={handleAddTrack}
  />

  <PianoRoll
          grid={tracks[currentTrack]._grid}
          oncellclick={handleCellClick}
          onpaintstart={handlePaintStart}
          onpaintover={handlePaintOver}
          onpaintend={handlePaintEnd}
  />

  <NotationOutput {notation} />
</div>

<style>
  .app {
    background: var(--color-bg-deep);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100svh;
    max-height: 640px;
    font-family: var(--font-mono);
  }
</style>