"""Einmaliger Import der Excel-Baumkarte (docs/Baumkarte.xlsx) nach data/baumkarte.json.

Die Excel enthält ein Kartenbild (Screenshot, in Excel um 90° gedreht) und nummerierte Kreise darüber.
1. Kreismittelpunkte aus der Zeichnung lesen und in Bildpixel umrechnen.
2. Bild über Passpunkte (Dachecken, Garage, Schuppen, Trampolin) an das DOP20 anpassen (Ähnlichkeitstransformation).
3. Feinausgleich: Kreise auf Baumspitzen im nDOM einrasten (ICP, max. 2 m), gemessene Höhe übernehmen.
Achtung: überschreibt data/baumkarte.json. Danach Inhalte in die Artefakt-Datenbank (Collection 'trees') schreiben.
"""
import json, re, zipfile, io, glob
from pathlib import Path
import numpy as np, openpyxl, tifffile
from PIL import Image
from scipy import ndimage
from scipy.spatial import cKDTree
ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / 'docs' / 'Baumkarte.xlsx'
z = zipfile.ZipFile(XLSX)
draw = z.read('xl/drawings/drawing1.xml').decode()
anch = re.findall(r'<xdr:twoCellAnchor[^>]*>(.*?)</xdr:twoCellAnchor>', draw, re.S)
# Bild: Ankerbox und Drehung aus dem ersten Anker
pic = anch[0]
offx, offy = map(int, re.search(r'<a:off x="(-?\d+)" y="(-?\d+)"', pic).groups())
cx, cy = map(int, re.search(r'<a:ext cx="(\d+)" cy="(\d+)"', pic).groups())
img = Image.open(io.BytesIO(z.read('xl/media/image1.png'))); W, Hh = img.size
f_ = re.search(r'<xdr:from><xdr:col>(\d+)</xdr:col><xdr:colOff>(\d+)</xdr:colOff><xdr:row>(\d+)</xdr:row><xdr:rowOff>(\d+)</xdr:rowOff>', pic).groups()
t_ = re.search(r'<xdr:to><xdr:col>(\d+)</xdr:col><xdr:colOff>(\d+)</xdr:colOff><xdr:row>(\d+)</xdr:row><xdr:rowOff>(\d+)</xdr:rowOff>', pic).groups()
f_, t_ = list(map(int, f_)), list(map(int, t_))
colW = (cy - (t_[1] - f_[1])) / (t_[0] - f_[0])          # Bild ist 90° gedreht: Anzeigebreite = cy
rowH = (cx - t_[3]) / t_[2]
X0 = f_[1]
marks = []
for a in anch[1:]:
    ft = re.findall(r'<xdr:(?:from|to)><xdr:col>(\d+)</xdr:col><xdr:colOff>(\d+)</xdr:colOff><xdr:row>(\d+)</xdr:row><xdr:rowOff>(\d+)</xdr:rowOff>', a)
    (c1, o1, r1, p1), (c2, o2, r2, p2) = [tuple(map(int, x)) for x in ft]
    Xd = ((c1 * colW + o1) + (c2 * colW + o2)) / 2; Yd = ((r1 * rowH + p1) + (r2 * rowH + p2)) / 2
    t = ''.join(re.findall(r'<a:t>([^<]*)</a:t>', a)).strip()
    marks.append((t, (Xd - X0) / cy * Hh, Yd / cx * W))      # Pixel im gedrehten Bild (Breite Hh, Höhe W)
P = np.array([[m[1], m[2]] for m in marks])
# Passpunkte: gedrehtes Bild (px) -> UTM
src = np.array([[510, 2405], [801, 2374], [703.5, 2498], [620, 2499], [844, 2368], [859, 2474]], float)
dst = np.array([[553515.33, 5284105.0], [553552.33, 5284097.67], [553535.13, 5284086.33], [553524.67, 5284088.67], [553557.67, 5284096.47], [553555.47, 5284083.0]])
def fit(s, d):
    A, B = [], []
    for (x, y), (E, N) in zip(s, d): A += [[x, y, 1, 0], [-y, x, 0, 1]]; B += [E, N]
    return np.linalg.lstsq(np.array(A), np.array(B), rcond=None)[0]
def T(p, q): a, b, c, d = q; return np.stack([a * p[:, 0] + b * p[:, 1] + c, b * p[:, 0] - a * p[:, 1] + d], 1)
q = fit(src, dst)
nd = tifffile.imread(glob.glob(str(ROOT / 'rohdaten' / '**' / 'ndom1_32_553_5284_1_bw.tif'), recursive=True)[0]).astype(float); nd[nd < -100] = 0
sm = ndimage.uniform_filter(nd, 3); r, c = np.nonzero((sm == ndimage.maximum_filter(sm, 5)) & (sm > 1.5))
peaks = np.stack([553000.5 + c, 5284999.5 - r], 1); ph = sm[r, c]; kd = cKDTree(peaks)
for it in range(8):
    U = T(P, q); dist, idx = kd.query(U); ok = (dist < (3.5 if it < 3 else 2.0)) & (U[:, 1] > 5284002)
    q = fit(P[ok], peaks[idx[ok]])
U = T(P, q); dist, idx = kd.query(U)
ws = openpyxl.load_workbook(XLSX).active
rows = {str(r[13]): r[14:18] for r in ws.iter_rows(min_row=14, values_only=True) if r[13] is not None}
seed, seen = [], set()
def rec(i, nr, E, N, h, note):
    art, sorte, gep, ges = (rows.get(nr) or (None,) * 4)
    art = (art or '').strip(); status = 'aktiv'
    if art == 'tod': art, status = '', 'abgestorben'
    if isinstance(gep, int) and gep >= 2020: h = None        # Jungbäume: Höhe aus Alter, nicht aus nDOM
    return dict(id=i, nr=nr, art=art, sorte=(sorte or '').strip(), gepflanzt=gep, geschnitten=ges, status=status, notiz=note, E=E, N=N, h=h)
for k, (t, *_ ) in enumerate(marks):
    snap = dist[k] < 2.0 and U[k, 1] > 5284002
    E, N = (peaks[idx[k]] if snap else U[k])
    note = 'In der Karte mit x markiert' if t == 'x' else ('Nr. in der Karte doppelt vergeben' if t in seen else '')
    seen.add(t)
    seed.append(rec(f't{k+1:03d}', t, round(float(E), 2), round(float(N), 2), round(float(ph[idx[k]]), 1) if snap else None, note))
for nr in rows:
    if nr not in seen: seed.append(rec(f'n{int(nr):03d}', nr, None, None, None, 'Ohne Lage in der Karte'))
json.dump(seed, open(ROOT / 'data' / 'baumkarte.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(seed), 'Einträge,', int(sum(dist < 2.0)), 'auf nDOM eingerastet')
