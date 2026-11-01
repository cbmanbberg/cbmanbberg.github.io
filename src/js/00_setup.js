import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CSS2DRenderer, CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';

// ---------- Maßstab: Planpixel (60 dpi, 1:25) -> Meter. Ursprung Achse 1 / Achse A ----------
const P = 0.01058;
const X = px => (px - 180) * P;
const Z = py => (py - 165) * P;

// Höhen lt. Schnitt
const H = { egTop:2.495, wallEG:2.54, ogFloor:2.96, ogCeil:5.35, dgFloor:5.86, wallTop:6.47, ridge:12.38, eave:4.62 };
const SLOPE = 0.899;            // ca. 42°
const zN = Z(110), zS = Z(1350); // Außenkanten Nord/Süd
const zMid = (zN + zS) / 2;
const xW = X(162), xE = X(1357);
const xWohnStart = xW - 8.45;    // Wohnhaus 8,45 m (Plan 1911)
const xStallEnd = xWohnStart + 35.45; // Gesamtlänge 35,45 m (Plan 1911)

// ---------- Renderer ----------
const wrap = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
wrap.appendChild(renderer.domElement);
const lr = new CSS2DRenderer();
lr.setSize(innerWidth, innerHeight);
lr.domElement.style.position='fixed'; lr.domElement.style.inset='0'; lr.domElement.style.pointerEvents='none';
wrap.appendChild(lr.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9e6df);
scene.fog = new THREE.Fog(0xe9e6df, 380, 1500);
const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 3000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI*0.495; controls.maxDistance = 700;

scene.add(new THREE.HemisphereLight(0xfffaf0, 0x8a8070, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(40, 38, 34); sun.target.position.set(22,0,6);
sun.castShadow = true; sun.shadow.mapSize.set(4096,4096);
Object.assign(sun.shadow.camera,{left:-48,right:48,top:40,bottom:-40,near:1,far:140});
sun.shadow.bias = -0.0004;
scene.add(sun, sun.target);

// ---------- Clipping (Schnitt) ----------
const cutPlane = new THREE.Plane(new THREE.Vector3(0,0,-1), 100);

// ---------- Materialien ----------
const M = (c, o={}) => new THREE.MeshStandardMaterial(Object.assign({color:c, roughness:.85, side:THREE.DoubleSide, clippingPlanes:[cutPlane]}, o));
const mat = {
  klinker: M(0xa65a43), putz: M(0xf3f0ea), estrich: M(0xb7b3ac), diele: M(0xc99e6a), fliese: M(0xd9d5cd),
  holz: M(0x8a6340), holzAlt: M(0x6e5038), lamelle: M(0x9c7a55), dach: M(0x8c4a36), sparren: M(0xa47d55),
  glas: M(0x9cc3d5,{transparent:true, opacity:.28, roughness:.1, metalness:.1, depthWrite:false}),
  rahmen: M(0x3b3a38), dunkel: M(0x2b2b2b), moebel: M(0xe2ddd4), moebelH: M(0xb08a5e),
  nbPutz: M(0xe6e0d4), nbHolz: M(0x7b5b3e), nbFenster: M(0x34414a), gelaender: M(0x3b3a38),
  gras: new THREE.MeshStandardMaterial({color:0xa9b98a, roughness:1}),
  kies: new THREE.MeshStandardMaterial({color:0xcfc8bb, roughness:1}),
};
const edgeMat = new THREE.LineBasicMaterial({color:0x2a2622, transparent:true, opacity:.22, clippingPlanes:[cutPlane]});

// ---------- Gruppen ----------
const G = {};
['eg','og','dg','roof','truss','nbEG','nbOG','nbDG','lblNBEG','ramp','furnEG','furnOG','lblEG','lblOG','lblNB'].forEach(k=>{G[k]=new THREE.Group(); scene.add(G[k]);});

function box(g, x1,x2, y1,y2, z1,z2, m, edges=true){
  const w=Math.abs(x2-x1), h=Math.abs(y2-y1), d=Math.abs(z2-z1);
  if(w<1e-4||h<1e-4||d<1e-4) return;
  const geo = new THREE.BoxGeometry(w,h,d);
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);
  if(m!==mat.glas){mesh.castShadow=true; mesh.receiveShadow=true;}
  g.add(mesh);
  if(edges && m!==mat.glas){const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat); e.position.copy(mesh.position); g.add(e);}
  return mesh;
}
// Box aus Planpixeln
const bp = (g, px1,px2, py1,py2, y1,y2, m, e) => box(g, X(px1),X(px2), y1,y2, Z(py1),Z(py2), m, e);

function label(g, html, x, y, z, cls=''){
  const d=document.createElement('div'); d.className='lbl '+cls; d.innerHTML=html;
  const o=new CSS2DObject(d); o.position.set(x,y,z); o.userData.z=z; g.add(o); return o;
}
