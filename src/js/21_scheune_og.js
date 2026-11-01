// =====================================================================
// OBERGESCHOSS
// =====================================================================
const og = G.og;
// Decke über EG / Boden OG (Holzbalken + Dielen 510 mm) – mit Luftraum und Treppenloch
[[205,1290,175,572],[205,950,572,805],[205,1290,805,822],[205,580,822,1283],[950,1290,822,1283]]
  .forEach(r=>bp(og, ...r, H.egTop,H.ogFloor, mat.diele));
bp(og, 338,555, 157,548, H.ogFloor,H.ogFloor+0.01, mat.fliese, false);   // Kinderbad Feinsteinzeug
bp(og, 580,718, 252,548, H.ogFloor,H.ogFloor+0.01, mat.fliese, false);   // Elternbad
// Innenwände OG (Holzständer)
[[318,338,145,805],[555,580,152,555],[718,735,250,555],[950,968,250,475],
 [338,465,550,572],[545,805,550,572],[885,1322,550,572],
 [205,465,803,825],[545,560,803,825],[950,975,803,825],[1060,1322,803,825],
 [560,580,825,1290],[950,970,825,1290],[1285,1322,572,805]].forEach(w=>bp(og, ...w, H.ogFloor,H.ogCeil, mat.putz));
[[465,545,550,572],[805,885,550,572],[465,545,803,825],[975,1060,803,825]].forEach(w=>bp(og, ...w, H.ogFloor+2.1,H.ogCeil, mat.putz));
// Brüstung Luftraum + Treppenauge
bp(og, 580,950, 808,818, H.ogFloor,H.ogFloor+1.0, mat.glas);
bp(og, 580,950, 806,820, H.ogFloor+0.96,H.ogFloor+1.02, mat.gelaender);
bp(og, 947,953, 697,805, H.ogFloor+0.96,H.ogFloor+1.02, mat.gelaender);
for(let py=700; py<805; py+=10) bp(og, 948,952, py,py+1.5, H.ogFloor,H.ogFloor+0.96, mat.gelaender, false);
// Giebelwände OG (Holzständer 376)
bp(og, 200,230, 145,1300, H.wallEG,H.wallTop, mat.putz);
bp(og, 1322,1350, 145,1300, H.wallEG,H.wallTop, mat.putz);

// Fassaden OG Nord/Süd: Fachwerk Bestand + 3-fach Verglasung
function facadeOG(postPy1, postPy2, glassPy){
  const grid=[180,570,958,1337];
  // Schwelle, Rähm
  bp(og, 162,1357, postPy1,postPy2, H.wallEG,H.wallEG+0.2, mat.holzAlt);
  bp(og, 162,1357, postPy1,postPy2, H.wallTop-0.22,H.wallTop, mat.holzAlt);
  bp(og, 162,1357, postPy1,postPy2, H.dgFloor-0.1,H.dgFloor+0.1, mat.holzAlt);
  grid.forEach(g=>{
    bp(og, g-13,g+13, postPy1,postPy2, H.wallEG,H.wallTop, mat.holzAlt);
  });
  // Kopfbänder
  const k=1.1;
  grid.forEach(g=>{
    [-1,1].forEach(s=>{
      const x0=X(g), x1=x0+s*k, y0=H.dgFloor-0.85, y1=H.dgFloor-0.1;
      const len=Math.hypot(k,y1-y0), geo=new THREE.BoxGeometry(len,0.16,(postPy2-postPy1)*P*0.8);
      const m=new THREE.Mesh(geo, mat.holzAlt); m.position.set((x0+x1)/2,(y0+y1)/2,Z((postPy1+postPy2)/2));
      m.rotation.z = s*Math.atan2(y1-y0,k); m.castShadow=true;
      if((s<0&&g>180)||(s>0&&g<1337)) og.add(m);
    });
  });
  // Verglasung mit Pfosten
  bp(og, 230,1322, glassPy-2,glassPy+2, H.ogFloor,H.ogCeil, mat.glas);
  bp(og, 230,1322, glassPy-3,glassPy+3, H.ogCeil-0.06,H.ogCeil, mat.rahmen);
  bp(og, 230,1322, glassPy-3,glassPy+3, H.wallEG+0.2,H.ogFloor, mat.holz);
  for(let px=230; px<=1322; px+=(1322-230)/12) bp(og, px-3,px+3, glassPy-3,glassPy+3, H.ogFloor,H.ogCeil, mat.rahmen, false);
  // Kniestock DG geschlossen (Holzschalung)
  bp(og, 200,1350, glassPy-3,glassPy+3, H.ogCeil,H.wallTop-0.22, mat.lamelle);
}
facadeOG(110,140,150);
facadeOG(1318,1348,1295);

// Treppe zur ELW (1.05): OKF OG -> Podest +6,10
(function(){
  const x1=X(232), x2=X(318), zs=Z(690), ze=Z(240), n=17, t=(zs-ze)/n;
  box(og, x1,x2, H.ogFloor-0.05,H.ogFloor, Z(690),Z(803), mat.holz);
  for(let i=0;i<n-1;i++){
    const y=H.ogFloor+(i+1)*R; const g = y>H.ogCeil ? G.dg : og;
    box(g, x1,x2, y-0.05,y, zs-(i+1)*t, zs-i*t, mat.holz);
  }
  box(G.dg, x1,x2, H.dgFloor,6.10, Z(145),Z(240), mat.holz);  // Podest ELW
})();

// Möbel OG
const fo = G.furnOG;
bp(fo, 1130,1320, 278,450, H.ogFloor,H.ogFloor+0.45, mat.moebel);           // Bett
bp(fo, 1310,1320, 278,450, H.ogFloor,H.ogFloor+1.0, mat.moebelH);
bp(fo, 887,945, 250,475, H.ogFloor,H.ogFloor+2.2, mat.moebelH);             // Schränke Ankleide
bp(fo, 970,1027, 250,475, H.ogFloor,H.ogFloor+2.2, mat.moebelH);
bp(fo, 358,515, 183,247, H.ogFloor,H.ogFloor+0.55, mat.moebel);             // Badewanne
bp(fo, 358,400, 300,370, H.ogFloor,H.ogFloor+0.85, mat.moebel);             // WT Kinderbad
bp(fo, 585,627, 255,375, H.ogFloor,H.ogFloor+0.85, mat.moebel);             // Doppel-WT Elternbad
bp(fo, 360,450, 455,548, H.ogFloor+0.01,H.ogFloor+2.0, mat.glas);           // Dusche
bp(fo, 585,720, 455,548, H.ogFloor+0.01,H.ogFloor+2.0, mat.glas);
