import {createGestureTransport} from './gesture-transport.mjs?v=32';
export function createRecordingPlayer(ctx,destination,options={}){
 let config,transport,node,pending,ready=false,revision=0,awaitReady;
 let state={position:0,time:0,waiting:false,playing:false};
 const makeNode=options.createNode??((context)=>new AudioWorkletNode(context,'guitar-pcm-gate',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2]}));
 const send=data=>node?.port.postMessage(data);
 function seconds(){if(!transport)return 0;const advance=state.playing&&!state.waiting?Math.max(0,Math.min(.12,ctx.currentTime-state.time)):0;return Math.min(transport.limit,state.position+advance)}
 function stop(){state.position=seconds();state.time=ctx.currentTime;state.playing=false;send({type:'pause'})}
 function reset(){transport?.reset();state={position:config?.boundaries[0]??0,time:ctx.currentTime,waiting:false,playing:false};send({type:'reset'})}
 return {
  get ready(){return ready},
  async load(next){
   if(config===next&&ready)return;if(config===next&&pending)return pending;
   stop();config=next;ready=false;const token=++revision;transport=createGestureTransport(next);
   pending=(async()=>{
    if(!node){if(!ctx.audioWorklet)throw Error('Low-latency audio is unavailable. Try a recent Chrome or Edge browser.');await ctx.audioWorklet.addModule('pcm-gate-worklet.mjs?v=32');node=makeNode(ctx);const gain=ctx.createGain();gain.gain.value=.85;node.connect(gain);gain.connect(destination);
     node.port.onmessage=({data})=>{if(data.revision!==revision)return;if(data.type==='ready')awaitReady?.();else if(data.type==='position')state={position:data.position,time:data.time,waiting:data.waiting,playing:data.playing}};
     node.onprocessorerror=()=>{ready=false;stop();options.onError?.('Audio processing failed. Please reload.')};
    }
    const response=await (options.fetchAudio??fetch)(next.url);if(!response.ok)throw Error('Could not load the guitar track. Please try again.');
    const buffer=await ctx.decodeAudioData(await response.arrayBuffer());if(token!==revision)return;
    const channels=Array.from({length:Math.min(2,buffer.numberOfChannels)},(_,i)=>buffer.getChannelData(i).slice());
    await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Audio preparation timed out. Please reload.')),10000);awaitReady=()=>{clearTimeout(timeout);resolve()};node.port.postMessage({type:'load',channels,start:next.boundaries[0],revision:token},channels.map(c=>c.buffer))});
    if(token===revision){ready=true;reset()}
   })().finally(()=>{pending=null});return pending;
  },
  canStroke(now=ctx.currentTime){return ready&&transport.canStroke(now,seconds())},
  play(index){if(!ready)throw Error('Load the guitar track first.');if(index===0&&transport.lastIndex>=0)reset();const event=transport.stroke(index,ctx.currentTime,seconds());if(!event)return null;state.position=seconds();state.time=ctx.currentTime;state.playing=true;state.waiting=false;send({type:'grant',limit:event.limit});return event},
  resume(){if(ready){state.time=ctx.currentTime;state.playing=true;send({type:'resume'})}},
  position(){if(!ready)return null;const beat=transport.beatAt(seconds());return {beat,waiting:state.waiting,ended:beat>=config.boundaries.length-1-.002,period:transport.period}},
  stop,reset
 };
}
