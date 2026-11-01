// =====================================================================
// ERDGESCHOSS
// =====================================================================
const eg = G.eg;
bp(eg, 162,1357, 110,1350, -0.3,0, mat.estrich, false); // Bodenplatte / Sichtestrich

// Außenwände EG (400 Klinker außen + Dämmung/Ziegel/Putz innen = 685 mm)
function facadeEG(piers, openings, outerPy, innerPy, splitPy, north){
  for(const [a,b] of piers){
    bp(eg, a,b, north?outerPy:splitPy, north?splitPy:outerPy, 0,H.wallEG, mat.klinker);
    bp(eg, a,b, north?splitPy:innerPy, north?innerPy:splitPy, 0,H.wallEG, mat.putz);
  }
  for(const [a,b] of openings){
    const z1=Math.min(outerPy,innerPy), z2=Math.max(outerPy,innerPy);
    bp(eg, a,b, z1,z2, 2.30,H.wallEG, mat.klinker);           // Sturz
    const gz = north ? 150 : 1296;
    bp(eg, a,b, gz-2,gz+2, 0.02,2.30, mat.glas);                 // Verglasung
    bp(eg, a,b, gz-3,gz+3, 2.22,2.30, mat.rahmen);
    bp(eg, a,a+5, gz-3,gz+3, 0,2.30, mat.rahmen);
    bp(eg, b-5,b, gz-3,gz+3, 0,2.30, mat.rahmen);
    if(b-a>120) bp(eg, (a+b)/2-3,(a+b)/2+3, gz-3,gz+3, 0,2.30, mat.rahmen);
  }
}
facadeEG([[162,359],[451,679],[871,1056],[1146,1209],[1287,1357]], [[359,451],[679,871],[1056,1146],[1209,1287]], 110,175,148,true);
facadeEG([[162,233],[433,664],[867,1001],[1203,1357]], [[233,433],[664,867],[1001,1203]], 1350,1283,1310,false);
// Giebelseiten (zum Wohnhaus / zum Stall)
bp(eg, 162,200, 110,1350, 0,H.wallEG, mat.klinker); bp(eg, 200,228, 175,1283, 0,H.wallEG, mat.putz);
bp(eg, 1318,1357, 110,1350, 0,H.wallEG, mat.klinker); bp(eg, 1290,1318, 175,1283, 0,H.wallEG, mat.putz);

// Innenwände EG (Hochlochziegel 175 + Putz)
[[503,521,175,572],[368,580,554,572],[561,579,572,822],[226,368,554,584],[351,368,584,804],
 [226,238,804,822],[318,414,804,822],[494,579,804,822],
 [950,968,175,404],[950,968,484,555],[950,1290,554,572],[950,1300,804,822],
 [445,579,922,939],[504,521,939,1283]].forEach(w=>bp(eg, ...w, 0,H.egTop, mat.putz));
// Türstürze
[[238,318,804,822],[414,494,804,822],[950,968,404,484]].forEach(w=>bp(eg, ...w, 2.295,H.egTop, mat.putz));
// Treppenmittelwand bis OG + 0,90
bp(eg, 950,1186, 678,697, 0,H.ogFloor, mat.putz);
bp(G.og, 950,1186, 678,697, H.ogFloor,H.ogFloor+0.9, mat.putz);

// Holzwangentreppe 16 Stg / 0,185
const R=0.185;
(function stairs(){
  const z1=Z(697), z2=Z(805), xa=X(978), xb=X(1190), n=8, t=(xb-xa)/n;
  for(let i=0;i<n;i++) box(eg, xa+i*t, xa+(i+1)*t, (i+1)*R-0.05, (i+1)*R, z1+0.02, z2-0.02, mat.holz);
  box(eg, X(1190), X(1288), 8*R-0.25, 8*R, Z(572), Z(805), mat.holz);      // Podest
  const u1=Z(574), u2=Z(678), xs=X(1190), xe=X(950), tu=(xs-xe)/8;
  for(let i=0;i<7;i++) box(eg, xs-(i+1)*tu, xs-i*tu, 8*R+(i+1)*R-0.05, 8*R+(i+1)*R, u1, u2, mat.holz);
})();

// Schornstein Erlus LAF18 (bis über Dach)
bp(eg, 368,406, 762,800, 0,H.ogFloor, mat.putz);
bp(G.og, 368,406, 762,800, H.ogFloor,H.dgFloor, mat.putz);
bp(G.dg, 368,406, 762,800, H.dgFloor, 12.9, mat.putz);
bp(G.dg, 362,412, 756,806, 12.9, 13.05, mat.dunkel);

// Möbel EG
const fe = G.furnEG;
bp(fe, 717,813, 926,1152, 0.72,0.77, mat.moebelH);                       // Esstisch
bp(fe, 760,770, 1030,1048, 0,0.72, mat.dunkel, false);
[[668,706],[823,861]].forEach(([a,b])=>[[935,973],[992,1030],[1049,1087],[1105,1143]].forEach(([c,d])=>{
  bp(fe, a,b, c,d, 0.42,0.47, mat.moebel); bp(fe, a+15,b-15, c+15,d-15, 0,0.42, mat.dunkel, false);
  const back = a<760 ? [a,a+5] : [b-5,b]; bp(fe, back[0],back[1], c,d, 0.47,0.85, mat.moebel);
}));
bp(fe, 1047,1132, 926,1152, 0,0.92, mat.moebel);                          // Kochinsel
bp(fe, 1047,1132, 926,1152, 0.92,0.96, mat.dunkel);
[963,1040,1115].forEach(y=>{const s=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.06,20), mat.moebelH); s.position.set(X(1012),0.7,Z(y)); s.castShadow=true; fe.add(s); bp(fe,1009,1015,y-3,y+3,0,0.7,mat.dunkel,false);});
bp(fe, 1226,1284, 823,1255, 0,0.92, mat.moebel); bp(fe, 1226,1284, 823,1255, 0.92,0.96, mat.dunkel); // Küchenzeile
bp(fe, 1255,1284, 823,1255, 1.5,2.3, mat.moebel);
bp(fe, 595,652, 722,780, 0,1.1, mat.dunkel);                              // Kaminofen
bp(fe, 619,628, 745,755, 1.1,2.2, mat.dunkel, false);
bp(fe, 1103,1255, 262,413, 0.72,0.77, mat.moebelH);                       // Schreibtisch
bp(fe, 1110,1118, 270,405, 0,0.72, mat.dunkel,false); bp(fe, 1240,1248, 270,405, 0,0.72, mat.dunkel,false);
[[210,247],[428,466]].forEach(([c,d])=>{bp(fe,1159,1197,c,d,0.45,0.5,mat.dunkel); });
bp(fe, 968,1287, 496,552, 0,2.2, mat.moebelH);                            // Einbauregal
bp(fe, 307,349, 674,724, 0,0.85, mat.moebel);                             // WT Gäste WC
