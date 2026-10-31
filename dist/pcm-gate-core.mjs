// Decoded PCM stays resident. Only the authorized endpoint changes on a gesture.
// Rendering runs on the audio thread, independent of camera work or page timers.
export class PcmGate {
 constructor(channels,sampleRate,start){
  this.channels=channels;this.sampleRate=sampleRate;this.ramp=Math.max(1,Math.round(sampleRate*.004));
  this.start=Math.round(start*sampleRate);this.reset();
 }
 reset(){this.cursor=this.start;this.limit=this.start;this.playing=false;this.envelope=0;this.granted=false}
 grant(seconds){this.limit=Math.min(this.channels[0].length,Math.max(this.limit,Math.round(seconds*this.sampleRate)));this.playing=true;this.granted=true}
 pause(){this.playing=false}
 resume(){this.playing=true}
 get position(){return this.cursor/this.sampleRate}
 get waiting(){return this.granted&&this.cursor>=this.limit}
 render(outputs){
  const frames=outputs[0].length;
  for(let i=0;i<frames;i++){
   const available=this.cursor<this.limit,target=this.playing&&available?1:0;
   this.envelope+=Math.max(-1/this.ramp,Math.min(1/this.ramp,target-this.envelope));
   const consuming=available&&(this.playing||this.envelope>0);
   const gain=consuming?this.envelope*Math.min(1,(this.limit-this.cursor)/this.ramp):0;
   for(let c=0;c<outputs.length;c++)outputs[c][i]=consuming?this.channels[Math.min(c,this.channels.length-1)][this.cursor]*gain:0;
   if(consuming)this.cursor++;
  }
 }
}
