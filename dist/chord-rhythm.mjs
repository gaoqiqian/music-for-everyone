import {chordAt} from './song-session.mjs?v=37';
import {chordSpec} from './chord-engine.mjs?v=42';

// The user's chart repeats two bass downstrokes, a full downstroke,
// then the short down/up pair. Only the part authorized by a gesture is queued.
export const STRUM_PATTERN=[{beat:0,bass:true,up:false,accent:.17},{beat:.5,bass:true,up:false,accent:.12},{beat:1,bass:false,up:false,accent:.13},{beat:1.5,bass:false,up:false,accent:.11},{beat:1.75,bass:false,up:true,accent:.085}];
export function strokeEnd(song,beat){return song.strokeBeats?.find(b=>b>beat+1e-7)??Math.min(song.length,beat+1)}
export function rhythmEvents({song,beat,chord,velocity=.7}){
 const end=strokeEnd(song,beat),p=60/song.bpm,events=[];
 for(let cycle=Math.floor(beat/2)*2;cycle<end;cycle+=2)for(const hit of song.strumPattern??STRUM_PATTERN){const at=cycle+hit.beat;if(at<beat-1e-7||at>=end-1e-7)continue;
  const harmony=song.assisted?chordAt({...song,chords:song.harmony},at).chord:chord,spec=chordSpec(harmony);
  let strings=spec.frets.flatMap((f,i)=>f<0?[]:[{midi:[40,45,50,55,59,64][i]+f,string:i}]);if(hit.bass)strings=strings.slice(0,3);if(hit.up)strings.reverse();
  strings.forEach((s,i)=>events.push({harmony,midi:s.midi,key:'string-'+s.string,group:'live-chords',delay:(at-beat)*p+i*.009,duration:Math.max(.18,Math.min(.65,(end-at)*p)),velocity:hit.accent*Math.max(.45,Math.min(.95,velocity))}));
 }
 return events;
}
export function createChordRhythm({play,stop,now}){
 let queue=[],lastChord=null;
 function flush(){const time=now();while(queue.length&&queue[0].at<=time+.035){const event=queue.shift();if(event.at<time-.10)continue;if(lastChord!==null&&lastChord!==event.harmony)stop('live-chords');lastChord=event.harmony;play({...event,delay:Math.max(0,event.at-time)})}}
 return {trigger(input){queue=[];const start=now();queue=rhythmEvents(input).map(e=>({...e,at:start+e.delay})).sort((a,b)=>a.at-b.at);flush()},update:flush,stop(){queue=[];lastChord=null;stop('live-chords')},get pending(){return queue.length}};
}
