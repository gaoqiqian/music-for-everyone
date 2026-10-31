import {CHORD_SONG,CHORD_CHOICES} from './chord-controls.mjs';
export const RELAXED_SONG={...CHORD_SONG,id:'relaxed-chord-practice',profile:'relaxed-practice-v1',title:'Relaxed six-chord practice',menuLabel:'Relaxed six-chord practice',relaxed:true,guided:true,choices:[...CHORD_CHOICES]};
export function needsChord(song,beat,selected){if(!song.guided)return false;let target=song.chords[0];for(const c of song.chords){if(c.beat>beat)break;target=c}return target.chord!==selected}
