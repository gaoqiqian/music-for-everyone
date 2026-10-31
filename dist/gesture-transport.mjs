const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export function createGestureTransport(config){
 const points=config.boundaries,base=config.period??60/76;
 let lastIndex=-1,lastTime=null,period=base,rate=1,intervals=[];
 function beatAt(position){let i=0;while(i+1<points.length&&position>=points[i+1])i++;if(i===points.length-1)return i;return i+clamp((position-points[i])/(points[i+1]-points[i]),0,1)}
 return {
  get lastIndex(){return lastIndex},get limit(){return points[lastIndex+1]??points[0]},get period(){return period},
  reset(){lastIndex=-1;lastTime=null;period=base;rate=1;intervals=[]},beatAt,
  canStroke(now,position){return lastTime===null||(now-lastTime>=.24&&lastIndex<=Math.floor(beatAt(position)+1e-6))},
  stroke(index,now,position){
   if(index!==lastIndex+1||index<0||index>=points.length-1)return null;
   if(lastTime!==null){const delta=now-lastTime;if(delta>=base*.55&&delta<=base*1.65){intervals.push(delta);intervals=intervals.slice(-3);const sorted=[...intervals].sort((a,b)=>a-b);const target=sorted[Math.floor(sorted.length/2)];period=clamp(period*.5+target*.5,base*.72,base*1.35)}else if(delta>base*1.65){intervals=[]}}
   // Keep the recording at its original speed; avoid a tempo jump at each beat.
   rate=1;
   lastIndex=index;lastTime=now;return {index,rate,limit:this.limit,period};
  }
 };
}
