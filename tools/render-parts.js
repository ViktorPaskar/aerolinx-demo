// Renders every part model to assets/parts/<name>.webp plus the hero poster.
const { chromium } = require('C:/Users/user/shottool/node_modules/playwright');
const esbuild = require('esbuild'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const only = process.argv[2] ? process.argv[2].split(',') : null;
(async () => {
  const r = await esbuild.build({ entryPoints: [path.join(root, 'tools/render-parts-entry.js')], bundle: true, write: false, format: 'iife', absWorkingDir: root });
  const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 1000 } });
  p.on('pageerror', e => console.log('ERR', String(e)));
  await p.setContent('<!doctype html><body style="margin:0;background:#000"><canvas id=c></canvas></body>');
  await p.addScriptTag({ content: r.outputFiles[0].text });
  await p.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  const names = await p.evaluate(() => window.__names);
  let total = 0;
  for (const n of names) {
    if (only && !only.includes(n)) continue;
    const d = await p.evaluate(x => window.__render(x), n);
    const buf = Buffer.from(d.split(',')[1], 'base64'); total += buf.length;
    fs.writeFileSync(path.join(root, 'assets/parts', n + '.webp'), buf);
    console.log(n, Math.round(buf.length / 1024) + 'KB', d.slice(5, 15));
  }
  if (!only) {
    const d = await p.evaluate(() => window.__poster(1600, 1000));
    fs.writeFileSync(path.join(root, 'assets/poster.webp'), Buffer.from(d.split(',')[1], 'base64'));
  }
  console.log('total', Math.round(total / 1024) + 'KB');
  await b.close();
})();
