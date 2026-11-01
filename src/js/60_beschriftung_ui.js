// =====================================================================
// RAUMBEZEICHNUNGEN
// =====================================================================
const L = (g, nr, name, f, px, py, y, cls) => label(g, `<b>${nr}</b> ${name}<br>${f}`, X(px), y, Z(py), cls);
const yE=1.3, yO=H.ogFloor+1.3;
[['0.01','Eingang/Garderobe','14,84 m²',290,1060],['0.02','Gäste WC','2,93 m²',290,700],['0.03','Technik','11,61 m²',365,370],
 ['0.04','Speisekammer','5,06 m²',470,690],['0.05','Wohnen','29,27 m²',760,420],['0.06','Arbeiten','13,49 m²',1180,470],
 ['0.07','Treppe','8,18 m²',1050,760],['0.08','Kochen','17,16 m²',1110,1200],['0.09','Essen','21,26 m²',765,1200]]
 .forEach(r=>L(G.lblEG, ...r, yE, ''));
[['0.01','Kinderzimmer','17,56 m²',400,1060],['2.06','Kinderzimmer','18,56 m²',1140,1060],['1.02','Flur/Galerie','15,84 m²',740,690],
 ['1.03','Kinderbad','8,44 m²',450,400],['1.04a','Elternbad','6,08 m²',650,420],['1.04b','Ankleide','9,53 m²',840,400],
 ['1.04c','Eltern Schlafen','15,44 m²',1170,480],['1.05','Aufgang ELW','',265,500],['','Luftraum','über Essen',765,1050]]
 .forEach(r=>L(G.lblOG, ...r, yO, 'og'));

// =====================================================================
// UI
// =====================================================================
const views = {
  out:  {p:[44,24,52], t:[17,3,6]},
  hof:  {p:[58,15,34], t:[33,4,6]},
  env:  {p:[95,120,230], t:[15,0,-15]},
  barn: {p:[17,13,27], t:[6,3,6]},
  top:  {p:[6.1,34,6.05], t:[6.1,0,6]},
  in:   {p:[7.3,1.6,11.4], t:[6.2,2.2,2.0]},
};
{ const pts=(ENV.bkInit||[]).filter(t=>t.E!=null).map(t=>utm2m(t.E,t.N));
  if(pts.length){ const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length, cz=pts.reduce((a,p)=>a+p[1],0)/pts.length; views.orchard={p:[cx+15,95,cz+55], t:[cx,0,cz]}; } }
let anim=null;
function fitP(v){const t=new THREE.Vector3(...v.t), p=new THREE.Vector3(...v.p); const f=Math.max(1, Math.min(1.9, 1.15/camera.aspect)); return t.clone().add(p.sub(t).multiplyScalar(v===views.in?1:(v===views.env?Math.min(f,1.2):f)));}
function goView(k){
  const v=views[k]; const p0=camera.position.clone(), t0=controls.target.clone();
  const t1=new THREE.Vector3(...v.t), p1=fitP(v); const t=performance.now();
  anim = now => { let a=Math.min(1,(now-t)/900); a=a<.5?2*a*a:1-Math.pow(-2*a+2,2)/2;
    camera.position.lerpVectors(p0,p1,a); controls.target.lerpVectors(t0,t1,a); if(a>=1) anim=null; };
}
camera.position.copy(fitP(views.out)); controls.target.set(...views.out.t);

const state = {lvl:'all', roof:true, truss:true, nb:true, furn:true, labels:true, cut:14, env:true, ramp:true};
function apply(){
  const showOG = state.lvl!=='eg', showDG = state.lvl==='all';
  G.og.visible = showOG; G.furnOG.visible = showOG && state.furn;
  G.dg.visible = showDG; G.roof.visible = showDG && state.roof; G.truss.visible = showDG && state.truss;
  G.furnEG.visible = state.furn; G.nbEG.visible = state.nb; G.nbOG.visible = state.nb && showOG; G.nbDG.visible = state.nb && showDG;
  G.lblNBEG.visible = state.labels && state.nb && state.lvl==='eg';
  G.lblEG.visible = state.labels && state.lvl==='eg';
  G.lblOG.visible = state.labels && (state.lvl==='og' || (state.lvl==='all' && !state.roof));
  G.lblNB.visible = state.labels && state.nb && state.lvl==='all';
  ENVG.visible = state.env; G.ramp.visible = state.ramp; applyBK();
  ENVG.traverse(o=>{ if(o.isCSS2DObject) o.visible = state.env && state.labels; });
  cutPlane.constant = state.cut>=13.9 ? 1e6 : state.cut;
  document.getElementById('cutv').textContent = state.cut>=13.9 ? 'aus' : state.cut.toFixed(1)+' m';
  [G.lblEG,G.lblOG,G.lblNB,G.lblNBEG].forEach(g=>g.children.forEach(o=>{o.visible = g.visible && (state.cut>=13.9 || o.userData.z <= state.cut) && !(o.userData.ramp && !state.ramp);}));
}
document.querySelectorAll('[data-lvl]').forEach(b=>b.onclick=()=>{
  state.lvl=b.dataset.lvl; document.querySelectorAll('[data-lvl]').forEach(x=>x.classList.toggle('on',x===b));
  if(state.lvl!=='all' && camera.position.y<10) goView('barn');
  apply();
});
document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{state[b.dataset.t]=!state[b.dataset.t]; b.classList.toggle('on',state[b.dataset.t]); apply();});
document.querySelectorAll('[data-cam]').forEach(b=>b.onclick=()=>goView(b.dataset.cam));
document.getElementById('cut').oninput=e=>{state.cut=parseFloat(e.target.value); apply();};
document.getElementById('toggle').onclick=e=>{const p=document.getElementById('panel'); p.classList.toggle('min'); e.target.textContent=p.classList.contains('min')?'Menü ▴':'Menü ▾';};
apply();

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); lr.setSize(innerWidth,innerHeight);});
renderer.setAnimationLoop(now=>{ if(anim) anim(now); controls.update(); renderer.render(scene,camera); lr.render(scene,camera); });
