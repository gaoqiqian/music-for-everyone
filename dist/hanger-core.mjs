export const PRACTICE_CHORDS=['C','G','Am','F'];
export function newStrokeState(){return {point:null,peak:null,direction:0,last:-Infinity}}
export function palmPoint(lm){const indices=[0,5,9,17];return {x:1-indices.reduce((sum,i)=>sum+lm[i].x,0)/4,y:indices.reduce((sum,i)=>sum+lm[i].y,0)/4}}
export function pickStrummingHand(landmarks,screenSide='right',previous=null,maxDistance=.28){
 const candidates=landmarks.map(lm=>({lm,point:palmPoint(lm)})).filter(({point})=>previous?Math.hypot(point.x-previous.x,point.y-previous.y)<maxDistance:screenSide==='any'||(screenSide==='right'?point.x>.48:point.x<.52));
 if(!candidates.length)return null;
 candidates.sort((a,b)=>previous?Math.hypot(a.point.x-previous.x,a.point.y-previous.y)-Math.hypot(b.point.x-previous.x,b.point.y-previous.y):Math.abs(a.point.x-(screenSide==='right'?.72:.28))-Math.abs(b.point.x-(screenSide==='right'?.72:.28)));
 return candidates[0];
}
export function trackStrummingHand(landmarks,previous=null,gap=0){
 // Handedness labels can flicker on a turned wrist. Follow spatial continuity instead.
 return pickStrummingHand(landmarks,'any',previous,Math.min(.50,.24+Math.max(0,gap)*.0015));
}
const median=values=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)]};
export function calibrateZone(samples,{minSamples=12,minDuration=900}={}){
 if(samples.length<minSamples||samples.at(-1).time-samples[0].time<minDuration)return {ok:false,reason:'Waiting for a steady hand…'};
 const x=median(samples.map(p=>p.x)),y=median(samples.map(p=>p.y));
 const deviations=samples.map(p=>Math.hypot(p.x-x,p.y-y));
 if(median(deviations)>.025||Math.max(...deviations)>.075)return {ok:false,reason:'Hold your strumming hand still for one second.'};
 return {ok:true,zone:resizeZone({x,y:y+.04})};
}
export function resizeZone(center,size='wide'){
 if(size==='camera')return {x:.5,y:.5,width:1,height:1};
 const [width,height]=size==='full'?[.94,.82]:size==='compact'?[.46,.46]:[.76,.68];
 return {x:Math.max(width/2+.02,Math.min(.98-width/2,center.x)),y:Math.max(height/2+.02,Math.min(.98-height/2,center.y)),width,height};
}
export function detectZoneStroke(point,state,time,zone,sensitivity=85,quick=false){
 if(!zone||!point||Math.abs(point.x-zone.x)>zone.width/2||Math.abs(point.y-zone.y)>zone.height/2){state.point=null;state.peak=null;state.direction=0;return null}
 if(!state.point||time-state.point.time>350){state.point={...point,time};state.peak={...point,time};state.direction=0;return null}
 // Follow the turning point of the hand, rather than a fixed string line.
 // Travel must exceed a dead band before either direction can sound once.
 const amount=Math.max(0,Math.min(100,Number(sensitivity)||0))/100;
 const travel=(.055-.032*amount)*(quick?.46:1),cooldown=quick?55:140-65*amount;
 const previous=state.point,dy=point.y-state.peak.y,direction=Math.sign(dy);
 state.point={...point,time};
 if(state.direction&&direction===state.direction){state.peak={...point,time};return null}
 const required=quick&&direction<0?travel*.52:travel;
 if(Math.abs(dy)<required){if(Math.abs(dy)<.008){state.peak.x=point.x;state.peak.time=time}return null}
 const speed=Math.max(Math.abs(dy)/Math.max(.01,(time-state.peak.time)/1000),Math.abs(point.y-previous.y)/Math.max(.01,(time-previous.time)/1000));
 if(speed<(quick?.025:.06)||(time-state.last<cooldown&&(!quick||direction>0)))return null;
 // Horizontal drift alone must not count as a strum.
 if(Math.abs(dy)<Math.abs(point.x-state.peak.x)*(quick?.25:.45))return null;
 state.direction=direction;state.peak={...point,time};if(!quick||direction>0)state.last=time;
 return {direction,velocity:Math.max(.42,Math.min(.95,.42+speed*.22)),speed};
}
export function practicePosition(time,start,bpm){
 const step=60/bpm,relative=(time-start)/step;
 if(relative<0)return {count:Math.min(4,Math.max(1,Math.ceil(-relative))),beat:Math.max(0,Math.floor(relative+4))%4,chord:'C',next:'G',bar:0};
 const bar=Math.floor(relative/4),chordIndex=bar%4;
 return {count:0,beat:Math.floor(relative)%4,chord:PRACTICE_CHORDS[chordIndex],next:PRACTICE_CHORDS[(chordIndex+1)%4],bar:bar+1};
}
export function assistedDelay(time,start,bpm,enabled=true){
 if(!enabled||time<start)return 0;
 const grid=30/bpm,elapsed=time-start,phase=((elapsed%grid)+grid)%grid;
 const delay=phase<.001?0:grid-phase;
 return delay<=.08?delay:0;
}
