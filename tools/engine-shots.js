// Renders the engine at several scroll values to PNG for review.
const { chromium } = require('C:/Users/user/shottool/node_modules/playwright');
const esbuild = require('esbuild'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const out = process.argv[2];
const ps = (process.argv[3] || '0,0.12,0.26,0.38,0.5,0.58,0.68,0.78,0.88').split(',').map(Number);
(async () => {
  const r = await esbuild.build({ entryPoints: [path.join(root, 'tools/engine-test.js')], bundle: true, write: false, format: 'iife', absWorkingDir: root });
  const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on('pageerror', e => console.log('ERR', String(e)));
  p.on('console', m => m.type() === 'error' && console.log('CON', m.text()));
  await p.setContent('<!doctype html><body style="margin:0;background:#000"><canvas id=c style="display:block"></canvas></body>');
  await p.addScriptTag({ content: r.outputFiles[0].text });
  await p.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  for (const v of ps) {
    const t = await p.evaluate(x => window.__draw(x), v);
    await p.screenshot({ path: path.join(out, `eng-${String(v).replace('.', '_')}.png`) });
    console.log(v, 'tris', t);
  }
  await b.close();
})();
