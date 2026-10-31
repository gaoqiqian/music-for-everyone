import assert from 'node:assert/strict';
import {PRACTICE_SONG,ALTERNATE_SONG} from '../dist/practice-song.mjs';
import {CHORD_SONG} from '../dist/chord-controls.mjs';
import {RELAXED_SONG,needsChord} from '../dist/practice-chords.mjs';
import {SONGS} from '../dist/songbook.mjs';
import {createSession,validateSong,chordAt} from '../dist/song-session.mjs';
import {defaultLyrics,validateCues,importLyrics} from '../dist/lyric-cues.mjs';
import {chordSpec} from '../dist/chord-engine.mjs';
for(const raw of [...SONGS,PRACTICE_SONG,ALTERNATE_SONG,CHORD_SONG,RELAXED_SONG]){
 const song=validateSong(raw);validateCues(defaultLyrics(song).cues,song.length);
 for(const chord of song.chords)assert.ok(chordSpec(chord.chord));
 if(song.practice||song.guided){const session=createSession(song);session.start(0,{countIn:0});for(let b=0;b<song.length;b++){const chord=chordAt(song,b).chord;assert.equal(needsChord(song,b,chord),false);assert.equal(session.stroke(b).beat,b)}assert.equal(session.stroke(song.length+1),null)}
}
assert.ok(SONGS.every(song=>!song.recording));
assert.equal(importLyrics('One line\nAnother line',PRACTICE_SONG).cues.length,2);
assert.throws(()=>importLyrics('[99:59]Outside the section',PRACTICE_SONG));
console.log('PASS: all repertoire, chord voicings, beat-by-beat exercises and cue import');
