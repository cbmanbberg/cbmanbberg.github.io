"""CityGML LoD2 (LGL BW) einlesen: je Gebäude Id, Adresse, Schwerpunkt, Höhe und Flächen (roof/wall/ground)."""
import xml.etree.ElementTree as ET
NS = {'gml': 'http://www.opengis.net/gml', 'bldg': 'http://www.opengis.net/citygml/building/1.0', 'xal': 'urn:oasis:names:tc:ciq:xsdschema:xAL:2.0'}
def parse_lod2(files):
    out = []
    for f in files:
        for b in ET.parse(f).getroot().iter('{%s}Building' % NS['bldg']):
            surfs = []
            for tag, kind in [('RoofSurface', 'roof'), ('WallSurface', 'wall'), ('GroundSurface', 'ground')]:
                for s in b.iter('{%s}%s' % (NS['bldg'], tag)):
                    for pl in s.iter('{%s}posList' % NS['gml']):
                        v = list(map(float, pl.text.split())); surfs.append((kind, [v[i:i + 3] for i in range(0, len(v), 3)]))
            if not surfs: continue
            xs = [p[0] for _, r in surfs for p in r]; ys = [p[1] for _, r in surfs for p in r]
            addr = [' '.join(filter(None, [(a.findtext('.//xal:ThoroughfareName', '', NS)), a.findtext('.//xal:ThoroughfareNumber', '', NS)]))
                    for a in b.iter('{%s}Address' % NS['bldg'])]
            h = b.find('bldg:measuredHeight', NS)
            out.append({'id': b.get('{%s}id' % NS['gml']), 'addr': addr, 'cx': sum(xs) / len(xs), 'cy': sum(ys) / len(ys),
                        'h': float(h.text) if h is not None else None, 'surfs': surfs})
    return out
