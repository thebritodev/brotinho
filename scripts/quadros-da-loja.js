/**
 * Monta os quadros de marketing da App Store a partir das capturas reais.
 *
 * ## Por que compor, e nao so capturar
 *
 * `capturas.js` fotografa o app rodando — e e isso que a Apple exige, interface
 * de verdade e nao arte conceitual. So que uma captura crua nao vende: quem
 * rola a busca le a frase antes de olhar a tela. Estes quadros poem a captura
 * dentro de uma moldura de aparelho, sobre o fundo da marca, com uma frase em
 * cima. A tela continua sendo a de verdade; o que se acrescenta e a leitura.
 *
 * ## O tamanho
 *
 * 1179 x 2556 — "Dynamic Island medio", que e o **unico obrigatorio** hoje na
 * App Store Connect. O `capturas.js` ainda gera 1242 x 2688, que hoje e
 * opcional; quem subir so o obrigatorio deixa a Apple reduzir para o resto.
 *
 * Nada de transparencia: a Apple recusa PNG com canal alfa.
 *
 * Uso: node scripts/quadros-da-loja.js [variante]
 *   variante: a | b | c   (os tres tratamentos do rascunho)
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');
const CAPTURAS = path.join(RAIZ, 'capturas');
const SAIDA = path.join(RAIZ, 'loja', 'app-store');

/** O obrigatorio de hoje: iPhone com Dynamic Island, tamanho medio. */
const LARGURA = 1179;
const ALTURA = 2556;

/* A paleta, copiada de `theme/tokens` — a mesma do app, e nao uma segunda. */
const CREME = '#FBF6EC';
const CREME2 = '#F3EBDC';
const VERDE = '#5B8A72';
const VERDE_FORTE = '#2E4A3B';
const MARROM = '#3A3630';
const MARROM_FRACO = '#6B6457';
const TERRACOTA = '#C9754F';

function comoDataUri(arquivo) {
  const b = fs.readFileSync(path.join(CAPTURAS, arquivo));
  return 'data:image/png;base64,' + b.toString('base64');
}

/** A moldura do aparelho, com a captura dentro. */
function aparelho({ imagem, largura, inclinacao = 0, sombra = true }) {
  const alturaDoVidro = Math.round(largura * (2688 / 1242));
  return `
    <div style="
      width:${largura}px;
      height:${alturaDoVidro}px;
      border-radius:${Math.round(largura * 0.13)}px;
      background:#17150F;
      padding:${Math.round(largura * 0.022)}px;
      transform:rotate(${inclinacao}deg);
      ${sombra ? `box-shadow:0 ${Math.round(largura * 0.09)}px ${Math.round(largura * 0.18)}px rgba(58,54,48,.28);` : ''}
      flex:none;
    ">
      <div style="
        width:100%;height:100%;
        border-radius:${Math.round(largura * 0.11)}px;
        overflow:hidden;background:${CREME};
      ">
        <img src="${imagem}" style="width:100%;height:100%;object-fit:cover;object-position:top;display:block">
      </div>
    </div>`;
}

/** Um marcador atrás de uma palavra, como nas referências. */
const destaque = (texto, cor) => `
  <span style="
    background:${cor};
    color:#FFFFFF;
    border-radius:18px;
    padding:2px 22px 10px;
    display:inline-block;
    line-height:1;
  ">${texto}</span>`;

const TRATAMENTOS = {
  /*
    A — a lógica do Finch: frase em cima, aparelho embaixo, fundo chapado.
    É a mais sóbria das três, e a mais parecida com a categoria.
  */
  a: ({ imagem }) => `
    <div style="
      width:${LARGURA}px;height:${ALTURA}px;background:${CREME};
      display:flex;flex-direction:column;align-items:center;
      padding:150px 90px 0;box-sizing:border-box;overflow:hidden;
    ">
      <div style="font:700 112px/1.08 'Baloo 2';color:${MARROM};text-align:center;letter-spacing:-1px">
        Tire o pensamento<br>da cabeça
      </div>
      <div style="font:400 48px/1.45 'Nunito';color:${MARROM_FRACO};text-align:center;margin-top:34px;max-width:860px">
        Repita em voz alta até ele virar só som.
      </div>
      <div style="margin-top:96px">${aparelho({ imagem, largura: 760 })}</div>
    </div>`,

  /*
    B — a lógica da referência do sono: palavra destacada numa caixa, aparelho
    inclinado, e objetos da própria marca flutuando em volta.
  */
  b: ({ imagem }) => `
    <div style="
      width:${LARGURA}px;height:${ALTURA}px;
      background:linear-gradient(170deg, ${CREME} 0%, ${CREME} 46%, ${CREME2} 100%);
      display:flex;flex-direction:column;align-items:center;
      padding:140px 80px 0;box-sizing:border-box;overflow:hidden;position:relative;
    ">
      <div style="font:700 110px/1.14 'Baloo 2';color:${MARROM};text-align:center;letter-spacing:-1px">
        Tire o pensamento<br>${destaque('da cabeça', VERDE)}
      </div>
      <div style="font:400 46px/1.45 'Nunito';color:${MARROM_FRACO};text-align:center;margin-top:40px;max-width:840px">
        Repita em voz alta até ele virar só som.
      </div>
      <div style="margin-top:84px">${aparelho({ imagem, largura: 740, inclinacao: -3.5 })}</div>
      <!-- Folhas da marca, soltas no fundo. -->
      <svg viewBox="0 0 100 100" style="position:absolute;left:62px;top:980px;width:150px;opacity:.5;transform:rotate(-18deg)">
        <path d="M50 8 C84 24 86 66 50 92 C14 66 16 24 50 8 Z" fill="${VERDE}" opacity=".35"/>
      </svg>
      <svg viewBox="0 0 100 100" style="position:absolute;right:48px;top:1320px;width:112px;opacity:.5;transform:rotate(24deg)">
        <path d="M50 8 C84 24 86 66 50 92 C14 66 16 24 50 8 Z" fill="${TERRACOTA}" opacity=".3"/>
      </svg>
    </div>`,

  /*
    C — a mais ousada: frase grande ocupando o alto, aparelho sangrando pela
    base, e a faixa de terra do próprio app fechando o quadro embaixo.
  */
  c: ({ imagem }) => `
    <div style="
      width:${LARGURA}px;height:${ALTURA}px;background:${CREME};
      display:flex;flex-direction:column;align-items:center;
      padding:160px 72px 0;box-sizing:border-box;overflow:hidden;position:relative;
    ">
      <div style="font:800 128px/1.04 'Baloo 2';color:${MARROM};text-align:center;letter-spacing:-2px">
        Tire o pensamento<br>${destaque('da cabeça', TERRACOTA)}
      </div>
      <div style="font:600 46px/1.4 'Nunito';color:${VERDE_FORTE};text-align:center;margin-top:36px">
        Repita em voz alta até ele virar só som.
      </div>
      <div style="margin-top:70px">${aparelho({ imagem, largura: 820, inclinacao: 2 })}</div>
      <svg viewBox="0 0 1179 320" style="position:absolute;left:0;bottom:0;width:${LARGURA}px">
        <path d="M0 120 C300 40 760 180 1179 70 L1179 320 L0 320 Z" fill="${VERDE}" opacity=".16"/>
        <path d="M0 190 C340 120 820 240 1179 150 L1179 320 L0 320 Z" fill="${VERDE}" opacity=".22"/>
      </svg>
    </div>`,
};

(async () => {
  const variante = (process.argv[2] || 'a').toLowerCase();
  const fazer = TRATAMENTOS[variante];
  if (!fazer) {
    console.error('variante desconhecida: ' + variante + ' (use a, b ou c)');
    process.exit(1);
  }
  const fonte = path.join(CAPTURAS, '3-composta.png');
  if (!fs.existsSync(fonte)) {
    console.error('não achei capturas/3-composta.png — rode `node scripts/capturas.js` antes');
    process.exit(1);
  }
  fs.mkdirSync(SAIDA, { recursive: true });

  const html = `<!doctype html><html><head><meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>*{margin:0;padding:0;box-sizing:border-box}body{background:${CREME}}</style>
  </head><body>${fazer({ imagem: comoDataUri('3-composta.png') })}</body></html>`;

  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: LARGURA, height: ALTURA } });
  await p.setContent(html, { waitUntil: 'networkidle' });
  /* As fontes do Google chegam depois do `networkidle` em alguns casos. */
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(600);

  const arquivo = path.join(SAIDA, `rascunho-${variante}.png`);
  await p.screenshot({ path: arquivo });
  console.log(`  ${path.relative(RAIZ, arquivo)}  ${LARGURA} × ${ALTURA}`);
  await b.close();
})();
