/**
 * Gera os arquivos de ícone a partir do mascote do próprio app.
 *
 * O ícone antigo era um PNG exportado de um editor, sem relação com o desenho
 * que a pessoa vê ao abrir o app: quando o mascote ganhou rosto, contorno e
 * gradientes, o ícone continuou sendo uma folha chapada. Aqui os dois têm a
 * mesma origem — `components/brand/IconeDoApp.tsx` — e este script só rasteriza.
 *
 * Segue o caminho de `captura-paywall.js`: aponta o app para o ícone por meio
 * de uma alteração temporária de uma linha, captura, e devolve o arquivo byte a
 * byte ao original.
 *
 * Uso: node scripts/gera-icone.js   (com o Metro rodando em :8081)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ORIGEM = 'http://localhost:8081/';
const ASSETS = path.join(__dirname, '..', 'assets');
const APP = path.join(__dirname, '..', 'App.tsx');

const ORIGINAL = '<RootNavigator />';
const FORCADO = '<IconeDoApp lado={LADO_DO_ICONE} comFundo={COM_FUNDO} ocupacao={OCUPACAO} />';
const IMPORT = "import { RootNavigator } from './src/navigation/RootNavigator';";

/**
 * Cada arquivo que o `app.json` referencia, e o que ele precisa ser.
 *
 * `foreground` do Android sai **sem fundo**: o sistema compõe com o
 * `background` e recorta num círculo, num quadrado arredondado ou num
 * "squircle", conforme o launcher. Por isso ele também sai menor — o recorte
 * come as bordas, e o que fica de fora da zona segura some.
 */
const ARQUIVOS = [
  { nome: 'icon.png', lado: 1024, fundo: true, ocupacao: 0.78 },
  { nome: 'splash-icon.png', lado: 1024, fundo: false, ocupacao: 0.85 },
  { nome: 'favicon.png', lado: 256, fundo: true, ocupacao: 0.78 },
  { nome: 'android-icon-foreground.png', lado: 1024, fundo: false, ocupacao: 0.55 },
];

(async () => {
  const antes = fs.readFileSync(APP, 'utf8');
  if (!antes.includes(ORIGINAL)) throw new Error('não encontrei o RootNavigator no App.tsx');
  if (!antes.includes(IMPORT)) throw new Error('não encontrei o import do RootNavigator');

  const browser = await chromium.launch();

  try {
    for (const { nome, lado, fundo, ocupacao } of ARQUIVOS) {
      const patched = antes
        .replace(IMPORT, `${IMPORT}\nimport { IconeDoApp } from './src/components/brand/IconeDoApp';`)
        .replace(ORIGINAL, FORCADO)
        .replace('LADO_DO_ICONE', String(lado))
        .replace('COM_FUNDO', String(fundo))
        .replace('OCUPACAO', String(ocupacao));
      fs.writeFileSync(APP, patched, 'utf8');

      const page = await browser.newPage({
        viewport: { width: lado, height: lado },
        deviceScaleFactor: 1,
      });
      await page.goto(ORIGEM, { waitUntil: 'networkidle', timeout: 180000 });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'networkidle', timeout: 180000 });
      await page.waitForTimeout(2500);

      // A folga em volta do desenho, medida em vez de estimada: um ícone com o
      // mascote encostando na borda é recortado pelo Android e pelo iOS.
      const folga = await page.evaluate((L) => {
        const svg = document.querySelector('svg');
        if (!svg) return null;
        const r = svg.getBoundingClientRect();
        return {
          cima: +((r.top / L) * 100).toFixed(1),
          baixo: +(((L - r.bottom) / L) * 100).toFixed(1),
          lados: +((r.left / L) * 100).toFixed(1),
        };
      }, lado);

      await page.screenshot({
        path: path.join(ASSETS, nome),
        omitBackground: !fundo,
      });
      await page.close();

      console.log(
        `  ${nome.padEnd(30)} ${lado}×${lado}` +
          (folga ? `  folga ${folga.cima}% / ${folga.baixo}% / ${folga.lados}%` : ''),
      );

      // Cada arquivo parte do original: as substituições não se acumulam.
      fs.writeFileSync(APP, antes, 'utf8');
    }
  } finally {
    fs.writeFileSync(APP, antes, 'utf8');
    const depois = fs.readFileSync(APP, 'utf8');
    console.log(
      depois === antes ? 'App.tsx restaurado, idêntico ao original' : 'ATENÇÃO: App.tsx difere do original',
    );
    await browser.close();
  }
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
