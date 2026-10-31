const TUNING=[40,45,50,55,59,64];
const VOICINGS={Bb:[-1,1,3,3,3,1],'F#m':[2,4,4,2,2,2],B7:[-1,2,1,2,0,2],G7:[3,2,0,0,0,1],C:[-1,3,2,0,1,0],G:[3,2,0,0,0,3],Am:[-1,0,2,2,1,0],F:[1,3,3,2,1,1],Em:[0,2,2,0,0,0],Dm:[-1,-1,0,2,3,1],D:[-1,-1,0,2,3,2],Bm7:[-1,2,4,2,3,2],Em7:[0,2,0,0,3,0],Am7:[-1,0,2,0,1,0],Cmaj7:[-1,3,2,0,0,0],Bm:[-1,2,4,4,3,2],'D/C':[-1,3,0,2,3,2],'C/D':[-1,-1,0,0,1,0],'F/G':[3,-1,3,2,1,1],C6:[-1,3,2,2,1,0],'D7/F#':[2,-1,0,2,1,2],'G/B':[-1,2,0,0,3,3],'A/E':[0,0,2,2,2,0],A7:[-1,0,2,0,2,0],'A/G':[3,-1,2,2,2,0],Gmaj7:[3,2,0,0,0,2],A:[-1,0,2,2,2,0],Bm7b5:[-1,2,3,2,3,-1],D7:[-1,-1,0,2,1,2],'G/D':[-1,-1,0,0,0,3],D6:[-1,-1,0,2,0,2],Db:[-1,4,6,6,6,4],Ab:[4,6,6,5,4,4],'Eb/Db':[-1,4,1,3,4,3],Cm7:[-1,3,5,3,4,3],Fm:[1,3,3,1,1,1],Bbm7:[-1,1,3,1,2,1],Fm7:[1,3,1,1,1,1],Eb7:[-1,6,8,6,8,6],Abmaj7:[4,-1,5,5,4,-1]};
const FLAT_NAMES=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
export function chordSpec(symbol){
 const id=symbol==='C#'?'Db':symbol,frets=VOICINGS[id];if(!frets)return null;
 const notes=frets.flatMap((f,i)=>f<0?[]:[TUNING[i]+f]);
 return {id,name:id.includes('/')?id+' · 分数chord':id+' chord',feel:'歌曲chord',notes,frets:[...frets],display:[...new Set(notes.map(n=>FLAT_NAMES[n%12]))].join(' · ')};
}
export const SONG_CHORDS=Object.keys(VOICINGS).map(chordSpec);
export function validateProfile(profile){
 if(profile?.videoId!=='xwO1oAwxt4c'||!Number.isFinite(profile.duration)||profile.duration<190||profile.duration>205||!Array.isArray(profile.segments)||profile.segments.length<1)throw new Error('chord时间轴与当前伴奏版本不匹配');
 let previous=-1;for(const event of profile.segments){if(!Number.isFinite(event.time)||event.time<0||event.time<=previous||event.time>=profile.duration||!chordSpec(event.chord))throw new Error('chord时间轴包含无效事件');previous=event.time}
 return {...profile,segments:profile.segments.map(event=>({...event,chord:chordSpec(event.chord).id}))};
}
export function harmonyAt(profile,seconds,{offset=0,videoId,duration}={}){
 if(!profile||videoId!==profile.videoId||(duration>0&&Math.abs(duration-profile.duration)>1.5))return {available:false,reason:'version'};
 const at=seconds+offset;if(at<profile.segments[0].time)return {available:false,reason:'intro',next:profile.segments[0].chord,until:profile.segments[0].time-seconds-offset};
 if(at>=profile.duration)return {available:false,reason:'ended'};
 let lo=0,hi=profile.segments.length-1;
 while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(profile.segments[mid].time<=at)lo=mid;else hi=mid-1}
 const event=profile.segments[lo],next=profile.segments[lo+1];
 return {available:true,index:lo,chord:event.chord,next:next?.chord||'—',start:event.time,end:next?.time||profile.duration,until:(next?.time||profile.duration)-at,progress:Math.max(0,Math.min(1,(at-event.time)/((next?.time||profile.duration)-event.time))),section:at>=147.115?'后段 · Ab 调':at>=104.405?'段落 C':at>=73.13?'段落 B':at>=45.525?'段落 A':'前奏 / 主歌',reference:true};
}
