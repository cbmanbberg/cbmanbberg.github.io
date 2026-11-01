// =====================================================================
// NACHBARTEILE: altes Bauernhaus (Umbauplan Füssinger), Stall/Remise, Keller mit Auffahrt (Plan 1911)
// =====================================================================
const NB_EG=G.nbEG, NB_OG=G.nbOG, NB_DG=G.nbDG;

// Wand mit Öffnungen. axis 'x': Wand läuft in x (a..b), Dicke in z (t1..t2); axis 'z': umgekehrt.
// ops: {a,b,y1,y2,type:'w'|'d'|'g'|'o'}
function wall(g, axis, t1,t2, a,b, y0,y1, m, ops=[], frame=mat.putz){
  const mk = (u1,u2,v1,v2,mm,e=true)=> axis==='x' ? box(g,u1,u2,v1,v2,t1,t2,mm,e) : box(g,t1,t2,v1,v2,u1,u2,mm,e);
  const mkT = (u1,u2,v1,v2,s1,s2,mm,e=false)=> axis==='x' ? box(g,u1,u2,v1,v2,s1,s2,mm,e) : box(g,s1,s2,v1,v2,u1,u2,mm,e);
  const br=[...new Set([a,b,...ops.flatMap(o=>[o.a,o.b])])].filter(v=>v>=a&&v<=b).sort((p,q)=>p-q);
  for(let i=0;i<br.length-1;i++){
    const u1=br[i], u2=br[i+1]; if(u2-u1<1e-3) continue;
    const cov=ops.filter(o=>o.a<=u1+1e-6&&o.b>=u2-1e-6).sort((p,q)=>p.y1-q.y1);
    let y=y0; for(const c of cov){ if(c.y1>y) mk(u1,u2,y,c.y1,m); y=Math.max(y,c.y2);} if(y1>y) mk(u1,u2,y,y1,m);
  }
  const tm=(t1+t2)/2;
  for(const o of ops){
    if(o.type==='w'){ mkT(o.a,o.b,o.y1,o.y2,tm-0.02,tm+0.02,mat.glas);
      mkT(o.a,o.b,o.y1,o.y1+0.06,tm-0.04,tm+0.04,frame); mkT(o.a,o.b,o.y2-0.06,o.y2,tm-0.04,tm+0.04,frame);
      mkT(o.a,o.a+0.05,o.y1,o.y2,tm-0.04,tm+0.04,frame); mkT(o.b-0.05,o.b,o.y1,o.y2,tm-0.04,tm+0.04,frame);
      mkT((o.a+o.b)/2-0.025,(o.a+o.b)/2+0.025,o.y1,o.y2,tm-0.04,tm+0.04,frame);
      mkT(o.a,o.b,(o.y1+o.y2)/2+0.12,(o.y1+o.y2)/2+0.16,tm-0.04,tm+0.04,frame);
    } else if(o.type==='d'||o.type==='g'){ mkT(o.a,o.b,o.y1,o.y2,tm-0.03,tm+0.03,mat.holz,true);
      if(o.type==='g') mkT((o.a+o.b)/2-0.02,(o.a+o.b)/2+0.02,o.y1,o.y2,tm-0.05,tm+0.05,mat.holzAlt);
    }
  }
}
// Giebel: Polygon in (z,y), Dicke in x
function gable(g, x1, x2, pts, m){
  const sh=new THREE.Shape(); sh.moveTo(-pts[0][0],pts[0][1]); pts.slice(1).forEach(p=>sh.lineTo(-p[0],p[1])); sh.closePath();
  const geo=new THREE.ExtrudeGeometry(sh,{depth:x2-x1,bevelEnabled:false});
  const mesh=new THREE.Mesh(geo,m); mesh.rotation.y=Math.PI/2; mesh.position.x=x1; mesh.castShadow=true; mesh.receiveShadow=true; g.add(mesh);
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo),edgeMat); e.rotation.copy(mesh.rotation); e.position.copy(mesh.position); g.add(e);
}
const triTop = [[zN,H.wallTop],[zS,H.wallTop],[zMid,H.ridge-0.05]];
const W = (a,b,y1,y2,type='w') => ({a,b,y1,y2,type});

// ---------------- Altes Bauernhaus (Wohnteil) ----------------
// Koordinaten aus Umbauplan Füssinger (Ausschnitt), auf 8,45 m Länge / Gebäudetiefe skaliert
const wx = c => xWohnStart + (c-30)*8.45/(575-30);
const wz = c => zN + (c-265)*(zS-zN)/(1065-265);
const hE=0.55, hEc=3.05, hO=3.30, hOc=6.0, hD=6.30;   // Wohnhaus: Hochparterre, OG, Dachboden (angenommen)
const tW=wz(295)-zN, xi1=wx(60), xi2=wx(540);
// Außenwände: unten nbEG (bis OG-Fußboden), oben nbOG
function wh2(axis, t1,t2, a,b, opsE, opsO){
  wall(NB_EG, axis, t1,t2, a,b, 0,hO, mat.nbPutz, opsE);
  wall(NB_OG, axis, t1,t2, a,b, hO,H.wallTop, mat.nbPutz, opsO);
}
const mapX = arr => arr.map(([a,b,t])=>[wx(a),wx(b),t]), mapZ = arr => arr.map(([a,b,t])=>[wz(a),wz(b),t]);
const opsL = (arr,y1,y2) => arr.map(([a,b,t])=>t==='d'?W(a,b,hE,2.65,'d'):W(a,b,y1,y2,'w'));
// Süd: 2 Stubenfenster, Haustür mit Vortreppe, kleines Gangfenster
wh2('x', zS-tW, zS, xWohnStart, xW,
  [...opsL(mapX([[108,167],[240,298],[479,514]]),1.45,2.6), W(wx(383),wx(456),hE,2.65,'d')],
  opsL(mapX([[108,167],[240,298],[428,486]]),hO+0.45,hO+1.6));
// Nord: Speisefenster, Tür WC-Anbau, Küchenfenster, Tür zur Scheune
wh2('x', zN, zN+tW, xWohnStart, xW,
  [...opsL(mapX([[100,150],[380,430]]),1.45,2.6), W(wx(200),wx(260),hE,2.55,'d'), W(wx(480),wx(530),hE,2.55,'d')],
  opsL(mapX([[100,150],[240,290],[400,450]]),hO+0.45,hO+1.6));
// West
wh2('z', xWohnStart, xWohnStart+tW, zN, zS,
  opsL(mapZ([[360,420],[570,630],[820,880],[940,1000]]),1.45,2.6),
  opsL(mapZ([[360,420],[570,630],[820,880],[940,1000]]),hO+0.45,hO+1.6));
// Brandwand zur Scheune
wall(NB_EG,'z', wx(540),xW, zN,zS, 0,hO, mat.nbPutz);
wall(NB_OG,'z', wx(540),xW, zN,zS, hO,H.wallTop, mat.nbPutz);
// Sockel
box(NB_EG, xWohnStart-0.04, xW, 0, 0.45, zS-0.02, zS+0.04, mat.estrich, false);
box(NB_EG, xWohnStart-0.04, xWohnStart+0.02, 0, 0.45, zN, zS, mat.estrich, false);
// Böden / Decken
box(NB_EG, xi1, xi2, 0, hE, zN+tW, zS-tW, mat.diele, false);
[[60,545,295,790],[60,475,790,900],[60,545,900,1035]].forEach(([a,b,c,d])=>box(NB_OG, wx(a),wx(b), hEc,hO, wz(c),wz(d), mat.diele));
box(NB_DG, xi1, xi2, hOc, hD, zN+tW, zS-tW, mat.diele);
// Innenwände (EG und gleiche Achsen im OG)
function inner(y0,y1,yd){
  const g = y0<1 ? NB_EG : NB_OG; const D=(a,b)=>W(a,b,y0,y0+yd,'o');
  wall(g,'z', wx(300),wx(315), wz(295),wz(728), y0,y1, mat.putz, [D(wz(380),wz(440)), D(wz(600),wz(660))]);
  wall(g,'x', wz(490),wz(500), wx(60),wx(300), y0,y1, mat.putz);
  wall(g,'x', wz(728),wz(742), wx(60),wx(545), y0,y1, mat.putz, [D(wx(150),wx(210)), D(wx(400),wx(460))]);
  wall(g,'z', wx(370),wx(385), wz(742),wz(1035), y0,y1, mat.putz, [D(wz(860),wz(920))]);
}
inner(hE,hEc,2.0); inner(hO,hOc,2.0);
// Treppe im Gang entlang Brandwand
(function(){ const n=15, r=(hO-hE)/n, za=wz(985), zb=wz(790), t=(za-zb)/n;
  for(let i=0;i<n;i++) box(NB_EG, wx(475),wx(540), hE+(i+1)*r-0.05, hE+(i+1)*r, za-(i+1)*t, za-i*t, mat.holz); })();
// Vortreppe Haustür
[0,1,2].forEach(i=>box(NB_EG, wx(360)+i*0.1, wx(500)-i*0.1, i*0.18, (i+1)*0.18, zS, zS+1.0-i*0.3, mat.estrich));
// Kamin Küche (durchs Dach), Herd, Kachelofen Wohnzimmer
const kx1=wx(495), kx2=wx(540), kz1=wz(540), kz2=wz(585);
box(NB_EG,kx1,kx2,0,hO,kz1,kz2,mat.putz); box(NB_OG,kx1,kx2,hO,hD,kz1,kz2,mat.putz);
box(NB_DG,kx1,kx2,hD,roofY((kz1+kz2)/2)+1.1,kz1,kz2,mat.putz);
box(NB_EG, wx(330),wx(370), hE,hE+0.85, wz(610),wz(665), mat.dunkel);
box(NB_EG, wx(318),wx(370), hE,hE+1.8, wz(745),wz(805), M(0x5f7d6a));
// WC-Anbau Nord
box(NB_EG, wx(180),wx(290), 0, 2.6, zN-(wz(265)-wz(175)), zN, mat.nbPutz);
box(NB_EG, wx(170),wx(300), 2.6, 2.75, zN-(wz(265)-wz(165)), zN, mat.dach);
// Giebel
gable(NB_DG, xWohnStart, xWohnStart+tW, triTop, mat.nbPutz);
box(NB_DG, xWohnStart-0.05, xWohnStart, 7.6, 8.5, zMid-1.1, zMid-0.4, mat.nbFenster, false);
box(NB_DG, xWohnStart-0.05, xWohnStart, 7.6, 8.5, zMid+0.4, zMid+1.1, mat.nbFenster, false);
gable(NB_DG, wx(540), xW, triTop, mat.nbPutz);
// Raumnamen
const LN=(g,t,a,b,y)=>label(g,t,wx(a),y,wz(b),'nb');
LN(G.lblNBEG,'<b>Speise</b>',180,390,1.9); LN(G.lblNBEG,'<b>Zimmer</b>',180,610,1.9); LN(G.lblNBEG,'<b>Küche</b>',420,460,1.9);
LN(G.lblNBEG,'<b>Wohnzimmer</b>',200,890,1.9); LN(G.lblNBEG,'<b>Gang</b>',430,980,1.9); LN(G.lblNBEG,'<b>WC</b>',235,215,1.9);
label(G.lblNB, '<b>Altes Bauernhaus</b>', (xWohnStart+xW)/2, 8.2, zMid, 'nb');

// ---------------- Stall / Remise ----------------
const fx = c => xE + (c-60)*(xStallEnd-xE)/(940-60);
const fz = c => zN + (c-80)*(zS-zN)/(890-80);
const sx = hx => xE + (hx-1055)*(xStallEnd-xE)/665;     // Ansicht 1911
const tS = 0.4, hSt=2.8;
wall(NB_EG,'x', zS-tS,zS, xE,xStallEnd, 0,hSt, mat.nbPutz,
  [W(sx(1100),sx(1135),1.1,2.2), W(sx(1200),sx(1240),1.1,2.2), W(sx(1320),sx(1435),0,2.2,'g'), W(sx(1510),sx(1680),0,2.2,'g')]);
wall(NB_EG,'x', zN,zN+tS, xE,xStallEnd, 0,hSt, mat.nbPutz,
  [W(fx(180),fx(240),1.1,2.0), W(fx(450),fx(510),1.1,2.0), W(fx(720),fx(840),0,2.2,'g')]);
wall(NB_EG,'z', xStallEnd-tS,xStallEnd, zN,zS, 0,hSt, mat.nbPutz, [W(fz(170),fz(210),1.2,1.8), W(fz(540),fz(580),1.2,1.8)]);
// Obergeschoss Holzschalung (Heuboden)
wall(NB_OG,'x', zS-0.1,zS, xE,xStallEnd, hSt,H.wallTop, mat.nbHolz);
wall(NB_OG,'x', zN,zN+0.1, xE,xStallEnd, hSt,H.wallTop, mat.nbHolz);
wall(NB_OG,'z', xStallEnd-0.1,xStallEnd, zN,zS, hSt,5.3, mat.nbHolz);
for(let x=xE+0.2; x<xStallEnd; x+=0.3){ box(NB_OG, x, x+0.04, hSt, H.wallTop, zS, zS+0.03, mat.holzAlt, false); box(NB_OG, x, x+0.04, hSt, H.wallTop, zN-0.03, zN, mat.holzAlt, false);}
[[1145,1195],[1355,1410],[1575,1630]].forEach(([a,b])=>box(NB_OG, sx(a),sx(b), 3.9,4.5, zS+0.03,zS+0.07, mat.nbFenster,false));
box(NB_OG, xE, xStallEnd-0.1, hSt, hSt+0.2, zN+0.1, zS-0.1, mat.diele);    // Heuboden
// Innenwände EG
wall(NB_EG,'z', fx(340),fx(360), zN+tS,zS-tS, 0,hSt, mat.nbPutz, [W(fz(420),fz(480),0,2.2,'o')]);
wall(NB_EG,'z', fx(615),fx(645), zN+tS,zS-tS, 0,hSt, mat.nbPutz, [W(fz(300),fz(360),0,2.2,'o')]);
wall(NB_EG,'x', fz(375),fz(390), xE,fx(340), 0,hSt, mat.nbPutz, [W(fx(150),fx(220),0,2.1,'o')]);
wall(NB_EG,'x', fz(660),fz(670), fx(360),fx(615), 0,hSt, mat.nbPutz);
box(NB_EG, xE, xStallEnd, -0.1, 0.02, zN, zS, mat.estrich, false);
// Ostgiebel mit Tor zur Hocheinfahrt
const gz1=4.4, gz2=9.4, gTop=8.6, yB=5.3;
gable(NB_DG, xStallEnd-0.12, xStallEnd, [[zN,yB],[gz1,yB],[gz1,gTop],[gz2,gTop],[gz2,yB],[zS,yB],[zS,H.wallTop],[zMid,H.ridge-0.05],[zN,H.wallTop]], mat.nbHolz);
box(NB_DG, fx(645), xStallEnd-0.12, yB-0.2, yB, zN+0.1, zS-0.1, mat.diele);   // Bühne / Tenne
label(G.lblNB, '<b>Stall / Remise</b>', (xE+xStallEnd)/2, 8.2, zMid, 'nb');
const LS=(t,a,b)=>label(G.lblNBEG,`<b>${t}</b>`,fx(a),1.6,fz(b),'nb');
LS('Schweinestall',200,230); LS('Pferdestall',200,600); LS('Remise',490,420); LS('Remise',490,770); LS('Wagenremise',780,450);

// ---------------- Keller + überdachte Hocheinfahrt + Rampe (Plan 1911) ----------------
const xK1 = xStallEnd + 4.80, xK2 = xK1 + 5.30, kz1b = 3.4, kz2b = 9.4;
// Keller (Mauerwerk 50–70 cm), Erdüberdeckung
wall(NB_EG,'x', kz2b-0.5,kz2b, xK1,xK2, 0,3.4, M(0xcfc6b6), [W(xK1+2.1,xK1+3.2,0,2.0,'d')], mat.putz);
wall(NB_EG,'x', kz1b,kz1b+0.5, xK1,xK2, 0,3.4, M(0xcfc6b6));
wall(NB_EG,'z', xK1,xK1+0.7, kz1b,kz2b, 0,3.4, M(0xcfc6b6));
wall(NB_EG,'z', xK2-0.7,xK2, kz1b,kz2b, 0,3.4, M(0xcfc6b6));
box(NB_OG, xK1, xK2, 3.4, yB-0.3, kz1b, kz2b, M(0x8f8a7c));
// Brücke Gebäude → Keller, freie Durchfahrt darunter (keine Stützen)
box(NB_OG, xStallEnd, xK1, yB-0.3, yB, gz1, gz2, mat.holz);
[gz1+0.2, gz2-0.2].forEach(z=>{ box(NB_OG, xStallEnd, xK1, yB-0.7, yB-0.3, z-0.15, z+0.15, mat.holzAlt); });
box(NB_OG, xK1, xK2, yB-0.3, yB, gz1, gz2, mat.holz);
// Einfahrtsschuppen auf Brücke und Keller (Holz)
const aTop = 9.0;
wall(NB_DG,'x', gz2-0.1,gz2, xStallEnd,xK2, yB,aTop, mat.nbHolz, [W(xStallEnd+1.5,xStallEnd+2.3,6.7,7.9), W(xK1+1.8,xK1+2.6,6.7,7.9)], mat.nbHolz);
wall(NB_DG,'x', gz1,gz1+0.1, xStallEnd,xK2, yB,aTop, mat.nbHolz);
wall(NB_DG,'z', xK2-0.1,xK2, gz1,gz2, yB,aTop, mat.nbHolz, [W(gz1+0.5,gz2-0.5,yB,8.4,'g')]);
for(let x=xStallEnd+0.15; x<xK2; x+=0.3){ box(NB_DG, x,x+0.04, yB,aTop, gz2,gz2+0.03, mat.holzAlt,false); box(NB_DG, x,x+0.04, yB,aTop, gz1-0.03,gz1, mat.holzAlt,false); }
const aMid=(gz1+gz2)/2, aHalf=(gz2-gz1)/2+0.5, aRidge=aTop+((gz2-gz1)/2)*SLOPE;
gable(NB_DG, xK2-0.1, xK2, [[gz1,aTop],[gz2,aTop],[aMid,aRidge]], mat.nbHolz);
[-1,1].forEach(s=>{ const run2=aHalf, rise2=run2*SLOPE, len=Math.hypot(run2,rise2);
  const geo=new THREE.BoxGeometry(xK2+0.5-xStallEnd, 0.22, len); const m=new THREE.Mesh(geo, mat.dach);
  m.rotation.x=s*ang; const nrm=new THREE.Vector3(0,Math.cos(ang),s*Math.sin(ang));
  m.position.set((xStallEnd+xK2+0.5)/2, aRidge-rise2/2+ (0.5*SLOPE)/2*0, aMid+s*run2/2).addScaledVector(nrm,0.11);
  m.castShadow=true; G.roof.add(m);
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo),edgeMat); e.position.copy(m.position); e.rotation.copy(m.rotation); G.roof.add(e);
});
// Auffahrtsrampe (Erddamm) nach Osten, Verlauf angenommen
(function(){
  const L=30, h=yB, x0=xK2, x1=xK2+L, s=1.3;  // Böschung 1:1,3
  const z1=gz1, z2=gz2;
  const v=[ x0,h,z1, x0,h,z2, x1,0,z2, x1,0,z1,               // Fahrbahn
            x0,0,z1-h*s, x0,0,z2+h*s ];                         // Böschungsfuß am Keller
  const idxTop=[0,1,2, 0,2,3], idxSide=[0,3,4, 1,5,2];
  const mk=(idx,m)=>{const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(v,3)); g.setIndex(idx); g.computeVertexNormals();
    const me=new THREE.Mesh(g,m); me.receiveShadow=true; me.castShadow=true; G.ramp.add(me);};
  mk(idxTop, new THREE.MeshStandardMaterial({color:0xbdb3a2, roughness:1, side:THREE.DoubleSide, clippingPlanes:[cutPlane]}));
  mk(idxSide, new THREE.MeshStandardMaterial({color:0x93a46f, roughness:1, side:THREE.DoubleSide, clippingPlanes:[cutPlane]}));
  // Stirnseite am Keller als Erdkeil
  const g2=new THREE.BufferGeometry(); g2.setAttribute('position',new THREE.Float32BufferAttribute([x0,h,z1, x0,0,z1-h*s, x0,0,kz1b, x0,h,z2, x0,0,z2+h*s, x0,0,kz2b],3));
  g2.setIndex([0,1,2, 3,5,4]); g2.computeVertexNormals(); G.ramp.add(new THREE.Mesh(g2, new THREE.MeshStandardMaterial({color:0x93a46f, side:THREE.DoubleSide})));
  label(G.lblNB,'<b>Auffahrt 1911</b> (angenommen)', x0+L*0.45, h*0.6+0.8, aMid, 'nb').userData.ramp=true;
})();
label(G.lblNB,'<b>Keller</b> mit Einfahrtsschuppen', (xK1+xK2)/2, 4.0, kz2b+0.2, 'nb');

// Güllegrube vor der Nordwand der Scheune (Umbauplan Füssinger, rot markiert)
box(NB_EG, xW, xE, 0, 0.12, zN-2.8, zN, mat.estrich);
box(NB_EG, xW+0.4, xW+1.2, 0.12, 0.16, zN-1.9, zN-1.1, mat.dunkel, false);
label(G.lblNB, 'Güllegrube (Bestand)', (xW+xE)/2, 0.6, zN-1.4, 'nb');
