// =====================================================================
// DACHGESCHOSS / DACH
// =====================================================================
const dg = G.dg;
// Decke über OG / Boden DG (Balkenlage 280 + Dielen)
[[200,232,145,1300],[318,1350,145,1300],[232,318,145,240],[232,318,700,1300]].forEach(r=>bp(dg, ...r, H.ogCeil,H.dgFloor, mat.diele));

// Dachhaut über gesamte Gebäudelänge 35,45 m
const run = (zMid - zN) + 2.06, rise = run*SLOPE, slopeLen = Math.hypot(run, rise), ang = Math.atan(SLOPE);
const xr1 = xWohnStart-0.5, xr2 = xStallEnd+0.5, th=0.28;
[-1,1].forEach(s=>{
  const geo = new THREE.BoxGeometry(xr2-xr1, th, slopeLen+0.3);
  const m = new THREE.Mesh(geo, mat.dach);
  const zc = zMid + s*run/2, yc = H.ridge - rise/2;
  m.rotation.x = s*ang;
  const nrm = new THREE.Vector3(0, Math.cos(ang), s*Math.sin(ang));
  m.position.set((xr1+xr2)/2, yc, zc).addScaledVector(nrm, th/2+0.22);
  m.castShadow = true; m.receiveShadow = true; G.roof.add(m);
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat); e.position.copy(m.position); e.rotation.copy(m.rotation); G.roof.add(e);
});
// First
box(G.roof, xr1, xr2, H.ridge+0.3, H.ridge+0.5, zMid-0.18, zMid+0.18, mat.dach);

// Dachstuhl Scheune (vereinfacht nach Schnitt AA/BB)
const tr = G.truss;
function beamBetween(g, a, b, w, h, m){
  const v=new THREE.Vector3().subVectors(b,a), len=v.length();
  const geo=new THREE.BoxGeometry(w,h,len);
  const mesh=new THREE.Mesh(geo,m); mesh.position.copy(a).addScaledVector(v,.5);
  mesh.lookAt(b); mesh.castShadow=true; g.add(mesh); return mesh;
}
const roofY = z => H.ridge - Math.abs(z-zMid)*SLOPE;
// Sparren über ganze Länge
for(let x=xWohnStart+0.1; x<=xStallEnd-0.1; x+=0.85){
  [-1,1].forEach(s=>{
    const a=new THREE.Vector3(x, H.eave, zMid + s*(run)), b=new THREE.Vector3(x, H.ridge, zMid);
    beamBetween(tr, a, b, 0.1, 0.2, mat.sparren);
  });
}
// Mittelpfetten, Firstpfette
const zP1 = 2.85, zP2 = 9.10, yPf = 8.95;
[zP1,zP2].forEach(z=>box(tr, xWohnStart, xStallEnd, yPf-0.12, yPf+0.12, z-0.11, z+0.11, mat.holzAlt));
box(tr, xWohnStart, xStallEnd, H.ridge-0.42, H.ridge-0.2, zMid-0.1, zMid+0.1, mat.holzAlt);
// Binder in den Achsen 1–4: Stützen, Kehlbalken, Kopfbänder
[180,570,958,1337].forEach(g=>{
  const x=X(g);
  [zP1,zP2].forEach(z=>{
    box(tr, x-0.11,x+0.11, H.dgFloor, yPf-0.12, z-0.11,z+0.11, mat.holzAlt);
    [-1,1].forEach(s=>{ if((s<0&&g===180)||(s>0&&g===1337)) return;
      beamBetween(tr, new THREE.Vector3(x, yPf-1.0, z), new THREE.Vector3(x+s*1.0, yPf-0.12, z), 0.14, 0.14, mat.holzAlt);});
    const s = z<zMid ? -1 : 1;
    beamBetween(tr, new THREE.Vector3(x, H.dgFloor+0.3, z), new THREE.Vector3(x, H.wallTop-0.1, zMid+s*(zMid-zN-0.3)), 0.14, 0.16, mat.holzAlt);
  });
  const yK=9.2, dz=(H.ridge-yK)/SLOPE - 0.15;
  box(tr, x-0.08,x+0.08, yK-0.12,yK+0.12, zMid-dz, zMid+dz, mat.holzAlt);
  beamBetween(tr, new THREE.Vector3(x, H.ridge-0.42, zMid), new THREE.Vector3(x, yK+0.12, zMid), 0.16, 0.16, mat.holzAlt);
});
