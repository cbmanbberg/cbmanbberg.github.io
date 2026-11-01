# CLAUDE.md

Kontext für Claude Code in diesem Projekt.

## Nutzer
- Clemens, Bauherr, Holztechnik-Ingenieur. Antworten und Texte auf Deutsch, direkt, Kernaussage zuerst.
- In deutschen Texten (UI, README, Antworten) keine Gedankenstriche verwenden.

## Projekt
3D Modell der Hofstelle Baltersberg 5 (Bodnegg): umgebaute Scheune nach Werkplanung 2021, altes Bauernhaus und Stall nach Plänen 1911 bzw. Umbauplan Füssinger, Gelände und Umgebung aus LGL Open GeoData, Baumkarte des Bauherrn.

## Arbeitsweise
- Quellcode in `src/`, Daten in `data/`, Ausgabe `web/` wird nur von `scripts/build.py` erzeugt. Nie `web/` direkt bearbeiten.
- Die JS-Teile in `src/js/` werden in Namensreihenfolge zu EINEM ES-Modul verkettet. Alle Teile teilen sich den Gültigkeitsbereich (`THREE`, `scene`, `mat`, `box`, `bp`, `label`, `G`, `H`, `state`, ...). Kein import/export zwischen den Teilen. Reihenfolge beachten: was ein Teil auf oberster Ebene benutzt, muss vorher definiert sein; Funktionen werden gehoistet, `const` nicht.
- `data/env.js` nicht von Hand ändern, sondern `scripts/build_env.py` anpassen und neu laufen lassen. Rohdaten liegen in `rohdaten/` (nicht versioniert).
- Testen: `python scripts/build.py && cd web && python -m http.server`. Für Screenshots headless Chromium mit `--use-gl=swiftshader` (Playwright).

## Koordinaten
- Modell: Meter. x entlang Gebäudeachse West nach Ost, z Nord nach Süd, y Höhe. y = 0 ist OKF EG Scheune = 576,85 m ü. NHN.
- Ursprung Achse 1 / Achse A der Werkplanung. Planpixel der Werkplanung (60 dpi gerendert, 1:25): `X(px) = (px-180)*0.01058`, `Z(py) = (py-165)*0.01058`; Pixelwerte in den Wandlisten beziehen sich darauf.
- UTM 32 (ETRS89) <-> Modell: `scripts/model_coords.py` (Python) und `utm2m/m2utm` in `50_baumkarte.js` (JS). Gebäudeachse um -9,46° gegen Ost gedreht, Anker Mitte Südkante aus LoD2.
- Wichtige Maße: Bauernhaus 8,45 m, Gesamtlänge 35,45 m, Gebäudetiefe 13,1 m, First 12,38 m, Dachneigung ca. 42°, OKF OG 2,96, OKF DG 5,86.

## Bekannte Annahmen / offene Punkte
- Rampe der Hocheinfahrt 1911: Verlauf nach Osten angenommen, heute nicht mehr im Gelände (Schalter „Auffahrt 1911“).
- Bauernhaus innen: Raumaufteilung aus Umbauplan Füssinger, Geschosshöhen geschätzt (Hochparterre +0,55, OG +3,30).
- Gelände reicht nur bis N 5284000 (etwa 100 m südlich des Hofs). Bäume 1 bis 4 der Baumkarte liegen knapp außerhalb. Nächster Schritt: Kachel 32_553_5282_2 einbinden.
- Baumkarte: Nr. 9, 43, 44, 73 in der Ursprungskarte doppelt; Nr. 5 und 31 ohne Lage; zwei Punkte mit „x“.
- Fehlerkennungen von Bäumen (Dachüberstand, Keller) werden in `build_env.py` (`false_tree`, `DROP`) entfernt.

## Veröffentlichung
Bisher als Artefakt auf claude.ai: https://claude.ai/artifact/73wrDAYMnpwXJ4xbmoQ7Yc (Dateien `index.html` + `env.js`, Datenbank-Collection `trees`, Fähigkeiten db, user, downloads). Für eigenes Hosting (z. B. GitHub Pages) braucht die Baumkarte einen eigenen Speicher.
