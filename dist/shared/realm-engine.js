/* Perspective portals using native Canvas clipping: no WebGL, stencil, or GPU depth dependency. */
(() => {
 'use strict';
 const CFG=window.REALM_DESIGNS?.[document.body.dataset.design]||window.REALM_DESIGNS?.ink;
 const BG=CFG?.bg||['#030611','#b3add3','#000420'];
 const RGB=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const mix=(a,b,t)=>`rgb(${a.map((c,i)=>Math.round(c*(1-t)+b[i]*t)).join(',')})`;
 const clamp=v=>Math.max(0,Math.min(1,v));
 class RealmRenderer{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});if(!this.ctx)throw Error('Canvas rendering unavailable');this.config=CFG;this.isInk=document.body.dataset.design==='ink';this.width=0;this.height=0;this.frames=0;this.drawCalls=0;this.samples=[];this.intervals=[];this.lastFrame=0;this.ratio=1;this.rims=[];this.svg=document.querySelector('#portal-membranes');this.textures=this.makeTextures();this.worlds=[];this.vertexCount=0;this.edgeCount=0;this.motionAllowed=false;this.activityTime=0;this.activityLast=null;this.continuationFrames=0;this.continuationSamples=[];this.motionTime=0;this.motionFrames=0;this.motionSamples=[];this.motionIntervals=[];this.motionCadence=30;this.travel=false;this.settleTimer=0;this.stageSamples=[];this.life=this.isInk&&window.InkWorldLife?new window.InkWorldLife(this):null;}
  makeTextures(){const isInk=!CFG||document.body.dataset.design==='ink',legacyInk=isInk&&!window.REALM_INK_WORLDS,make=(w,h,paint)=>{const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'));return c;};
   const source=legacyInk&&make(1900,740,c=>{c.font='bold 108px monospace';c.fillStyle='#00ff9f';c.fillText('SOUTHWORTH',35,140);c.font='56px monospace';c.fillStyle='#40ff40';c.fillText('Java + React',35,292);c.fillText('Systems & experiments',35,382);c.fillStyle='#00ccff';c.fillText('Vendo-Matic 800',35,550);c.fillText('TEnmo / Beertraunteer',35,640);});
   const atmosphere=isInk&&make(1200,900,c=>{const g=c.createLinearGradient(0,0,1200,900);g.addColorStop(0,'#365295');g.addColorStop(.48,'#564293');g.addColorStop(1,'#714186');c.fillStyle=g;c.fillRect(0,0,1200,900);});
   const paperLight=legacyInk&&make(1200,900,c=>{const g=c.createLinearGradient(50,850,1000,100);g.addColorStop(0,'#a7b2c6');g.addColorStop(.42,'#cdd5e2');g.addColorStop(1,'#edf0f5');c.fillStyle=g;c.fillRect(0,0,1200,900);const spot=c.createRadialGradient(920,200,10,920,200,750);spot.addColorStop(0,'rgba(226,230,255,.22)');spot.addColorStop(1,'rgba(210,215,239,0)');c.fillStyle=spot;c.fillRect(0,0,1200,900);});
   const castLight=make(640,640,c=>{const g=c.createRadialGradient(320,320,15,320,320,320);g.addColorStop(0,'rgba(144,123,245,.26)');g.addColorStop(.38,'rgba(68,65,160,.16)');g.addColorStop(.7,'rgba(7,188,204,.065)');g.addColorStop(1,'rgba(7,188,204,0)');c.fillStyle=g;c.fillRect(0,0,640,640);});
   const textures={source,atmosphere,paperLight,castLight};
   if(CFG&&document.body.dataset.design!=='ink'){textures.environments=CFG.bg.map((color,i)=>make(600,450,c=>{c.fillStyle=color;c.fillRect(0,0,600,450);const g=c.createRadialGradient(425,175,10,425,175,360);g.addColorStop(0,CFG.light[i]);g.addColorStop(1,color);c.fillStyle=g;c.fillRect(0,0,600,450);}));}
   return textures;
  }
  refreshTextures(){if(this.width>0){this.measureHero();this.worlds=this.prepareWorlds(this.buildWorlds());}}
  buildWorlds(){const key=document.body.dataset.design;if(window.REALM_ART?.[key]){const result=window.REALM_ART[key](this);for(const w of result){w.faces=w.faces||[];w.sprites=w.sprites||[];w.lines=w.lines||[];w.dots=w.dots||[];for(const f of w.faces){if(typeof f.color==='string')f.color=RGB(f.color);f.z=f.points.reduce((s,p)=>s+p[2],0)/f.points.length;}for(const p of w.sprites)if(typeof p.texture==='string')p.texture=this.textures[p.texture];w.faces.sort((a,b)=>b.z-a.z);}return result;}const sprite=(texture,x,y,z,w,h,angle,alpha)=>({texture:this.textures[texture],x,y,z,w,h,angle,alpha});
   const mobile=this.width>0&&this.width<=760;
   const world0={faces:[],lines:[],dots:[],sprites:[]};
   const world1={faces:[],sprites:[]};const world2={faces:[],sprites:[sprite('source',-7,7,30,27,10.5,0,.36)]};
   const face=(world,points,color,cull=false)=>{const a=points[0],b=points[1],c=points[2],u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);world.faces.push({points,color:Array.isArray(color)?color:RGB(color),z:points.reduce((s,p)=>s+p[2],0)/points.length,normal:cull?[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]:null});};
   if(window.REALM_INK_WORLDS)return window.REALM_INK_WORLDS(this,world0);
   // A continuous, half-twisted paper ribbon: one deliberate object, no random polygon field.
   const ribbon=(a,s)=>{const r=6.8+s*Math.cos(a/2);return[2.5+r*Math.cos(a),r*Math.sin(a)*.78,14.5+s*Math.sin(a/2)+1.7*Math.sin(a*2)];};
   for(let i=0;i<112;i++){const a=i/112*Math.PI*2,b=(i+1)/112*Math.PI*2,p=[ribbon(a,-1.9),ribbon(a,1.9),ribbon(b,1.9),ribbon(b,-1.9)];const light=Math.pow(.5+.5*Math.sin(a+.8),.65),color=[Math.round(40+light*185),Math.round(24+light*207),Math.round(94+light*149)];face(world1,p,color);}
   const paper=[[[[-11,2,9],[-6,7,13],[-4,2,15]],'#b5a9e1'],[[[-11,2,9],[-4,2,15],[-8,-2,12]],'#e0eef9'],[[[8,-5,13],[5,-1,17],[12,2,20]],'#a59ad4'],[[[8,-5,13],[12,2,20],[13,-6,17]],'#e6f7ff']];paper.forEach(([p,c])=>face(world1,p,c));
   // Jayden Southworth's initials, built from solid phosphor-like pixels in three dimensions.
   const pixels=['00111011110','00010010000','00010010000','00010001110','10010000001','10010000001','01100011110'];
   const rotate=p=>{const a=-.33,c=Math.cos(a),s=Math.sin(a);return[p[0]*c+p[2]*s,p[1],-p[0]*s+p[2]*c];};
   const cube=(x,y,z,w,h,d)=>{const p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(q=>{const v=rotate([q[0]*w/2+x,q[1]*h/2+y,q[2]*d/2]);return[v[0]+6.2,v[1],v[2]+z];});for(const[a,b,c,d,t]of[[0,1,2,3,'#00ff9f'],[5,4,7,6,'#06382f'],[4,0,3,7,'#125b4b'],[1,5,6,2,'#0b7e61'],[3,2,6,7,'#40ff40'],[4,5,1,0,'#073a36']]){face(world2,[p[a],p[b],p[c],p[d]],t,true);}};
   pixels.forEach((row,y)=>[...row].forEach((pixel,x)=>{if(pixel==='1')cube((x-5)*.84,(3-y)*.84,18,.72,.72,.55+(x%3)*.15);}));
   for(const w of[world0,world1,world2])w.faces.sort((a,b)=>b.z-a.z);return[world0,world1,world2];
  }
  portalSpec(index){const mobile=this.width<=760;if(index===0){const w=this.width||1188,h=this.height||761,fx=this.fx||h*.76,fy=this.fy||h*.76;const layout=CFG?.portal||{cx:.735,cy:.49,rx:.193,ry:.335};let cx=w*layout.cx,cy=h*layout.cy,rx=Math.min(w*layout.rx,h*.302),ry=Math.min(h*layout.ry,w*.26);if(mobile){const top=this.heroZone?.top??Math.max(254,Math.min(285,h*.36)),bottom=this.heroZone?.bottom??h-194;cx=w*.53;cy=(top+bottom)/2;ry=Math.max(72,(bottom-top)/2);rx=Math.min(w*.36,ry*.94);if(CFG?.shape==='circle')rx=Math.min(ry,w*.38);if(CFG?.shape==='lens')rx=Math.min(w*.42,ry*1.65);}if(this.heroSlot){({cx,cy,rx,ry}=this.heroSlot);}return{...this.heroSlot?.geometry,x:(cx-w/2)*8/fx,y:(h/2-cy)*8/fy,z:8,rx:rx*8/fx,ry:ry*8/fy};}return{x:mobile?-5.7:-4.3,y:mobile?-.2:.3,z:16,rx:mobile?2.85:2.5,ry:3.25};}
  measureHero(){
   this.heroZone=null;this.heroSlot=null;
   const slot=this.isInk&&document.querySelector('.ink-portal-slot');
   if(slot){
    const box=slot.getBoundingClientRect();
    if(box.width>0&&box.height>0){
     let left=box.left,right=box.right,top=box.top,bottom=box.bottom;
     const first=document.querySelector('.poster-jayden')?.getBoundingClientRect(),second=document.querySelector('.poster-realm')?.getBoundingClientRect(),title=document.querySelector('#entry-title')?.getBoundingClientRect(),dx=title?.left||0,dy=title?.top||0;
     const shortLandscape=this.height<=560&&this.width>=this.height;
     if(shortLandscape&&first&&second){
      const caption=document.querySelector('.entry-caption')?.getBoundingClientRect(),header=document.querySelector('.site-header')?.getBoundingClientRect();
      const safe={left:Math.max(first.right-dx,second.right-dx)+20,right:this.width-16,top:(header?.bottom||76)+10,bottom:Math.min(this.height-72,(caption?.top||this.height-90)-16)};
      const w=Math.max(1,safe.right-safe.left),h=Math.max(1,safe.bottom-safe.top);
      this.heroSlot={cx:(safe.left+safe.right)/2,cy:(safe.top+safe.bottom)/2,rx:Math.min(w*.40,h*.70),ry:h*.35,geometry:{shear:.36,taper:.07,tiltX:.16,tiltY:.05}};
      for(let attempt=0;attempt<28;attempt++){
       const portal=this.portalSpec(0),points=Array.from({length:64},(_,i)=>this.project(this.portalPoint(portal,i/64*Math.PI*2,0,1.22,-.72),{x:0,y:0,z:0})),bounds=this.bounds(points);
       if(bounds.left>=safe.left&&bounds.right<=safe.right&&bounds.top>=safe.top&&bounds.bottom<=safe.bottom)break;
       if(bounds.right-bounds.left>w||bounds.bottom-bounds.top>h){this.heroSlot.rx*=.96;this.heroSlot.ry*=.96;}
       this.heroSlot.cx+=Math.max(0,safe.left-bounds.left)-Math.max(0,bounds.right-safe.right);
       this.heroSlot.cy+=Math.max(0,safe.top-bounds.top)-Math.max(0,bounds.bottom-safe.bottom);
      }
      return;
     }
     if(first&&second){
      if(this.width<=760){top=first.bottom-dy+9;bottom=second.top-dy-10;}
      else{top=Math.max(top,first.bottom-dy+42);left=Math.max(left,second.right-dx+52);}
     }
     if(this.width>760){
      // Fit the diagonal opening into the bay beside the lower word. Its
      // tilt follows the color current, leaving the landmark fully exposed.
      // The heading is measured, never moved or resized.
      const edge=(second?.right-dx)||this.width*.68,gap=Math.max(120,this.width-edge-42);
      this.heroSlot={cx:edge+20+gap*.51,cy:this.height*.65,rx:gap*.44,ry:this.height*.20,geometry:{shear:.52,taper:.08,tiltX:.19,tiltY:.07}};
      for(let attempt=0;attempt<14;attempt++){
       const portal=this.portalSpec(0),near=Array.from({length:64},(_,i)=>this.project(this.portalPoint(portal,i/64*Math.PI*2,0,1.18,-.60),{x:0,y:0,z:0})),bounds=this.bounds(near),safeLeft=edge+10,safeRight=this.width-12;
       if(bounds.right<=safeRight&&bounds.left>=safeLeft)break;
       if(bounds.right>safeRight)this.heroSlot.cx-=(bounds.right-safeRight)*.95;
       if(bounds.left<safeLeft){this.heroSlot.rx*=.96;this.heroSlot.ry*=.96;this.heroSlot.cx+=(safeLeft-bounds.left)*.65;}
      }
     }else{
      // Keep the phone aperture dimensional and nearly round. One uniform fit
      // preserves its proportions inside the unchanged title gap.
      const gap=Math.max(70,bottom-top),radius=gap*.425,slot={cx:this.width*.51,cy:(top+bottom)/2,rx:radius*1.10,ry:radius,geometry:{shear:.12,taper:.045,tiltX:.16,tiltY:.045}};
      this.heroSlot=slot;
      for(let attempt=0;attempt<24;attempt++){
       const portal=this.portalSpec(0),points=Array.from({length:64},(_,i)=>this.project(this.portalPoint(portal,i/64*Math.PI*2,0,1.22,-.72),{x:0,y:0,z:0})),bounds=this.bounds(points);
       if(bounds.top>=top&&bounds.bottom<=bottom&&bounds.left>=12&&bounds.right<=this.width-12)break;
       slot.rx*=.97;slot.ry*=.97;
      }
     }
     return;
    }
   }
   if(this.width>760)return;
   const title=document.querySelector('#entry-title'),caption=document.querySelector('.entry-caption')||document.querySelector('.eclipse-identity .entry-meta');
   if(!title||!caption)return;
   const t=title.getBoundingClientRect(),b=caption.getBoundingClientRect();
   this.heroZone={top:Math.max(185,t.bottom+24),bottom:Math.min(this.height-130,b.top-24)};
   if(this.heroZone.bottom-this.heroZone.top<135)this.heroZone=null;
  }
  resize(width,height){const expectedRatio=Math.min(2,window.devicePixelRatio||1);if(this.width===width&&this.height===height&&this.ratio===expectedRatio)return;this.width=width;this.height=height;this.aspect=width/height;this.stretch=Math.min(1,this.aspect/.82);this.ratio=Math.min(2,window.devicePixelRatio||1);this.canvas.width=Math.round(width*this.ratio);this.canvas.height=Math.round(height*this.ratio);this.fx=width*.76*this.stretch/this.aspect;this.fy=height*.76;this.measureHero();this.worlds=this.prepareWorlds(this.buildWorlds());this.vertexCount=this.worlds.reduce((s,w)=>s+w.faces.reduce((n,f)=>n+(f.points.length-2)*3,0),0);if(this.svg)this.svg.setAttribute('viewBox',`0 0 ${width} ${height}`);}
  project(p,camera){const z=p[2]-camera.z;return[this.width/2+(p[0]-camera.x)*this.fx/z,this.height/2-(p[1]-camera.y)*this.fy/z];}
  clipZ(points,z,greater){const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ia=greater?a[2]>=z:a[2]<=z,ib=greater?b[2]>=z:b[2]<=z;if(ia)out.push(a);if(ia!==ib){const t=(z-a[2])/(b[2]-a[2]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,z]);}}return out;}
  bounds(points){let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;for(const p of points){left=Math.min(left,p[0]);top=Math.min(top,p[1]);right=Math.max(right,p[0]);bottom=Math.max(bottom,p[1]);}return{left,top,right,bottom};}
  intersection(a,b){const r={left:Math.max(a.left,b.left),top:Math.max(a.top,b.top),right:Math.min(a.right,b.right),bottom:Math.min(a.bottom,b.bottom)};return r.right>r.left&&r.bottom>r.top?r:null;}
  curve(points,canvas=true,append=false){const c=this.ctx;let d=canvas?'':`M${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;if(canvas){if(!append)c.beginPath();c.moveTo(...points[0]);}for(let i=0;i<points.length;i++){const p0=points[(i-1+points.length)%points.length],p1=points[i],p2=points[(i+1)%points.length],p3=points[(i+2)%points.length],a=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],b=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];if(canvas)c.bezierCurveTo(...a,...b,...p2);if(!canvas)d+=`C${a.map(v=>v.toFixed(2)).join(' ')} ${b.map(v=>v.toFixed(2)).join(' ')} ${p2.map(v=>v.toFixed(2)).join(' ')}`;}if(canvas)c.closePath();return d+'Z';}
  path(points){const c=this.ctx;c.beginPath();c.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);c.closePath();}
  paintMembranes(){
   if(!this.svg)return;
   if(!this.membraneNodes)this.membraneNodes=[0,1].map(i=>{
    const node=name=>document.querySelector(`#membrane-${name}-${i}`),n={group:document.querySelector(`#membrane-${i}`),gradient:node('gradient'),color:node('color'),light:node('light'),clip:node('clip-path')};
    n.clipped=n.group.hasAttribute('clip-path');n.color.style.opacity=this.isInk?.28:1;n.light.style.opacity=this.isInk?.35:1;
    // These legacy layers are invisible in every current direction. Avoid
    // serializing their additional paths on every native scroll frame.
    const echo=node('echo'),glint=node('glint');if(echo)echo.style.opacity=0;if(glint)glint.style.opacity=0;
    return n;
   });
   for(let i=0;i<2;i++){
    const n=this.membraneNodes[i],rim=this.rims[i],display=rim?'':'none';
    if(n.display!==display){n.group.style.display=display;n.display=display;}if(!rim)continue;
    const d=this.curve(rim.points,false);if(n.path!==d){n.color.setAttribute('d',d);n.light.setAttribute('d',d);n.path=d;}
    const b=rim.region,old=n.region;
    if(!old||old.left!==b.left||old.top!==b.top||old.right!==b.right||old.bottom!==b.bottom){n.gradient.setAttribute('x1',b.left);n.gradient.setAttribute('y1',b.top);n.gradient.setAttribute('x2',b.right);n.gradient.setAttribute('y2',b.bottom);n.region={...b};}
    if(rim.parent){const clip=this.curve(rim.parent,false);if(n.clipPath!==clip){n.clip.setAttribute('d',clip);n.clipPath=clip;}if(!n.clipped){n.group.setAttribute('clip-path',`url(#membrane-clip-${i})`);n.clipped=true;}}
    else if(n.clipped){n.group.removeAttribute('clip-path');n.clipped=false;}
   }
  }
  prepareWorlds(worlds){for(const w of worlds){const vertices=[],canonical=new Map(),intern=p=>{const key=p.map(v=>v.toFixed(7)).join('|');if(canonical.has(key))return canonical.get(key);const q=[...p];Object.defineProperty(q,'_vertex',{value:vertices.length});vertices.push(q);canonical.set(key,q);return q;};for(const f of w.faces){f.points=f.points.map(intern);for(const material of f.materialPaths||[])material.points=material.points.map(intern);if(w===worlds[0]&&f.surround&&!f.normal){const [a,b,c]=f.points,u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);f.normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];}if(f.gradient){f.gradient.from=intern(f.gradient.from);f.gradient.to=intern(f.gradient.to);f.gradient.colors=f.gradient.colors.map(v=>typeof v==='string'?RGB(v):v);}f.minZ=Math.min(...f.points.map(p=>p[2]));f.maxZ=Math.max(...f.points.map(p=>p[2]));}for(const l of w.lines||[])l.points=l.points.map(intern);for(const d of w.dots||[])d.p=intern(d.p);w.vertices=vertices;w.projected=vertices.map(()=>[0,0]);w.screenScratch=[];w.projectionFrame=-1;const commands=[],lineBuckets=new Map(),dotBuckets=new Map();for(const f of w.faces){if(typeof f.color==='string')f.color=RGB(f.color);f.z=f.points.reduce((n,p)=>n+p[2],0)/f.points.length;commands.push({type:'face',z:f.z,item:f});}
   for(const sprite of w.sprites||[]){if(typeof sprite.texture==='string')sprite.texture=this.textures[sprite.texture];if(sprite.texture)commands.push({type:'sprite',z:sprite.z,item:sprite});}
   for(const line of w.lines||[])for(let i=0;i<line.points.length-1;i++){const a=line.points[i],b=line.points[i+1],z=(a[2]+b[2])/2-.035,key=[Math.round(z*8),line.color,line.alpha,line.width].join('|');let bucket=lineBuckets.get(key);if(!bucket){bucket={type:'lines',z,segments:[],color:line.color,alpha:line.alpha??1,width:line.width||.8};lineBuckets.set(key,bucket);}bucket.segments.push([a,b]);}
   for(const dot of w.dots||[]){const z=dot.p[2]-.025,color=dot.color||CFG?.accent?.[worlds.indexOf(w)]||'#07bccc',key=Math.round(z*8)+'|'+color;let bucket=dotBuckets.get(key);if(!bucket){bucket={type:'dots',z,dots:[],color};dotBuckets.set(key,bucket);}bucket.dots.push(dot);}
   for(const curve of w.curves||[]){if(typeof Path2D!=='undefined'){const p=new Path2D(),q=curve.points;p.moveTo(q[0][0],q[0][1]);for(let i=1;i<q.length;i+=3)p.bezierCurveTo(q[i][0],q[i][1],q[i+1][0],q[i+1][1],q[i+2][0],q[i+2][1]);p.closePath();curve.cachedPath=p;}commands.push({type:'curve',z:curve.z,item:curve});}
   for(const pulse of w.pulses||[])commands.push({type:'pulse',z:pulse.points.reduce((sum,p)=>sum+p[2],0)/pulse.points.length,item:pulse});
   commands.push(...lineBuckets.values(),...dotBuckets.values());commands.sort((a,b)=>b.z-a.z);w.commands=commands;
   for(const [order,cmd] of commands.entries()){cmd.paintOrder=order;cmd.minZ=cmd.type==='face'?cmd.item.minZ:cmd.type==='lines'?Math.min(...cmd.segments.flat().map(p=>p[2])):cmd.type==='dots'?Math.min(...cmd.dots.map(d=>d.p[2])):cmd.type==='pulse'?Math.min(...cmd.item.points.map(p=>p[2])):cmd.item.z;cmd.maxZ=cmd.type==='face'?cmd.item.maxZ:cmd.type==='lines'?Math.max(...cmd.segments.flat().map(p=>p[2])):cmd.type==='dots'?Math.max(...cmd.dots.map(d=>d.p[2])):cmd.type==='pulse'?Math.max(...cmd.item.points.map(p=>p[2])):cmd.item.z;}
   w.occluders=[...commands].sort((a,b)=>a.minZ-b.minZ);w.maskCommands=new Map();w.projectionGeneration=0;
   for(const f of w.faces)f.screenPoints=f.points.map(p=>w.projected[p._vertex]);}return worlds;}
  lineSegment(a,b,low,high=Infinity){if(a[2]>=low&&b[2]>=low&&a[2]<=high&&b[2]<=high)return[a,b];const dz=b[2]-a[2];if(Math.abs(dz)<1e-8)return a[2]>=low&&a[2]<=high?[a,b]:null;let t0=(low-a[2])/dz,t1=(high-a[2])/dz;if(t0>t1)[t0,t1]=[t1,t0];t0=Math.max(0,t0);t1=Math.min(1,t1);if(t1<t0)return null;return[t0,t1].map(t=>a.map((v,i)=>v+(b[i]-v)*t));}
  foregroundCommands(world,high){
   if(world.maskCommands.has(high))return world.maskCommands.get(high);
   const result=[];for(const command of world.occluders){if(command.minZ>high)break;result.push(command);}result.sort((a,b)=>a.paintOrder-b.paintOrder);
   world.maskCommands.set(high,result);if(world.maskCommands.size>16)world.maskCommands.delete(world.maskCommands.keys().next().value);return result;
  }
  geometry(index,camera,visible,frontOnly=null,alphaOnly=false){
   const world=this.worlds[index],high=frontOnly??Infinity,low=camera.z+.08;
   if(!this.travel||alphaOnly||!world.life?.length)return this.geometryRange(index,camera,visible,frontOnly,alphaOnly);
   const time=this.life?.time||0,groups=world.life.map(item=>({item,z:item.depthAt?item.depthAt(time):item.z})).filter(g=>g.z>low&&g.z<=high).sort((a,b)=>b.z-a.z);
   let ceiling=high;for(const {item,z}of groups){if(ceiling>z+1e-7)this.geometryRange(index,camera,visible,ceiling,false,z);item.paint(this.ctx,p=>this.project(p,camera),time,camera);this.drawCalls++;ceiling=z;}
   this.geometryRange(index,camera,visible,ceiling,false,low);
  }
  geometryRange(index,camera,visible,frontOnly=null,alphaOnly=false,nearLimit=null){const c=this.ctx,world=this.worlds[index],fog=RGB(BG[index]),high=frontOnly??Infinity,low=nearLimit??camera.z+.08;if(high<=low+1e-7)return;
   if(world.projectionFrame<0||world.cameraX!==camera.x||world.cameraY!==camera.y||world.cameraZ!==camera.z){for(let i=0;i<world.vertices.length;i++){const p=world.vertices[i],z=p[2]-camera.z,inv=Math.abs(z)<1e-8?0:1/z,out=world.projected[i];out[0]=this.width/2+(p[0]-camera.x)*this.fx*inv;out[1]=this.height/2-(p[1]-camera.y)*this.fy*inv;}world.projectionGeneration++;world.projectionFrame=this.frames;world.cameraX=camera.x;world.cameraY=camera.y;world.cameraZ=camera.z;}world.projectionFrame=this.frames;const project=p=>p._vertex===undefined?this.project(p,camera):world.projected[p._vertex];
   const bandKey=low+'|'+high;let commands=alphaOnly?this.foregroundCommands(world,high):world.commands;
   if(low>camera.z+.081||Number.isFinite(high)){if(!world.bands)world.bands=new Map();if(world.bands.has(bandKey))commands=world.bands.get(bandKey);else{commands=commands.filter(cmd=>cmd.maxZ>=low&&cmd.minZ<=high);world.bands.set(bandKey,commands);if(world.bands.size>40)world.bands.delete(world.bands.keys().next().value);}}
   for(const command of commands){
    if(command.maxZ-command.minZ<1e-7&&command.minZ>=high)continue;
    if(command.type==='face'){const face=command.item;if(face.maxZ<low||face.minZ>high)continue;if(face.normal){const a=face.points[0],n=face.normal;if(n[0]*(camera.x-a[0])+n[1]*(camera.y-a[1])+n[2]*(camera.z-a[2])>=0)continue;}let points=face.points;if(face.maxZ>high)points=this.clipZ(points,high,false);if(face.minZ<low)points=this.clipZ(points,low,true);if(points.length<3)continue;let screen,bounds;if(points===face.points){screen=face.screenPoints;if(face.boundsGeneration!==world.projectionGeneration){face.screenBounds=this.bounds(screen);face.boundsGeneration=world.projectionGeneration;}bounds=face.screenBounds;}else{screen=world.screenScratch;screen.length=0;for(const p of points)screen.push(project(p));bounds=this.bounds(screen);}if(!this.intersection(bounds,visible))continue;
     if(alphaOnly)c.fillStyle='#fff';else{if(face.paintGeneration!==world.projectionGeneration){const q=clamp((face.z-camera.z-18)/90),haze=q*q*(3-2*q)*.72;if(face.gradient){const a=project(face.gradient.from),b=project(face.gradient.to),g=c.createLinearGradient(a[0],a[1],b[0],b[1]);g.addColorStop(0,mix(face.gradient.colors[0],fog,haze));g.addColorStop(1,mix(face.gradient.colors[1],fog,haze));face.paintStyle=g;}else face.paintStyle=mix(face.color,fog,haze);face.paintGeneration=world.projectionGeneration;}c.fillStyle=face.paintStyle;}this.path(screen);c.globalAlpha=face.alpha??1;c.fill();c.strokeStyle=c.fillStyle;c.lineWidth=.45;c.stroke();
     if(!alphaOnly&&face.materialPaths){c.save();c.clip();for(const material of face.materialPaths){c.beginPath();let segments=0;for(let i=1;i<material.points.length;i+=material.disconnected?2:1){const segment=this.lineSegment(material.points[i-1],material.points[i],low,high);if(!segment)continue;const a=project(segment[0]),b=project(segment[1]);c.moveTo(...a);c.lineTo(...b);segments++;}if(segments){c.globalAlpha=material.alpha??1;c.lineJoin='round';c.lineCap='butt';c.strokeStyle=material.groove;c.lineWidth=material.grooveWidth;c.stroke();c.strokeStyle=material.color;c.lineWidth=material.width;c.stroke();this.drawCalls+=2;}}c.restore();}
     c.globalAlpha=1;this.drawCalls++;
    }else if(command.type==='curve'){
     const curve=command.item,d=curve.z-camera.z;if(d<.1||curve.z>high||curve.z<low)continue;
     const points=curve.points.map(p=>this.project(p,camera));if(!this.intersection(this.bounds(points),visible))continue;
     let path;if(curve.cachedPath&&typeof DOMMatrix!=='undefined'){path=new Path2D();path.addPath(curve.cachedPath,new DOMMatrix([this.fx/d,0,0,-this.fy/d,this.width/2-camera.x*this.fx/d,this.height/2+camera.y*this.fy/d]));}else{c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i+=3)c.bezierCurveTo(...points[i],...points[i+1],...points[i+2]);c.closePath();}
     c.fillStyle=alphaOnly?'#fff':curve.color;if(path)c.fill(path);else c.fill();c.strokeStyle=alphaOnly?'#fff':curve.edge;c.lineWidth=Math.max(.8,Math.min(5,curve.width*this.fy/d));c.lineJoin='round';if(path)c.stroke(path);else c.stroke();this.drawCalls++;
    }else if(command.type==='sprite'){const sprite=command.item;if(sprite.z>high)continue;const d=sprite.z-camera.z;if(d<.1||sprite.z<low)continue;const cs=Math.cos(sprite.angle),sn=Math.sin(sprite.angle),center=[sprite.x,sprite.y,sprite.z],x=[cs*sprite.w,sn*sprite.w,0],y=[sn*sprite.h,-cs*sprite.h,0],p=[center[0]-x[0]/2-y[0]/2,center[1]-x[1]/2-y[1]/2,center[2]],tl=this.project(p,camera),tr=this.project([p[0]+x[0],p[1]+x[1],p[2]],camera),bl=this.project([p[0]+y[0],p[1]+y[1],p[2]],camera),br=[tr[0]+bl[0]-tl[0],tr[1]+bl[1]-tl[1]];if(!this.intersection(this.bounds([tl,tr,bl,br]),visible))continue;c.save();c.globalAlpha=sprite.alpha??1;c.transform((tr[0]-tl[0])/sprite.texture.width,(tr[1]-tl[1])/sprite.texture.width,(bl[0]-tl[0])/sprite.texture.height,(bl[1]-tl[1])/sprite.texture.height,tl[0],tl[1]);c.drawImage(sprite.texture,0,0);c.restore();this.drawCalls++;
    }else if(command.type==='lines'){let count=0;c.beginPath();for(const pair of command.segments){const segment=this.lineSegment(pair[0],pair[1],low,high);if(!segment)continue;const a=project(segment[0]),b=project(segment[1]);if(Math.max(a[0],b[0])+2<visible.left||Math.min(a[0],b[0])-2>visible.right||Math.max(a[1],b[1])+2<visible.top||Math.min(a[1],b[1])-2>visible.bottom)continue;c.moveTo(...a);c.lineTo(...b);count++;}if(count){c.globalAlpha=command.alpha;c.strokeStyle=alphaOnly?'#fff':command.color;c.lineWidth=command.width;c.stroke();c.globalAlpha=1;this.drawCalls++;}
    }else if(command.type==='pulse'){
     const pulse=command.item,t=((this.phase*.13+pulse.offset)%1+1)%1,point=u=>{const a=Math.max(0,Math.min(.99999,u))*(pulse.points.length-1),i=Math.floor(a),f=a-i;return pulse.points[i].map((v,k)=>v+(pulse.points[i+1][k]-v)*f);},p=point(t),tail=point(t-.06);
     if(p[2]<low||p[2]>high)continue;const a=this.project(p,camera),b=this.project(tail,camera);if(a[0]<visible.left||a[0]>visible.right||a[1]<visible.top||a[1]>visible.bottom)continue;
     c.globalAlpha=Math.sin(t*Math.PI)*.85;c.strokeStyle=pulse.color;c.lineWidth=1.5;c.beginPath();c.moveTo(...b);c.lineTo(...a);c.stroke();c.fillStyle=pulse.color;c.beginPath();c.arc(...a,Math.min(2.8,Math.max(1.05,.055*this.fy/(p[2]-camera.z))),0,Math.PI*2);c.fill();c.globalAlpha=1;this.drawCalls++;
    }else if(command.type==='dots'){let count=0;c.beginPath();for(const dot of command.dots){const d=dot.p[2]-camera.z;if(d<.1||dot.p[2]>high||dot.p[2]<low)continue;const p=project(dot.p);if(p[0]<visible.left||p[0]>visible.right||p[1]<visible.top||p[1]>visible.bottom)continue;const r=Math.min(6,Math.max(.35,dot.r*this.fy/d));c.moveTo(p[0]+r,p[1]);c.arc(p[0],p[1],r,0,Math.PI*2);count++;}if(count){c.globalAlpha=.68;c.fillStyle=alphaOnly?'#fff':command.color;c.fill();c.globalAlpha=1;this.drawCalls++;}}
   }
  }
  portalPoint(portal,a,phase,scale=1,depth=0){
   const shape=CFG?.shape||'tear';let x=Math.cos(a),y=Math.sin(a),wave=1+.023*Math.sin(a*3+phase*.6)+.012*Math.sin(a*7-phase*.35);
   if(shape==='slit'){x=Math.sign(x)*Math.pow(Math.abs(x),.62);y=Math.sign(y)*Math.pow(Math.abs(y),.62);wave=1+.012*Math.sin(a*5+phase);}
   if(shape==='diamond'){x=Math.sign(x)*Math.pow(Math.abs(x),1.55);y=Math.sign(y)*Math.pow(Math.abs(y),1.55);wave=1+.024*Math.sin(a*3+phase);}
   if(shape==='circle')wave=1+.01*Math.sin(a*5+phase*.3);
   if(shape==='leaf'){x*=.89+.17*y;wave=1+.024*Math.sin(a*6+phase);}
   if(shape==='lens'){y*=.83+.15*Math.cos(a*2);wave=1+.018*Math.sin(a*4+phase*.5);}
   if(this.isInk){wave=.955+.036*Math.sin(a*3+.7)+.025*Math.sin(a*5-.4)+.014*Math.cos(a*2)+.005*Math.sin(a*7+phase*.2);x*=.97+.055*y;}
   const dy=y*wave*portal.ry*scale,dx=x*wave*portal.rx*scale*(1-(portal.taper||0)*Math.max(0,y))+(portal.shear||0)*dy;
   const tilt=this.isInk?(portal.tiltX??(portal.z<10?.38:-.30))*dx+(portal.tiltY??(portal.z<10?.10:-.11))*dy:0;
   return[portal.x+dx,portal.y+dy,portal.z+depth+tilt+.018*Math.sin(a*4+phase)];
  }
  aperture(portal,camera,phase){let points=Array.from({length:48},(_,i)=>this.portalPoint(portal,i/48*Math.PI*2,phase));if(points.some(p=>p[2]<camera.z+.035))points=this.clipZ(points,camera.z+.035,true);return points.map(p=>this.project(p,camera));}
  openCurve(points){const c=this.ctx;c.beginPath();c.moveTo(...points[0]);for(let i=0;i<points.length-1;i++){const a=points[Math.max(0,i-1)],b=points[i],d=points[i+1],e=points[Math.min(points.length-1,i+2)];c.bezierCurveTo(b[0]+(d[0]-a[0])/6,b[1]+(d[1]-a[1])/6,d[0]-(e[0]-b[0])/6,d[1]-(e[1]-b[1])/6,...d);}}
  environment(index,camera,visible){const c=this.ctx;c.fillStyle=BG[index];c.fillRect(visible.left,visible.top,visible.right-visible.left,visible.bottom-visible.top);if(index<2||this.textures.environments||this.textures.inkEnvironments){const texture=this.textures.inkEnvironments?.[index]||this.textures.environments?.[index]||(index===0?this.textures.atmosphere:this.textures.paperLight);if(this.textures.environments){const center=this.project([index===1?3:0,0,36],camera),radius=this.fy*30/(36-camera.z);c.drawImage(texture,center[0]-radius*4/3,center[1]-radius,radius*8/3,radius*2);}else c.drawImage(texture,0,0,this.width,this.height);this.drawCalls++;}if(index===0){const p=this.portalSpec(0),center=this.project([p.x,p.y,p.z+1],camera),d=p.z+1-camera.z;if(d>.2){const r=Math.min(this.height*2,this.fy*7/d);c.drawImage(this.textures.castLight,center[0]-r,center[1]-r,r*2,r*2);this.drawCalls++;}}this.drawCalls++;}
  apertureCovers(points,rect){const inside=p=>{let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};for(const x of[rect.left-3,(rect.left+rect.right)/2,rect.right+3])for(const y of[rect.top-3,(rect.top+rect.bottom)/2,rect.bottom+3])if(!inside([x,y]))return false;return true;}
  layer(index,camera,visible,phase,parent=null,ancestors=[]){const c=this.ctx,portal=index<2?this.portalSpec(index):null;let aperture=null,region=null,covers=false;if(portal&&portal.z-camera.z>.135){aperture=this.aperture(portal,camera,phase);region=this.intersection(this.bounds(aperture),visible);covers=!!region&&this.apertureCovers(aperture,visible);}if(!covers){this.environment(index,camera,visible);this.geometry(index,camera,visible);this.life?.view(index,camera,visible,portal,aperture,ancestors);}if(!region)return;
   const childClip=this.isInk&&portal.z-camera.z>=this.portalNearLimit(portal)?this.aperture({...portal,rx:portal.rx*.94,ry:portal.ry*.94,z:portal.z+.48},camera,phase):aperture;c.save();this.curve(aperture);c.clip();this.layer(index+1,{x:camera.x-portal.x,y:camera.y-portal.y,z:camera.z-portal.z},region,phase,childClip,[...ancestors,{index,camera:{...camera},portal,clip:childClip}]);c.restore();const inner=this.portalSurface(index,portal,camera,visible,phase,parent);if(!covers)this.rims.push({points:inner||aperture,parent,region,index,distance:portal.z-camera.z,phase});
   c.save();this.curve(aperture);c.clip();this.geometry(index,camera,region,portal.z-.03);c.restore();
  }
  portalNearLimit(portal){return .85+(portal.z<10?.38:.30)*portal.rx*1.16+(portal.z<10?.10:.11)*portal.ry*1.16;}
  portalBody(portal,camera,visible,phase,motion=0){
   const near=this.portalNearLimit(portal);if(!this.isInk||portal.z-camera.z<near)return null;
   const c=this.ctx,fade=clamp((portal.z-camera.z-near)/.85);
   const rim=this.aperture(portal,camera,phase),back=this.aperture({...portal,rx:portal.rx*.94,ry:portal.ry*.94,z:portal.z+.48},camera,phase),bounds=this.bounds(rim);
   if(!this.intersection(bounds,visible))return null;
   // A faint, luminous interior joins the separated skins. There is no solid
   // hoop: the source and destination remain visible through these surfaces.
   const haze=c.createLinearGradient(bounds.left,bounds.top,bounds.right,bounds.bottom);
   haze.addColorStop(0,'#bafcf0');haze.addColorStop(.43,'#ab9add');haze.addColorStop(1,'#36bccd');
   c.save();this.curve(rim);this.curve(back,true,true);c.fillStyle=haze;c.globalAlpha=.16*fade;c.fill('evenodd');c.restore();this.drawCalls++;
   // Tapered spectral skins have distinct depths and incomplete silhouettes.
   // Gaps between them expose the world, while two cross the aperture edge.
   const skins=[
    {a:-1.58,l:2.00,z:.82,w:.11,r:.98,col:'#86dcf1',alpha:.26},
    {a:1.32,l:2.52,z:.54,w:.15,r:1.015,col:'#c9a8f5',alpha:.20},
    {a:3.72,l:1.82,z:-.24,w:.11,r:.97,col:'#c9fff3',alpha:.36},
    {a:-.38,l:1.36,z:-.11,w:.10,r:1.01,col:'#6ff1e3',alpha:.30},
    {a:2.08,l:1.10,z:.12,w:.075,r:.96,col:'#f2c9f7',alpha:.31},
    {a:4.52,l:1.14,z:.38,w:.09,r:1.035,col:'#c6caff',alpha:.24}
   ];
   for(const [k,skin] of skins.entries()){
    const outer=[],inner=[],n=32;
    for(let i=0;i<=n;i++){
     const t=i/n,drift=.085*Math.sin(motion*.65+k*1.7),a=skin.a+skin.l*t+drift,taper=Math.sin(Math.PI*t)**.8,bend=.12*Math.sin(a*2+.6)+.24*Math.sin(motion*.8+k*1.4)*taper;
     outer.push(this.project(this.portalPoint(portal,a,phase,skin.r+skin.w*taper,skin.z+bend),camera));
     inner.push(this.project(this.portalPoint(portal,a,phase,skin.r-.035*taper,skin.z+.13+bend),camera));
    }
    if(!this.intersection(this.bounds(outer),visible))continue;
    c.save();this.curve([...outer,...inner.reverse()]);const g=c.createLinearGradient(outer[0][0],outer[0][1],outer[n][0],outer[n][1]);g.addColorStop(0,'rgba(120,190,240,0)');g.addColorStop(.38,skin.col);g.addColorStop(.65,skin.col);g.addColorStop(1,'rgba(180,220,255,0)');c.fillStyle=g;c.globalAlpha=skin.alpha*fade;c.fill();
    this.openCurve(outer);c.strokeStyle=g;c.lineWidth=.85;c.globalAlpha=Math.min(.72,skin.alpha*2)*fade;c.stroke();c.restore();this.drawCalls+=2;
   }
   // Loose filaments bow in front of and behind the tear, rather than making
   // concentric graphic outlines. Independent depth flex makes their relative
   // overlap change without disturbing the aperture or camera.
   for(const [start,length,depth,color,alpha]of [[-.9,1.75,-.28,'#d6fff9',.62],[1.1,1.6,.95,'#9ba9ee',.42],[3.15,1.38,.38,'#e8baff',.55],[4.6,1.02,-.14,'#9ffff0',.70]]){
    const points=Array.from({length:34},(_,i)=>{const t=i/33,a=start+length*t+.07*Math.sin(motion*.58+start),scale=1.055+(.045+.018*Math.sin(motion*.8+start))*Math.sin(t*Math.PI);return this.project(this.portalPoint(portal,a,phase,scale,depth+.22*Math.sin(t*Math.PI*2)+.22*Math.sin(motion*.64+start)*Math.sin(t*Math.PI)),camera);});
    if(!this.intersection(this.bounds(points),visible))continue;c.save();this.openCurve(points);c.strokeStyle=color;c.globalAlpha=alpha*fade;c.lineWidth=.65;c.stroke();c.restore();this.drawCalls++;
   }
   // A short luminous seam travels over the near skin. Its broad, low-alpha
   // reflection is local to the tear; no full-screen glow or blur is used.
   const head=motion*.36-.7,trace=Array.from({length:18},(_,i)=>{const a=head+(i/17-.5)*.48;return this.project(this.portalPoint(portal,a,phase,1.06,-.23+.11*Math.sin(a*2)),camera);});
   c.save();this.openCurve(trace);const light=c.createLinearGradient(...trace[0],...trace[17]);light.addColorStop(0,'rgba(204,255,247,0)');light.addColorStop(.5,'#e9fffa');light.addColorStop(1,'rgba(204,255,247,0)');c.strokeStyle=light;c.lineWidth=8;c.globalAlpha=.08*fade;c.stroke();c.lineWidth=1.4;c.globalAlpha=.83*fade;c.stroke();c.restore();this.drawCalls+=2;
   return back;
  }
  // One monotonic clock owns every environmental phase. Loop timestamps only
  // pace paint work; changing rendering surfaces never changes simulation time.
  advanceActivity(now){
   if(!this.motionAllowed||document.hidden){this.activityLast=null;return;}
   now=Math.max(this.activityLast??0,this.activityStamp??now);
   if(this.activityLast!==null)this.activityTime+=Math.max(0,(now-this.activityLast)/1000);
   this.activityLast=now;this.motionTime=this.activityTime;if(this.life)this.life.time=this.activityTime;
  }
  setMotionEnabled(enabled){
   const allowed=!!enabled&&this.isInk;
   if(allowed!==this.motionAllowed){if(this.motionAllowed)this.advanceActivity(performance.now());this.activityLast=allowed?performance.now():null;}
   this.motionAllowed=allowed;this.life?.enable(allowed);
   if(!allowed){this.lastFrame=0;this.previousWasTravel=false;this.cancelSettle();this.stopContinuation();this.stopMotion();if(this.motionCanvas&&this.motionCanvas.style.display!=='none')this.motionCanvas.style.display='none';}
  }
  stopContinuation(){if(this.continuationTimer)clearTimeout(this.continuationTimer);if(this.continuationRAF)cancelAnimationFrame(this.continuationRAF);this.continuationTimer=this.continuationRAF=0;}
  scheduleContinuation(){
   if(this.continuationTimer||this.continuationRAF||!this.travel||!this.motionAllowed||document.hidden)return;
   // Fill only gaps between native camera paints. Preparation remains alive;
   // these frames never allocate activity patches or rebuild their masks.
   const interval=1000/30;
   this.continuationTimer=setTimeout(()=>{this.continuationTimer=0;this.continuationRAF=requestAnimationFrame(()=>{
    this.continuationRAF=0;if(!this.travel||!this.motionAllowed||document.hidden){if(document.hidden)this.activityLast=null;return;}
    if(performance.now()-this.lastFrame>=interval-1&&(!this.continuationGuard||this.continuationGuard()))this.draw(this.lastState,false,false,true);
    this.scheduleContinuation();
   });},Math.max(0,interval-(performance.now()-this.lastFrame)-4));
  }
  cancelSettle(){
   if(this.settleTimer)clearTimeout(this.settleTimer);this.settleTimer=0;
   this.settleGeneration=(this.settleGeneration||0)+1;this.life?.cancelPrepare();
  }
  requestSettle(delay=140){
   if(!this.travel)return;
   this.cancelSettle();if(!this.motionAllowed||document.hidden||!this.lastState)return;
   const generation=this.settleGeneration,state=this.lastState;
   const valid=()=>generation===this.settleGeneration&&state===this.lastState&&this.motionAllowed&&!document.hidden&&(!this.settleGuard||this.settleGuard());
   this.settleTimer=setTimeout(()=>{this.settleTimer=0;if(!valid()){if(generation===this.settleGeneration&&state===this.lastState)this.onSettleBlocked?.();return;}
    if(this.life)this.life.prepare(()=>{if(valid())this.draw(state,true,true);},valid);
    else if(valid())this.draw(state,true);
   },delay);
  }
  stopMotion(){
   if(this.motionTimer){clearTimeout(this.motionTimer);this.motionTimer=0;}
   if(this.motionRAF){cancelAnimationFrame(this.motionRAF);this.motionRAF=0;}
   this.motionLast=0;
   if(this.motionCanvas&&this.motionCanvas.dataset.running!=='false')this.motionCanvas.dataset.running='false';
  }
  portalSurface(index,portal,camera,visible,phase,parent){
   const distance=portal.z-camera.z;
   if(!this.travel&&this.motionAllowed&&index===this.rootWorld&&!parent&&distance>this.portalNearLimit(portal)){
    const extent=[];for(const depth of[-.85,1.5])for(let i=0;i<48;i++)extent.push(this.project(this.portalPoint(portal,i/48*Math.PI*2,phase,1.27,depth),camera));
    const bound=this.bounds(extent),patch=this.intersection({left:Math.floor(bound.left-5),top:Math.floor(bound.top-5),right:Math.ceil(bound.right+5),bottom:Math.ceil(bound.bottom+5)},visible);
    // Clip the localized surface to the viewport. Large visible rims keep
    // their phase too; size alone must not freeze a living boundary.
    if(patch&&patch.right-patch.left>4&&patch.bottom-patch.top>4){
     this.motionPlan={index,portal,camera:{...camera},visible,phase,patch};
     return this.aperture({...portal,rx:portal.rx*.94,ry:portal.ry*.94,z:portal.z+.48},camera,phase);
    }
   }
   return this.portalBody(portal,camera,visible,phase,this.motionTime);
  }
  updateMotionPatch(){
   const p=this.motionPlan;
   if(this.motionTimer){clearTimeout(this.motionTimer);this.motionTimer=0;}if(this.motionRAF){cancelAnimationFrame(this.motionRAF);this.motionRAF=0;}
   if(!p){this.stopMotion();if(this.motionCanvas&&this.motionCanvas.style.display!=='none')this.motionCanvas.style.display='none';return;}
   if(!this.motionCanvas){
    const el=document.createElement('canvas');el.id='portal-life';el.setAttribute('aria-hidden','true');el.style.cssText='position:absolute;z-index:-1;pointer-events:none;contain:strict';this.canvas.parentElement.insertBefore(el,this.svg);
    this.motionCanvas=el;this.motionCtx=el.getContext('2d');this.occlusionCanvas=document.createElement('canvas');this.occlusionCtx=this.occlusionCanvas.getContext('2d');
   }
   const {left,top,right,bottom}=p.patch,w=right-left,h=bottom-top,el=this.motionCanvas,ratio=this.ratio;
   const pw=Math.ceil(w*ratio),ph=Math.ceil(h*ratio);
   if(el.width!==pw||el.height!==ph){el.width=this.occlusionCanvas.width=pw;el.height=this.occlusionCanvas.height=ph;}
   el.style.left=left+'px';el.style.top=top+'px';el.style.width=w+'px';el.style.height=h+'px';el.style.display='block';
   // Cache source-world foreground alpha only when the scroll/layout changes.
   // Each animation tick applies this small mask, preserving front/back overlap.
   const original=this.ctx,c=this.occlusionCtx;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,pw,ph);c.setTransform(ratio,0,0,ratio,-left*ratio,-top*ratio);this.ctx=c;
   this.geometry(p.index,p.camera,p.patch,p.portal.z-.03,true);this.ctx=original;
   this.paintPortalMotion(performance.now());this.scheduleMotion();
  }
  paintPortalMotion(now){
   const p=this.motionPlan;if(!p||!this.motionAllowed)return;
   const start=performance.now(),last=this.motionLast;
   this.advanceActivity(now);if(last){const dt=now-last;this.motionIntervals.push(dt);if(this.motionIntervals.length>120)this.motionIntervals.shift();}
   this.motionLast=now;
   const c=this.motionCtx,el=this.motionCanvas,{left,top}=p.patch,original=this.ctx,drawCalls=this.drawCalls;
   c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,el.width,el.height);c.setTransform(this.ratio,0,0,this.ratio,-left*this.ratio,-top*this.ratio);this.ctx=c;
   this.portalBody(p.portal,p.camera,p.visible,p.phase,this.motionTime);
   c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='destination-out';c.drawImage(this.occlusionCanvas,0,0);c.globalCompositeOperation='source-over';this.ctx=original;this.drawCalls=drawCalls;
   const cost=performance.now()-start;this.motionSamples.push(cost);if(this.motionSamples.length>120)this.motionSamples.shift();this.motionFrames++;
   if(this.motionFrames%30===0){const costs=[...this.motionSamples].sort((a,b)=>a-b);this.motionCadence=costs[Math.floor(costs.length*.9)]>5?20:30;}
   if(el.dataset.running!=='true')el.dataset.running='true';if(this.motionFrames%15===0||this.motionFrames===1)el.dataset.performance=JSON.stringify(this.motionMetrics());
  }
  scheduleMotion(){
   if(this.motionTimer||this.motionRAF||!this.motionAllowed||!this.motionPlan||document.hidden)return;
   const delay=Math.max(0,1000/this.motionCadence-(performance.now()-this.motionLast)-6);
   this.motionTimer=setTimeout(()=>{this.motionTimer=0;this.motionRAF=requestAnimationFrame(now=>{this.motionRAF=0;if(!this.motionAllowed||!this.motionPlan||document.hidden){this.stopMotion();return;}if(now-this.motionLast>=1000/this.motionCadence-1)this.paintPortalMotion(now);this.scheduleMotion();});},delay);
  }
  motionMetrics(){const summary=values=>{const a=[...values].sort((x,y)=>x-y);return{median:a.length?+a[Math.floor(a.length*.5)].toFixed(2):0,p95:a.length?+a[Math.min(a.length-1,Math.floor(a.length*.95))].toFixed(2):0,samples:a.length};};return{frames:this.motionFrames,worldFrames:this.frames,drawMs:summary(this.motionSamples),intervalMs:summary(this.motionIntervals),cadenceLimit:this.motionCadence,patchPixels:this.motionCanvas?this.motionCanvas.width*this.motionCanvas.height:0,worldPixels:this.canvas.width*this.canvas.height};}
  draw(state,settled=false,prepared=false,continuation=false){
   const started=performance.now();this.activityStamp=started;try{this.advanceActivity(started);this.lastState=state;this.travel=!settled;
   if(!continuation)this.cancelSettle();
   if(settled)this.stopContinuation();
   if(this.travel&&!continuation){this.stopMotion();if(this.motionCanvas&&this.motionCanvas.style.display!=='none')this.motionCanvas.style.display='none';this.life?.suspend();}
   this.frames++;this.phase=state.phase;this.rootWorld=state.world;this.canvas.dataset.phase=state.phase.toFixed(4);this.drawCalls=0;this.rims=[];this.motionPlan=null;this.life?.begin();
   const c=this.ctx;c.setTransform(this.ratio,0,0,this.ratio,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.lineJoin='round';c.lineCap='butt';
   this.layer(state.world,state.camera,{left:0,top:0,right:this.width,bottom:this.height},state.phase);
   const worldEnd=performance.now();this.paintMembranes();const edgeEnd=performance.now();
   if(settled){this.updateMotionPatch();if(prepared)this.life?.activate();else this.life?.update();}
   const end=performance.now();this.stageSamples.push({world:worldEnd-started,edge:edgeEnd-worldEnd,activity:end-edgeEnd,total:end-started,settled,continuation});if(this.stageSamples.length>160)this.stageSamples.shift();
   this.samples.push(end-started);if(this.samples.length>120)this.samples.shift();if(this.lastFrame&&this.previousWasTravel&&!settled)this.intervals.push(started-this.lastFrame);if(this.intervals.length>120)this.intervals.shift();this.lastFrame=started;this.previousWasTravel=!settled;
   if(this.frames%8===0||this.frames===1)this.canvas.dataset.performance=JSON.stringify(this.metrics());
   if(continuation){this.continuationFrames++;this.continuationSamples.push(end-started);if(this.continuationSamples.length>120)this.continuationSamples.shift();}
   if(!settled){this.scheduleContinuation();if(!continuation&&!this.managedSettle)this.requestSettle();}
   }finally{this.activityStamp=null;}
  }
  metrics(){const summary=values=>{if(!values.length)return{median:0,p95:0,samples:0};const a=[...values].sort((a,b)=>a-b);return{median:+a[Math.floor(a.length*.5)].toFixed(2),p95:+a[Math.min(a.length-1,Math.floor(a.length*.95))].toFixed(2),samples:a.length};};return{renderer:'canvas-2d',activityTime:this.activityTime,continuationFrames:this.continuationFrames,continuationDrawMs:summary(this.continuationSamples),stages:this.stageSamples.length?this.stageSamples[this.stageSamples.length-1]:null,travelFrames:this.stageSamples.filter(s=>!s.settled).length,drawMs:summary(this.samples),activeFrameIntervalMs:summary(this.intervals),frames:this.frames,drawCommands:this.drawCalls,canvas:[this.canvas.width,this.canvas.height],effectivePixelRatio:+this.ratio.toFixed(2)};}
 }
 window.RealmRenderer=RealmRenderer;
})();
