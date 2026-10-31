let detector;
async function initialize(){try{
 const {FilesetResolver,HandLandmarker}=await import('./assets/vision_bundle.mjs');
 const files=await FilesetResolver.forVisionTasks('./assets/wasm');
 detector=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'./assets/hand_landmarker.task'},runningMode:'VIDEO',numHands:new URL(self.location.href).searchParams.get('hands')==='2'?2:1,minHandDetectionConfidence:.45,minHandPresenceConfidence:.45,minTrackingConfidence:.45});
 postMessage({type:'ready'});
}catch(error){postMessage({type:'error',message:error.message})}}
initialize();
onmessage=event=>{const {bitmap,timestamp,epoch}=event.data;if(!bitmap)return;try{
 const started=performance.now(),result=detector.detectForVideo(bitmap,timestamp),durationMs=performance.now()-started;
 postMessage({type:'result',result:{landmarks:result.landmarks,handedness:result.handedness},timestamp,epoch,durationMs});
}catch(error){postMessage({type:'error',message:error.message,epoch})}finally{bitmap.close()}};
