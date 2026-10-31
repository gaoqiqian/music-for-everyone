export function createTrackingBudget(){
 let average=0,interval=1000/30,last=-Infinity,notBefore=-Infinity;
 return {
  reset(){average=0;interval=1000/30;last=-Infinity;notBefore=-Infinity},
  get interval(){return interval},
  ready(now){return now>=notBefore&&now-last>=interval-2},
  sent(now){last=now},
  observe(milliseconds,now){if(!Number.isFinite(milliseconds)||milliseconds<=0)return;average=average?average*.75+milliseconds*.25:milliseconds;const target=Math.min(100,Math.max(1000/30,average*1.6));interval=target>interval?target:interval*.85+target*.15;if(Number.isFinite(now))notBefore=now+Math.max(5,Math.min(35,average*.45))},
  get average(){return average}
 };
}
