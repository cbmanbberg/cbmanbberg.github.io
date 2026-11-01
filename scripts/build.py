"""Baut die Webseite aus src/ nach web/.

  python scripts/build.py            -> web/index.html, web/style.css, web/app.js, web/env.js
  python scripts/build.py --single   -> zusätzlich web/hof3d_einzeldatei.html (alles in einer Datei, zum Weitergeben)

Die JS-Teile in src/js/ werden in Namensreihenfolge zu einem ES-Modul zusammengefügt
(gemeinsamer Gültigkeitsbereich, deshalb keine import/export zwischen den Teilen).
"""
import sys, shutil
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
SRC, WEB = ROOT / 'src', ROOT / 'web'
WEB.mkdir(exist_ok=True)
parts = sorted((SRC / 'js').glob('*.js'))
app = '\n'.join(f'// ===== {p.name} =====\n' + p.read_text(encoding='utf-8') for p in parts)
(WEB / 'app.js').write_text(app, encoding='utf-8')
shutil.copy(SRC / 'index.html', WEB / 'index.html'); shutil.copy(SRC / 'style.css', WEB / 'style.css')
shutil.copy(ROOT / 'data' / 'env.js', WEB / 'env.js')
print('web/ gebaut:', ', '.join(p.name for p in parts))
if '--single' in sys.argv:
    html = (SRC / 'index.html').read_text(encoding='utf-8')
    html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + (SRC / 'style.css').read_text(encoding='utf-8') + '</style>')
    html = html.replace('<script src="env.js"></script>', '<script>' + (ROOT / 'data' / 'env.js').read_text(encoding='utf-8') + '</script>')
    html = html.replace('<script type="module" src="app.js"></script>', '<script type="module">\n' + app + '\n</script>')
    (WEB / 'hof3d_einzeldatei.html').write_text(html, encoding='utf-8')
    print('web/hof3d_einzeldatei.html gebaut')
