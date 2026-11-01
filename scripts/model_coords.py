"""Gemeinsame Geometrie: Planmaßstab, Gebäudemaße und Transformation UTM 32 (ETRS89) <-> Modellkoordinaten.

Modell: x entlang der Gebäudelängsachse (West -> Ost), z quer (Nord -> Süd), y Höhe über OKF EG Scheune.
Ursprung: Achse 1 / Achse A der Werkplanung. Planpixel: 60 dpi, 1:25 -> 10,58 mm je Pixel.
"""
import math
import numpy as np
P = 0.01058
X = lambda px: (px - 180) * P
Z = lambda py: (py - 165) * P
xW = X(162)                       # Außenkante Scheune West (Brandwand zum Bauernhaus)
xE = X(1357)                      # Außenkante Scheune Ost
xWohnStart = xW - 8.45            # Bauernhaus 8,45 m (Plan 1911)
xStallEnd = xWohnStart + 35.45    # Gesamtlänge 35,45 m (Plan 1911, LoD2: 35,5 m)
zN, zS = Z(110), Z(1350)          # Außenkanten Nord / Süd
xc = (xWohnStart + xStallEnd) / 2
H0 = 576.85                       # m ü. NHN, entspricht y = 0 (OKF EG Scheune)
th = math.radians(-9.46)          # Drehung der Gebäudeachse gegen Ost (aus LoD2-Grundriss)
ex = np.array([math.cos(th), math.sin(th)]); ez = np.array([math.sin(th), -math.cos(th)])
A = np.array([(553517.0 + 553552.07) / 2, (5284105.51 + 5284100.0) / 2])   # Mitte Südkante (LoD2)
def to_m(E, N):
    d = np.stack([np.asarray(E) - A[0], np.asarray(N) - A[1]], -1)
    return d @ ex + xc, d @ ez + zS
def to_utm(x, z):
    a = np.asarray(x) - xc; b = np.asarray(z) - zS
    return A[0] + a * ex[0] + b * ez[0], A[1] + a * ex[1] + b * ez[1]
__all__ = ['P', 'X', 'Z', 'xW', 'xE', 'xWohnStart', 'xStallEnd', 'zN', 'zS', 'xc', 'H0', 'th', 'ex', 'ez', 'A', 'to_m', 'to_utm', 'np', 'math']
