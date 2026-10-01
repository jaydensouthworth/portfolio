/* Ink & Signal: cartoon color currents, a suspended mineral horizon, then a phosphor signature.
   The exit is z=16. Distant sheets remain beyond it; near scenery is confined
   to x>=3, safely right of the complete approach and aperture sight cone. */
(() => {
 const world=()=>({faces:[],lines:[],dots:[],sprites:[]});
 const color=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*Math.max(0,Math.min(1,t))));
 const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 const face=(w,points,c,extra={})=>w.faces.push({points,color:typeof c==='string'?rgb(c):c,z:points.reduce((s,p)=>s+p[2],0)/points.length,...extra});
 const line=(w,points,c,alpha=.65,width=1)=>w.lines.push({points,color:c,alpha,width});
 const texture=(r,key,w,h,paint)=>{if(r.textures[key])return r.textures[key];const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'));r.textures[key]=c;return c;};
 window.REALM_INK_WORLDS=(r,entry)=>{
  const paper=world(),signal=world(),mobile=r.width<=760;
  // Clean, cartoon-like color currents replace the print-sheet opening.
  // Each authored cubic silhouette is on a separate depth plane. The curves
  // project natively at device resolution, without textures, filters or a loop.
  entry.curves=[];
  // The background itself is colored: broad cel-shaded currents replace the
  // old near-black atmosphere. All shadows remain in the blue/violet family.
  const colorField=(points,z,fill)=>entry.curves.push({points:points.map(([x,y])=>[(x*r.width-r.width/2)*z/r.fx,(r.height/2-y*r.height)*z/r.fy,z]),z,color:fill,edge:fill,width:0.01});
  colorField([[-.2,-.2],[.3,-.25],[.9,-.1],[1.2,-.2],[1.4,.2],[.76,.32],[.49,.09],[.13,-.09],[.29,.47],[-.2,.55],[-.3,.34],[-.3,.10],[-.2,-.2]],48,'#465fa6');
  colorField([[-.2,.58],[.06,.72],[.32,.32],[.56,.49],[.80,.68],[.38,.83],[.65,1.2],[.25,1.25],[-.2,1.2],[-.2,.58]],41,'#51439a');

  const flow=[[-.22,1.30],[-.02,1.12],[.26,1.25],[.50,.96],[.73,.73],[.58,.43],[.82,.22],[1.02,.03],[1.24,.19],[1.19,.41],[1.13,.67],[.93,.78],[1.23,1.10],[1.32,1.40],[.10,1.48],[-.22,1.30]];
  const addFlow=(depth,dx,dy,sx,sy,fill,edge,width=0.07)=>{
   const points=flow.map(([x,y])=>[((x*sx+dx)*r.width-r.width/2)*depth/r.fx,(r.height/2-(y*sy+dy)*r.height)*depth/r.fy,depth]);
   entry.curves.push({points,z:depth,color:fill,edge,width});
  };
  // Unequal widths and staggered ends give the waves a drawn rhythm. The
  // cyan edge and hot-pink curl repeat the exact letter-shadow colors.
  addFlow(33,-.045,-.08,1.10,1.01,'#5c3c96','#4a367d');
  addFlow(30,-.012,-.035,1.05,1.01,'#8151ca','#4b337b');
  addFlow(28,.003,.009,1.01,.99,'#38d1df','#3f438d');
  addFlow(26,.021,.037,1.00,.985,'#46599e','#4b367f');
  addFlow(24,.050,.071,.985,.99,'#df31c4','#7041a2');
  addFlow(22,.062,.091,.99,1.00,'#f25ba9','#943882',.055);
  addFlow(20,.090,.128,.99,1.01,'#754192','#59347d');
  // A small counter-current from the upper-left prevents a stock concentric
  // rainbow. It shares the same smooth geometry, cropped off the canvas edge.
  const curl=[[-.23,.00],[-.07,-.04],[.025,.03],[-.012,.16],[-.05,.31],[-.17,.25],[-.16,.38],[-.10,.48],[-.32,.48],[-.23,.00]];
  for(const [z,offset,col]of[[31,0,'#9463d4'],[29,-.027,'#49dbe2'],[27,-.058,'#49599c']]){
   const points=curl.map(([x,y])=>[((x+offset)*r.width-r.width/2)*z/r.fx,(r.height/2-y*r.height)*z/r.fy,z]);
   entry.curves.push({points,z,color:col,edge:'#54418f',width:.05});
  }

  // One curl of the source world's cyan/pink material crosses the suspended
  // tear. Separate depths make the boundary occlude its rear strand while
  // the near strand overlaps the opening. The central travel path stays clear.
  const tear=r.portalSpec(0);
  const wake=[[.78,.88],[.93,.95],[1.15,.55],[1.02,.18],[.96,-.06],[.88,-.18],[.91,-.42],[.85,-.09],[.94,.05],[.93,.24],[.98,.55],[.87,.82],[.78,.88]];
  for(const [z,dx,fill,edge]of [[9.15,.025,'#df80cf','#9863b6'],[7.18,0,'#72e2e4','#52629e']]){
   entry.curves.push({spatialWake:true,points:wake.map(([x,y])=>[(tear.x+(x+dx)*tear.rx*(1-(tear.taper||0)*Math.max(0,y))+(tear.shear||0)*y*tear.ry)*z/tear.z,(tear.y+y*tear.ry)*z/tear.z,z]),z,color:fill,edge,width:.018});
  }

  // These are continuous volumes, not billboards: the color currents begin
  // behind the viewer, turn through the near field and disappear into the
  // distance. Their cropped cross-sections imply a world outside the frame.
  const volume=(w,center,radius,base,light,n=44)=>{
   const at=(t,a)=>{const p=center(t),twist=t*1.35;return[p[0]+Math.cos(a+twist)*radius,p[1]+Math.sin(a+twist)*radius*.62,p[2]+Math.sin(a+twist)*radius*.26];};
   for(let i=0;i<n;i++)for(let side=0;side<8;side++){
    const t=i/n,u=(i+1)/n,a=side/8*Math.PI*2,b=(side+1)/8*Math.PI*2,p=at(t,a),q=at(u,a),s=at(u,b),v=at(t,b);
    const shade=angle=>color(rgb(base),rgb(light),.12+.84*Math.max(0,Math.sin(angle+.65)));
    face(w,[p,q,s,v],shade(a),{surround:true,gradient:{from:p,to:v,colors:[shade(a),shade(b)]}});
   }
  };
  const nearCurrent=t=>[-3.6-18*t+2*Math.sin(t*Math.PI),-3.3-5*t+7*Math.sin(t*Math.PI*.85),-7+70*t];
  volume(entry,nearCurrent,1.20,'#65439d','#d393e5',38);
  const currentSurface=(t,a)=>{const c=nearCurrent(t),q=a+t*1.35,radius=1.218;return[c[0]+Math.cos(q)*radius,c[1]+Math.sin(q)*radius*.62,c[2]+Math.sin(q)*radius*.26];};
  line(entry,Array.from({length:39},(_,i)=>currentSurface(.09+i/38*.80,.28)),'#69dce2',.73,1.05);
  line(entry,Array.from({length:14},(_,i)=>currentSurface(.22+i/13*.21,1.08)),'#f293d6',.68,.95);
  volume(entry,t=>[-4.8-14*t,5.1+2.8*Math.sin(t*Math.PI)-4*t,-9+74*t],.68,'#46579e','#8ce5e7',34);

  // The suspended horizon: one celestial-scale instrument, with a shaded
  // ceramic core and three incomplete orbital surfaces. Everything remains
  // beyond the exit plane, so its impossible scale never blocks the crossing.
  const coreX=mobile?12:-4.5,coreY=mobile?4:5,coreScale=mobile?1.32:1;
  const core=r.textures['ink-horizon-upper']&&r.textures['ink-horizon-lower']?null:texture(r,'ink-horizon-core',900,900,c=>{c.scale(900/1100,900/1100);
   c.save();c.beginPath();c.arc(550,550,510,0,Math.PI*2);c.clip();
   const body=c.createRadialGradient(325,255,25,590,590,700);
   body.addColorStop(0,'#fff3c9');body.addColorStop(.22,'#efbd6c');body.addColorStop(.52,'#cc7650');body.addColorStop(.76,'#743348');body.addColorStop(1,'#381a3a');c.fillStyle=body;c.fillRect(0,0,1100,1100);
   // A curved terminator, with a narrow luminous boundary. The lower half is
   // another material, not an image pasted on the surface.
   c.beginPath();c.moveTo(-40,620);c.bezierCurveTo(220,735,680,680,1140,335);c.lineTo(1140,1140);c.lineTo(-40,1140);c.closePath();
   const dark=c.createLinearGradient(240,610,770,1100);dark.addColorStop(0,'#5c2441');dark.addColorStop(.5,'#391830');dark.addColorStop(1,'#1b1125');c.fillStyle=dark;c.fill();
   c.beginPath();c.moveTo(-40,620);c.bezierCurveTo(220,735,680,680,1140,335);c.strokeStyle='#ffdc9b';c.lineWidth=5;c.stroke();
   c.beginPath();c.moveTo(-40,633);c.bezierCurveTo(220,748,680,693,1140,348);c.strokeStyle='#e593ab';c.lineWidth=2;c.stroke();
   // Sparse, deliberately drawn contour bands make curvature legible.
   for(let i=0;i<7;i++){c.beginPath();c.ellipse(495,515,485-i*19,120+i*35,-.28,3.5,5.95);c.strokeStyle='rgba(255,224,165,'+(.1-i*.009)+')';c.lineWidth=1.1;c.stroke();}
   // Broad copper seams belong to the curved material, rather than a
   // particle layer in front of it. They repeat on the small visible horizon.
   for(const [offset,alpha,width] of [[0,.30,15],[36,.19,6],[83,.14,3]]){
    c.beginPath();c.moveTo(95,465-offset);c.bezierCurveTo(260,250-offset,580,420-offset,805,160-offset*.3);c.strokeStyle='rgba(255,216,140,'+alpha+')';c.lineWidth=width;c.stroke();
   }
   c.beginPath();c.moveTo(550,693);c.bezierCurveTo(575,780,725,755,800,953);c.strokeStyle='rgba(243,126,94,.35)';c.lineWidth=3;c.stroke();
   const rim=c.createLinearGradient(170,100,920,980);rim.addColorStop(0,'#fff1be');rim.addColorStop(.42,'#f6af62');rim.addColorStop(1,'#a74a52');c.beginPath();c.arc(550,550,507,0,Math.PI*2);c.strokeStyle=rim;c.lineWidth=5;c.stroke();c.restore();
  });
  const upperCore=texture(r,'ink-horizon-upper',900,900,c=>{c.scale(900/1100,900/1100);c.beginPath();c.moveTo(-40,620);c.bezierCurveTo(220,735,680,680,1140,335);c.lineTo(1140,-40);c.lineTo(-40,-40);c.closePath();c.clip();c.drawImage(core,0,0,1100,1100);});
  const lowerCore=texture(r,'ink-horizon-lower',900,900,c=>{c.scale(900/1100,900/1100);c.beginPath();c.moveTo(-40,620);c.bezierCurveTo(220,735,680,680,1140,335);c.lineTo(1140,1140);c.lineTo(-40,1140);c.closePath();c.clip();c.drawImage(core,0,0,1100,1100);});
  delete r.textures['ink-horizon-core'];
  paper.sprites.push({texture:upperCore,x:coreX-.3,y:coreY+.6,z:42,w:25*coreScale,h:25*coreScale,angle:-.09,alpha:1});
  paper.sprites.push({texture:lowerCore,x:coreX+1,y:coreY-1.2,z:43,w:25*coreScale,h:25*coreScale,angle:-.09,alpha:1});
  // A complete smaller horizon occupies the incoming aperture's sightline.
  // It remains in the same world after arrival; the larger companion reveals
  // the scale of that world as the surrounding field opens up.
  const previewZ=mobile?24:36,previewX=tear.x*previewZ/tear.z,previewY=tear.y*previewZ/tear.z;
  const previewR=.46*Math.min(tear.rx,tear.ry)*(previewZ+tear.z)/tear.z,previewSize=previewR*2;
  paper.sprites.push({texture:upperCore,x:previewX-previewR*.024,y:previewY+previewR*.046,z:previewZ,w:previewSize,h:previewSize,angle:-.09,alpha:1});
  paper.sprites.push({texture:lowerCore,x:previewX+previewR*.08,y:previewY-previewR*.092,z:previewZ+.22,w:previewSize,h:previewSize,angle:-.09,alpha:1});
  const previewOrbit=(a,edge)=>[previewX+Math.cos(a)*(previewR*1.44+edge),previewY+Math.sin(a)*(previewR*.58+edge*.45)+Math.cos(a)*previewR*.16,previewZ+Math.sin(a)*previewR*.56];
  for(let i=0;i<48;i++){const a=-.75+i/48*5.65,b=-.75+(i+1)/48*5.65,p=previewOrbit(a,0),q=previewOrbit(b,0);face(paper,[p,q,previewOrbit(b,previewR*.13),previewOrbit(a,previewR*.13)],color([98,43,71],[255,219,156],.5+.5*Math.sin(a+.4)));}
  line(paper,Array.from({length:65},(_,i)=>previewOrbit(-.75+i/64*5.65,previewR*.13)),'#ffd99a',.55,.85);

  const orbit=(a,v,layer,back=0)=>{
   const radius=13.1+layer*4.4+v,co=Math.cos(a),si=Math.sin(a);
   return[coreX+co*radius*coreScale,coreY+(si*radius*.63+co*3.0)*coreScale,39+si*radius*.50+layer*2.8+back];
  };
  const shade=(a,layer)=>color(layer===1?[98,40,66]:[69,34,60],layer===1?[248,169,80]:[244,216,180],.17+.80*Math.pow(.5+.5*Math.sin(a+.55),.7));
  for(let layer=1;layer>=0;layer--){
   const n=layer===0?64:48,start=layer===1?-.32:-1.12,end=layer===1?4.50:4.84,width=layer===0?2.5:layer===1?1.1:1.8;
   for(let i=0;i<n;i++){
    const a=start+(end-start)*i/n,b=start+(end-start)*(i+1)/n,p=orbit(a,0,layer),q=orbit(b,0,layer),u=orbit(b,width,layer),v=orbit(a,width,layer);
    face(paper,[p,q,u,v],shade(a,layer),{gradient:{from:p,to:q,colors:[shade(a,layer),shade(b,layer)]}});
    face(paper,[p,orbit(a,0,layer,.42),orbit(b,0,layer,.42),q],layer===1?'#71344a':'#382039');
   }
   for(const edge of[0,width])line(paper,Array.from({length:n+1},(_,i)=>orbit(start+(end-start)*i/n,edge,layer)),layer===1?'#ffc36a':'#ffe6b8',layer===0?.7:.34,1);
   for(const a of[start,end])face(paper,[orbit(a,0,layer),orbit(a,width,layer),orbit(a,width,layer,.42),orbit(a,0,layer,.42)],'#d4a488');
  }
  // The separated rose orbit catches the amber light and joins the warm
  // mineral material to its plum shadows.
  line(paper,Array.from({length:97},(_,i)=>{const a=-.8+i/96*5.1;return[coreX+Math.cos(a)*26*coreScale,coreY+(Math.sin(a)*14+Math.cos(a)*5)*coreScale,49+Math.sin(a)*11];}),'#d08ca7',.55,1.35);

  // Gravity strata bend below the horizon. They have no floor grid or
  // shared architectural horizon: this world has a different spatial rule.
  paper.curves=[];
  for(const [z,dy,fill,edge]of [[66,-8,'#37203c','#713d58'],[56,-11,'#4c263f','#bd785d'],[47,-14,'#271a32','#8f5162']]){
   const xy=[[-42,dy],[-20,dy+11],[3,dy-2],[17,dy+7],[30,dy+13],[38,dy+7],[48,dy+19],[54,dy-30],[-48,dy-30],[-42,dy]];
   paper.curves.push({points:xy.map(([x,y])=>[x,y,z]),z,color:fill,edge,width:.075});
  }

  // A mineral stratum curves underneath and around the viewer. Its two ends
  // continue behind the camera; the central path to the exit remains open.
  // Its height is well below the doorway's complete sight cone.
  const shelf=(a,edge,drop=0)=>[(18+edge)*Math.cos(a),-9.5+Math.sin(a*2)*.55-drop,8+(18+edge)*Math.sin(a)];
  for(let i=0;i<64;i++){
   const a=-Math.PI*.85+i/64*Math.PI*1.95,b=-Math.PI*.85+(i+1)/64*Math.PI*1.95,p=shelf(a,0),q=shelf(b,0),u=shelf(b,3.4),v=shelf(a,3.4);
   face(paper,[p,q,u,v],'#c48666',{surround:true,gradient:{from:p,to:v,colors:['#efb978','#61384d']}});
   face(paper,[p,shelf(a,0,.58),shelf(b,0,.58),q],'#341b33',{surround:true});
  }

  // Unequal engraved strata and seated mineral facets make the near arch
  // read as a material volume. They share its actual coordinates and depth.
  for(const [start,end,edge,col]of[[-2.2,2.9,.86,'#b88063'],[-1.6,3.2,1.9,'#e1a178'],[-1.95,1.75,2.72,'#713248']]){
   line(paper,Array.from({length:43},(_,i)=>{const p=shelf(start+(end-start)*i/42,edge);return[p[0],p[1]+.025,p[2]];}),col,.62,.85);
  }
  for(const [a,size]of[[.93,.55],[1.57,.8],[2.31,.48],[2.73,.65]]){
   const c=shelf(a,.3),u=[Math.cos(a)*size,0,Math.sin(a)*size],v=[-Math.sin(a)*size*.65,0,Math.cos(a)*size*.65],top=[c[0]+u[0]*.18,c[1]+size*.66,c[2]+u[2]*.18];
   const p=[c.map((n,k)=>n-u[k]),c.map((n,k)=>n+v[k]),c.map((n,k)=>n+u[k]),c.map((n,k)=>n-v[k])];
   for(let i=0;i<4;i++)face(paper,[p[i],p[(i+1)%4],top],['#9b5855','#ebbd83','#bf8161','#592941'][i]);
  }

  // Three nearby cut-glass fins create strong approach parallax on the safe
  // right side. All x >= 3.6; the full exit approach lies left of x=0.
  for(let i=0;i<3;i++){
   const x=4.8+i*2.1,z=12+i*2.6,y=-2+i*5;
   const p=[[x,y,z],[x+7.5,y+4.6,z+5.8],[x+7.5,y+3.35,z+6.2],[x,y-1.25,z+.4]];
   face(paper,p,'#d9a46f',{gradient:{from:p[0],to:p[1],colors:['#9c514e','#ffe8ad']}});
   face(paper,[p[2],p[3],[x-.05,y-1.9,z+.85],[x+7.45,y+2.7,z+6.65]],'#683544');
   line(paper,[p[0],p[1]],'#ffedb5',.78,1.1);
   const inset=(u,v)=>[p[0][0]+(p[1][0]-p[0][0])*u+(p[3][0]-p[0][0])*v,p[0][1]+(p[1][1]-p[0][1])*u+(p[3][1]-p[0][1])*v,p[0][2]+(p[1][2]-p[0][2])*u+(p[3][2]-p[0][2])*v-.025];
   face(paper,[inset(.08,.22),inset(.87,.22),inset(.87,.42),inset(.08,.42)],'#98564c');
   line(paper,[inset(.08,.22),inset(.87,.22)],'#f4ca8b',.65,.8);

  }

  // A cached directional wash gives the surrounding void a color and light
  // source. Broad light shafts are authored once; no blur or noise per frame.
  const mineralLight=texture(r,'ink-mineral-environment',1200,900,c=>{
   const g=c.createLinearGradient(0,0,1200,900);g.addColorStop(0,'#663b4e');g.addColorStop(.38,'#3c203a');g.addColorStop(1,'#1c132c');c.fillStyle=g;c.fillRect(0,0,1200,900);
   const wash=c.createRadialGradient(245,135,15,245,135,820);wash.addColorStop(0,'rgba(255,178,76,.50)');wash.addColorStop(.45,'rgba(202,87,57,.19)');wash.addColorStop(1,'rgba(46,18,41,0)');c.fillStyle=wash;c.fillRect(0,0,1200,900);
   for(const [left,width,alpha] of [[110,160,.075],[385,95,.045]]){const beam=c.createLinearGradient(left,0,left+330,900);beam.addColorStop(0,'rgba(255,208,130,'+alpha+')');beam.addColorStop(1,'rgba(177,76,98,0)');c.fillStyle=beam;c.beginPath();c.moveTo(left,0);c.lineTo(left+width,0);c.lineTo(left+width+470,900);c.lineTo(left+170,900);c.closePath();c.fill();}
  });

  // A monolithic, extruded JS silhouette replaces the isolated pixel sign.
  // Its traces are rooted in the silhouette and bend through several depth planes.
  const center=mobile?0:-6.5,cy=mobile?4.5:.1,z0=24.5,angle=.20;
  const transform=p=>[center+p[0]*Math.cos(angle)+p[2]*Math.sin(angle),cy+p[1],z0-p[0]*Math.sin(angle)+p[2]*Math.cos(angle)];
  const glyphs=[[[ -4.9,4.2],[-.8,4.2],[-.8,-2.3],[-1.2,-3.4],[-2.1,-4],[-3.8,-4],[-4.9,-3.1],[-5.35,-2],[-3.7,-1.3],[-3.3,-2.25],[-2.45,-2.25],[-2.35,-1.8],[-2.35,2.55],[-4.9,2.55]],[[.45,4.2],[4.8,4.2],[5.6,3.5],[5.6,2.5],[3.8,2.5],[3.55,2.8],[2.1,2.8],[1.7,2.4],[1.7,1.35],[2.15,.95],[4.35,.4],[5.55,-.65],[5.55,-2.65],[4.6,-3.85],[.4,-3.85],[-.35,-2.9],[-.35,-1.8],[1.4,-1.8],[1.65,-2.3],[3.4,-2.3],[3.75,-1.95],[3.75,-1.2],[3.3,-.85],[1.05,-.25],[-.1,.85],[-.1,2.85]]];
  for(const poly of glyphs){
   const front=poly.map(([x,y])=>transform([x,y,0]));
   face(signal,front,'#80e9da',{gradient:{from:transform([-5,4,0]),to:transform([6,-4,0]),colors:['#d6ffd8','#28b986']}});
   for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],p=[transform([...a,0]),transform([...b,0]),transform([...b,1.15]),transform([...a,1.15])];face(signal,p,i%3===0?'#125248':'#06332e');}
   line(signal,[...front,front[0]],'#ccfff0',.7,1.05);

  }
  const trace=(start,side,i)=>{
   const p=transform([start[0],start[1],.12]),reach=side*(5.2+i*.5),points=[p,[p[0]+side*1.2,p[1],p[2]+2],[p[0]+side*2.2,p[1]+(i%2?1:-1)*1.3,p[2]+3],[p[0]+reach,p[1]+(i%2?1:-1)*1.3,30+i*.85],[p[0]+reach+side*2.4,p[1]+(i%2?1:-1)*3.1,35+i*.85]];
   line(signal,points,i%3===0?'#07bccc':'#00ff9f',.6,i%3===0?1.4:.85);
   if(i%2===0)(signal.pulses||(signal.pulses=[])).push({points,color:i%3?'#bdffe2':'#bfefff',offset:i*.13+(side>0?.35:0)});
   const end=points[points.length-1];signal.dots.push({p:end,r:.075,color:'#b9ffdf'});
   for(let k=1;k<points.length-1;k++)signal.dots.push({p:points[k],r:.045,color:'#00ccff'});
  };
  for(let i=0;i<7;i++){trace([-4.9,3.4-i*.95],-1,i);trace([5.5,3.2-i*.9],1,i);}
  const atmosphere=texture(r,'ink-signal-atmosphere',1200,900,c=>{c.fillStyle='#000420';c.fillRect(0,0,1200,900);const g=c.createRadialGradient(360,280,40,360,280,740);g.addColorStop(0,'#0b493d');g.addColorStop(.42,'#042b31');g.addColorStop(1,'#000420');c.fillStyle=g;c.fillRect(0,0,1200,900);});
  // Each world's activity uses the same persistent coordinates when seen
  // through the tear and after crossing. No camera or background animation.
  const life=window.INK_LIFE_ART;
  if(life){
   const near=mobile?[[.10,.54,.05,.7,0],[.86,.68,.04,.6,2.4]]:[[.14,.75,.043,.7,0],[.29,.80,.026,.8,2.4],[.90,.27,.031,.6,1.1]];
   const far=mobile?[[.79,.14,.025,.45,1],[.14,.83,.023,.5,3]]:[[.64,.14,.025,.45,1],[.90,.16,.017,.5,3],[.10,.54,.019,.42,4.2]];
   entry.life=[...near.map((p,i)=>life.current(r,[p],15,'near-current-'+i)),...far.map((p,i)=>life.current(r,[p],35,'distant-current-'+i)),life.stream(r),life.passage(0)];
   paper.life=[
    life.orbit(coreX,coreY,42,12*coreScale,true,'horizon-orbit-far'),
    life.orbit(coreX,coreY,42,12*coreScale,false,'horizon-orbit-near'),
    life.orbit(previewX,previewY,previewZ,previewR,true,'small-orbit-far'),
    life.orbit(previewX,previewY,previewZ,previewR,false,'small-orbit-near'),
    life.strata(),life.passage(1)
   ];
  }
  window.INK_COMPUTE_WORLD?.(r,signal);
  r.textures.inkEnvironments=[r.textures.atmosphere,mineralLight,atmosphere];
  return[entry,paper,signal];
 };
})();
