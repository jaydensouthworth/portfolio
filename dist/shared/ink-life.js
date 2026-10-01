/* Living processes are separate cropped surfaces. Static worlds and their
   occlusion masks are rebuilt only on native scroll or layout changes. */
(() => {
 'use strict';
 const TAU=Math.PI*2;
 class InkWorldLife {
  constructor(renderer){this.r=renderer;this.allowed=false;this.time=0;this.last=0;this.frames=0;this.samples=[];this.views=[];this.patches=[];this.cadence=24;this.maskRefreshes=0;this.prepareGeneration=0;this.preparationSamples=[];}
  enable(value){this.allowed=value;if(!value)this.cancelPrepare();if(!value){this.stop();for(const p of this.patches)if(p.el.style.display!=='none')p.el.style.display='none';}}
  stop(){if(this.timer)clearTimeout(this.timer);if(this.raf)cancelAnimationFrame(this.raf);this.timer=this.raf=0;this.last=0;for(const p of this.patches)if(p.el.dataset.running!=='false')p.el.dataset.running='false';}
  cancelPrepare(){this.prepareGeneration++;if(this.prepareRAF)cancelAnimationFrame(this.prepareRAF);this.prepareRAF=0;}
  suspend(){this.cancelPrepare();this.stop();for(const p of this.patches)if(p.el.style.display!=='none')p.el.style.display='none';}
  begin(){this.views=[];}
  view(index,camera,visible,portal,aperture,ancestors){if(this.r.isInk&&index<3)this.views.push({index,camera:{...camera},visible,portal,aperture,ancestors});}
  canvas(){const el=document.createElement('canvas');el.setAttribute('aria-hidden','true');el.className='world-life';el.style.cssText='position:absolute;z-index:-1;pointer-events:none;contain:strict';this.r.canvas.parentElement.insertBefore(el,this.r.motionCanvas||this.r.svg);return el;}
  plans(){
   const r=this.r,plans=[];
   for(const v of this.views)for(const group of r.worlds[v.index].life||[]){
    if(group.z-v.camera.z<1)continue;
    const points=group.bounds.filter(p=>p[2]>v.camera.z+.35).map(p=>r.project(p,v.camera));if(!points.length)continue;
    const b=r.bounds(points),patch=r.intersection({left:Math.floor(b.left-5),top:Math.floor(b.top-5),right:Math.ceil(b.right+5),bottom:Math.ceil(b.bottom+5)},v.visible);
    if(!patch||patch.right-patch.left<4||patch.bottom-patch.top<4)continue;
    // Large surfaces retain their motion too; freezing them caused a phase
    // jump at the first travel frame. The measured cadence controls cost.
    const animated=true;
    plans.push({v,group,patch,animated});
   }
   return plans;
  }
  configure(plan,index,prepareOnly){
   const r=this.r;let p=this.patches[index];
   if(!p){const el=this.canvas(),mask=document.createElement('canvas');p={el,c:el.getContext('2d'),mask,m:mask.getContext('2d')};this.patches.push(p);}
   Object.assign(p,plan);
   const {v,group,patch}=plan,ratio=Math.min(1.5,r.ratio),w=patch.right-patch.left,h=patch.bottom-patch.top,pw=Math.ceil(w*ratio),ph=Math.ceil(h*ratio);p.ratio=ratio;
   if(p.el.width!==pw||p.el.height!==ph){p.el.width=p.mask.width=pw;p.el.height=p.mask.height=ph;}
   Object.assign(p.el.style,{left:patch.left+'px',top:patch.top+'px',width:w+'px',height:h+'px',display:prepareOnly?'none':'block'});
   p.el.dataset.world=String(v.index);p.el.dataset.process=group.name;p.maskDepth=undefined;
   return p;
  }
  update(prepareOnly=false){
   this.stop();const plans=this.plans();
   for(let i=0;i<plans.length;i++){const p=this.configure(plans[i],i,prepareOnly);if(!prepareOnly)this.mask(p,p.group.depthAt?p.group.depthAt(this.time):p.group.z);}
   this.active=plans.length;for(let i=this.active;i<this.patches.length;i++)this.patches[i].el.style.display='none';
   if(!prepareOnly)this.activate();
  }
  activate(){for(let i=0;i<this.active;i++)this.patches[i].el.style.display='block';this.paint(performance.now(),true);this.schedule();}
  prepare(done,valid=()=>true){
   this.cancelPrepare();this.stop();const plans=this.plans(),generation=this.prepareGeneration;let index=0;
   // Allocation/resizing can be more expensive than mask drawing. Keep both
   // inside the same cancellable frame budget, with every partial patch hidden.
   this.active=0;for(const p of this.patches)if(p.el.style.display!=='none')p.el.style.display='none';
   const chunk=()=>{this.prepareRAF=0;if(generation!==this.prepareGeneration||!this.allowed||document.hidden||!valid())return;const start=performance.now();
    do{if(index<plans.length){const p=this.configure(plans[index],index,true);index++;this.mask(p,p.group.depthAt?p.group.depthAt(this.time):p.group.z);}}while(index<plans.length&&performance.now()-start<3);
    this.preparationSamples.push(performance.now()-start);if(this.preparationSamples.length>120)this.preparationSamples.shift();
    if(index<plans.length)this.prepareRAF=requestAnimationFrame(chunk);else{this.active=plans.length;done();}
   };this.prepareRAF=requestAnimationFrame(chunk);
  }
  mask(p,depth){
    this.maskRefreshes++;
    const r=this.r,original=r.ctx,calls=r.drawCalls,{v,patch,ratio}=p,w=patch.right-patch.left,h=patch.bottom-patch.top,c=p.m;
    c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.lineJoin='round';c.lineCap='butt';c.clearRect(0,0,p.mask.width,p.mask.height);c.setTransform(ratio,0,0,ratio,-patch.left*ratio,-patch.top*ratio);r.ctx=c;c.save();
    for(const a of v.ancestors){r.curve(a.clip);c.clip();}
    c.fillStyle='#fff';c.fillRect(patch.left,patch.top,w,h);
    c.globalCompositeOperation='destination-out';
    // The current world, its exit, and every parent world's foreground
    // participate in occlusion. Activity cannot leak across the boundary.
    r.geometry(v.index,v.camera,patch,depth-.03,true);
    if(v.aperture&&v.portal.z<depth){r.curve(v.aperture);c.fill();}
    for(const a of v.ancestors)r.geometry(a.index,a.camera,patch,a.portal.z-.03,true);
    c.restore();r.ctx=original;r.drawCalls=calls;p.maskDepth=depth;
  }
  paint(now,all=false){
   const start=performance.now(),r=this.r;
   r.advanceActivity(now);this.last=now;
   for(let i=0;i<this.active;i++){
    const p=this.patches[i];if(!all&&!p.animated)continue;
    const c=p.c,{left,top}=p.patch;c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.lineJoin='round';c.lineCap='butt';c.clearRect(0,0,p.el.width,p.el.height);c.setTransform(p.ratio,0,0,p.ratio,-left*p.ratio,-top*p.ratio);
    // A single depth-traveling subject needs a new occlusion slice only when
    // it crosses half a world unit. Existing static vertex projections remain
    // cached; no world/background is repainted by this localized update.
    if(p.group.depthAt){const depth=Math.round(p.group.depthAt(this.time)*2)/2;if(depth!==p.maskDepth)this.mask(p,depth);}
    p.group.paint(c,point=>r.project(point,p.v.camera),this.time,p.v.camera);p.paintedTime=this.time;
    c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='destination-in';c.drawImage(p.mask,0,0);c.globalCompositeOperation='source-over';
    const running=String(this.allowed&&p.animated);if(p.el.dataset.running!==running)p.el.dataset.running=running;
   }
   this.frames++;this.samples.push(performance.now()-start);if(this.samples.length>120)this.samples.shift();
   if(this.frames%24===0){const a=[...this.samples].sort((a,b)=>a-b);this.cadence=a[Math.floor(a.length*.9)]>4?16:24;}
   if(this.frames%12===0||all)r.canvas.dataset.life=JSON.stringify(this.metrics());
  }
  schedule(){if(this.timer||this.raf||!this.allowed||document.hidden||!this.patches.slice(0,this.active).some(p=>p.animated))return;
   this.timer=setTimeout(()=>{this.timer=0;this.raf=requestAnimationFrame(now=>{this.raf=0;if(!this.allowed||document.hidden){this.stop();return;}if(now-this.last>=1000/this.cadence-1)this.paint(now);this.schedule();});},Math.max(0,1000/this.cadence-(performance.now()-this.last)-5));
  }
  metrics(){const a=[...this.samples].sort((a,b)=>a-b);return{frames:this.frames,maskRefreshes:this.maskRefreshes,worldFrames:this.r.frames,drawMs:{median:a.length?+a[Math.floor(a.length*.5)].toFixed(2):0,p95:a.length?+a[Math.min(a.length-1,Math.floor(a.length*.95))].toFixed(2):0,samples:a.length},preparationMs:{chunks:this.preparationSamples.length,total:+this.preparationSamples.reduce((s,v)=>s+v,0).toFixed(2),p95:this.preparationSamples.length?+[...this.preparationSamples].sort((a,b)=>a-b)[Math.min(this.preparationSamples.length-1,Math.floor(this.preparationSamples.length*.95))].toFixed(2):0,max:this.preparationSamples.length?+Math.max(...this.preparationSamples).toFixed(2):0},cadenceLimit:this.cadence,patches:this.active,animatedPatches:this.patches.slice(0,this.active).filter(p=>p.animated).length,patchPixels:this.patches.slice(0,this.active).reduce((s,p)=>s+p.el.width*p.el.height,0),worldPixels:this.r.canvas.width*this.r.canvas.height};}
 }
 const box=(x,y,z,rx,ry)=>[[x-rx,y-ry,z],[x+rx,y-ry,z],[x+rx,y+ry,z],[x-rx,y+ry,z]];
 const path=(c,points,close=false)=>{c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);if(close)c.closePath();};
 window.InkWorldLife=InkWorldLife;
 window.INK_LIFE_ART={
  // A small school of ribbon organisms rides each authored current. The
  // silhouette undulates; coherent travel and differing scale imply a habitat.
  current(r,positions,z,name){
   const units=positions.map(([x,y,size,speed,offset])=>({x:(x-.5)*r.width*z/r.fx,y:(.5-y)*r.height*z/r.fy,size:size*r.width*z/r.fx,speed,offset}));
   const bounds=units.flatMap(o=>box(o.x,o.y,z,o.size*2.4,o.size*1.2));
   return{name,z,bounds,paint(c,project,time){for(const o of units){
    const t=time*o.speed+o.offset,x=o.x+Math.cos(t*.38)*o.size*.55,y=o.y+Math.sin(t*.51)*o.size*.35,s=o.size;
    const form=[[1.1,0],[.4,.20],[.03,.62],[-.35,.32],[-1.2,.06],[-.4,-.1],[.06,-.44],[.45,-.16]];
    const points=form.map(([u,v],i)=>project([x+u*s,y+(v+Math.sin(t*1.5+u*2)*.09*(1-Math.abs(u)*.3))*s,z]));
    c.save();c.beginPath();c.moveTo(...points[0]);for(let i=0;i<points.length;i++){const a=points[(i-1+points.length)%points.length],b=points[i],d=points[(i+1)%points.length],e=points[(i+2)%points.length];c.bezierCurveTo(b[0]+(d[0]-a[0])*.13,b[1]+(d[1]-a[1])*.13,d[0]-(e[0]-b[0])*.13,d[1]-(e[1]-b[1])*.13,...d);}c.closePath();c.fillStyle=name.startsWith('distant')?'#f6a2cf':'#83f0ed';c.globalAlpha=name.startsWith('distant')?.65:.88;c.fill();c.lineJoin='round';c.strokeStyle='#5650aa';c.lineWidth=1.1;c.stroke();
    path(c,[project([x+s*.8,y,z]),project([x-s*.25,y+s*.02,z]),project([x-s*1.65,y+Math.sin(t*1.4)*s*.13,z])]);c.strokeStyle='#e6fffd';c.globalAlpha=.8;c.lineWidth=1;c.stroke();
    const tip=project([x+s*.68,y+s*.025,z]);c.beginPath();c.arc(...tip,1.3,0,TAU);c.fillStyle='#344d8e';c.globalAlpha=1;c.fill();c.restore();
   }}};
  },
  passage(index){
   const duration=index?48:32,phase=index?.31:.19;
   const center=u=>index?[8.5+u*14,-2.8+Math.sin(u*Math.PI)*5,-4+u*76]:[-3.3-u*10,-1.6+Math.sin(u*Math.PI)*3.8,-4+u*60];
   const size=index?1.25:.72,z=index?72:56;
   const bounds=Array.from({length:96},(_,i)=>center(i/95)).flatMap(p=>box(p[0],p[1],p[2],size*2,size*1.3));
   const position=time=>((time/duration+phase)%1);
   return{name:index?'mineral-passage':'current-passage',z,bounds,depthAt:time=>center(position(time))[2],paint(c,project,time,camera={z:0}){
    const u=position(time),p=center(u);if(p[2]-camera.z<1.2)return;
    const fade=Math.min(1,(1-u)/.12),s=size,flutter=Math.sin(time*1.7)*.10;
    const shape=index?[[1.4,0],[.35,.50],[-1.55,.03],[-.3,-.34]]:[[1.15,0],[.2,.58+flutter],[-.4,.22],[-1.45,.02],[-.35,-.12],[.15,-.47-flutter]];
    const points=shape.map(([x,y])=>project([p[0]+x*s,p[1]+y*s,p[2]]));c.save();path(c,points,true);c.fillStyle=index?'#ffe7ad':'#91efdf';c.globalAlpha=fade;c.fill();
    path(c,[points[0],points[2],points[points.length-1]],true);c.fillStyle=index?'#ba6b55':'#6565ad';c.fill();
    path(c,[project([p[0]+s,p[1]+.02,p[2]]),project([p[0]-s*1.8,p[1]+Math.sin(time*.7)*s*.12,p[2]])]);c.strokeStyle=index?'#fff1c8':'#d4fff0';c.lineWidth=1;c.stroke();c.restore();
   }};
  },
  stream(r){
   const z=18,convert=(x,y)=>[(x-.5)*r.width*z/r.fx,(.5-y)*r.height*z/r.fy,z];
   const center=t=>{const u=1-t;return[1.09*u*u*u+3*.60*u*u*t+3*.88*u*t*t+.46*t*t*t,-.14*u*u*u+3*.20*u*u*t+3*.71*u*t*t+1.22*t*t*t];};
   return{name:'color-current-flow',z,bounds:[convert(.40,-.05),convert(1.16,-.05),convert(1.16,1.07),convert(.40,1.07)],paint(c,project,time){
    c.save();c.lineCap='round';for(let n=0;n<4;n++){const start=(time*.021+n*.25)%1;for(let j=0;j<12;j++){const t=start+j*.005;if(t>1)continue;const a=center(t),b=center(Math.min(1,t+.006)),offset=n%2?.012:-.015;path(c,[project(convert(a[0]+offset,a[1])),project(convert(b[0]+offset,b[1]))]);c.strokeStyle=n%2?'#f8b8e6':'#b1fff3';c.globalAlpha=Math.sin(j/12*Math.PI)*.48;c.lineWidth=1.2;c.stroke();}}c.restore();
   }};
  },
  // Moving arcs and faceted companions have separate near/far passes. The
  // mineral core eclipses the far pass using the cached world-depth mask.
  orbit(x,y,z,radius,back,name){
   const depth=z+(back?radius*.7:-radius*.7),rx=radius*1.65,ry=radius*.78;
   return{name,z:depth,bounds:box(x,y,z-radius*.7,rx*1.1,ry*1.15),paint(c,project,time){
    const point=a=>[x+Math.cos(a)*rx,y+Math.sin(a)*ry+Math.cos(a)*radius*.22,z+Math.sin(a)*radius*.65];
    c.save();c.lineCap='round';
    for(let i=0;i<3;i++){
     const a=time*.12+i*TAU/3+.6,angles=Array.from({length:28},(_,k)=>a-.85+k/27*.85).filter(q=>(Math.sin(q)>0)===back);
     if(angles.length>1){const pts=angles.map(q=>project(point(q)));path(c,pts);c.strokeStyle=i===1?'#e8a0ab':'#ffd28c';c.globalAlpha=back?.28:.58;c.lineWidth=back?1:1.6;c.stroke();}
     if((Math.sin(a)>0)!==back)continue;
     const q=point(a),s=radius*(i===0?.105:.065),spin=time*.16+i,poly=Array.from({length:4},(_,k)=>{const v=spin+k*Math.PI/2;return project([q[0]+Math.cos(v)*s,q[1]+Math.sin(v)*s*.7,q[2]]);});
     path(c,poly,true);c.fillStyle=back?'#b77a78':i===1?'#e9aaa4':'#ffe3a8';c.globalAlpha=back?.7:.98;c.fill();path(c,[poly[0],poly[2],poly[1]],true);c.fillStyle=back?'#76425b':'#ba6b55';c.fill();
    }
    c.restore();
   }};
  },
  strata(){const z=44;return{name:'mineral-tides',z,bounds:box(2,-14,z,37,6),paint(c,project,time){c.save();for(let band=0;band<3;band++){const points=Array.from({length:54},(_,k)=>{const x=-35+k/53*74;return project([x,-14+band*1.65+Math.sin(x*.14+time*.16+band)*1.35,z]);});path(c,points);c.strokeStyle=band===1?'#d8938b':'#ffc577';c.globalAlpha=.15+band*.055;c.lineWidth=band===2?1.2:.8;c.stroke();}c.restore();}};}
 };
})();
