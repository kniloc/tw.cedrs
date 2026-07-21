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

  function handleCellClick(ri, col) {
    const g = { ...currentGrid() };
    const k = cellKey(ri, col);
    if (g[k]) {
      delete g[k];
    } else {
      g[k] = {
        note: rows[ri].note,
        oct: rows[ri].oct,
        row: ri,
        dur,
        dotted,
        dyn,
      };
    }
    setGrid(g);
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
    const maxLen = Math.max(...allEvents.map(evs =>
      evs.reduce((s, e) => s + durBeats(e.dur, e.dotted) * secPerBeat, 0)
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
    ontempchange={(v) => (tempo = v)}
    ondurchange={(d) => (dur = d)}
    ondottedtoggle={() => (dotted = !dotted)}
    ondynchange={(d) => (dyn = d)}
    onrest={handleRest}
    onundo={handleUndo}
    onclear={handleClear}
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
  />

  <NotationOutput {notation}>
    {#snippet action()}
      <button
        class="play-btn"
        class:playing={isPlaying}
        onclick={handlePlay}
        disabled={!notation}
      >
        {isPlaying ? 'stop' : 'play'}
      </button>
    {/snippet}
  </NotationOutput>
</div>

<style>
  .app {
    background: var(--crust);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100svh;
    max-height: 640px;
    font-family: var(--font-mono);
  }

  .play-btn {
    padding: 4px 12px;
    border-radius: 4px;
    border: 1px solid var(--green);
    background: transparent;
    font-size: 11px;
    color: var(--green);
    cursor: pointer;
    font-family: var(--font-mono);
    transition: all 0.1s;
  }

  .play-btn:hover:not(:disabled) { background: var(--surface0); }
  .play-btn.playing { background: var(--surface0); }
  .play-btn:disabled { opacity: 0.4; cursor: default; }
</style>