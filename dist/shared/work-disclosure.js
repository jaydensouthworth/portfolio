/* A native horizontal project rail leaves mobile vertical travel unobstructed. */
(() => {
 'use strict';
 const work=document.querySelector('#work'),sheet=document.querySelector('#work-folio'),dock=document.querySelector('.work-dock'),toggle=document.querySelector('.work-disclosure'),rail=document.querySelector('.work-project-rail'),hint=document.querySelector('.work-dock-hint'),footer=document.querySelector('.work-dock-footer');
 if(!work||!sheet||!dock||!toggle||!rail||!footer)return;
 const coarse=matchMedia('(pointer: coarse)'),viewport=document.querySelector('#viewport-unit');
 let expanded=false,compact=false;
 const isCompact=()=>!document.body.classList.contains('reduced')&&(innerWidth<=760||(coarse.matches&&(viewport?.clientHeight||innerHeight)<=560));
 function apply(){
  const next=isCompact(),focus=document.activeElement;let restoreFocus=null;
  if(next!==compact){
   expanded=false;
   if(!next&&(dock.contains(focus)||footer.contains(focus)))restoreFocus=sheet.querySelector('h2');
   else if(next&&sheet.contains(focus))restoreFocus=toggle;
  }
  compact=next;
  work.dataset.workCompact=String(compact);work.dataset.workExpanded=String(compact&&expanded);
  work.setAttribute('aria-labelledby',compact?'work-dock-title':'work-title');
  dock.hidden=!compact;sheet.hidden=compact&&!expanded;rail.hidden=!compact||expanded;hint.hidden=!compact||expanded;footer.hidden=!compact||!expanded;
  toggle.setAttribute('aria-expanded',String(compact&&expanded));
  toggle.setAttribute('aria-label',expanded?'Collapse project folio':'Expand full project folio');
  toggle.querySelector('span').textContent=expanded?'Collapse':'Expand';toggle.querySelector('i').textContent=expanded?'−':'+';
  if(restoreFocus){if(restoreFocus!==toggle)restoreFocus.setAttribute('tabindex','-1');restoreFocus.focus({preventScroll:true});}
 }
 function collapse(focus=false){if(focus)toggle.focus({preventScroll:true});expanded=false;apply();}
 toggle.addEventListener('click',()=>{expanded=!expanded;apply();});
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||!compact||!expanded||document.querySelector('dialog[open]')||document.querySelector('.nav-toggle')?.getAttribute('aria-expanded')==='true')return;
  event.preventDefault();collapse(true);
 },{capture:true});
 // A mode change exposes the full document; revisiting the realm starts compact.
 new MutationObserver(()=>apply()).observe(document.body,{attributes:true,attributeFilter:['class']});
 new MutationObserver(()=>{if(work.getAttribute('aria-hidden')==='true')collapse();}).observe(work,{attributes:true,attributeFilter:['aria-hidden']});
 addEventListener('resize',apply,{passive:true});window.visualViewport?.addEventListener('resize',apply,{passive:true});coarse.addEventListener('change',apply);
 addEventListener('popstate',()=>collapse());addEventListener('hashchange',()=>{if(location.hash!=='#work')collapse();});
 apply();
})();
