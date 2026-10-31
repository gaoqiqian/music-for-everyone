import {defaultLyrics,isObsoleteDraft,validateCues,lyricFrame,importLyrics} from './lyric-cues.mjs?v=43';
export function createSingAlong({getSong,getPosition,onChange,toast,storage}){
 try{if(storage===undefined)storage=globalThis.localStorage}catch{storage=null}
 const $=id=>document.getElementById(id);let songId,model,lastFrameKey='';
 const key=()=>`air-duet-lyrics:en:v1:${songId}`;
 function save(){try{storage?.setItem(key(),JSON.stringify(model))}catch{toast('Calibration works for this session, but browser storage is unavailable.')}}
 function configure(){
  const song=getSong();if(songId===song.id)return;
  songId=song.id;model=defaultLyrics(song);try{const saved=JSON.parse(storage?.getItem(key())??'null');if(saved&&!isObsoleteDraft(song,saved)){validateCues(saved.cues,song.length);if(!Number.isFinite(saved.delay)||Math.abs(saved.delay)>song.length||typeof saved.notice!=='string')throw Error();model=saved}}catch{}
  lastFrameKey='';$('lyricAnchor').replaceChildren();model.cues.forEach((c,i)=>{const option=document.createElement('option');option.value=i;option.textContent=c.text;$('lyricAnchor').append(option)});
 }
 function changed(){save();lastFrameKey='';onChange()}
 $('lyricEarlier').onclick=()=>{configure();model.delay=Math.min(getSong().length,model.delay+.5);changed()};
 $('lyricLater').onclick=()=>{configure();model.delay=Math.max(-getSong().length,model.delay-.5);changed()};
 $('lyricAnchorNow').onclick=()=>{configure();const cue=model.cues[Number($('lyricAnchor').value)];model.delay=Math.max(-getSong().length,Math.min(getSong().length,getPosition().beat-cue.beat));changed();toast('This cue now starts at the current position.')};
 $('lyricReset').onclick=()=>{try{storage?.removeItem(key())}catch{}songId=null;configure();onChange();toast('Default cues restored.')};
 $('lyricFile').onchange=async()=>{const file=$('lyricFile').files[0];if(!file)return;try{if(file.size>128000)throw Error('File too large. Import only the current section.');const next=importLyrics(await file.text(),getSong());configure();model=next;save();songId=null;configure();onChange();toast('Cues imported. They will follow your performance.')}catch(e){toast(e.message)}finally{$('lyricFile').value=''}};
 $('lyricOpen').onclick=()=>{$('lyricSettings').open=true;$('lyricSettings').scrollIntoView({block:'nearest',behavior:'smooth'})};
 function update(position,{playing=false,demo=false,gesture='sweep'}={}){
  configure();const song=getSong(),frame=lyricFrame(model.cues,position.beat,song.length,model.delay);
  const status=position.count?`Count-in  ${position.count}`:frame.ended?'Section finished':demo?'Demo sing-along':playing?position.waiting?(gesture==='fist-open'?'Waiting for your palm opening · Cues paused':'Waiting for your downstroke · Cues paused'):'Sing with the guitar':position.beat>0?'Paused':'Ready to sing';
  const frameKey=`${songId}|${frame.index}|${status}|${model.delay}|${model.notice}`;
  if(frameKey===lastFrameKey)return;lastFrameKey=frameKey;
  $('phrase').textContent=frame.current;$('lyricNext').textContent=`Next: ${frame.next}`;
  $('lyricState').textContent=`${status} · ${Math.max(1,frame.index+1)}/${model.cues.length}`;
  $('lyricNotice').textContent=model.notice;$('lyricOffset').textContent=model.delay===0?'No lyric offset':`Lyric cues${model.delay>0?'later by':'earlier by'} ${Math.abs(model.delay).toFixed(1)} beat`;
 }
 return {update};
}
