# Hof 3D: Umbau Scheune Baltersberg

Interaktives 3D Modell (three.js) der umgebauten Scheune mit altem Bauernhaus, Stall/Remise, Keller mit Hocheinfahrt, Gelände, Luftbild, Bäumen, PV-Anlagen und einer bearbeitbaren Baumkarte.

## Schnellstart

```bash
pip install -r requirements.txt
python scripts/build.py              # baut web/ aus src/ und data/
cd web && python -m http.server 8000 # dann http://localhost:8000 öffnen
```

`python scripts/build.py --single` erzeugt zusätzlich `web/hof3d_einzeldatei.html`, eine einzelne Datei zum Weitergeben.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/index.html`, `src/style.css` | Seite und Bedienoberfläche |
| `src/js/00_setup.js` | Maßstab, Renderer, Kamera, Licht, Materialien, Hilfsfunktionen `box()`, `label()` |
| `src/js/10_gelaende.js` | Gelände (DGM1 + DOP20), Bäume aus nDOM, Nachbargebäude LoD2, Nordpfeil, Fundament |
| `src/js/20_scheune_eg.js` | Scheune Erdgeschoss nach Werkplanung |
| `src/js/21_scheune_og.js` | Scheune Obergeschoss, Fachwerkfassaden, ELW-Treppe |
| `src/js/22_dach.js` | Decke DG, Dachhaut über 35,45 m, Dachstuhl |
| `src/js/30_bestand.js` | Altes Bauernhaus (Umbauplan Füssinger), Stall/Remise, Keller, Brücke, Einfahrtsschuppen, Rampe 1911, Güllegrube |
| `src/js/40_pv_schuppen.js` | PV-Felder, Gartenschuppen, Schopf mit Boden-Deckel-Schalung |
| `src/js/50_baumkarte.js` | Baumkarte: antippen, pflanzen, fällen, löschen, Liste, Excel-Export |
| `src/js/60_beschriftung_ui.js` | Raumbeschriftungen, Ansichten, Menülogik |
| `data/env.js` | Erzeugt von `scripts/build_env.py` (Gelände, Luftbild, Bäume, LoD2, PV, Schuppen, Baumkarte als Ersatz) |
| `data/baumkarte.json` | Stand der Baumkarte (Export der Artefakt-Datenbank vom 01.11.2026) |
| `scripts/` | Datenaufbereitung und Build |
| `docs/plaene/` | Werkplanung 2021, Umbauplan Füssinger, Bestandsplan 1911 |
| `docs/Baumkarte.xlsx` | Ursprüngliche Excel-Baumkarte |
| `rohdaten/` | Geodaten des LGL (nicht im Repo, siehe unten) |

## Geodaten neu aufbereiten

1. Auf https://opengeodata.lgl-bw.de die Kachel **32_553_5284_2** laden: `dgm1`, `ndom1`, `dop20rgb`, `LoD2`.
2. Die ZIPs nach `rohdaten/` entpacken (Unterordner egal, die Skripte suchen rekursiv).
3. `python scripts/build_env.py` und danach `python scripts/build.py`.

Für eine Erweiterung nach Süden zusätzlich Kachel **32_553_5282_2** laden und in `build_env.py` den Ausschnitt (`N0`) sowie das Einlesen auf mehrere Teilkacheln erweitern.

`scripts/import_baumkarte.py` war der einmalige Import der Excel-Baumkarte (Kartenbild georeferenziert, Bäume auf nDOM eingerastet). Er überschreibt `data/baumkarte.json`.

## Baumkarte und Speicherung

- **Veröffentlichtes Modell auf claude.ai:** Die Bäume liegen in der Datenbank des Artefakts (Collection `trees`, nur der Besitzer schreibt). Änderungen sind auf allen Geräten gleich.
- **Lokal oder auf eigenem Server:** Die Seite fällt automatisch auf `ENV.bkInit` (aus `data/baumkarte.json`) zurück und speichert Änderungen im `localStorage` des Browsers. Für eine dauerhafte Lösung braucht es einen eigenen Speicher, zum Beispiel eine kleine API oder eine JSON-Datei im Repo.
- Felder je Baum: `nr, art, sorte, gepflanzt, geschnitten, status (aktiv|abgestorben|gefällt), gefaellt, notiz, E, N (UTM 32), h (gemessene Höhe nDOM)`.

## Quellen und Lizenz der Geodaten

Geländemodell, Oberflächenmodell, Luftbild und 3D-Gebäude: LGL-BW (2025), Datenlizenz Deutschland, Namensnennung, Version 2.0, www.lgl-bw.de. Der Quellenvermerk muss auf der Seite sichtbar bleiben.

## Veröffentlichung auf GitHub Pages

Bei jedem Push auf `main` baut `.github/workflows/pages.yml` die Seite mit `scripts/build.py` und veröffentlicht `web/` unter https://cbmanbberg.github.io. Einmalig nötig: im Repo unter Settings, Pages, Source „GitHub Actions“ wählen.

Die Pläne in `docs/plaene/` und `docs/Baumkarte.xlsx` sind per `.gitignore` ausgeschlossen, weil das Repo öffentlich ist. Sie liegen nur lokal.
