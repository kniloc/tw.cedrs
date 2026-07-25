export const CONFIG = {
    NOTES: ['B','Bb','A','Ab','G','Gb','F','E','Eb','D','Db','C'],
    BLACK_NOTES: new Set(['Bb', 'Ab', 'Gb', 'Eb', 'Db']),
    OCTAVES: [6, 5, 4, 3, 2],
    COLS: 64
};

export const DUR_BEATS = { w:4, h:2, q:1, e:0.5, s:0.25 };
export const DYN_GAIN  = { pp:0.1, p:0.25, mp:0.45, mf:0.65, f:0.8, ff:1.0 };

export const DYNAMICS = ['pp', 'p', 'mp', 'mf', 'f', 'ff'];
export const DURATIONS = ['w', 'h', 'q', 'e', 's'];

export function buildRows() {
    const rows = [];

    for (const oct of CONFIG.OCTAVES) {
        for (const note of CONFIG.NOTES) {
            rows.push({note, oct, black: CONFIG.BLACK_NOTES.has(note)});
        }
    }
    return rows;
}

export function accOf(note) {
    if (note.endsWith('b')) return 'b';
    if (note.endsWith('#')) return '#';
    return '';
}

export function noteName(note) {
    return note.length > 1 ? note[0] : note;
}

export function noteToMidi(note, acc, oct) {
    const m = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
    const a = acc === '#' ? 1 : acc === 'b' ? -1 : 0;
    return 12 * (oct + 1) + m[note] + a;
}

export function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

export function durBeats(dur, dotted) {
    return (DUR_BEATS[dur] || 1) * (dotted ? 1.5 : 1)
}

// 1 grid column = 1 sixteenth note; span → (dur, dotted)
const SPAN_DUR_MAP = {
    1:  { dur: 's', dotted: false },
    2:  { dur: 'e', dotted: false },
    3:  { dur: 'e', dotted: true  },
    4:  { dur: 'q', dotted: false },
    6:  { dur: 'q', dotted: true  },
    8:  { dur: 'h', dotted: false },
    12: { dur: 'h', dotted: true  },
    16: { dur: 'w', dotted: false },
};

export function spanToDur(span) {
    if (SPAN_DUR_MAP[span]) {
        return SPAN_DUR_MAP[span];
    }
    const keys = Object.keys(SPAN_DUR_MAP).map(Number);
    const closest = keys.reduce((a, b) => Math.abs(b - span) < Math.abs(a - span) ? b : a);
    return SPAN_DUR_MAP[closest];
}

export function cellKey(r, c) {
    return `${r},${c}`;
}

export function gridToEvents(grid) {
    const byCol = {};
    for (const [k, v] of Object.entries(grid)) {
        const [r, c] = k.split(',').map(Number);
        if (!byCol[c]) byCol[c] = [];
        byCol[c].push({ ...v, row: r });
    }

    const sorted = Object.keys(byCol).map(Number).sort((a, b) => a - b);
    const events = [];
    let lastEnd = -1;

    for (const col of sorted) {
        const notes = byCol[col];
        const first = notes[0];
        const span = first.span ?? 4;
        const { dur, dotted } = spanToDur(span);

        if (lastEnd >= 0 && col > lastEnd) {
            const gap = col - lastEnd;
            const gapDur = spanToDur(gap);
            events.push({ type: 'rest', dur: gapDur.dur, dotted: gapDur.dotted, dyn: 'mf' });
        }

        if (first.type === 'rest') {
            events.push({ type: 'rest', dur, dotted, dyn: first.dyn });
        } else if (notes.length === 1) {
            events.push({
                type: 'note',
                note: noteName(first.note),
                acc: accOf(first.note),
                oct: first.oct,
                dur,
                dotted,
                dyn: first.dyn,
            });
        } else {
            events.push({
                type: 'chord',
                pitches: notes.map(n => ({ note: noteName(n.note), acc: accOf(n.note), oct: n.oct })),
                dur,
                dotted,
                dyn: first.dyn,
            });
        }

        lastEnd = col + span;
    }

    return events;
}

export function buildNotation(tempo, tracks) {
    const parts = [];

    for (const track of tracks) {
        const grid = track._grid || {};
        if (!Object.keys(grid).length) continue;

        const events = gridToEvents(grid);
        if (!events.length) continue;

        const tokens = [`t${tempo}`];
        let lastDyn = null;

        for (const event of events) {
            if (event.type !== 'rest' && event.dyn !== lastDyn) {
                tokens.push(event.dyn);
                lastDyn = event.dyn;
            }

            const dot = event.dotted ? '.' : '';
            if (event.type === 'note') {
                tokens.push(`${event.note}${event.acc}${event.oct}${event.dur}${dot}`);
            } else if (event.type === 'rest') {
                tokens.push(`r${event.dur}${dot}`);
            } else if (event.type === 'chord') {
                const inner = event.pitches.map(p => `${p.note}${p.acc}${p.oct}`).join(' ');
                tokens.push(`[${inner}${event.dur}${dot}]`);
            }
        }

        parts.push(tokens.join(' '));
    }

    return parts.join(' | ');
}