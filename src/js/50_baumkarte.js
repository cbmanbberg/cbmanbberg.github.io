// ---------------- Baumkarte: eigene Bäume pflanzen, bearbeiten, fällen ----------------
const BK = {db:null, col:null, local:false, can:true, trees:new Map(), objs:new Map(), show:true, plant:false, placeFor:null, sel:null, newPt:null};
const BKG = new THREE.Group(); scene.add(BKG);
const ctE=Math.cos(ENV.th), stE=Math.sin(ENV.th);
const utm2m=(E,N)=>{const dE=E-ENV.A[0], dN=N-ENV.A[1]; return [dE*ctE+dN*stE+ENV.xc, dE*stE-dN*ctE+ENV.zS];};
const m2utm=(x,z)=>{const a=x-ENV.xc, b=z-ENV.zS; return [ENV.A[0]+a*ctE+b*stE, ENV.A[1]+a*stE-b*ctE];};
const bkRay=new THREE.Raycaster(), DOWN=new THREE.Vector3(0,-1,0);
function groundY(x,z){ if(!TERR) return 0; bkRay.set(new THREE.Vector3(x,300,z),DOWN); const h=bkRay.intersectObject(TERR)[0]; return h?h.point.y:-0.6; }
const SPEC={Apfel:[0x5e8f3b,'rund'],Birne:[0x4d7f3a,'hoch'],Kirsche:[0x5b8a44,'rund'],Zwetschge:[0x557d3f,'hoch'],Mirabelle:[0x5b8840,'rund'],Quitte:[0x6a9140,'rund'],
  Walnuss:[0x4a7834,'gross'],Maroni:[0x4e7b36,'gross'],Eiche:[0x456e2f,'gross'],Sumpfeiche:[0x4a7432,'gross'],Linde:[0x5c8d3d,'gross'],Buche:[0x4f7a33,'gross'],Ahorn:[0x55833a,'gross']};
const ARTEN=['Apfel','Birne','Kirsche','Zwetschge','Mirabelle','Quitte','Walnuss','Maroni','Eiche','Sumpfeiche','Linde','Buche','Ahorn'];
const crownGeo=new THREE.IcosahedronGeometry(1,1), trunkGeo=new THREE.CylinderGeometry(1,1.2,1,7);
const trunkMat=new THREE.MeshStandardMaterial({color:0x5a4634}), deadMat=new THREE.MeshStandardMaterial({color:0x8a8178}),
      stakeMat=new THREE.MeshStandardMaterial({color:0xd9c9a8}), stumpMat=new THREE.MeshStandardMaterial({color:0x7a5f45}), pickMat=new THREE.MeshBasicMaterial({visible:false});
const selRing=new THREE.Mesh(new THREE.RingGeometry(1,1.25,40), new THREE.MeshBasicMaterial({color:0xffc83d, side:THREE.DoubleSide, depthTest:false, transparent:true}));
selRing.rotation.x=-Math.PI/2; selRing.visible=false; selRing.renderOrder=10; scene.add(selRing);
const YEAR=new Date().getFullYear();
function treeSize(t){
  const sp=SPEC[(t.art||'').trim()]||[0x5e8f3b,'rund'], big=sp[1]==='gross', yr=parseInt(t.gepflanzt);
  let h=+t.h||0;
  if(!h){ if(yr){ const age=Math.max(0,YEAR-yr); h=big?Math.min(2.5+age*0.6,14):Math.min(2.2+age*0.35,6);} else h=big?10:5.5; }
  const r=big?Math.min(Math.max(h*0.33,1),6):Math.min(Math.max(h*0.38,0.7),4.5);
  return {h,r,sp};
}
function buildTree(t){
  const g=new THREE.Group(); const [x,z]=utm2m(t.E,t.N); g.position.set(x,groundY(x,z),z); g.userData.id=t.id;
  const st=t.status||'aktiv', hasArt=!!(t.art||'').trim();
  let top=1.5, pr=0.7;
  if(st==='gefällt'){ const m=new THREE.Mesh(trunkGeo,stumpMat); m.scale.set(0.25,0.35,0.25); m.position.y=0.17; g.add(m); top=0.6; }
  else if(!hasArt && st!=='abgestorben'){ const m=new THREE.Mesh(trunkGeo,stakeMat); m.scale.set(0.04,1.3,0.04); m.position.y=0.65; g.add(m); }
  else {
    const {h,r,sp}=treeSize(t); top=h; pr=r;
    if(st==='abgestorben'){
      const w=0.12+h*0.01, m=new THREE.Mesh(trunkGeo,deadMat); m.scale.set(w,h*0.6,w); m.position.y=h*0.3; m.castShadow=true; g.add(m);
      [0,2.1,4.2].forEach(a=>{const b=new THREE.Mesh(trunkGeo,deadMat); b.scale.set(0.05,h*0.3,0.05); b.position.set(Math.cos(a)*0.35,h*0.55,Math.sin(a)*0.35); b.rotation.set(Math.sin(a)*0.6,0,-Math.cos(a)*0.6); g.add(b);});
      top=h*0.75;
    } else {
      const ch=sp[1]==='hoch'?Math.min(h*0.55,r*1.8):Math.min(h*0.45,r*1.25), cy=h-ch, young=parseInt(t.gepflanzt)>=YEAR-3;
      const col=new THREE.Color(sp[0]); if(young) col.offsetHSL(0,0.06,0.08);
      const c=new THREE.Mesh(crownGeo,new THREE.MeshStandardMaterial({color:col,roughness:.95,flatShading:true})); c.scale.set(r,ch,r); c.position.y=cy; c.rotation.y=(t.E*7)%6; c.castShadow=true; g.add(c);
      const tw=0.06+h*0.012, tr=new THREE.Mesh(trunkGeo,trunkMat); tr.scale.set(tw,cy+0.2,tw); tr.position.y=cy/2; tr.castShadow=true; g.add(tr);
      if(young){ const p=new THREE.Mesh(trunkGeo,stakeMat); p.scale.set(0.03,1.7,0.03); p.position.set(0.25,0.85,0); g.add(p); }
    }
  }
  const pr2=Math.max(pr,0.8), ph=Math.max(top,1.6);
  const pick=new THREE.Mesh(new THREE.CylinderGeometry(pr2,pr2,ph,8),pickMat); pick.position.y=ph/2; pick.userData.id=t.id; g.add(pick);
  const d=document.createElement('div'); d.className='lbl bk'+(st==='gefällt'?' fell':'')+(st==='abgestorben'?' dead':''); d.textContent=t.nr||'?';
  const lo=new CSS2DObject(d); lo.position.y=top+0.5; g.add(lo);
  g.userData={id:t.id,pick,label:lo,r:pr2};
  return g;
}
function hideGeneric(){
  if(!GEN) return; const pts=[...BK.objs.values()].map(g=>g.position), zero=new THREE.Matrix4().makeScale(0,0,0);
  GEN.trees.forEach((t,i)=>{
    const near=BK.show && pts.some(p=>Math.hypot(p.x-t[0],p.z-t[1])<3.2);
    if(near){ GEN.crowns.setMatrixAt(i,zero); GEN.trunks.setMatrixAt(i,zero); }
    else { GEN.crowns.instanceMatrix.array.set(GEN.c0.subarray(i*16,i*16+16),i*16); GEN.trunks.instanceMatrix.array.set(GEN.t0.subarray(i*16,i*16+16),i*16); }
  });
  GEN.crowns.instanceMatrix.needsUpdate=true; GEN.trunks.instanceMatrix.needsUpdate=true;
}
function applyBK(){
  const vis=BK.show && state.env;
  BKG.visible=vis;
  BK.objs.forEach(g=>{ g.userData.label.visible=vis; });
  if(!vis){ selRing.visible=false; }
  hideGeneric();
}
function rebuildBK(){
  BK.objs.forEach(g=>{ g.userData.label.removeFromParent(); BKG.remove(g); });
  BK.objs.clear();
  BK.trees.forEach(t=>{ if(t.E==null||t.N==null) return; const g=buildTree(t); BKG.add(g); BK.objs.set(t.id,g); });
  applyBK(); fillLists(); renderList();
  if(BK.sel){ const g=BK.objs.get(BK.sel); if(g) ringAt(g.position,g.userData.r); }
}
function ringAt(p,r){ selRing.position.set(p.x,p.y+0.08,p.z); selRing.scale.setScalar(r*1.1); selRing.visible=true; }

// ---- UI ----
const $=id=>document.getElementById(id);
function toast(msg,ms=2600){ const t=$('toast'); t.textContent=msg; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true,ms); }
const byNr=(a,b)=>{const x=parseFloat(a.nr), y=parseFloat(b.nr); if(isNaN(x)&&isNaN(y)) return String(a.nr).localeCompare(String(b.nr)); if(isNaN(x)) return 1; if(isNaN(y)) return -1; return x-y||String(a.id).localeCompare(String(b.id));};
function nextNr(){ let m=0; BK.trees.forEach(t=>{const n=parseInt(t.nr); if(n>m) m=n;}); return String(m+1); }
function fillLists(){
  const arts=new Set(ARTEN), sorten=new Set(); BK.trees.forEach(t=>{ if(t.art) arts.add(t.art.trim()); if(t.sorte) sorten.add(t.sorte.trim()); });
  $('artList').innerHTML=''; arts.forEach(a=>{const o=document.createElement('option'); o.value=a; $('artList').appendChild(o);});
  $('sorteList').innerHTML=''; sorten.forEach(a=>{const o=document.createElement('option'); o.value=a; $('sorteList').appendChild(o);});
}
let delArm=false;
function openSheet(mode, t){
  BK.mode=mode; delArm=false; $('shDel').textContent='Löschen'; $('shMsg').textContent='';
  $('shTitle').textContent = mode==='new' ? 'Neuen Baum pflanzen' : `Baum ${t.nr||''}`;
  $('fNr').value=t.nr??''; $('fArt').value=t.art||''; $('fSorte').value=t.sorte||''; $('fGep').value=t.gepflanzt??''; $('fGes').value=t.geschnitten??'';
  $('fStatus').value=t.status||'aktiv'; $('fNotiz').value=t.notiz||'';
  $('shPos').textContent = t.E!=null ? `Lage: Ost ${(+t.E).toFixed(1)} / Nord ${(+t.N).toFixed(1)} (UTM 32)${t.h?` · gemessene Höhe ${t.h} m`:''}` : 'Noch ohne Lage im Gelände';
  ['shFell','shMove','shDel'].forEach(k=>$(k).hidden = mode==='new');
  $('shFell').textContent = (t.status==='gefällt') ? 'Wieder aktiv' : 'Fällen';
  ['shSave','shFell','shMove','shDel'].forEach(k=>$(k).disabled=!BK.can);
  if(!BK.can) $('shMsg').textContent='Nur ansehen: du kannst hier nichts ändern.';
  $('sheet').hidden=false; $('list').hidden=true;
}
function closeSheet(){ $('sheet').hidden=true; BK.sel=null; BK.newPt=null; selRing.visible=false; }
function openTree(id){ const t=BK.trees.get(id); if(!t) return; BK.sel=id; const g=BK.objs.get(id); if(g) ringAt(g.position,g.userData.r); openSheet('edit',t); }
function openNew(E,N,p){ BK.sel=null; BK.newPt={E:+E.toFixed(2),N:+N.toFixed(2)}; ringAt(p,0.9);
  openSheet('new',{nr:nextNr(),art:'',sorte:'',gepflanzt:YEAR,status:'aktiv',E:BK.newPt.E,N:BK.newPt.N}); }
const numOrNull=v=>{ v=String(v).trim(); if(!v) return null; const n=Number(v); return isNaN(n)?v:n; };
function formData(){ return {nr:$('fNr').value.trim(), art:$('fArt').value.trim(), sorte:$('fSorte').value.trim(), gepflanzt:numOrNull($('fGep').value), geschnitten:numOrNull($('fGes').value), status:$('fStatus').value, notiz:$('fNotiz').value.trim()}; }

// ---- Speichern: Datenbank des Artefakts, sonst nur auf diesem Gerät ----
function persistLocal(){ try{ localStorage.setItem('bk-trees', JSON.stringify([...BK.trees.values()])); }catch(e){} }
async function writeTree(id, data, isNew){
  if(BK.local){ const t={...(BK.trees.get(id)||{id}), ...data, id}; BK.trees.set(id,t); persistLocal(); rebuildBK(); return true; }
  try{ const ref=BK.col.doc(id); if(isNew) await ref.set(data); else await ref.update(data); return true; }
  catch(e){ if(e&&e.code==='invalid_argument'){ BK.can=false; } $('shMsg').textContent='Speichern nicht möglich ('+(e&&e.code||'Fehler')+')'; return false; }
}
async function removeTree(id){
  if(BK.local){ BK.trees.delete(id); persistLocal(); rebuildBK(); return true; }
  try{ await BK.col.doc(id).delete(); return true; } catch(e){ $('shMsg').textContent='Löschen nicht möglich ('+(e&&e.code||'Fehler')+')'; return false; }
}
$('shClose').onclick=closeSheet;
$('shSave').onclick=async()=>{
  const d=formData(); if(!d.nr){ $('shMsg').textContent='Bitte eine Nummer eintragen.'; return; }
  if(BK.mode==='new'){ const id='u'+Date.now().toString(36); if(await writeTree(id,{...d,E:BK.newPt.E,N:BK.newPt.N,h:null,angelegt:new Date().toISOString().slice(0,10)},true)){ toast(`Baum ${d.nr} gepflanzt`); closeSheet(); } }
  else if(BK.sel){ if(await writeTree(BK.sel,d,false)){ toast('Gespeichert'); closeSheet(); } }
};
$('shFell').onclick=async()=>{ const t=BK.trees.get(BK.sel); if(!t) return; const to=t.status==='gefällt'?'aktiv':'gefällt';
  const add = to==='gefällt' ? {status:to, gefaellt:new Date().toISOString().slice(0,10)} : {status:to};
  if(await writeTree(BK.sel,add,false)){ toast(to==='gefällt'?`Baum ${t.nr} als gefällt markiert`:`Baum ${t.nr} wieder aktiv`); closeSheet(); } };
$('shMove').onclick=()=>{ BK.placeFor=BK.sel; $('sheet').hidden=true; toast('Tippe im Gelände auf die neue Stelle',4000); };
$('shDel').onclick=async()=>{ if(!delArm){ delArm=true; $('shDel').textContent='Wirklich löschen?'; return; }
  const t=BK.trees.get(BK.sel); if(await removeTree(BK.sel)){ toast(`Baum ${t?t.nr:''} gelöscht`); closeSheet(); } };

// ---- Liste ----
function renderList(){
  const tb=$('listBody'); if(!tb) return; tb.innerHTML='';
  [...BK.trees.values()].sort(byNr).forEach(t=>{
    const tr=document.createElement('tr'); if(t.status==='gefällt') tr.className='fell';
    [t.nr, t.art||'', t.sorte||'', t.gepflanzt??'', t.status&&t.status!=='aktiv'?t.status:''].forEach(v=>{const td=document.createElement('td'); td.textContent=v; tr.appendChild(td);});
    const td=document.createElement('td');
    if(t.E==null){ const b=document.createElement('button'); b.textContent='Lage setzen'; b.disabled=!BK.can; b.onclick=e=>{e.stopPropagation(); BK.placeFor=t.id; $('list').hidden=true; toast('Tippe im Gelände auf die Stelle',4000);}; td.appendChild(b); }
    tr.appendChild(td);
    tr.onclick=()=>{ if(t.E==null) return; flyTo(t.id); };
    tb.appendChild(tr);
  });
  $('listInfo').textContent = BK.local ? 'Änderungen werden nur auf diesem Gerät gespeichert.' : `${BK.trees.size} Einträge`;
}
function flyTo(id){ const g=BK.objs.get(id); if(!g) return; const p=g.position;
  views._t={p:[p.x+9,p.y+9,p.z+13], t:[p.x,p.y+2,p.z]}; goView('_t'); openTree(id); }
$('listClose').onclick=()=>{$('list').hidden=true;};

// ---- Tippen im Modell ----
let downP=null;
renderer.domElement.addEventListener('pointerdown',e=>{downP={x:e.clientX,y:e.clientY,t:performance.now()};});
renderer.domElement.addEventListener('pointerup',e=>{ if(!downP) return; const mv=Math.hypot(e.clientX-downP.x,e.clientY-downP.y), dt=performance.now()-downP.t; downP=null; if(mv<8&&dt<600) onTap(e); });
function onTap(e){
  if(!BK.show || !state.env) return;
  const r=renderer.domElement.getBoundingClientRect();
  bkRay.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1, -(e.clientY-r.top)/r.height*2+1), camera);
  if(!BK.placeFor){ const hit=bkRay.intersectObjects([...BK.objs.values()].map(g=>g.userData.pick),false)[0]; if(hit){ openTree(hit.object.userData.id); return; } }
  if(!(BK.plant||BK.placeFor) || !TERR) return;
  const th=bkRay.intersectObject(TERR)[0]; if(!th) return;
  const [E,N]=m2utm(th.point.x, th.point.z);
  if(BK.placeFor){ const id=BK.placeFor; BK.placeFor=null; writeTree(id,{E:+E.toFixed(2),N:+N.toFixed(2)},false).then(ok=>ok&&toast('Neue Lage gespeichert')); return; }
  openNew(E,N,th.point);
}

// ---- Excel-Export ----
async function exportXlsx(){
  const C=window.claude; const dl=C&&C.use ? await C.use('downloads') : null;
  if(!dl){ toast('Download ist in dieser Ansicht nicht verfügbar'); return; }
  try{
    if(!window.XLSX) await new Promise((res,rej)=>{const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload=res; s.onerror=rej; document.head.appendChild(s);});
    const rows=[...BK.trees.values()].sort(byNr).map(t=>({Nr:isNaN(+t.nr)?t.nr:+t.nr, Art:t.art||'', Sorte:t.sorte||'', gepflanzt:t.gepflanzt??'', geschnitten:t.geschnitten??'', Status:t.status||'aktiv', 'gefällt am':t.gefaellt||'', Notiz:t.notiz||'', 'Ostwert (UTM32)':t.E??'', 'Nordwert (UTM32)':t.N??''}));
    const ws=XLSX.utils.json_to_sheet(rows); ws['!cols']=[{wch:5},{wch:12},{wch:24},{wch:10},{wch:11},{wch:11},{wch:11},{wch:32},{wch:15},{wch:15}];
    const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Baumkarte');
    const buf=XLSX.write(wb,{bookType:'xlsx',type:'array'});
    await dl.save({filename:'Baumkarte.xlsx', data:new Blob([buf])});
  }catch(e){ if(!(e&&e.code==='declined')) toast('Export nicht möglich'+(e&&e.code?' ('+e.code+')':'')); }
}

// ---- Buttons ----
document.querySelectorAll('[data-bk]').forEach(b=>b.onclick=()=>{
  const k=b.dataset.bk;
  if(k==='show'){ BK.show=!BK.show; b.classList.toggle('on',BK.show); if(!BK.show){ BK.plant=false; document.querySelector('[data-bk=plant]').classList.remove('on'); closeSheet(); } applyBK(); }
  if(k==='plant'){ if(!BK.can){ toast('Nur ansehen: Pflanzen ist hier nicht möglich'); return; } BK.plant=!BK.plant; b.classList.toggle('on',BK.plant);
    if(BK.plant){ if(!BK.show){ BK.show=true; document.querySelector('[data-bk=show]').classList.add('on'); applyBK(); } toast('Tippe auf eine freie Stelle im Gelände',3500); } }
  if(k==='list'){ renderList(); $('list').hidden=!$('list').hidden; $('sheet').hidden=true; }
  if(k==='xlsx') exportXlsx();
});

// ---- Daten laden ----
(async()=>{
  await 0;
  const C=window.claude;
  let db=null; try{ db = C&&C.use ? await C.use('db') : null; }catch(e){ db=null; }
  if(!db){
    BK.local=true;
    let arr=null; try{ arr=JSON.parse(localStorage.getItem('bk-trees')||'null'); }catch(e){}
    (arr||ENV.bkInit||[]).forEach(t=>BK.trees.set(t.id,{...t}));
    rebuildBK(); return;
  }
  BK.db=db; BK.col=db.collection('trees');
  try{ const u=await C.use('user'); if(u&&u.can){ const c=await u.can('data.write'); if(c===false) BK.can=false; } }catch(e){}
  const timer=setTimeout(()=>toast('Baumkarte noch nicht erreichbar',4000),10000);
  BK.col.onSnapshot(snap=>{
    if(!snap.metadata.fromCache) clearTimeout(timer);
    BK.trees.clear(); snap.docs.forEach(d=>BK.trees.set(d.id,{id:d.id,...d.data()}));
    rebuildBK();
  }, err=>{ clearTimeout(timer); toast('Baumkarte nicht verfügbar'); });
})();
