const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => { const [saida, ...imgs] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: imgs.length * 320 + 20, height: 800 } });
  await p.setContent(`<body style="margin:0;padding:10px;background:#8a857c;display:flex;gap:10px;font-family:sans-serif">${imgs.map((f) => `<div style="text-align:center"><img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}" style="width:310px;border-radius:10px;display:block"><small style="color:#fff">${path.basename(f, '.png')}</small></div>`).join('')}</body>`);
  await p.screenshot({ path: saida, fullPage: true }); await b.close(); })();
