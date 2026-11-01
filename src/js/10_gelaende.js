// ---------- Gelände (LGL Open GeoData: DGM1, DOP20 2025, nDOM1, LoD2) ----------
const ENVG = new THREE.Group(); scene.add(ENVG);
let TERR=null, GEN=null;
(function(){
  if(typeof ENV==='undefined') return;
  const e=ENV, ct=Math.cos(e.th), st=Math.sin(e.th);
  const toM=(E,N)=>{const dE=E-e.A[0], dN=N-e.A[1]; return [dE*ct+dN*st+e.xc, dE*st-dN*ct+e.zS];};
  const raw=atob(e.h), hb=new Uint8Array(raw.length); for(let i=0;i<raw.length;i++) hb[i]=raw.charCodeAt(i);
  const hv=new Int16Array(hb.buffer), nx=e.nx, ny=e.ny;
  const pos=new Float32Array(nx*ny*3), uv=new Float32Array(nx*ny*2);
  let minY=1e9;
  for(let i=0;i<ny;i++) for(let j=0;j<nx;j++){
    const k=i*nx+j, [x,z]=toM(e.E0+j*e.step, e.N1-i*e.step), y=hv[k]/100;
    pos.set([x,y,z],k*3); uv.set([j/(nx-1), 1-i/(ny-1)],k*2); if(y<minY) minY=y;
  }
  const idx=[]; for(let i=0;i<ny-1;i++) for(let j=0;j<nx-1;j++){const a=i*nx+j,b=a+1,c=a+nx,d=c+1; idx.push(a,c,b, b,c,d);}
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const tex=new THREE.TextureLoader().load('data:image/jpeg;base64,'+e.img); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8;
  const terr=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:tex, roughness:1})); terr.receiveShadow=true; ENVG.add(terr); TERR=terr;
  const skirt=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000), mat.gras); skirt.rotation.x=-Math.PI/2; skirt.position.y=minY-0.5; scene.add(skirt);
  // Bäume aus nDOM
  const n=e.trees.length, dummy=new THREE.Object3D(), col=new THREE.Color();
  const crowns=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1), new THREE.MeshStandardMaterial({roughness:.95, flatShading:true}), n);
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1.2,1,6), new THREE.MeshStandardMaterial({color:0x5a4634}), n);
  e.trees.forEach(([x,z,yb,h,r0],i)=>{ const r=r0*0.85;
    const ch=Math.min(h*0.42, r*1.35), cy=yb+h-ch;
    dummy.position.set(x,cy,z); dummy.scale.set(r,ch,r); dummy.rotation.set(0,i*1.7,0); dummy.updateMatrix(); crowns.setMatrixAt(i,dummy.matrix);
    col.setHSL(0.24+((i*37)%17)/170, 0.38+((i*13)%7)/40, 0.22+((i*29)%11)/90); crowns.setColorAt(i,col);
    const tr=0.12+h*0.012; dummy.position.set(x,yb+(cy-yb)/2,z); dummy.scale.set(tr,cy-yb+0.2,tr); dummy.rotation.set(0,0,0); dummy.updateMatrix(); trunks.setMatrixAt(i,dummy.matrix);
  });
  crowns.castShadow=trunks.castShadow=true; crowns.receiveShadow=true; ENVG.add(crowns, trunks);
  GEN={crowns,trunks,trees:e.trees,c0:crowns.instanceMatrix.array.slice(),t0:trunks.instanceMatrix.array.slice()};
  // Nachbargebäude LoD2
  const wallP=[], roofP=[];
  e.blds.forEach(b=>b.forEach(([roof,pts])=>{
    let v=[]; for(let i=0;i<pts.length;i+=3) v.push(new THREE.Vector3(pts[i],pts[i+1],pts[i+2]));
    if(v.length>3 && v[0].distanceTo(v[v.length-1])<1e-3) v.pop(); if(v.length<3) return;
    const nrm=new THREE.Vector3(); for(let i=0;i<v.length;i++){const a=v[i],c=v[(i+1)%v.length]; nrm.x+=(a.y-c.y)*(a.z+c.z); nrm.y+=(a.z-c.z)*(a.x+c.x); nrm.z+=(a.x-c.x)*(a.y+c.y);}
    const ax=Math.abs(nrm.x), ay=Math.abs(nrm.y), az=Math.abs(nrm.z);
    const p2=v.map(q=> ax>=ay&&ax>=az ? new THREE.Vector2(q.z,q.y) : ay>=az ? new THREE.Vector2(q.x,q.z) : new THREE.Vector2(q.x,q.y));
    const tris=THREE.ShapeUtils.triangulateShape(p2,[]); const out=roof?roofP:wallP;
    tris.forEach(t=>t.forEach(k=>out.push(v[k].x,v[k].y,v[k].z)));
  }));
  [[wallP,0xe9e4da],[roofP,0x9a4b37]].forEach(([arr,c])=>{ if(!arr.length) return;
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3)); g.computeVertexNormals();
    const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:c, side:THREE.DoubleSide, roughness:.9})); m.castShadow=m.receiveShadow=true; ENVG.add(m);
    const ed=new THREE.LineSegments(new THREE.EdgesGeometry(g,30), new THREE.LineBasicMaterial({color:0x2a2622,transparent:true,opacity:.25})); ENVG.add(ed);
  });
  // Nordpfeil
  const d=document.createElement('div'); d.className='lbl nb'; d.innerHTML='<b>N</b> ↑'; const o=new CSS2DObject(d); o.position.set(e.north[0],3,e.north[1]); ENVG.add(o);
})();
// Fundament / Sockel unter dem Gebäude
box(scene, xWohnStart, xStallEnd, -1.2, 0, zN, zS, M(0x9c968c), false);
