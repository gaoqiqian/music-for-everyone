export function isObsoleteDraft(){return false}
export function defaultLyrics(song){const sung=['star','jacques','grace','auld'].includes(song.id);return {cues:song.phrases.map(c=>({...c})),profile:song.profile,notice:song.lyricNotice??(sung?'Cues follow performance progress':'Practice phrase cues; import your own text if desired.'),kind:sung?'Lyric cues':'Performance cues',delay:0}}
export function validateCues(cues,length){
 if(!Array.isArray(cues)||!cues.length||cues.length>200)throw Error('Provide 1–200 cue lines.');
 let previous=-Infinity;
 for(const c of cues){if(!Number.isFinite(c.beat)||c.beat<0||c.beat>=length||c.beat<=previous||typeof c.text!=='string'||!c.text.trim()||c.text.length>500)throw Error('Invalid cue time or content.');previous=c.beat}
 return cues;
}
export function lyricFrame(cues,beat,length,delay=0){
 const at=beat-delay;let index=-1;for(let i=0;i<cues.length;i++){if(cues[i].beat>at+1e-7)break;index=i}
 return {index,current:cues[index]?.text??'Intro · Get ready',next:cues[index+1]?.text??'End of this section',ended:beat>=length};
}
function recordingBeat(song,seconds){
 const b=song.recording?.boundaries;if(!b)return seconds*song.bpm/60;
 const time=seconds+b[0];let i=0;while(i+1<b.length&&time>=b[i+1])i++;
 return i===b.length-1?i:i+(time-b[i])/(b[i+1]-b[i]);
}
export function importLyrics(raw,song){
 if(typeof raw!=='string'||raw.length>30000)throw Error('Cue file too large. Import only this section.');
 const rows=[],plain=[];let offset=0;
 for(const row of raw.replace(/^\uFEFF/,'').split(/\r?\n/)){
  const offsetTag=row.match(/^\[offset:([+-]?\d+)\]$/i);if(offsetTag){offset=Number(offsetTag[1])/1000;continue}
  if(/^\[(ti|ar|al|by|re|ve):/i.test(row))continue;
  const tags=[...row.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
  const text=row.replace(/\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\]/g,'').trim();if(!text)continue;
  if(tags.length)for(const tag of tags)rows.push({seconds:Number(tag[1])*60+Number(tag[2])+Number('0.'+(tag[3]||'0')),text});else plain.push(text);
 }
 if(rows.length&&plain.length)throw Error('Use timed LRC or plain TXT lines, without mixing formats.');
 let cues;
 if(rows.length){
  rows.sort((a,b)=>a.seconds-b.seconds);cues=rows.map(c=>({beat:recordingBeat(song,Math.max(0,c.seconds+offset)),text:c.text}));
  if(cues.some(c=>c.beat>=song.length))throw Error('LRC timestamps exceed this section. Start timing from its first beat.');
 }else cues=plain.map((text,i)=>({beat:i*song.length/plain.length,text}));
 validateCues(cues,song.length);
 return {cues,kind:'Lyric cues',delay:0,notice:rows.length?'Imported LRC · Timed from the first beat':'Imported TXT · Evenly spaced cues; adjust as needed'};
}
