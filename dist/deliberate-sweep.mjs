export function createSweepState(){return {point:null,history:[],armed:true,last:-Infinity}}
function reset(state,point=null,time=0){state.point=point?{...point,time}:null;state.history=point?[{...point,time}]:[];state.armed=true}
export function detectSweep(point,state,time,zone){
 if(!point||!zone||Math.abs(point.x-zone.x)>zone.width/2||Math.abs(point.y-zone.y)>zone.height/2){reset(state);return null}
 if(!state.point||time-state.point.time>350){reset(state,point,time);return null}
 state.point={...point,time};state.history.push({...point,time});state.history=state.history.filter(p=>time-p.time<=320);
 const extreme=state.history.reduce((best,p)=>state.armed?(p.y<best.y?p:best):(p.y>best.y?p:best));
 const dy=point.y-extreme.y,travel=state.armed?dy:-dy,required=state.armed?.035:.025;
 const elapsed=time-extreme.time;
 if(travel<required||elapsed<25||travel<Math.abs(point.x-extreme.x)*.85)return null;
 if(!state.armed){state.armed=true;state.history=[{...point,time}];return {direction:-1}}
 // Consume the complete sweep even if it was too close to the preceding hit.
 // This prevents a rejected bounce from firing later while the hand is still.
 state.armed=false;state.history=[{...point,time}];
 if(time-state.last<180)return null;
 state.last=time;const speed=travel/(elapsed/1000);
 return {direction:1,speed,velocity:Math.max(.45,Math.min(.95,.45+speed*.22))};
}
