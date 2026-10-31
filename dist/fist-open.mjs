const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function handPose(hand){
 if(!hand||hand.length<21||hand.some(p=>!Number.isFinite(p?.x)||!Number.isFinite(p?.y)))return 'unknown';
 const scale=distance(hand[0],hand[9]);if(scale<.025)return 'unknown';
 let open=0,closed=0;
 for(const tip of [8,12,16,20]){const reach=(distance(hand[tip],hand[0])-distance(hand[tip-2],hand[0]))/scale;if(reach>.20)open++;if(reach<.06&&distance(hand[tip],hand[tip-3])<scale*.85)closed++;}
 // The thumb is deliberately ignored: naturally opening three long fingers
 // suffices, while an isolated pointing finger must never count as a fist.
 if(open>=3)return 'open';if(closed>=3&&open===0)return 'fist';return 'unknown';
}
export function createFistOpen(){
 let armed=false,pose='unknown',candidate='unknown',since=0,frames=0,lastSeen=-Infinity,lastHit=-Infinity;
 function clear(){armed=false;pose='unknown';candidate='unknown';frames=0;lastSeen=-Infinity;}
 return {reset(){clear();lastHit=-Infinity},get armed(){return armed},get pose(){return pose},get lastHit(){return lastHit},
 update(hand,time){
  if(time-lastSeen>300){armed=false;candidate='unknown';frames=0;pose='unknown';}
  if(!hand){candidate='unknown';frames=0;return null}
  lastSeen=time;const next=handPose(hand);
  if(next==='unknown'){candidate=next;frames=0;return null}
  if(next!==candidate){candidate=next;since=time;frames=1;return null}
  frames++;if(frames<2||time-since<(next==='fist'?60:40))return null;
  pose=next;
  if(next==='fist'){armed=true;return null}
  if(!armed)return null;
  // Consume this opening even during cooldown, so it cannot fire later while held.
  armed=false;if(time-lastHit<220)return null;lastHit=time;return {direction:1,velocity:.7};
 }};
}
