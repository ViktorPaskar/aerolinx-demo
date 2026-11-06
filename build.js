// Bundles scripts and styles into index.html. Catalogue photos stay in assets/ and load lazily.
const esbuild = require('esbuild'), fs = require('fs'), path = require('path');
const r = esbuild.buildSync({
  entryPoints: ['src/main.js'], bundle: true, minify: true, write: false, format: 'iife', target: 'es2020', charset: 'utf8',
  loader: { '.webp': 'dataurl', '.json': 'json' }, absWorkingDir: __dirname, legalComments: 'none',
});
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = fs.readFileSync(path.join(__dirname, 'src/store.css'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, 'src/index.html'), 'utf8')
  .split('/*{{CSS}}*/').join(css)
  .split('/*{{JS}}*/').join(js);
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html', (html.length / 1048576).toFixed(2) + ' MB');
