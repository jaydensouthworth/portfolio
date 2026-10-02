const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const code=fs.readFileSync(require('path').join(__dirname,'../dist/shared/work-disclosure.js'),'utf8');
let checks=0;
function setup(width=400,height=609,isCoarse=true){
 const events={},observers=[];
 let active=null,dialog=false;
 class E{
  constructor(){this.attrs={};this.dataset={};this.hidden=false;this.listeners={};this.children={};this.members=new Set();}
  addEventListener(k,f){this.listeners[k]=f;}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}
  contains(e){return this===e||this.members.has(e);}querySelector(q){return this.children[q]??(this.children[q]=new E());}
  focus(o){assert.equal(this.hidden,false,'Cannot restore focus to hidden control');active=this;this.focusOptions=o;}
 }
 const work=new E(),sheet=new E(),dock=new E(),toggle=new E(),rail=new E(),hint=new E(),footer=new E(),menu=new E(),body=new E(),title=new E(),inside=new E(),chip=new E(),continueButton=new E();
 dock.hidden=true;sheet.children.h2=title;sheet.members.add(inside);dock.members.add(toggle);dock.members.add(chip);footer.members.add(continueButton);
 body.reduced=false;body.classList={contains:()=>body.reduced};
 const viewport={clientHeight:height},coarse={matches:isCoarse,addEventListener:(k,f)=>events.coarse=f};
 const map={'#work':work,'#work-folio':sheet,'.work-dock':dock,'.work-disclosure':toggle,'.work-project-rail':rail,'.work-dock-hint':hint,'.work-dock-footer':footer,'#viewport-unit':viewport,'.nav-toggle':menu};
 const document={body,get activeElement(){return active;},querySelector:q=>q==='dialog[open]'?dialog:map[q],addEventListener:(k,f)=>events[k]=f};
 const ctx={document,window:{visualViewport:{addEventListener:(k,f)=>events.visualResize=f}},innerWidth:width,innerHeight:height,location:{hash:'#work'},matchMedia:()=>coarse,addEventListener:(k,f)=>events[k]=f,MutationObserver:class{constructor(f){this.f=f;}observe(el,opts){observers.push({el,f:this.f,opts});}}};
 vm.runInNewContext(code,ctx);
 return{ctx,document,work,sheet,dock,toggle,rail,hint,footer,menu,body,title,inside,chip,continueButton,coarse,viewport,events,observers,setFocus:e=>active=e,getFocus:()=>active,setDialog:v=>dialog=v,notify:el=>observers.filter(o=>o.el===el).forEach(o=>o.f())};
}
for(const [w,h,c,compact]of [[400,609,true,true],[320,568,false,true],[844,390,true,true],[844,390,false,false],[1180,757,false,false]]){
 const t=setup(w,h,c);assert.equal(t.work.dataset.workCompact,String(compact));assert.equal(t.sheet.hidden,compact);assert.equal(t.dock.hidden,!compact);checks++;
 if(!compact)continue;
 assert.equal(t.rail.hidden,false);assert.equal(t.toggle.attrs['aria-expanded'],'false');
 t.toggle.listeners.click();assert.equal(t.sheet.hidden,false);assert.equal(t.rail.hidden,true);assert.equal(t.footer.hidden,false);assert.equal(t.toggle.attrs['aria-expanded'],'true');checks++;
 const esc={key:'Escape',preventDefault(){this.prevented=true;}};t.setDialog(true);t.events.keydown(esc);assert.equal(t.sheet.hidden,false);assert(!esc.prevented);t.setDialog(false);checks++;
 t.menu.setAttribute('aria-expanded','true');t.events.keydown(esc);assert.equal(t.sheet.hidden,false);t.menu.setAttribute('aria-expanded','false');checks++;
 t.setFocus(t.inside);t.events.keydown(esc);assert(esc.prevented);assert.equal(t.getFocus(),t.toggle);assert.equal(t.sheet.hidden,true);assert.equal(t.rail.hidden,false);checks++;
 t.toggle.listeners.click();t.work.setAttribute('aria-hidden','true');t.notify(t.work);assert.equal(t.sheet.hidden,true);assert.equal(t.toggle.attrs['aria-expanded'],'false');checks++;
 t.work.setAttribute('aria-hidden','false');t.body.reduced=true;t.notify(t.body);assert.equal(t.sheet.hidden,false);assert.equal(t.dock.hidden,true);assert.equal(t.work.attrs['aria-labelledby'],'work-title');checks++;
 t.body.reduced=false;t.notify(t.body);assert.equal(t.sheet.hidden,true);t.toggle.listeners.click();t.events.popstate();assert.equal(t.sheet.hidden,true);checks++;
 t.toggle.listeners.click();t.setFocus(t.continueButton);t.ctx.innerWidth=1180;t.viewport.clientHeight=757;t.events.resize();assert.equal(t.getFocus(),t.title);assert.equal(t.sheet.hidden,false);assert.equal(t.dock.hidden,true);assert.equal(t.getFocus().focusOptions.preventScroll,true);checks++;
 t.setFocus(t.inside);t.ctx.innerWidth=320;t.events.resize();assert.equal(t.getFocus(),t.toggle);assert.equal(t.toggle.attrs.tabindex,undefined);assert.equal(t.dock.hidden,false);checks++;
 assert(!('touchstart' in t.events)&&!('wheel' in t.events)&&!('pointermove' in t.events),'Disclosure must not intercept native travel');checks++;
}
console.log(JSON.stringify({checks,result:'passed',scope:'Disclosure lifecycle and focus; not physical touch or browser layout'}));
