import {CHORD_CHOICES} from './chord-controls.mjs?v=41';
import {chordAt} from './song-session.mjs?v=39';

// Coach the next accepted stroke, rather than waiting for the audio clock to
// finish the preceding beat. The guide never advances the performance itself.
export function coachFrame({song,nextBeat,selected,camera=false,right=false,calibrated=false,armed=true,number=null,left=false,demo=false,beat=0,gesture='sweep',pose='unknown',recentHit=false}){
 const ended=nextBeat>=song.length,clockAt=Math.max(0,Math.min(song.length-1e-6,demo?beat:nextBeat));
 const at=demo?(song.strokeBeats?.filter(b=>b<=clockAt+1e-7).at(-1)??Math.floor(clockAt)):clockAt;
 const choices=song.choices??CHORD_CHOICES;
 const target=chordAt(song,at),digit=choices.indexOf(target.chord)+1,nextDigit=choices.indexOf(target.next)+1;
 const targetEnd=song.chords.find(c=>c.beat>at)?.beat??song.length;
 const remaining=song.strokeBeats?song.strokeBeats.filter(b=>b>=at&&b<targetEnd).length:targetEnd-at,correct=selected===target.chord;
 const duration=(song.strokeBeats?.find(b=>b>at)??at+1)-at;
 const label=chord=>song.groupNames?.[chord]??chord;
 const cue=ended?'Section complete':demo?`Demo: ${label(target.chord)}`:correct?`Show ${digit} · ${label(target.chord)} ✓`:`${song.assisted?'Change group':'Change chord'}: show ${digit} · ${label(target.chord)}`;
 const preview=ended?'Press Reset to play again':target.next==='End'?`Final ${remaining} strokes`:`${remaining<=(song.beginner?4:2)?'Play  '+remaining+' more →':song.beginner?'Keep holding · Next →':'Next →'} Show ${nextDigit} · ${label(target.next)}`;
 const finger=number&&choices[number-1]&&choices[number-1]!==selected?`Detected ${number} · Hold briefly`:left?`Selected ${choices.indexOf(selected)+1} · Selection stays when you release`:`Selected ${choices.indexOf(selected)+1} · Left hand on the left side`;
 let action=gesture==='fist-open'?(armed?'🖐 Open to play':'✊ Close to prepare'):'↓ Strum down',detail=gesture==='fist-open'?(armed?'Open naturally; no need to straighten all five fingers.':'Close your palm gently for the next beat.'):duration<1?'Half beat here · Continue a little sooner.':'Strum with the beat; guitar accents are handled for you.';
 if(ended){action='✓ Section complete';detail='Press Reset to start again'}
 else if(demo){action='♫ Demo playing';detail='Listen first, then try strumming.'}
 else if(!camera){action='Start camera';detail='Or click chord cards and press Space.'}
 else if(!right){action='Right hand to the right side';detail='Keep your whole palm in view.'}
 else if(!calibrated&&gesture!=='fist-open'){action='Hold your right hand still for 1 second.';detail='Wait for calibration before strumming.'}
 else if(!correct){action=song.assisted?'Choose this group first':'Choose this chord first';detail=(song.beginner||song.guided)?`No rush. Choose ${digit}, then ${gesture==='fist-open'?'close → open':'strum'}. The music waits for you.`:`Left hand: show ${digit}, choose ${target.chord} then ${gesture==='fist-open'?'close → open':'strum down'}`}
 else if(!armed&&gesture!=='fist-open'){action='↑ Raise to prepare';detail='Raise your hand, then strum down.'}
 return {gesture,pose,recentHit,armed,right,camera,calibrated,target:target.chord,next:target.next,digit,nextDigit,remaining,correct,cue,preview,finger,action,detail,word:target.word??'',duration,step:ended?song.meter:Math.floor(at)%song.meter};
}

export function centerPrompt(frame){
 if(frame.action==='✓ Section complete')return {label:'Section complete',chord:'✓',digit:'Press Reset to play again',status:'',next:''};
 const fist=frame.gesture==='fist-open';
 const status=fist?(frame.camera&&!frame.right?'Bring your right hand to the right side.':frame.recentHit?'✓ Played once · Close to prepare again':frame.armed?'🖐 Open your right hand once to play':'✊ Close your right hand for the next beat'): 'Hold the chord · Strum down with your right hand';
 return {label:frame.correct?'Use this chord now':'Change to this chord',chord:frame.target,digit:`Left hand: show ${frame.digit}`,status:frame.correct?status:fist?'Choose a chord, then close → open':'Choose, then strum · The music waits',next:frame.next==='End'?`Final ${frame.remaining} strokes`:frame.remaining<=2?`Play  ${frame.remaining} more → ${frame.next} · Show ${frame.nextDigit}`:`Next ${frame.next} · Show ${frame.nextDigit}`};
}

export function createStageCoach(root){
 root.innerHTML=`<div class="coach-center" aria-label="Center chord guide"><small class="center-label"></small><strong class="center-chord" aria-live="polite"></strong><span class="center-digit"></span><span class="center-status"></span><span class="center-next"></span><span class="center-confirm" aria-hidden="true">✓ Chord ready</span></div><div class="coach-choices"><small>Left hand · Choose chord number</small><div class="coach-list">${CHORD_CHOICES.map((chord,i)=>`<button data-chord="${chord}" aria-label="Choose ${chord} chord"><span>${i+1}</span><b>${chord}</b><i></i></button>`).join('')}</div><span class="coach-finger"></span><small class="coach-six">Show 1–5 fingers · 6 🤙</small></div><div class="coach-cue"><small>Use this chord on the next stroke</small><strong></strong><span></span><span class="coach-word"></span><small class="coach-time"></small><div class="coach-dots" aria-label="Progress in this bar">${[1,2,3,4].map(i=>`<i>${i}</i>`).join('')}</div></div><div class="coach-action"><strong></strong><span></span></div>`;
 const $=s=>root.querySelector(s),text=(s,value)=>{const el=$(s);if(el.textContent!==value)el.textContent=value};
 let lastKey='',choicesKey='',previousCorrect=true,previousTarget='',confirmation;
 return {update(state){const choices=state.song.choices??CHORD_CHOICES,nextChoices=choices.join('|');if(nextChoices!==choicesKey){choicesKey=nextChoices;$('.coach-list').innerHTML=choices.map((chord,i)=>`<button data-chord="${chord}" aria-label="Choose ${state.song.groupNames?.[chord]??chord+' chord'}"><span>${i+1}</span><b>${state.song.groupNames?.[chord]??chord}</b><i></i></button>`).join('');text('.coach-six',choices.length===2?'Two chord choices · Four beats each':state.song.beginner?'Use 1 and 2 · Two phrases per group':'Show 1–5 fingers · 6 🤙');lastKey='';}const f=coachFrame(state),key=JSON.stringify({...f,selected:state.selected});if(key===lastKey)return;lastKey=key;
 const center=centerPrompt(f);if(state.demo){center.label='Demo playing';center.status='Follow the guide and listen';}text('.center-label',center.label);root.classList.toggle('fist-input',state.gesture==='fist-open');text('.center-chord',center.chord);text('.center-digit',center.digit);text('.center-status',center.status);text('.center-next',state.gesture==='fist-open'?center.next.replaceAll('strokes','palm openings').replaceAll('Play ','Play '):center.next);if(f.correct&&!previousCorrect&&previousTarget===f.target){confirmation?.cancel();confirmation=$('.center-confirm').animate([{opacity:1},{opacity:1,offset:.7},{opacity:0}],{duration:1100,fill:'forwards'});}previousCorrect=f.correct;previousTarget=f.target;
 text('.coach-cue>small',state.song.assisted?(state.demo?'Demo chord group':'Keep this group for the next stroke'):state.demo?'Demo uses this chord':state.gesture==='fist-open'?'Use this chord on the next palm opening':'Use this chord on the next stroke');text('.coach-cue strong',f.cue);text('.coach-cue>span',state.gesture==='fist-open'?f.preview.replaceAll('strokes','palm openings').replaceAll('Play ','Play '):f.preview);text('.coach-word',f.word?((state.song.beginner||state.song.relaxed||state.song.practice)?'Cue: ':'Sing: ')+(state.gesture==='fist-open'?f.word.replaceAll('play all','play all'):f.word):'');text('.coach-time',state.nextBeat>=state.song.length?'Section complete':`${state.gesture==='fist-open'?'This palm opening':'This stroke'}：${f.duration<1?'Half beat':'1 beat'}`);text('.coach-finger',f.finger);text('.coach-action strong',f.action);text('.coach-action span',f.detail);
 root.classList.toggle('needs-change',!f.correct);root.classList.toggle('change-soon',f.remaining<=(state.song.beginner?4:2));
 for(const row of root.querySelectorAll('.coach-list button')){const active=row.dataset.chord===state.selected,target=row.dataset.chord===f.target;row.classList.toggle('selected',active);row.classList.toggle('target',target);row.setAttribute('aria-pressed',String(active));row.querySelector('i').textContent=active?'✓':target?'Choose':'';}
 [...root.querySelectorAll('.coach-dots i')].forEach((el,i)=>{el.classList.toggle('done',i<f.step);el.classList.toggle('current',i===f.step);});
 return f;
 }};
}
