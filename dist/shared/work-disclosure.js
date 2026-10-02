/* Native horizontal folio. Vertical gestures remain entirely browser-owned. */
(() => {
 'use strict';
 const work=document.querySelector('#work'),sheet=document.querySelector('#work-folio'),book=document.querySelector('.work-book'),track=document.querySelector('.work-project-pages');
 if(!work||!sheet||!book||!track)return;
 const coarse=matchMedia('(pointer: coarse)'),viewport=document.querySelector('#viewport-unit'),counter=book.querySelector('.work-page-count'),buttons=[...book.querySelectorAll('[data-work-page]')];
 const projects=[...track.querySelectorAll('.work-spread')].map(element=>({element,name:element.querySelector('h3').textContent,blocks:[...element.querySelector('.work-page-flow').children].map(node=>({node,text:node.textContent,controls:node.classList.contains('work-page-actions')?[...node.children]:null}))}));
 let compact=false,step=1,total=projects.length,frame=0,layoutWidth=0,layoutHeight=0,lastReport='',counts=projects.map(()=>1);
 const isCompact=()=>!document.body.classList.contains('reduced')&&(innerWidth<=760||(coarse.matches&&(viewport?.clientHeight||innerHeight)<=560));
 const pageIndex=()=>Math.max(0,Math.min(total-1,Math.round(track.scrollLeft/step)));
 function report(){const index=pageIndex(),label=`${index+1} / ${total}`;if(label===lastReport)return;lastReport=label;counter.textContent=label;for(const button of buttons)button.setAttribute('aria-disabled',String(Number(button.dataset.workPage)<0?index===0:index===total-1));}
 function layout(){
  frame=0;if(!compact)return;
  book.dataset.shortFrame=String((viewport?.clientHeight||innerHeight)<=450||parseFloat(getComputedStyle(document.documentElement).fontSize)>20);
  if(!track.clientWidth||!track.clientHeight)return;
  const width=Math.max(1,track.clientWidth-4),height=track.clientHeight;
  if(width===layoutWidth&&height===layoutHeight)return;
  let local=pageIndex(),projectIndex=0;while(projectIndex<counts.length-1&&local>=counts[projectIndex]){local-=counts[projectIndex];projectIndex++;}
  const focused=track.contains(document.activeElement)?document.activeElement:null;
  layoutWidth=width;layoutHeight=height;step=width+24;total=0;counts=[];
  book.style.setProperty('--page-width',`${width}px`);
  for(const project of projects){
   project.element.replaceChildren();let pages=[],page,contentCount=0;
   const fits=()=>page.scrollHeight<=page.clientHeight+1&&page.scrollWidth<=page.clientWidth+1;
   function nextPage(){page=document.createElement('div');page.className='work-page-flow';project.element.append(page);pages.push(page);contentCount=0;if(pages.length>1){const label=document.createElement('p');label.className='work-continuation';label.textContent=project.name;page.append(label);}}
   nextPage();
   function append(node){page.append(node);if(fits()){contentCount++;return true;}node.remove();return false;}
   function textPages(block){
    const words=block.text.trim().split(/\s+/);let offset=0;
    while(offset<words.length){
     const part=block.node.cloneNode(false);part.removeAttribute('id');page.append(part);let end=offset;
     while(end<words.length){part.textContent=words.slice(offset,end+1).join(' ');if(!fits())break;end++;}
     if(end===offset){part.remove();if(contentCount){nextPage();continue;} // At least one line fits in supported portal sizes.
      part.textContent=words[offset];page.append(part);end=offset+1;
     }else part.textContent=words.slice(offset,end).join(' ');
     contentCount++;offset=end;if(offset<words.length)nextPage();
    }
   }
   for(const block of project.blocks){
    if(block.controls)block.node.replaceChildren(...block.controls);
    if(append(block.node))continue;
    if(contentCount)nextPage();
    if(append(block.node))continue;
    if(block.controls){
     let row=block.node.cloneNode(false);page.append(row);
     for(const control of block.controls){row.append(control);if(!fits()){control.remove();if(row.children.length||contentCount){if(!row.children.length)row.remove();nextPage();row=block.node.cloneNode(false);page.append(row);}else page.dataset.tight='true';row.append(control);} }
     contentCount++;
    }else if(block.node.matches('p'))textPages(block);
    else { // A display heading is bounded independently of enlarged body copy.
     page.append(block.node);contentCount++;
    }
   }
   project.element.style.flexBasis=`${pages.length*step-24}px`;counts.push(pages.length);total+=pages.length;
  }
  let index=counts.slice(0,projectIndex).reduce((a,b)=>a+b,0)+Math.min(local,counts[projectIndex]-1);
  const visiblePages=[...track.querySelectorAll('.work-page-flow')],focusedPage=focused?.closest('.work-page-flow'),focusedIndex=visiblePages.indexOf(focusedPage);if(focusedIndex>=0)index=focusedIndex;
  book.dataset.pageOverflow=String(visiblePages.some(page=>page.scrollHeight>page.clientHeight+1||page.scrollWidth>page.clientWidth+1));
  track.scrollTo({left:index*step,behavior:'instant'});if(focused?.isConnected)focused.focus({preventScroll:true});report();
 }
 function queueLayout(force=false){if(force){layoutWidth=0;layoutHeight=0;}if(!frame)frame=requestAnimationFrame(layout);}
 function apply(){
  const next=isCompact(),focus=document.activeElement;let destination=null;
  if(next!==compact){if(!next&&book.contains(focus))destination=sheet.querySelector('h2');else if(next&&sheet.contains(focus))destination=book.querySelector('h2');}
  compact=next;work.dataset.workCompact=String(compact);delete work.dataset.workExpanded;
  work.setAttribute('aria-labelledby',compact?'work-dock-title':'work-title');book.hidden=!compact;sheet.hidden=compact;
  if(destination){destination.setAttribute('tabindex','-1');destination.focus({preventScroll:true});}queueLayout();
 }
 function move(delta){if(!compact)return;const index=Math.max(0,Math.min(total-1,pageIndex()+delta));track.scrollTo({left:index*step,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 for(const button of buttons)button.addEventListener('click',()=>move(Number(button.dataset.workPage)));
 track.addEventListener('scroll',report,{passive:true});
 track.addEventListener('keydown',event=>{if(event.target!==track||event.altKey||event.ctrlKey||event.metaKey)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}});
 new MutationObserver(apply).observe(document.body,{attributes:true,attributeFilter:['class']});
 new ResizeObserver(()=>queueLayout()).observe(track);
 addEventListener('resize',apply,{passive:true});window.visualViewport?.addEventListener('resize',apply,{passive:true});coarse.addEventListener('change',apply);
 document.fonts?.ready.then(()=>queueLayout(true));document.fonts?.addEventListener?.('loadingdone',()=>queueLayout(true));apply();
})();
