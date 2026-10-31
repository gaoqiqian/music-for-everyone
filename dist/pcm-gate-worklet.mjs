import {PcmGate} from './pcm-gate-core.mjs?v=32';
class GuitarGateProcessor extends AudioWorkletProcessor {
 constructor(){super();this.engine=null;this.elapsed=0;this.revision=0;this.port.onmessage=({data})=>{
  if(data.type==='load'){this.revision=data.revision;this.engine=new PcmGate(data.channels,sampleRate,data.start);this.port.postMessage({type:'ready',revision:this.revision})}
  else if(data.type==='reset')this.engine?.reset();
  else if(data.type==='grant')this.engine?.grant(data.limit);
  else if(data.type==='pause')this.engine?.pause();
  else if(data.type==='resume')this.engine?.resume();
  this.report();
 }}
 report(){if(this.engine){this.lastWaiting=this.engine.waiting;this.lastPlaying=this.engine.playing;this.port.postMessage({type:'position',revision:this.revision,position:this.engine.position,waiting:this.engine.waiting,playing:this.engine.playing,time:currentTime})}}
 process(inputs,outputs){if(this.engine){
  if((!this.engine.playing||this.engine.waiting)&&this.engine.envelope===0)return true;
  this.engine.render(outputs[0]);this.elapsed+=outputs[0][0].length;
  if(this.engine.waiting!==this.lastWaiting||this.engine.playing!==this.lastPlaying||(this.elapsed>=4096&&!this.engine.waiting)){this.elapsed=0;this.report()}
 }return true}
}
registerProcessor('guitar-pcm-gate',GuitarGateProcessor);
