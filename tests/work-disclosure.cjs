const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const code=fs.readFileSync(path.join(__dirname,'../dist/shared/work-disclosure.js'),'utf8');let checks=0;
function setup(width=400,height=609,coarsePointer=true,longText=false,manyActions=false){
 const events={},observers=[],rafs=[];let active=null;
 class E{
  constructor(tag='div',cls='',text=''){this.tag=tag;this.className=cls;this.text=text;this.attrs={};this.dataset={};this.hidden=false;this.listeners={};this.nodes=[];this.style={setProperty:(k,v)=>this.style[k]=v};this.width=322;this.height=280;this.scrollLeft=0;this.fixed=null;this.classList={contains:c=>this.className.split(' ').includes(c)};}
  get children(){return this.nodes;}get clientHeight(){return this.className==='work-page-flow'?track.height:this.height;}get clientWidth(){return this.width;}get scrollWidth(){return this.width;}
  get contentHeight(){if(this.fixed!==null)return this.fixed;if(this.nodes.length)return this.nodes.reduce((a,n)=>a+n.contentHeight+10,0)-10;return Math.ceil((this.text.length||1)/38)*20;}
  get scrollHeight(){return Math.max(this.clientHeight,this.contentHeight);}get textContent(){return this.nodes.length?this.nodes.map(n=>n.textContent).join(' '):this.text;}set textContent(t){this.text=t;this.nodes=[];}
  get isConnected(){return true;}matches(q){return this.tag===q;}closest(q){return q.startsWith('.')&&this.className.split(' ').includes(q.slice(1))?this:this.parent?.closest(q);}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}removeAttribute(k){delete this.attrs[k];}
  append(node){node.remove();this.nodes.push(node);node.parent=this;}remove(){if(this.parent){this.parent.nodes.splice(this.parent.nodes.indexOf(this),1);this.parent=null;}}
  replaceChildren(...nodes){for(const n of this.nodes)n.parent=null;this.nodes=[];nodes.forEach(n=>this.append(n));}
  cloneNode(){const n=new E(this.tag,this.className);n.fixed=this.fixed;return n;}
  querySelector(q){return this.querySelectorAll(q)[0];}querySelectorAll(q){const result=[];for(const n of this.nodes){if(q.startsWith('.')?n.className.split(' ').includes(q.slice(1)):q==='[data-work-page]'?n.dataset.workPage:n.tag===q)result.push(n);result.push(...n.querySelectorAll(q));}return result;}
  contains(n){return n===this||this.nodes.some(e=>e.contains(n));}addEventListener(k,f,o){this.listeners[k]=f;this.listeners[k+'Options']=o;}
  focus(o){assert(!this.hidden);active=this;this.focusOptions=o;}scrollTo(o){this.scrollLeft=o.left;this.lastScroll=o;this.listeners.scroll?.();}
 }
 const work=new E(),sheet=new E(),book=new E('div','work-book'),track=new E('div','work-project-pages'),body=new E(),title=new E('h2'),mobileTitle=new E('h2'),counter=new E('span','work-page-count'),prev=new E('button'),next=new E('button');prev.dataset.workPage='-1';next.dataset.workPage='1';sheet.append(title);book.append(mobileTitle);book.append(track);book.append(counter);book.append(prev);book.append(next);track.width=326;
 const projects=[],notes=[];
 for(let i=0;i<4;i++){const spread=new E('article','work-spread'),flow=new E('div','work-page-flow'),heading=new E('header','work-project-heading'),h3=new E('h3','','Project '+i),summary=new E('p','work-project-summary',longText&&i===0?'A long description with meaningful words. '.repeat(22).trim():'A practical project summary about a useful application.'),stack=new E('p','work-project-stack','Go · HTMX · SQLite'),actions=new E('div','work-page-actions'),button=new E('button','','Notes');heading.fixed=65;button.fixed=44;heading.append(h3);actions.append(button);if(manyActions&&i===0){for(const text of ['GitHub','Live demo']){const link=new E('a','',text);link.fixed=90;actions.append(link);}}[heading,summary,stack,actions].forEach(n=>flow.append(n));spread.append(flow);track.append(spread);projects.push({spread,summary,heading,actions});notes.push(button);}
 body.reduced=false;body.classList={contains:()=>body.reduced};const viewport={clientHeight:height},coarse={matches:coarsePointer,addEventListener:(k,f)=>events.coarse=f};
 const map={'#work':work,'#work-folio':sheet,'.work-book':book,'.work-project-pages':track,'#viewport-unit':viewport};const document={body,documentElement:new E(),get activeElement(){return active;},querySelector:q=>map[q],createElement:tag=>new E(tag)};
 const ctx={document,getComputedStyle:()=>({fontSize:'16px'}),window:{visualViewport:{addEventListener:(k,f)=>events.visualResize=f}},innerWidth:width,innerHeight:height,matchMedia:q=>q==='(pointer: coarse)'?coarse:{matches:false},addEventListener:(k,f)=>events[k]=f,requestAnimationFrame:f=>(rafs.push(f),rafs.length),MutationObserver:class{constructor(f){this.f=f;}observe(){observers.push(this.f);}},ResizeObserver:class{constructor(f){events.observeResize=f;}observe(){}}};
 vm.runInNewContext(code,ctx);const flush=()=>{let n=0;while(rafs.length){assert(++n<10);rafs.shift()();}};flush();
 return{ctx,work,sheet,book,track,body,title,mobileTitle,counter,prev,next,projects,notes,viewport,events,flush,setFocus:e=>active=e,getFocus:()=>active,notify:()=>observers.forEach(f=>f())};
}
for(const[w,h,c,compact]of[[400,609,true,true],[320,568,false,true],[844,390,true,true],[844,390,false,false],[1180,757,false,false]]){
 const t=setup(w,h,c);assert.equal(t.work.dataset.workCompact,String(compact));assert.equal(t.sheet.hidden,compact);assert.equal(t.book.hidden,!compact);checks++;if(!compact)continue;
 assert.equal(t.counter.textContent,'1 / 4');t.next.listeners.click();assert.equal(t.track.scrollLeft,346);assert.equal(t.counter.textContent,'2 / 4');checks++;
 t.setFocus(t.next);t.next.listeners.click();t.next.listeners.click();assert.equal(t.next.attrs['aria-disabled'],'true');assert.equal(t.getFocus(),t.next);assert.equal(t.next.attrs.disabled,undefined);checks++;
 const vertical={key:'ArrowDown',target:t.track,preventDefault(){this.prevented=true;}};t.track.listeners.keydown(vertical);assert(!vertical.prevented);checks++;
 let invoked=0;t.notes[0].listeners.click=()=>invoked++;const original=t.notes[0];t.setFocus(original);
 t.track.height=150;t.events.observeResize();t.flush();assert(t.projects[0].spread.children.length>1);assert.equal(t.getFocus(),original);assert(t.book.contains(original));original.listeners.click();assert.equal(invoked,1);checks++;
 assert(t.track.querySelectorAll('.work-page-flow').every(p=>p.scrollHeight<=p.clientHeight+1));checks++;
 t.body.reduced=true;t.notify();assert.equal(t.getFocus(),t.title);assert(!t.sheet.hidden&&t.book.hidden);checks++;
 t.body.reduced=false;t.setFocus(t.title);t.notify();assert.equal(t.getFocus(),t.mobileTitle);checks++;
 t.ctx.innerWidth=1180;t.viewport.clientHeight=757;t.setFocus(t.notes[0]);t.events.resize();assert.equal(t.getFocus(),t.title);checks++;
}
const packed=setup(400,609,true,false,true);packed.track.height=150;packed.events.observeResize();packed.flush();assert(packed.projects[0].spread.children.every(page=>page.children.some(node=>node.className!=='work-continuation')));assert.equal(packed.book.dataset.pageOverflow,'false');checks+=2;
const long=setup(400,609,true,true);const words=long.projects[0].spread.querySelectorAll('.work-project-summary').map(p=>p.textContent).join(' ');assert.equal(words,long.projects[0].summary.text);assert(long.projects[0].spread.children.length>2);assert.equal(long.book.dataset.pageOverflow,'false');checks+=3;
assert(!/addEventListener\(['"](?:touch|pointer|wheel)/.test(code));assert(!code.includes('scrollIntoView'));checks+=2;
console.log(JSON.stringify({checks,result:'passed',scope:'Measured page packing, preserved controls/focus and native-gesture contract; not physical touch/layout'}));
