/* Silicon seen from inside its layered structure. Material and etched cells
   are baked once; only a short routed transmission changes at idle. */
(() => {
 const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 window.INK_COMPUTE_WORLD=(r,w)=>{
  const mobile=r.width<=760;
  const face=(points,color,gradient,peripheral=false)=>{const value={points,color:rgb(color),compute:true,peripheral,...gradient&&{gradient}};w.faces.push(value);return value;};
  const line=(points,color='#35cda0',alpha=.7,width=1)=>w.lines.push({points,color,alpha,width});
  const make=(key,paint)=>{if(r.textures[key])return r.textures[key];const c=document.createElement('canvas');c.width=960;c.height=600;paint(c.getContext('2d'));return r.textures[key]=c;};
  const bank=make('ink-weight-bank',c=>{
   c.beginPath();c.moveTo(32,0);c.lineTo(874,0);c.lineTo(960,83);c.lineTo(960,558);c.lineTo(918,600);c.lineTo(0,600);c.lineTo(0,32);c.closePath();
   const metal=c.createLinearGradient(0,0,960,600);metal.addColorStop(0,'#23765d');metal.addColorStop(.35,'#073c3b');metal.addColorStop(1,'#031729');c.fillStyle=metal;c.fill();c.save();c.clip();
   // Clustered repeated cells, open routing channels and exposed cut edges.
   for(let cluster=0;cluster<6;cluster++){
    const x=60+(cluster%3)*286,y=48+Math.floor(cluster/3)*260;
    c.fillStyle='#031e29';c.fillRect(x-12,y-12,247,211);
    for(let row=0;row<6;row++)for(let col=0;col<8;col++){
     const v=.25+.5*(.5+.5*Math.sin(col*.65+row*.35+cluster));
     c.fillStyle=`rgba(77,230,155,${v})`;c.fillRect(x+col*28,y+row*29,19,19);
     c.fillStyle='rgba(195,255,219,.26)';c.fillRect(x+col*28,y+row*29,19,2);
     c.fillStyle='#062c30';c.fillRect(x+col*28+4,y+row*29+6,11,7);
    }
   }
   for(let lane=0;lane<8;lane++){
    c.beginPath();c.moveTo(-10,238+lane*6);c.lineTo(560-lane*8,238+lane*6);c.lineTo(602-lane*8,280+lane*6);c.lineTo(975,280+lane*6);c.strokeStyle=lane%3?'#2da583':'#b9f9be';c.lineWidth=lane%3?2:3;c.stroke();
   }
   c.fillStyle='#85dba8';c.fillRect(16,0,5,600);c.fillStyle='#103f41';c.fillRect(28,0,8,600);
   c.restore();
  });
  // An asymmetric succession of matrix slices, each at a real world depth.
  const banks=mobile?
   [[-6,8,31,25,15.6,.22],[11,8,47,26,16.3,-.35],[-16,-1,56,28,17.5,.28],[2,12,70,25,15.6,-.16],[-28,12,89,37,23,.25],[23,-4,103,31,19.4,-.27]]:
   [[-13,5.6,30,22,13.75,.22],[-22,-5,44,23,14.4,-.19],[6,12,56,29,18.1,-.32],[-33,13,70,31,19.4,.24],[-3,-12,79,36,22.5,-.12],[27,4,103,31,19.4,-.27]];
  for(const [x,y,z,width,height,angle]of banks){
   w.sprites.push({texture:bank,x,y,z,w:width,h:height,angle,alpha:1});
   const cs=Math.cos(angle),sn=Math.sin(angle),p=(u,v,d=0)=>[x+u*cs-v*sn,y+u*sn+v*cs,z+d];
   face([p(-width/2,-height/2),p(width/2,-height/2),p(width/2,-height/2,.65),p(-width/2,-height/2,.65)],'#031421');
   face([p(width/2,-height/2),p(width/2,height/2),p(width/2,height/2,.65),p(width/2,-height/2,.65)],'#0d5948');
   line([p(-width/2,-height/2,-.015),p(-width/2,height/2,-.015),p(width/2,height/2,-.015)],'#88e5ac',.64,1.2);
  }
  // Routed laminae leave the frame and pass behind the observer. No paired
  // pillars, common floor height, wall plane, or architectural ceiling.
  const routes=[
   {p:[[-15,9,-12],[-13,9,9],[-13,8,22],[-7,3,34],[-7,-5,51],[8,-8,85]],width:2.6,depth:.55},
   {p:[[12,-9,-15],[12,-7,12],[17,-7,23],[17,-2,37],[26,4,63],[39,13,108]],width:3.7,depth:.7},
   {p:[[-39,-14,18],[-28,-14,38],[-20,-7,53],[-20,11,78],[-3,17,118]],width:4.8,depth:.65}
  ];
  for(const {p,width,depth}of routes){
   for(let i=0;i<p.length-1;i++){
    const a=p[i],b=p[i+1],offset=v=>[v[0]+width,v[1]+.28,v[2]],q=[a,offset(a),offset(b),b];
    face(q,'#073831',{from:a,to:b,colors:['#061d2b','#1f8060']});
    face([offset(a),offset(b),[b[0]+width,b[1]-.5,b[2]+depth],[a[0]+width,a[1]-.5,a[2]+depth]],'#021625');
    for(let lane=0;lane<4;lane++){const t=.15+lane*.22;line([[a[0]+width*t,a[1]+.28*t+.02,a[2]-.025],[b[0]+width*t,b[1]+.28*t+.02,b[2]-.025]],lane===0?'#d6ffd0':lane===1?'#31d28e':'#187563',lane<2?.86:.7,lane===0?1.5:.8);}
   }
  }
  // A routed front bus passes over the lower part of the embedded signature.
  // Its thickness and contact with the adjacent bank establish physical depth.
  const bridgeX=mobile?0:-6.5,bridgeY=mobile?2.0:-2.4,bridgeZ=22.4;
  const bridge=[[bridgeX-7,bridgeY+.4,bridgeZ],[bridgeX+7,bridgeY+.4,bridgeZ],[bridgeX+8,bridgeY-.8,bridgeZ+.5],[bridgeX-7,bridgeY-.8,bridgeZ+.5]];
  face(bridge,'#0a5540',{from:bridge[0],to:bridge[2],colors:['#16755b','#032c2b']});
  face([bridge[2],bridge[3],[bridgeX-7,bridgeY-1.1,bridgeZ+1],[bridgeX+8,bridgeY-1.1,bridgeZ+1]],'#031823');
  for(let lane=0;lane<4;lane++)line([[bridgeX-7,bridgeY+.22-lane*.21,bridgeZ-.02],[bridgeX+6,bridgeY+.22-lane*.21,bridgeZ-.02],[bridgeX+9,bridgeY-2,bridgeZ+5]],lane===0?'#d5ffd0':'#3ea77a',lane===0?.85:.6,lane===0?1.2:.8);
  // The signature bus is a junction in a much wider circuit: one branch
  // disappears behind a bank, another reaches an oblique die, and a near arm
  // leaves below the observer. All traces belong to their carrying surfaces.
  const routedArm=(points,width)=>{
   for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],q=[a,[a[0]+width,a[1],a[2]],[b[0]+width,b[1],b[2]],b];
    const plate=face(q,'#0a4c39',{from:a,to:b,colors:['#145e47','#05242a']});plate.junction=true;plate.materialPaths=[];
    face([q[0],q[3],[b[0],b[1]-.4,b[2]+.24],[a[0],a[1]-.4,a[2]+.24]],'#021722');
    for(const t of[.22,.50,.78])plate.materialPaths.push({points:[[a[0]+width*t,a[1],a[2]],[b[0]+width*t,b[1],b[2]]],groove:'#032921',grooveWidth:3.2,color:t===.5?'#a4db9c':'#43986d',width:t===.5?1.35:.9,alpha:.84});
   }
  };
  const arrivalPoint=(u,v,z)=>[(u-.5)*r.width*(z-6.2)/r.fx,(.5-v)*r.height*(z-6.2)/r.fy,z];
  const hub=[bridgeX-3,bridgeY-.18,bridgeZ+.05];
  routedArm([hub,[bridgeX-8,bridgeY+2.0,31],[mobile?-10:-19,mobile?8:4.8,43]],mobile?1.25:2.15);
  routedArm([hub,[bridgeX+1.3,bridgeY-1.25,32],arrivalPoint(mobile?.72:.485,mobile?.24:.40,48)],mobile?1.15:1.8);
  if(!mobile)routedArm([hub,[-10,-4.4,18],[-12,-7.4,7]],2.0);else routedArm([hub,[-7,2.5,19],[-9,3.2,10]],1.35);
  // A non-front-facing die has a visible cut side, a top plane and grouped
  // etched cells. Its diagonal edge creates an occlusion distinct from banks.
  const die=(mobile?[[.72,.10,44],[.91,.14,56],[.9,.28,60],[.72,.24,48]]:[[.48,.25,44],[.565,.30,56],[.56,.45,60],[.485,.40,48]]).map(p=>arrivalPoint(...p));
  const dieFace=face(die,'#10523e',{from:die[0],to:die[2],colors:['#1a7050','#052e2b']});dieFace.junction=true;dieFace.materialPaths=[];
  const dieAt=(u,v)=>{const a=die[0].map((n,k)=>n+(die[1][k]-n)*u),b=die[3].map((n,k)=>n+(die[2][k]-n)*u);return a.map((n,k)=>n+(b[k]-n)*v);};
  for(let row=0;row<3;row++){
   const points=[];for(let col=0;col<5;col++){const u=.09+col*.17,v=.13+row*.26;points.push(dieAt(u,v),dieAt(u+.115,v),dieAt(u+.115,v+.15),dieAt(u,v+.15),dieAt(u,v));}
   dieFace.materialPaths.push({points,groove:'#07362c',grooveWidth:3,color:'#7fc799',width:1.2,alpha:.72});
  }
  const dieBack=die.map(p=>[p[0],p[1]-.65,p[2]+1.2]);
  face([die[0],die[1],dieBack[1],dieBack[0]],'#031a23');face([die[1],die[2],dieBack[2],dieBack[1]],'#247553');
  // Unequal near terraces expose laminated layers at the outer edge, with
  // short vias joining them. They never form a full roof or a second doorway.
  const terraceRay=mobile?[[.92,.14,14],[1.08,.11,12],[1.12,.29,31],[.90,.31,26]]:[[.79,.235,15],[1.03,.20,13],[1.08,.29,34],[.86,.315,28]];
  for(let layer=0;layer<3;layer++){
   const q=terraceRay.map(([u,v,z])=>arrivalPoint(u-layer*.008,v+layer*.018,z+layer*.7));
   const top=face(q,'#0e3a30',{from:q[0],to:q[2],colors:['#0a292c','#28754f']},true);top.junction=true;
   const edge=q.map(p=>[p[0],p[1]-.22,p[2]+.12]);
   face([q[0],q[3],edge[3],edge[0]],layer===1?'#72c792':'#328860',null,true);
   if(layer===0)for(let i=0;i<(mobile?2:4);i++){
    const t=.17+i*.19,a=q[0].map((v,k)=>v+(q[3][k]-v)*t),next=terraceRay.map(([u,v,z])=>arrivalPoint(u-.016,v+.036,z+1.4)),b=next[0].map((v,k)=>v+(next[3][k]-v)*t);face([a,[a[0]+.16,a[1],a[2]],[b[0]+.16,b[1],b[2]],b],'#95d3a3',null,true);
   }
  }
  // Cut fibers bridge neighboring banks, rather than a generic wire grid.
  for(let strand=0;strand<11;strand++){
   const x=-15+strand*.49,y=mobile?7.5:2.2;
   line([[x,y,28],[x-3,y-1,33],[x-3,y-1,43],[x-8,y+4,57]],strand%3?'#17866c':'#91e8b3',strand%3?.48:.75,strand%3?.7:1.1);
  }
  // Near-field additions surround the accepted center. Their clipped ends
  // continue behind the observer, and they add no idle animation surfaces.
  const overhead=[[2.8,2.7,-8],[8.8,3.6,-8],[19,11.0,32],[7.6,7.5,26]];
  face(overhead,'#061c2a',{from:overhead[0],to:overhead[2],colors:['#020b19','#145342']},true);
  const lowered=overhead.map(p=>[p[0],p[1]-.58,p[2]+.32]);
  face([overhead[3],overhead[2],lowered[2],lowered[3]],'#27775a',null,true);
  face([overhead[0],overhead[3],lowered[3],lowered[0]],'#041421',null,true);
  for(let lane=0;lane<8;lane++){
   const t=.12+lane*.094,p=overhead[0].map((v,k)=>v+(overhead[1][k]-v)*t),q=overhead[3].map((v,k)=>v+(overhead[2][k]-v)*t);
   line([p,[(p[0]+q[0])*.5,(p[1]+q[1])*.5-.05,(p[2]+q[2])*.5],q],lane%3?'#236b56':'#8ed49b',lane%3?.7:.88,lane%3?.9:1.5);
  }
  // Unequal connector trunks hug the outer edge of the view. Their physical
  // positions are authored from the arrival ray once, not screen-pinned.
  const edgeSlope=r.width*.485/r.fx;
  for(let trunk=0;trunk<3;trunk++){
   const depths=[-9,9+trunk*.8,18+trunk*2,34+trunk*4],ys=[-9+trunk*3,-5+trunk*3,3+trunk*2,15+trunk*3];
   const points=depths.map((z,i)=>[Math.max(mobile?1.3:2.5,edgeSlope*(z-6.35))+(trunk-1)*(mobile?.22:.6),ys[i],z]);
   const width=mobile?.16+trunk*.045:.32+trunk*.09;
   for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],q=[a,[a[0]+width,a[1],a[2]], [b[0]+width,b[1],b[2]],b];
    face(q,'#103f37',{from:a,to:b,colors:['#051a25','#225f43']},true);
    face([[a[0]+width,a[1],a[2]],[b[0]+width,b[1],b[2]],[b[0]+width+.2,b[1],b[2]+.4],[a[0]+width+.2,a[1],a[2]+.4]],'#031522',null,true);
    line([a,b],trunk===1?'#b4efad':'#3aac82',.82,trunk===1?1.8:1.15);
    for(const fraction of[.28,.72])line([[a[0]+width*fraction,a[1],a[2]-.015],[b[0]+width*fraction,b[1],b[2]-.015]],'#286d51',.72,.8);
    for(const t of[.34,.68]){const v=a.map((n,k)=>n+(b[k]-n)*t);line([[v[0],v[1],v[2]-.025],[v[0]+width,v[1],v[2]-.025]],'#5c9d70',.55,.85);}

   }
  }
  if(!mobile){
   const cut=[[-8,-3.8,-9],[6,-4.2,-8],[20,-11.5,26],[-15,-9.5,27]];
   const substrate=face(cut,'#0b4335',{from:cut[3],to:cut[0],colors:['#185c45','#031722']},true);substrate.materialPaths=[];
   const under=cut.map(p=>[p[0],p[1]-1.0,p[2]+.4]);
   face([cut[3],cut[2],under[2],under[3]],'#031222',null,true);
   line([cut[3],cut[2]],'#6cb98a',.8,1.4);
   // Thick connector contacts, with a deliberate interruption in the sequence.
   for(const i of[0,1,2,4,5,6]){
    const x=-13+i*2.2,t=(x+15)/35,z=27-t,y=-9.5-t*2+.025;
    face([[x,y,z],[x+1.15,y,z],[x+1.15,y+1.0,z],[x,y+1.0,z]],'#387f57',null,true);
    face([[x,y+1,z],[x+1.15,y+1,z],[x+1.15,y+1,z+1.7],[x,y+1,z+1.7]],'#76c891',null,true);
    line([[x,y+1,z-.01],[x+1.15,y+1,z-.01]],'#d1f1b5',.82,1.1);
   }
   // The engraving belongs to this surface. Separate depth-sorted lines
   // were painted behind the broad sloping face and disappeared beneath it.
   const surface=(u,v)=>{const near=cut[0].map((n,k)=>n+(cut[1][k]-n)*u),far=cut[3].map((n,k)=>n+(cut[2][k]-n)*u);return near.map((n,k)=>n+(far[k]-n)*v);};
   for(const [bus,pin]of[0,2,5].entries())for(const offset of[-.008,.008]){
    const terminal=(-13+pin*2.2+.575+15)/35+offset,shift=[.055,-.035,.06][bus];
    substrate.materialPaths.push({points:[surface(terminal,.985),surface(terminal,.72),surface(terminal+shift,.59),surface(terminal+shift,.04)],groove:'#021e26',grooveWidth:3.8,color:bus===1?'#8bca9d':'#5ba77d',width:1.55,alpha:.78});
   }
   // A small etched pad field belongs to the same wafer and connects to
   // its existing paired buses. The nearest group is intentionally cropped.
   const padRow=(left,v,count,step,width,height)=>{const path=[surface(.388,v+height/2),surface(left,v+height/2)];for(let i=0;i<count;i++){const u=left+i*step;path.push(surface(u,v+height/2),surface(u+width,v+height/2),surface(u+width,v-height/2),surface(u,v-height/2),surface(u,v+height/2));}return path;};
   for(const [left,v,count,step,width,height]of [[.244,.925,3,.046,.027,.019],[.257,.882,3,.046,.027,.020],[.344,.820,3,.049,.030,.023],[.357,.775,3,.049,.030,.024]]){
    substrate.materialPaths.push({points:padRow(left,v,count,step,width,height),groove:'#031f25',grooveWidth:2.8,color:'#549976',width:1.0,alpha:.60});
   }
   // A single near chip corner repeats the cached cells at a much larger scale.
   w.sprites.push({texture:bank,x:-5.4,y:-4.1,z:11,w:5.6,h:3.5,angle:.10,alpha:1});
   face([[-8.3,-5.6,11],[-2.65,-5.05,11],[-2.65,-5.05,11.55],[-8.3,-5.6,11.55]],'#020f1c',null,true);
  }
  // The observer is between stacked silicon, not facing a bank of boards.
  // These near dies are genuinely oblique, with exposed dark undersides;
  // their cropped edges continue outside the view and over the observer.
  const mix=(a,b,t)=>a.map((n,k)=>n+(b[k]-n)*t);
  const slab=(q,thickness,lit=true)=>{
   const under=q.map(p=>[p[0],p[1]-thickness,p[2]+thickness*.28]);
   const top=face(q,'#164c39',{from:q[0],to:q[2],colors:['#0a2730',lit?'#2c7250':'#1d523e']},true);
   top.enclosure=true;top.materialPaths=[];
   face([q[0],q[3],under[3],under[0]],'#020d1c',null,true).enclosure=true;
   face([q[3],q[2],under[2],under[3]],lit?'#397f56':'#154837',null,true).enclosure=true;
   face([under[0],under[1],under[2],under[3]],'#020d19',null,true).enclosure=true;
   for(const t of [.22,.48,.74])top.materialPaths.push({points:[mix(q[0],q[1],t),mix(q[3],q[2],t)],groove:'#062b28',grooveWidth:3.2,color:'#71b987',width:1.2,alpha:.68});
   return q;
  };
  const cacheStack=(rays,layers,dv,du)=>{
   const levels=Array.from({length:layers+1},(_,i)=>rays.map(([u,v,z])=>arrivalPoint(u+du*i,v+dv*i,z+i*.52)));
   const crown=face(levels[0],'#18503c',{from:levels[0][0],to:levels[0][2],colors:['#0a2830','#2c7250']},true);crown.enclosure=true;crown.materialPaths=[];
   for(const t of [.16,.36,.57,.78])crown.materialPaths.push({points:[mix(levels[0][0],levels[0][1],t),mix(levels[0][3],levels[0][2],t)],groove:'#062b28',grooveWidth:3.2,color:'#71b987',width:1.2,alpha:.68});
   for(let i=0;i<layers;i++){
    const a=levels[i],b=levels[i+1];
    const cut=face([a[3],a[2],b[2],b[3]],i%2?'#1b573d':'#2b704c',null,true);cut.enclosure=true;cut.materialPaths=[];
    face([a[0],a[3],b[3],b[0]],'#061d27',null,true).enclosure=true;
    cut.materialPaths.push({points:[mix(a[3],b[3],.78),mix(a[2],b[2],.78)],groove:'#041e23',grooveWidth:4.5,color:'#76ad7c',width:.8,alpha:.85});
    // Bonded contact ends share one batched material path per layer.
    const contacts=[];
    for(let n=0;n<(mobile?4:6);n++){
     const t=.12+n*(mobile?.23:.145),u=.045,A=mix(a[3],a[2],t),B=mix(a[3],a[2],t+u),C=mix(b[3],b[2],t+u),D=mix(b[3],b[2],t);
     const pa=mix(A,D,.22),pb=mix(B,C,.22),pc=mix(B,C,.65),pd=mix(A,D,.65);contacts.push(pa,pb,pb,pc,pc,pd,pd,pa);
    }
    cut.materialPaths.push({points:contacts,disconnected:true,groove:'#123f30',grooveWidth:2.6,color:'#a3cea1',width:1.8,alpha:.87});
   }
  };
  cacheStack(mobile?[[-.12,-.03,9],[.075,.06,13],[.10,.29,23],[-.09,.23,18]]:[[-.14,-.09,9],[.115,.07,14],[.17,.35,24],[-.09,.23,18]],mobile?3:4,mobile?.033:.038,-.005);
  cacheStack(mobile?[[.86,.05,10],[1.18,-.04,8],[1.19,.23,25],[.89,.28,24]]:[[.76,-.04,10],[1.13,-.15,8],[1.15,.21,27],[.85,.26,24]],3,mobile?.030:.040,.006);
  // An elbowed interconnect joins the upper layers to a different depth bank.
  // Broad material faces carry the channels; no independent idle surfaces.
  routedArm([arrivalPoint(mobile?.90:.86,mobile?.27:.23,24),arrivalPoint(mobile?.77:.71,mobile?.19:.14,36),arrivalPoint(mobile?.67:.53,mobile?.21:.18,56)],mobile?1.1:2.4);
  // Processing blocks differ from fine-cell cache: attached, stepped volumes
  // on an oblique die. Repeating the assembly at a smaller far scale lets
  // the junction lead into a wider processor rather than ending in a wall.
  const processingGroup=(rays,rows,cols)=>{
   const q=rays.map(p=>arrivalPoint(...p));
   const at=(u,v)=>mix(mix(q[0],q[1],u),mix(q[3],q[2],u),v);
   for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const step=.88/cols,bw=step*.76,u=.06+col*step,v=.13+row*.42,base=[at(u,v),at(u+bw,v),at(u+bw,v+.27),at(u,v+.27)],lift=mobile?.26:.6,top=base.map(p=>[p[0],p[1]+lift,p[2]-.16]);
    const tile=[at(Math.max(0,u-.025),v-.055),at(u+bw+.025,v-.055),at(u+bw+.025,v+.32),at(Math.max(0,u-.025),v+.32)];face(tile,'#082d2a').enclosure=true;
    const block=face(top,'#327b50',{from:top[0],to:top[2],colors:['#499866','#164f3b']});block.enclosure=true;block.materialPaths=[];
    face([top[3],top[2],base[2],base[3]],'#082b2a').enclosure=true;face([top[1],top[2],base[2],base[1]],'#174a37').enclosure=true;
    const grid=[];const on=(u,v)=>mix(mix(top[0],top[1],u),mix(top[3],top[2],u),v);
    for(let r0=0;r0<2;r0++)for(let c0=0;c0<3;c0++){const u0=.13+c0*.27,v0=.17+r0*.38,a=on(u0,v0),b=on(u0+.16,v0),c=on(u0+.16,v0+.21),d=on(u0,v0+.21);grid.push(a,b,b,c,c,d,d,a);}
    block.materialPaths.push({points:grid,disconnected:true,groove:'#164b38',grooveWidth:2.6,color:'#a0cfa1',width:1.0,alpha:.72});
   }
  };
  processingGroup(mobile?[[.025,.28,17],[.34,.32,23],[.32,.43,26],[-.01,.39,20]]:[[.15,.66,17],[.36,.69,23],[.39,.84,26],[.12,.80,20]],2,3);
  processingGroup(mobile?[[.73,.13,35],[1.03,.17,44],[1.02,.30,48],[.70,.25,39]]:[[.59,.14,35],[.76,.16,44],[.77,.28,48],[.58,.24,39]],1,3);
  routedArm([hub,arrivalPoint(mobile?.22:.24,mobile?.29:.64,23),arrivalPoint(mobile?.20:.245,mobile?.36:.71,20)],mobile?.65:1.35);
  if(!mobile){
   // A raised die emerges from the existing bottom wafer and extends behind
   // the camera. Its cut side makes the substrate a volume beneath us.
   const q=[[-.08,.85,9],[.20,.91,11],[.26,1.08,16],[-.09,1.12,12]].map(p=>arrivalPoint(...p));
   slab(q,.34);slab(q.map(p=>[p[0],p[1]+.28,p[2]+.4]),.26,false);
  }
  if(mobile){
   // On a phone, the environment also passes below and beside the contact
   // copy. A close cutaway exits behind the viewer, joined to the upper bus.
   const q=[[.69,.57,10],[1.14,.67,8],[1.12,1.18,14],[.40,1.13,24]].map(p=>{const q=arrivalPoint(...p);q[0]=Math.max(1.15,q[0]);return q;});
   const near=face(q,'#0a2c2b',{from:q[0],to:q[2],colors:['#123c32','#031923']},true);near.enclosure=true;near.materialPaths=[];
   const under=q.map(p=>[p[0],p[1]-.45,p[2]+.35]);
   face([q[0],q[3],under[3],under[0]],'#061722',null,true).enclosure=true;
   face([q[3],q[2],under[2],under[3]],'#21513d',null,true).enclosure=true;
   const channels=[];for(const t of[.24,.46,.68]){const a=mix(q[0],q[1],t),b=mix(q[3],q[2],t);channels.push(a,b);}
   near.materialPaths.push({points:channels,disconnected:true,groove:'#031d26',grooveWidth:5.5,color:'#477c5c',width:1.2,alpha:.82});
   const step=[ [.78,.77,10],[1.1,.82,9],[1.13,1.04,13],[.70,1.03,18] ].map(p=>arrivalPoint(...p));
   const top=face(step,'#124331',{from:step[0],to:step[2],colors:['#22563b','#092a29']},true);top.enclosure=true;
   const bottom=step.map(p=>[p[0],p[1]-.34,p[2]+.16]);face([step[0],step[3],bottom[3],bottom[0]],'#041723',null,true).enclosure=true;
   routedArm([arrivalPoint(.98,.34,21),arrivalPoint(.96,.58,18),arrivalPoint(.87,.69,13)],.42);
  }
  const z=mobile?29.6:28.6,x=mobile?-4:-11,y=mobile?9:5.8;
  const points=[[x-3,y+1.3,z],[x-1.3,y+1.3,z],[x-.4,y+.4,z],[x+2,y+.4,z]];
  w.life=[{name:'silicon-route-and-arrival',z,bounds:[[x-3.4,y-1.2,z],[x+3.0,y+1.8,z]],paint(c,project,time){
   const cycle=(time*.13)%1,at=t=>{const n=Math.min(2.9999,Math.max(0,t)*3),i=Math.floor(n),q=n-i;return points[i].map((v,k)=>v+(points[i+1][k]-v)*q);};
   c.save();if(cycle<.72){const q=cycle/.72,a=project(at(q)),b=project(at(Math.max(0,q-.15)));c.beginPath();c.moveTo(...b);c.lineTo(...a);c.strokeStyle='#caffb6';c.lineWidth=2.6;c.lineCap='round';c.stroke();}
   else{const alpha=Math.sin((cycle-.72)/.28*Math.PI);for(let i=0;i<6;i++){const p=project([x+2+(i%3)*.22,y+.35-Math.floor(i/3)*.25,z]);c.fillStyle=`rgba(193,255,173,${alpha*.85})`;c.fillRect(p[0],p[1],3,3);}}c.restore();
  }}];
 };
})();
