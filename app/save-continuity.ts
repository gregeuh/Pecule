import {motionSettings} from './ui-motion';

/** Only called for a confirmed server save (or the explicit demonstration). */
export async function confirmedTransfer(){
 const root=document.querySelector<HTMLElement>('.transfer-preview');
 if(!root||matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden)return;
 const timing=motionSettings(root),cards=root.querySelectorAll<HTMLElement>('.transfer-account'),token=root.querySelector<HTMLElement>('.transfer-token');
 const animations=[...cards].map((card,index)=>card.animate([{transform:'none'},{transform:`translateY(${index? -3:3}px) rotate(${index?1:-1}deg)`,offset:.3},{transform:'none'}],{duration:520,easing:timing.ease}));
 if(token)animations.push(token.animate([{opacity:0,transform:'translateY(-14px) scale(.7)'},{opacity:1,offset:.15},{opacity:1,offset:.8},{opacity:0,transform:'translateY(14px) scale(.7)'}],{duration:520,easing:timing.ease}));
 const stop=()=>animations.forEach(animation=>animation.cancel());
 const media=matchMedia('(prefers-reduced-motion: reduce)');media.addEventListener('change',stop);document.addEventListener('visibilitychange',stop);window.addEventListener('resize',stop);
 try{await Promise.allSettled(animations.map(animation=>animation.finished));}finally{stop();media.removeEventListener('change',stop);document.removeEventListener('visibilitychange',stop);window.removeEventListener('resize',stop);}
}

/** Hand off to an already visible journal row; never scroll or change a filter. */
export function operationToJournal(id:string,origin:DOMRect|undefined){
 if(!origin||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const started=performance.now();
 const attempt=()=>{
  if(document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(document.querySelector('[role="dialog"]')){if(performance.now()-started<900)requestAnimationFrame(attempt);return;}
  const row=document.querySelector<HTMLElement>(`[data-operation-id="${CSS.escape(id)}"] > button`);
  if(!row||typeof row.animate!=='function')return;
  const rect=row.getBoundingClientRect();if(rect.top<0||rect.bottom>innerHeight-80||!rect.width)return;
  const copy=row.cloneNode(true) as HTMLElement;copy.removeAttribute('id');copy.setAttribute('aria-hidden','true');copy.setAttribute('inert','');copy.className+=' operation-flight';
  Object.assign(copy.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});document.body.append(copy);
  const dx=Math.max(8-rect.left,Math.min(innerWidth-rect.right-8,origin.left-rect.left)),dy=Math.max(8-rect.top,Math.min(innerHeight-rect.bottom-80,Math.max(-180,Math.min(180,origin.top-rect.top))));
  const animation=copy.animate([{opacity:.5,transform:`translate(${dx}px,${dy}px) scale(.94)`},{opacity:1,transform:'none',offset:.8},{opacity:0,transform:'none'}],{duration:440,easing:motionSettings(row).ease});
  const stop=()=>{animation.cancel();copy.remove();};const media=matchMedia('(prefers-reduced-motion: reduce)');media.addEventListener('change',stop);window.addEventListener('resize',stop);document.addEventListener('visibilitychange',stop);document.addEventListener('pointerdown',stop,true);document.addEventListener('keydown',stop,true);
  void animation.finished.catch(()=>{}).finally(()=>{copy.remove();media.removeEventListener('change',stop);window.removeEventListener('resize',stop);document.removeEventListener('visibilitychange',stop);document.removeEventListener('pointerdown',stop,true);document.removeEventListener('keydown',stop,true);});
 };
 requestAnimationFrame(attempt);
}
