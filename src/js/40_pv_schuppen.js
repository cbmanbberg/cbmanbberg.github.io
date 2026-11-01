// ---------------- PV-Anlagen (nach Luftbild 2025) + Gartenschuppen ----------------
const pvTex=(()=>{const c=document.createElement('canvas'); c.width=128; c.height=212; const x=c.getContext('2d');
  x.fillStyle='#c4c8cc'; x.fillRect(0,0,128,212); x.fillStyle='#1c2940'; x.fillRect(3,3,122,206);
  x.strokeStyle='#34486b'; x.lineWidth=1;
  for(let i=1;i<6;i++){x.beginPath();x.moveTo(3+i*122/6,3);x.lineTo(3+i*122/6,209);x.stroke();}
  for(let j=1;j<10;j++){x.beginPath();x.moveTo(3,3+j*206/10);x.lineTo(125,3+j*206/10);x.stroke();}
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;})();
const pvMat=new THREE.MeshStandardMaterial({map:pvTex, roughness:.35, metalness:.3, side:THREE.DoubleSide});
function pvQuad(g,q){ const pos=[],uv=[]; [0,1,2,0,2,3].forEach(i=>{pos.push(q[i][0],q[i][1],q[i][2]); uv.push(q[i][3],q[i][4]);});
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,pvMat); m.receiveShadow=true; g.add(m); return m; }
function pvSlope(g, base, ux, vd, n, off, x1,x2,d1,d2){
  const P=(x,d)=>{const p=base.clone().addScaledVector(ux,x).addScaledVector(vd,d).addScaledVector(n,off); return [p.x,p.y,p.z,x/1.05,-d/1.75];};
  pvQuad(g,[P(x1,d1),P(x2,d1),P(x2,d2),P(x1,d2)]);
}
{ // Hauptdach Südseite: Scheune + Stall in drei Feldern, kleines Feld am Bauernhaus
  const ux=new THREE.Vector3(1,0,0), vd=new THREE.Vector3(0,-Math.sin(ang),Math.cos(ang)), n=new THREE.Vector3(0,Math.cos(ang),Math.sin(ang));
  const base=new THREE.Vector3(0,H.ridge,zMid);
  [[xW+0.4,8.7],[9.0,18.1],[18.4,xStallEnd-0.6]].forEach(([a,b])=>pvSlope(G.roof,base,ux,vd,n,0.56,a,b,0.5,10.9));
  pvSlope(G.roof,base,ux,vd,n,0.56,-8.2,-5.0,1.7,10.4);
  // Einfahrtsschuppen Südseite
  const aLen=Math.hypot(aHalf,aHalf*SLOPE);
  pvSlope(G.roof,new THREE.Vector3(0,aRidge,aMid),ux,vd,n,0.26,27.8,31.1,0.3,aLen-0.3);
}
if(typeof ENV!=='undefined'){
  (ENV.pv||[]).forEach(q=>pvQuad(ENVG,q));
  // Schopf im Garten (LoD2-Kubatur) mit Boden-Deckel-Schalung
  if(ENV.schopf){
    const bdTex=(()=>{const c=document.createElement('canvas'); c.width=64; c.height=256; const x=c.getContext('2d');
      x.fillStyle='#7d5c3d'; x.fillRect(0,0,64,256);
      for(let i=0;i<40;i++){ x.fillStyle=`rgba(${60+Math.random()*30|0},${40+Math.random()*20|0},${25+Math.random()*15|0},.18)`; x.fillRect(Math.random()*44,0,1+Math.random()*2,256); }
      x.fillStyle='rgba(0,0,0,.35)'; x.fillRect(44,0,3,256);              // Schattenfuge links vom Deckel
      x.fillStyle='#8d6b49'; x.fillRect(47,0,14,256);                     // Deckleiste
      x.fillStyle='rgba(255,255,255,.12)'; x.fillRect(47,0,2,256);
      x.fillStyle='rgba(0,0,0,.25)'; x.fillRect(61,0,3,256);
      const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;})();
    const wallM=new THREE.MeshStandardMaterial({map:bdTex, roughness:.9, side:THREE.DoubleSide});
    const roofM=new THREE.MeshStandardMaterial({color:0x9a4b37, roughness:.9, side:THREE.DoubleSide});
    ENV.schopf.forEach(([roof,pts])=>{
      let v=[]; for(let i=0;i<pts.length;i+=3) v.push(new THREE.Vector3(pts[i],pts[i+1],pts[i+2]));
      if(v.length>3 && v[0].distanceTo(v[v.length-1])<1e-3) v.pop(); if(v.length<3) return;
      const nrm=new THREE.Vector3(); for(let i=0;i<v.length;i++){const a=v[i],c=v[(i+1)%v.length]; nrm.x+=(a.y-c.y)*(a.z+c.z); nrm.y+=(a.z-c.z)*(a.x+c.x); nrm.z+=(a.x-c.x)*(a.y+c.y);}
      nrm.normalize(); const ax=Math.abs(nrm.x), ay=Math.abs(nrm.y), az=Math.abs(nrm.z);
      const p2=v.map(q=> ax>=ay&&ax>=az ? new THREE.Vector2(q.z,q.y) : ay>=az ? new THREE.Vector2(q.x,q.z) : new THREE.Vector2(q.x,q.y));
      const tris=THREE.ShapeUtils.triangulateShape(p2,[]);
      const hd=new THREE.Vector3(-nrm.z,0,nrm.x).normalize();          // horizontale Richtung in der Wand
      const pos=[], uv=[];
      tris.forEach(tr=>tr.forEach(k=>{ const q=v[k]; pos.push(q.x,q.y,q.z); uv.push(q.clone().sub(v[0]).dot(hd)/0.25, q.y/2.5); }));
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.computeVertexNormals();
      const m=new THREE.Mesh(g, roof?roofM:wallM); m.castShadow=m.receiveShadow=true; ENVG.add(m);
      const ed=new THREE.LineSegments(new THREE.EdgesGeometry(g,30), edgeMat); ENVG.add(ed);
    });
    const ctr=ENV.schopf.flatMap(([,p])=>p).reduce((a,v,i)=>{a[i%3]+=v; a.n+= (i%3===0); return a;},Object.assign([0,0,0],{n:0}));
    const d=document.createElement('div'); d.className='lbl nb'; d.innerHTML='<b>Schopf</b>'; const lo=new CSS2DObject(d);
    const ys=ENV.schopf.flatMap(([,p])=>p.filter((_,i)=>i%3===1)); lo.position.set(ctr[0]/ctr.n, Math.max(...ys)+0.8, ctr[2]/ctr.n); ENVG.add(lo);
  }   // Garage im Garten (Ost- und Westseite, aus LoD2)
  const sh=ENV.shed; if(sh){
    const sg=new THREE.Group(); sg.position.set(sh.x,sh.y,sh.z); sg.rotation.y=-sh.rot; ENVG.add(sg);
    const hw=sh.W/2, eave=sh.ridge-hw, o=0.3, run=hw+o, len=run*Math.SQRT2, q4=Math.PI/4;
    box(sg,-sh.L/2,sh.L/2,-0.4,eave,-hw,hw,mat.nbHolz);
    for(let x=-sh.L/2+0.15;x<sh.L/2;x+=0.3){ box(sg,x,x+0.04,0,eave,hw,hw+0.03,mat.holzAlt,false); box(sg,x,x+0.04,0,eave,-hw-0.03,-hw,mat.holzAlt,false); }
    [-1,1].forEach(s=>{ const shp=new THREE.Shape(); shp.moveTo(-hw,eave); shp.lineTo(hw,eave); shp.lineTo(0,sh.ridge); shp.closePath();
      const g=new THREE.ExtrudeGeometry(shp,{depth:0.1,bevelEnabled:false}); const m=new THREE.Mesh(g,mat.nbHolz); m.rotation.y=Math.PI/2; m.position.x= s<0?-sh.L/2:sh.L/2-0.1; m.castShadow=true; sg.add(m);
      const geo=new THREE.BoxGeometry(sh.L+0.6,0.12,len); const r=new THREE.Mesh(geo,mat.dach); r.rotation.x=s*q4;
      r.position.set(0,sh.ridge-run/2,s*run/2).addScaledVector(new THREE.Vector3(0,Math.cos(q4),s*Math.sin(q4)),0.06); r.castShadow=r.receiveShadow=true; sg.add(r);
      const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo),edgeMat); e.position.copy(r.position); e.rotation.copy(r.rotation); sg.add(e); });
    box(sg,sh.L/2,sh.L/2+0.05,0,2.0,-0.55,0.55,mat.holz);
    pvSlope(sg,new THREE.Vector3(0,sh.ridge,0),new THREE.Vector3(1,0,0),new THREE.Vector3(0,-Math.sin(q4),Math.cos(q4)),new THREE.Vector3(0,Math.cos(q4),Math.sin(q4)),0.15,-sh.L/2+0.1,1.2,0.35,len-0.25);
    const d=document.createElement('div'); d.className='lbl nb'; d.innerHTML='<b>Gartenschuppen</b>'; const lo=new CSS2DObject(d); lo.position.set(0,sh.ridge+0.8,0); sg.add(lo);
  }
}
