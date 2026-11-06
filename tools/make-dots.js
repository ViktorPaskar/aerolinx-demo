// Builds a land-only dot grid for the globe from Natural Earth data.
const fs = require('fs'), path = require('path');
const topo = require('topojson-client');
const land = require('world-atlas/land-110m.json');
const geo = topo.feature(land, land.objects.land);
const polys = [];
for (const f of geo.features || [geo]) {
  const g = f.geometry; if (!g) continue;
  (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).forEach(p => polys.push(p));
}
const inRing = (x, y, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const isLand = (lon, lat) => polys.some(p => inRing(lon, lat, p[0]) && !p.slice(1).some(h => inRing(lon, lat, h)));
const N = 26000, out = [], golden = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < N; i++) {
  const y = 1 - 2 * (i + .5) / N, lat = Math.asin(y) * 180 / Math.PI;
  if (lat < -58) continue;
  let lon = ((i * golden) * 180 / Math.PI) % 360; if (lon > 180) lon -= 360;
  if (isLand(lon, lat)) out.push(Math.round(lat * 10) / 10, Math.round(lon * 10) / 10);
}
fs.writeFileSync(path.resolve(__dirname, '../src/dots.json'), JSON.stringify(out));
console.log('dots', out.length / 2);
