/**
 * Gera `docs/og.png` — o cartão que aparece quando alguém cola o link do site.
 *
 * ## Por que existe
 *
 * O link do Brotinho circula colado: num story, num grupo de WhatsApp, numa
 * resposta de comentário. Sem `og:image` o WhatsApp mostra uma URL crua, e com
 * o ícone do app mostra um quadradinho de 1024 que o Facebook e o WhatsApp
 * cortam em círculo. Nos dois casos o link não diz nada.
 *
 * O formato que essas plataformas desenham grande é **1200 × 630**. É o único
 * lugar onde o mecanismo do app pode aparecer antes de alguém tocar em nada,
 * então é ele que o cartão mostra: a frase no meio do caminho de se desmanchar.
 *
 * ## Por que é gerado por script, e não desenhado à mão
 *
 * Pelo mesmo motivo das capturas da loja (`scripts/capturas.js`): o texto e as
 * cores vêm do mesmo lugar que a página, então o cartão não vence o prazo
 * sozinho quando a manchete mudar. Trocar a manchete aqui e rodar de novo é uma
 * linha; refazer um PNG num editor é uma tarde e um arquivo que ninguém sabe
 * mais de onde veio.
 *
 * ## A conta do desbotamento
 *
 * É a mesma de `ExperimentoComposta` e a mesma do script da página — as
 * palavras desbotam da esquerda para a direita, de modo que a frase se desfaz
 * na ordem em que é lida. Aqui ela é congelada em `PARADO_EM`: longe demais do
 * fim e o cartão parece só uma frase; perto demais e some, e quem vê não
 * entende que havia alguma coisa ali.
 *
 * Uso: node scripts/gera-og.js   (precisa de rede, para as fontes do Google)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DOCS = path.join(__dirname, '..', 'docs');
const SAIDA = path.join(DOCS, 'og.png');

/**
 * O ícone entra embutido, e não como `<img src="brotinho.png">`.
 *
 * A página é montada com `setContent`, e aí o documento não tem endereço: um
 * caminho relativo não tem a partir de onde resolver e sai um quadrado vazio no
 * lugar da marca — sem erro, sem aviso. É a mesma armadilha que o `CardDoStory`
 * do app já documenta: numa imagem gerada, tudo que precisa carregar chega
 * tarde demais.
 */
const MARCA = 'data:image/png;base64,' + fs.readFileSync(path.join(DOCS, 'brotinho.png')).toString('base64');

const LARGURA = 1200;
const ALTURA = 630;

/** Quanto da dissolução já aconteceu, de 0 a 1. */
const PARADO_EM = 0.62;

const MANCHETE = 'O pensamento que não sai da sua cabeça vira só som.';
const FRASE = 'vai dar tudo errado';

/** As mesmas cores do tema claro de `docs/index.html`. */
const COR = {
  fundo: '#FBF6EC',
  cartao: '#FFFFFF',
  tinta: '#3A3630',
  apoio: '#716B60',
  verde: '#3E6B54',
  linha: '#E9E2D2',
};

function palavras() {
  const partes = FRASE.split(' ');
  return partes
    .map((texto, i) => {
      const atraso = i * (0.5 / Math.max(1, partes.length - 1));
      const t = Math.max(0, Math.min(1, PARADO_EM * 1.5 - atraso));
      return `<span style="opacity:${1 - 0.9 * t};transform:translateY(${t * 10}px)">${texto}</span>`;
    })
    .join(' ');
}

const pagina = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@600;700&display=swap">
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: ${LARGURA}px; height: ${ALTURA}px; background: ${COR.fundo};
    color: ${COR.tinta}; font-family: 'Nunito', sans-serif;
    padding: 64px 72px; display: flex; flex-direction: column;
    justify-content: space-between; overflow: hidden;
  }
  .marca { display: flex; align-items: center; gap: 18px; }
  .marca img { width: 64px; height: 64px; border-radius: 16px; }
  .marca b { font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 34px; }
  h1 {
    font-family: 'Baloo 2', sans-serif; font-weight: 800;
    font-size: 66px; line-height: 1.08; max-width: 21ch;
  }
  .cartao {
    background: ${COR.cartao}; border: 1px solid ${COR.linha}; border-radius: 22px;
    padding: 22px 30px; display: flex; align-items: center; gap: 14px;
    align-self: flex-start; font-weight: 700; font-size: 40px;
  }
  .cartao span { display: inline-block; }
  .pe { color: ${COR.apoio}; font-size: 26px; font-weight: 600; }
  .pe b { color: ${COR.verde}; }
</style></head>
<body>
  <div class="marca"><img src="${MARCA}" alt=""><b>Brotinho</b></div>
  <h1>${MANCHETE}</h1>
  <div class="cartao">${palavras()}</div>
  <p class="pe">Diário por texto ou voz · <b>nada sai do seu aparelho</b></p>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: LARGURA, height: ALTURA },
    deviceScaleFactor: 1,
  });
  await page.setContent(pagina, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: SAIDA });
  await browser.close();
  console.log(`og.png  ${LARGURA} × ${ALTURA}  →  ${SAIDA}`);
})();
