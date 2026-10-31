export function validateSong(s){
 if(!s.id||!s.title||![2,3,4,6].includes(s.meter)||s.bpm<50||s.bpm>140||!s.notes.length||!s.chords.length)throw Error('Invalid song configuration');
 if(!s.notes.every(n=>(n[0]===null||(Number.isFinite(n[0])&&n[0]>=21&&n[0]<=108))&&Number.isFinite(n[1])&&n[1]>0))throw Error('Invalid melody note or duration');
 const length=s.notes.reduce((sum,n)=>sum+n[1],0);if(s.recording){const b=s.recording.boundaries;if(!Array.isArray(b)||b.length!==length+1||!b.every((t,i)=>Number.isFinite(t)&&t>=0&&(!i||t>b[i-1])))throw Error('Invalid backing beat map')}let previous=-1;for(const e of s.chords){if(e.beat<=previous||e.beat<0||e.beat>=length)throw Error('Invalid chord timeline');previous=e.beat}if(s.chords[0].beat!==0)throw Error('Missing starting chord');if(s.strokeBeats&&(!Array.isArray(s.strokeBeats)||s.strokeBeats[0]!==0||s.strokeBeats.at(-1)!==length||!s.strokeBeats.every((b,i)=>Number.isFinite(b)&&b>=0&&(!i||b>s.strokeBeats[i-1]))||s.chords.some(e=>!s.strokeBeats.includes(e.beat))))throw Error('Invalid stroke rhythm');return {...s,length};
}
export function chordAt(s,beat){let i=0;while(i+1<s.chords.length&&s.chords[i+1].beat<=beat)i++;return {...s.chords[i],next:s.chords[i+1]?.chord??'End'};}
export function phraseAt(s,beat){return s.phrases.filter(e=>e.beat<=beat).at(-1)?.text??'Ready · Strum with the beat';}
export function createSession(song){
 let s=validateSong(song),anchor=0,offset=0,playing=false,fresh=true,nextBeat=0,lastStroke=-Infinity,automatic=false;
 const raw=now=>playing?(now-anchor)*s.bpm/60:offset;
 const musical=now=>automatic?raw(now):Math.min(raw(now),nextBeat);
 return {get song(){return s},get playing(){return playing},get nextBeat(){return nextBeat},setSong(next){s=validateSong(next);this.reset()},reset(){playing=false;fresh=true;offset=0;nextBeat=0;lastStroke=-Infinity;automatic=false},
 start(now,options={}){if(!playing){automatic=!!options.automatic;if(fresh||offset>=s.length){offset=-(options.countIn??2);nextBeat=0;lastStroke=-Infinity}anchor=now-offset*60/s.bpm;fresh=false;playing=true}},
 pause(now){if(playing){offset=musical(now);playing=false}},
 position(now){const beat=musical(now),count=beat<0?Math.ceil(-beat-1e-8):0,relative=Math.max(0,beat-(s.pickup||0));return {...chordAt(s,Math.min(s.length-1e-8,Math.max(0,beat))),beat,count,waiting:playing&&!automatic&&raw(now)>=nextBeat&&nextBeat<s.length,ended:beat>=s.length,bar:Math.floor(relative/s.meter),inBar:Math.floor(relative%s.meter),phrase:phraseAt(s,beat)}},
 stroke(now){const clock=raw(now),p=60/s.bpm;if(!playing||automatic||clock<0||nextBeat>=s.length||now-lastStroke<.15)return null;
 const slot=nextBeat;nextBeat=s.strokeBeats?.find(b=>b>slot+1e-7)??slot+1;const onBeat=Math.abs(slot-clock)*p<=.18;lastStroke=now;anchor=now-slot*p;return {beat:slot,durationBeats:nextBeat-slot,delay:0,chord:chordAt(s,slot).chord,onBeat};}
 };
}

export function melodyForBeat(song,beat){
 if(!Number.isInteger(beat)||beat<0)return [];let cursor=0;const events=[];
 for(const [midi,duration] of song.notes){if(Number.isFinite(midi)&&cursor>=beat-1e-8&&cursor<beat+1-1e-8)events.push({midi,delayBeats:cursor-beat,durationBeats:duration});cursor+=duration}
 return events;
}
