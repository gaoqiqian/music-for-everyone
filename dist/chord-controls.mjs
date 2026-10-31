import {chordSpec} from './chord-engine.mjs';
export const CHORD_CHOICES=['C','D','Bm','Em','G','G7'];
export const CHORD_SONG={id:'six-chord-practice',profile:'six-chord-practice-v1',title:'Six-chord practice',menuLabel:'Six-chord practice',meter:4,bpm:66,notes:[[null,32]],choices:CHORD_CHOICES,guided:true,strokeBeats:Array.from({length:33},(_,i)=>i),chords:['C','D','Bm','Em','C','D','G','G7'].map((chord,i)=>({beat:i*4,chord,word:'Hold this chord for four beats'})),phrases:[{beat:0,text:'C → D → Bm → Em'},{beat:16,text:'C → D → G → G7'}],source:'PRACTICE-GUIDE.md'};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function gestureNumber(hand){
 if(!hand||hand.length<21)return null;
 const wrist=hand[0],scale=distance(wrist,hand[9]);if(scale<.025)return null;
 const extended=[8,12,16,20].map(t=>distance(hand[t],wrist)>distance(hand[t-2],wrist)+scale*.22);
 // Measure the thumb against the palm's own radial axis. Comparing its tip
 // only with the preceding joint misses naturally open thumbs and tilted palms.
 const across={x:hand[5].x-hand[17].x,y:hand[5].y-hand[17].y},width=Math.hypot(across.x,across.y);
 if(width<scale*.12)return null;
 const radial=((hand[4].x-hand[5].x)*across.x+(hand[4].y-hand[5].y)*across.y)/width;
 const thumbReach=distance(hand[4],hand[5]);
 const a={x:hand[2].x-hand[3].x,y:hand[2].y-hand[3].y},b={x:hand[4].x-hand[3].x,y:hand[4].y-hand[3].y};
 const straight=(a.x*b.x+a.y*b.y)/Math.max(1e-8,Math.hypot(a.x,a.y)*Math.hypot(b.x,b.y))<-.72;
 const spread=radial>width*.18&&thumbReach>Math.max(width*.40,scale*.15);
 const relaxed=radial>width*.08&&straight&&thumbReach>Math.max(width*.30,scale*.13);
 const thumb=spread||relaxed;
 if(thumb&&!extended[0]&&!extended[1]&&!extended[2]&&extended[3])return 6;
 // One to five count raised fingers, including the thumb. Chinese six is
 // intentionally recognized first so thumb + little finger remains six.
 const count=extended.filter(Boolean).length+Number(thumb);
 return count||null;
}
export function splitHands(hands=[]){let left=null,right=null;for(const hand of hands){const p=hand[0];if(!p)continue;const x=1-(hand[0].x+hand[5].x+hand[9].x+hand[17].x)/4;if(x<.46&&(!left||x<left.x))left={hand,x};if(x>.54&&(!right||x>right.x))right={hand,x}}return {left:left?.hand??null,right:right?.hand??null}}
export function createChordSelector(choices=CHORD_CHOICES){let votes=[];return {reset(){votes=[]},update(number,time){
 if(!number||!choices[number-1]){votes=[];return null}
 votes=votes.filter(v=>time-v.time<=420);votes.push({number,time});
 const matching=votes.filter(v=>v.number===number);
 // A single marginal thumb frame must not restart an otherwise steady pose.
 return matching.length>=3&&time-matching[0].time>=240&&matching.length/votes.length>=.65?choices[number-1]:null;
}}}

export function chordVoices(symbol,velocity=.7){const spec=chordSpec(symbol);return spec.frets.flatMap((f,i)=>f<0?[]:[{midi:[40,45,50,55,59,64][i]+f,delay:i*.012,duration:1.65,velocity:(i<3?.19:.14)*velocity,group:'live-chords',key:'string-'+i}])}
export function diagram(symbol){const spec=chordSpec(symbol),xs=[14,30,46,62,78,94];return `<svg viewBox="0 0 108 112" role="img" aria-label="${symbol} guitar fingering, strings 6 to 1 from left to right"><g stroke="currentColor" opacity=".45">${xs.map(x=>`<path d="M${x} 24v72"/>`).join('')}${[24,42,60,78,96].map((y,i)=>`<path d="M14 ${y}h80" stroke-width="${i?1:3}"/>`).join('')}</g>${spec.frets.map((f,i)=>f<1?`<text x="${xs[i]}" y="17" text-anchor="middle" font-size="12" fill="currentColor">${f<0?'×':'○'}</text>`:`<circle cx="${xs[i]}" cy="${24+(f-.5)*18}" r="5" fill="currentColor"/>`).join('')}${symbol==='Bm'?'<path d="M30 51h64" stroke="currentColor" stroke-width="9" stroke-linecap="round"/>':''}<text x="54" y="109" text-anchor="middle" font-size="8" fill="currentColor">String 6 → String 1</text></svg>`}
