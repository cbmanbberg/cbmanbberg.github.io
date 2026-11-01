"""Erzeugt data/env.js: Gelände, Luftbild, Bäume, Nachbargebäude, PV, Schuppen, Schopf, Baumkarte (Ersatzdaten).

Rohdaten (LGL BW Open GeoData, Kachel 32_553_5284_2) entpackt unter rohdaten/ ablegen:
  dgm1_32_553_5284_2_bw.zip, ndom1_32_553_5284_2_bw.zip, dop20rgb_32_553_5284_2_bw.zip, LoD2_32_553_5284_2_bw.zip
Aufruf:  python scripts/build_env.py
"""
import base64, io, json, math, glob
from pathlib import Path
import numpy as np, tifffile
from PIL import Image, ImageDraw
from scipy import ndimage
from model_coords import *          # Transformation UTM <-> Modell, Gebäudemaße
from lod2 import parse_lod2

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'rohdaten'
TILE = '32_553_5284_1'               # 1-km-Teilkachel mit dem Hof
def find(pattern):
    hits = glob.glob(str(RAW / '**' / pattern), recursive=True)
    if not hits: raise SystemExit(f'Rohdatei fehlt: {pattern} (unter {RAW})')
    return hits[0]

# ---- Ausschnitt um den Hof (UTM 32) ----
E0, E1, N0, N1 = 553300, 553800, 5284000, 5284350
STEP = 2

# ---- DGM1 ----
npy = RAW / 'dgm1_cache.npy'
if npy.exists(): dgm = np.load(npy)
else:
    xyz = np.loadtxt(find(f'dgm1_{TILE}_bw_*.xyz')); dgm = xyz[:, 2].reshape(1000, 1000); np.save(npy, dgm)
def dgm_at(E, N):
    c = np.clip(np.asarray(E) - 553000.5, 0, 998.999); r = np.clip(5284999.5 - np.asarray(N), 0, 998.999)
    c0 = np.floor(c).astype(int); r0 = np.floor(r).astype(int); fc = c - c0; fr = r - r0
    a = dgm[r0, c0]; b = dgm[r0, c0 + 1]; cc = dgm[r0 + 1, c0]; d = dgm[r0 + 1, c0 + 1]
    return (a * (1 - fc) + b * fc) * (1 - fr) + (cc * (1 - fc) + d * fc) * fr

Es = np.arange(E0, E1 + 0.1, STEP); Ns = np.arange(N1, N0 - 0.1, -STEP)
EE, NN = np.meshgrid(Es, Ns)
H = dgm_at(EE, NN) - H0
mx, mz = to_m(EE, NN)
inb = (mx > xWohnStart - 0.5) & (mx < xStallEnd + 0.5) & (mz > zN - 0.5) & (mz < zS + 0.5)
H[inb] = np.minimum(H[inb], -0.08)            # Gelände unter dem Gebäude absenken
hcm = np.round(H * 100).astype('<i2')

# ---- DOP20 Luftbild ----
dop = tifffile.imread(find(f'dop20rgb_{TILE}_bw_*.tif'))
x0 = int((E0 - 553000) / 0.2); x1 = int((E1 - 553000) / 0.2); y0 = int((5285000 - N1) / 0.2); y1 = int((5285000 - N0) / 0.2)
img = Image.fromarray(dop[y0:y1, x0:x1]).resize((2048, 1434), Image.LANCZOS)
buf = io.BytesIO(); img.save(buf, 'JPEG', quality=80); jpg = base64.b64encode(buf.getvalue()).decode()

# ---- LoD2 ----
lod = parse_lod2(glob.glob(str(RAW / '**' / 'LoD2_*.gml'), recursive=True))
KELLER = (553560.2, 5284104.8)
SCHOPF_ID = 'DEBW_001000de7bd'                 # Schopf im Garten (Boden-Deckel-Schalung, PV Ost/West)
def is_own(o):
    m = to_m(o['cx'], o['cy'])
    if xWohnStart - 1 < m[0] < xStallEnd + 1 and zN - 1 < m[1] < zS + 1: return True
    return abs(o['cx'] - KELLER[0]) < 4 and abs(o['cy'] - KELLER[1]) < 4
def model_polys(o):
    out = []
    for kind, ring in o['surfs']:
        if kind == 'ground': continue
        r = np.array(ring); a, b = to_m(r[:, 0], r[:, 1])
        out.append([1 if kind == 'roof' else 0, np.round(np.stack([a, r[:, 2] - H0, b], 1), 2).flatten().tolist()])
    return out
blds, schopf = [], None
for o in lod:
    if not (E0 < o['cx'] < E1 and N0 < o['cy'] < N1) or is_own(o): continue
    if o['id'] == SCHOPF_ID: schopf = model_polys(o)
    else: blds.append(model_polys(o))

# ---- PV auf dem Schopf (beide Dachflächen aus LoD2) ----
def pv_quad(ring, inset=0.35, ridge_inset=0.3, off=0.08):
    P = np.array([[*to_m(p[0], p[1]), p[2] - H0] for p in ring[:-1]])[:, [0, 2, 1]]
    n = np.cross(P[1] - P[0], P[2] - P[0]); n /= np.linalg.norm(n); n = -n if n[1] < 0 else n
    u = np.cross([0, 1, 0], n); u /= np.linalg.norm(u); v = np.cross(n, u)
    c = P.mean(0); lu = (P - c) @ u; lv = (P - c) @ v
    u1, u2, v1, v2 = lu.min() + inset, lu.max() - inset, lv.min() + inset, lv.max() - ridge_inset
    return [[round(float(t), 3) for t in (c + a * u + b * v + off * n)] + [round(a / 1.05, 3), round(b / 1.75, 3)] for a, b in [(u1, v1), (u2, v1), (u2, v2), (u1, v2)]]
pv = [pv_quad(r) for o in lod if o['id'] == SCHOPF_ID for k, r in o['surfs'] if k == 'roof']

# ---- Gartenschuppen (nicht im LoD2): Lage aus Luftbild/nDOM, First 4,50, 45° ----
cE, cN = 553525.2, 5284088.5
sx, sz = to_m(cE, cN)
shed = {'x': round(float(sx), 2), 'z': round(float(sz), 2), 'y': round(float(dgm_at(cE, cN) - H0), 2), 'rot': round(math.radians(16.5), 4), 'L': 6.5, 'W': 4.0, 'ridge': 4.5}

# ---- Bäume aus nDOM ----
mask = Image.new('L', (1000, 1000), 0); dr = ImageDraw.Draw(mask)
for o in lod:
    for k, ring in o['surfs']:
        if k in ('ground', 'roof'): dr.polygon([(p[0] - 553000, 5285000 - p[1]) for p in ring], fill=255)
mask = ndimage.binary_dilation(np.array(mask) > 0, iterations=2)
nd = tifffile.imread(find(f'ndom1_{TILE}_bw.tif')).astype(float); nd[nd < -100] = 0; nd[mask] = 0
sm = ndimage.uniform_filter(nd, 3)
peaks = (sm == ndimage.maximum_filter(sm, size=5)) & (sm > 2.5)
trees = []
for r, c in zip(*np.nonzero(peaks)):
    E = 553000.5 + c; N = 5284999.5 - r
    if not (E0 + 2 < E < E1 - 2 and N0 + 2 < N < N1 - 2): continue
    h = float(sm[r, c]); rad = []
    for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
        k = 1
        while k < 10 and 0 <= r + dy * k < 1000 and 0 <= c + dx * k < 1000 and nd[r + dy * k, c + dx * k] > 0.55 * h: k += 1
        rad.append(k)
    cr = max(1.3, min(8.0, float(np.mean(rad)) + 0.3))
    a, b = to_m(E, N)
    trees.append([round(float(a), 2), round(float(b), 2), round(float(dgm_at(E, N) - H0), 2), round(h, 1), round(cr, 1)])
def false_tree(t):   # Dachüberstand, Brücke/Keller, NO-Ecke, Gartenschuppen
    x, z = t[0], t[1]
    return ((xWohnStart - 2.8 < x < xStallEnd + 0.5 and zN - 5.0 < z < zS + 3.2) or (xStallEnd - 0.5 < x < 36.9 and 2.0 < z < 10.5)
            or (28 < x < 32 and -2 < z < 1) or (abs(x - shed['x']) < 4.2 and abs(z - shed['z']) < 3.2 and t[3] < 6))
DROP = [(20.76, 15.92), (37.2, -1.01), (33.59, 13.78)]      # lt. Bauherr nicht vorhanden
trees = [t for t in trees if not false_tree(t) and not any(abs(t[0] - a) < 0.05 and abs(t[1] - b) < 0.05 for a, b in DROP)]

# ---- Baumkarte (nur Ersatz, wenn die Datenbank nicht erreichbar ist) ----
bk_file = ROOT / 'data' / 'baumkarte.json'
bkInit = json.load(open(bk_file, encoding='utf-8')) if bk_file.exists() else []

nE, nN = to_m(A[0], A[1] + 80)
env = {'nx': len(Es), 'ny': len(Ns), 'E0': E0, 'N1': N1, 'step': STEP, 'H0': H0, 'A': A.tolist(), 'th': th, 'xc': xc, 'zS': zS,
       'h': base64.b64encode(hcm.tobytes()).decode(), 'img': jpg, 'blds': blds, 'trees': trees, 'north': [float(nE), float(nN)],
       'pv': pv, 'shed': shed, 'schopf': schopf, 'bkInit': bkInit}
out = ROOT / 'data' / 'env.js'
out.write_text('const ENV=' + json.dumps(env, separators=(',', ':'), ensure_ascii=False) + ';', encoding='utf-8')
print(f'{out}: {out.stat().st_size/1e6:.2f} MB, {len(trees)} Bäume, {len(blds)} Gebäude, {len(bkInit)} Baumkarte')
