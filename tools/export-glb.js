// Exports all part models to .render/glb/<name>.glb for Blender.
const { chromium } = require('C:/Users/user/shottool/node_modules/playwright');
const esbuild = require('esbuild'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const only = process.argv[2] ? process.argv[2].split(',') : null;
(async () => {
  const dir = path.join(root, '.render/glb'); fs.mkdirSync(dir, { recursive: true });
  const r = await esbuild.build({ entryPoints: [path.join(root, 'tools/export-glb-entry.js')], bundle: true, write: false, format: 'iife', absWorkingDir: root });
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage();
  p.on('pageerror', e => console.log('ERR', String(e)));
  await p.setContent('<!doctype html><body></body>');
  await p.addScriptTag({ content: r.outputFiles[0].text });
  await p.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  const names = await p.evaluate(() => window.__names);
  for (const n of names) {
    if (only && !only.includes(n)) continue;
    const d = await p.evaluate(x => window.__export(x), n);
    const buf = Buffer.from(d, 'base64'); fs.writeFileSync(path.join(dir, n + '.glb'), buf);
    console.log(n, (buf.length / 1048576).toFixed(1) + 'MB');
  }
  await b.close();
})();
