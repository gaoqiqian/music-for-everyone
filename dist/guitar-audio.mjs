export function createGuitarAudio(audio,destination,samples){
 const input=audio.createGain(),high=audio.createBiquadFilter(),low=audio.createBiquadFilter(),dry=audio.createGain(),room=audio.createConvolver(),wet=audio.createGain();
 high.type='highpass';high.frequency.value=65;low.type='lowpass';low.frequency.value=8200;dry.gain.value=.98;wet.gain.value=.025;
 input.connect(high);high.connect(low);low.connect(dry);dry.connect(destination);low.connect(room);room.connect(wet);wet.connect(destination);
 const impulse=audio.createBuffer(2,Math.ceil(audio.sampleRate*.32),audio.sampleRate);let seed=132;
 for(let channel=0;channel<2;channel++){const data=impulse.getChannelData(channel);for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=((seed/4294967296)*2-1)*Math.exp(-i/audio.sampleRate*14)*.35}}
 room.buffer=impulse;
 const voices=new Set(),levels=new WeakMap();
 function sampleLevel(buffer){if(!buffer?.getChannelData)return 1;if(levels.has(buffer))return levels.get(buffer);let peak=0;for(let channel=0;channel<buffer.numberOfChannels;channel++)for(const value of buffer.getChannelData(channel))peak=Math.max(peak,Math.abs(value));const level=Math.max(1,Math.min(12,.7/Math.max(.005,peak)));levels.set(buffer,level);return level}
 function release(voice,at,tail=.045){if(voice.stopped)return;voice.stopped=true;const gain=voice.gain.gain;
  if(gain.cancelAndHoldAtTime)gain.cancelAndHoldAtTime(at);else{gain.cancelScheduledValues(at);gain.setValueAtTime(Math.max(.0001,gain.value),at)}
  gain.setTargetAtTime(.0001,at,tail/3);try{voice.source.stop(at+tail+.02)}catch{}
 }
 function play({midi,delay=0,duration=.8,velocity=.6,group='guide',key='lead',pan=0}){
  if(!Number.isFinite(midi))return;const at=audio.currentTime+Math.max(0,delay),length=Math.max(.18,Math.min(2.4,duration)),gain=audio.createGain(),panner=audio.createStereoPanner();
  for(const voice of voices)if(voice.group===group&&voice.key===key&&voice.at<=at)release(voice,at,.055);
  if([...voices].filter(v=>!v.stopped).length>=8){const oldest=[...voices].find(v=>!v.stopped);if(oldest)release(oldest,audio.currentTime,.025)}
  const buffers=samples(),available=[...buffers.keys()],nearest=available.sort((a,b)=>Math.abs(a-midi)-Math.abs(b-midi))[0];let source;
  if(nearest!==undefined){source=audio.createBufferSource();source.buffer=buffers.get(nearest);source.playbackRate.value=2**((midi-nearest)/12)}else{source=audio.createOscillator();source.type='triangle';source.frequency.value=440*2**((midi-69)/12)}
  panner.pan.value=Math.max(-.3,Math.min(.3,pan));gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.005,Math.min(.9,velocity))*.68*sampleLevel(source.buffer)*(group==='auto-rhythm'?.48:1),at+(group==='auto-rhythm'?.018:.005));gain.gain.setTargetAtTime(.0001,at+length,.09);
  source.connect(gain);gain.connect(panner);panner.connect(input);const voice={source,gain,panner,group,key,at,stopped:false};voices.add(voice);
  source.onended=()=>{source.disconnect();gain.disconnect();panner.disconnect();voices.delete(voice)};source.start(at);source.stop(at+length+.45);
 }
 return {prepare(){for(const buffer of samples().values())sampleLevel(buffer)},play,stop(group){for(const voice of voices)if(!group||voice.group===group)release(voice,audio.currentTime,.025)},cancelFuture(group){for(const voice of voices)if(voice.group===group&&voice.at>audio.currentTime+.005)release(voice,audio.currentTime,.008)},get voiceCount(){return voices.size}};
}
