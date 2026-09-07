/**
 * Mede o card do story com a fonte de verdade, e reprova se alguma frase vazar.
 *
 * ## Por que este teste precisa existir
 *
 * O card deixou de ser feito de componentes e virou um SVG, porque a captura de
 * tela dependia de um módulo nativo que não subia no aparelho. A troca resolveu
 * a dependência e criou um risco novo: **`<Text>` de SVG não quebra linha**. A
 * quebra passou a ser nossa, em `quebraDeLinha.ts`, e ela estima a largura de
 * cada caractere sem poder medir a fonte.
 *
 * Estimativa sem verificação é como uma frase vaza pela borda de uma imagem que
 * a pessoa vai postar — e ninguém descobre, porque nada disso aparece na tela
 * do app: o card é montado fora dela, virado em PNG e entregue ao sistema.
 *
 * Então aqui a conta é conferida contra a realidade. O Baloo 2 SemiBold sai do
 * `node_modules`, entra no navegador como fonte de verdade, e cada linha das
 * vinte frases é medida com `getComputedTextLength()`. Se uma passar da caixa,
 * este arquivo quebra e diz qual.
 *
 * Uso: node scripts/confere-story.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

const FONTE = path.join(
  RAIZ,
  'node_modules',
  '@expo-google-fonts',
  'baloo-2',
  '600SemiBold',
  'Baloo2_600SemiBold.ttf',
);

(async () => {
  const saida = pastaTemporaria('story');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'data', 'conselhos.ts'),
      path.join(RAIZ, 'src', 'components', 'brand', 'quebraDeLinha.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );

  const arquivos = [];
  const pilha = [saida];
  while (pilha.length) {
    const dir = pilha.pop();
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) pilha.push(p);
      else if (e.name.endsWith('.js')) arquivos.push(p);
    }
  }
  const carregar = (nome) =>
    import(`file://${arquivos.find((a) => a.endsWith(nome)).replace(/\\/g, '/')}`);

  const { CONSELHOS, entreAspas } = await carregar('conselhos.js');
  /* As mesmas funcoes que o card usa. Repetidas aqui, o teste mediria uma
     quebra que nao e a que vai para a imagem. */
  const { corpoDaFrase, linhasDaFrase, LARGURA_DA_CAIXA } = await carregar('quebraDeLinha.js');

  const casos = CONSELHOS.map((c) => {
    const frase = entreAspas(c.texto);
    const corpo = corpoDaFrase(c.texto);
    return { id: c.id, corpo, linhas: linhasDaFrase(frase, corpo) };
  });

  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const ttf = fs.readFileSync(FONTE).toString('base64');
  await page.setContent(`
    <style>
      @font-face {
        font-family: 'Baloo2';
        src: url(data:font/ttf;base64,${ttf}) format('truetype');
        font-weight: 600;
      }
      body { margin: 0 }
    </style>
    <svg id="palco" width="1080" height="4000"></svg>
  `);
  await page.evaluate(() => document.fonts.ready);

  const medidas = await page.evaluate((entrada) => {
    const NS = 'http://www.w3.org/2000/svg';
    const palco = document.getElementById('palco');
    const out = [];
    let y = 100;
    for (const caso of entrada) {
      for (const linha of caso.linhas) {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', '20');
        t.setAttribute('y', String(y));
        t.setAttribute('font-size', String(caso.corpo));
        t.setAttribute('font-family', 'Baloo2');
        t.setAttribute('font-weight', '600');
        t.textContent = linha;
        palco.appendChild(t);
        out.push({ id: caso.id, linha, largura: t.getComputedTextLength() });
        y += caso.corpo * 1.5;
      }
    }
    return out;
  }, casos);

  await browser.close();

  let falhas = 0;
  const maiorPorFrase = new Map();
  for (const m of medidas) {
    const atual = maiorPorFrase.get(m.id);
    if (!atual || m.largura > atual.largura) maiorPorFrase.set(m.id, m);
  }

  console.log(`\ncaixa de ${LARGURA_DA_CAIXA}px · ${casos.length} frases · ${medidas.length} linhas\n`);
  for (const caso of casos) {
    const pior = maiorPorFrase.get(caso.id);
    const folga = LARGURA_DA_CAIXA - pior.largura;
    const ok = folga >= 0;
    if (!ok) falhas += 1;
    console.log(
      `  ${ok ? 'ok   ' : 'VAZOU'} ${caso.id.padEnd(30)} ${caso.linhas.length} linha(s) · ` +
        `maior ${Math.round(pior.largura)}px · folga ${Math.round(folga)}px`,
    );
    if (!ok) console.log(`        "${pior.linha}"`);
  }

  const menorFolga = Math.min(
    ...[...maiorPorFrase.values()].map((m) => LARGURA_DA_CAIXA - m.largura),
  );
  console.log(`\nmenor folga do repertorio: ${Math.round(menorFolga)}px · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
