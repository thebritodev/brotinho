/**
 * Gera imagens de fundo para CTA de conteudo organico, a partir da tela
 * inicial do app com foco na Composta.
 *
 * ## Por que nao e so um print
 *
 * O cartao da Composta ja tem copy propria — "Nao sai da cabeca?" e o botao
 * "Compostar esse pensamento". Jogar outra copy por cima de um print cru faz
 * dois textos disputarem o mesmo olhar, e quem perde e a copy nova.
 *
 * Entao cada variante reserva uma **zona de respiro** onde a copy entra sem
 * competir, e as tres diferem exatamente nisso: onde fica o silencio.
 *
 * Uso: node scripts/cta-organico.js [--formato feed|story]
 *   feed  1080x1350 (4:5)   story 1080x1920 (9:16)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const SAIDA = path.join(RAIZ, 'capturas', 'organico');
const TELA = path.join(SAIDA, 'inicial-inteira.png');

/**
 * A tela do aparelho, em pontos, e a densidade com que ela e capturada.
 *
 * O enquadramento do cartao **nao** e constante aqui: ele e medido na mesma
 * pagina que vira a imagem, logo antes do clique do obturador. Era constante,
 * e isso deu errado de um jeito silencioso — a medida saiu de uma pagina com o
 * atalho de desenvolvimento visivel e foi usada numa captura com ele escondido.
 * Cinquenta e cinco pontos de diferenca, tudo abaixo deslocado, e o rodape da
 * peca mostrando o cartao seguinte.
 */
const APARELHO = { largura: 430, altura: 932 };
const DENSIDADE = 3;
const PRINT = { largura: APARELHO.largura * DENSIDADE, altura: APARELHO.altura * DENSIDADE };

const SEMENTE = {
  profile: { name: 'Ana', nomeDoBroto: 'Brotinho', onboarded: true, subscribed: true },
  boasVindasVistas: true,
};

/** Captura a tela inicial e devolve onde o cartao da Composta caiu nela. */
async function capturarATela(browser) {
  const page = await browser.newPage({
    viewport: { width: APARELHO.largura, height: APARELHO.altura },
    deviceScaleFactor: DENSIDADE,
  });
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle', timeout: 240000 });
  await page.evaluate((e) => localStorage.setItem('@brotinho/app-state-v1', JSON.stringify(e)), SEMENTE);
  await page.reload({ waitUntil: 'networkidle', timeout: 240000 });
  await page.waitForTimeout(6000);

  /* O atalho de desenvolvimento some ANTES da medida, nao depois. */
  await page.addStyleTag({ content: '#atalho-de-dev{display:none !important}' });
  await page.waitForTimeout(600);

  const caixa = await page.evaluate(() => {
    const botao = [...document.querySelectorAll('[role="button"]')]
      .find((x) => x.innerText && x.innerText.trim().startsWith('Compostar esse pensamento'));
    if (!botao) return null;
    let n = botao;
    for (let i = 0; i < 14 && n; i += 1) {
      const e = getComputedStyle(n);
      const r = n.getBoundingClientRect();
      if (parseFloat(e.borderTopLeftRadius) > 10 && r.height > 300 && r.width > 300) {
        return { x: r.left, y: r.top, largura: r.width, altura: r.height };
      }
      n = n.parentElement;
    }
    return null;
  });
  if (!caixa) throw new Error('nao achei o cartao da Composta na tela');

  fs.mkdirSync(SAIDA, { recursive: true });
  await page.screenshot({ path: TELA });
  await page.close();

  /* De pontos de CSS para pixels da imagem. */
  return {
    x: Math.round(caixa.x * DENSIDADE),
    y: Math.round(caixa.y * DENSIDADE),
    largura: Math.round(caixa.largura * DENSIDADE),
    altura: Math.round(caixa.altura * DENSIDADE),
  };
}

let CARTAO = null;

/** As cores da marca, iguais as de `theme/tokens`. */
const CREME = '#FBF6EC';
const CREME_FUNDO = '#F5EFDE';
const VERDE = '#3E6B54';

const FORMATOS = {
  feed: { largura: 1080, altura: 1350 },
  story: { largura: 1080, altura: 1920 },
};

const pedido = process.argv.includes('--formato')
  ? process.argv[process.argv.indexOf('--formato') + 1]
  : 'feed';
const FORMATO = FORMATOS[pedido];
if (!FORMATO) {
  console.error(`formato desconhecido: ${pedido} (use feed ou story)`);
  process.exit(1);
}

/*
  O HTML e gravado ao lado da imagem e aberto por `file://`.

  `setContent` monta a pagina em `about:blank`, e dali o navegador recusa
  carregar `file://` — o resultado sai creme liso, sem erro nenhum. Gravando o
  arquivo na mesma pasta, a imagem vira um caminho relativo e carrega.
*/
const urlDaTela = 'inicial-inteira.png';

/**
 * A moldura comum: um canvas do tamanho do post, fundo creme.
 *
 * `overflow: hidden` em tudo, para nenhuma variante vazar um pixel para fora
 * do enquadramento — o que no Instagram vira uma borda branca fina.
 */
function pagina(corpo, estilo = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${FORMATO.largura}px;height:${FORMATO.altura}px;overflow:hidden;background:${CREME_FUNDO}}
    .palco{position:relative;width:${FORMATO.largura}px;height:${FORMATO.altura}px;overflow:hidden}
    ${estilo}
  </style></head><body><div class="palco">${corpo}</div></body></html>`;
}

/**
 * A. O cartao sangrado, com o ceu no topo.
 *
 * A copy entra no ceu: ele e a unica area grande do app sem texto proprio, e
 * as palavras que flutuam ali ("demitido", "ser", "vou") ja contam a historia
 * sozinhas. O botao verde fica no rodape, ancorando a peca sem pedir leitura.
 */
function variandoA() {
  /*
    Escala de "cobrir": a maior entre encher a largura e encher a altura.

    Com a escala da largura sozinha sobravam 73 pixels embaixo, e neles
    aparecia o comeco do cartao "A frase de hoje" — um pedaco de outra coisa
    no rodape da peca, que le como descuido.
  */
  const escala = Math.max(FORMATO.largura / CARTAO.largura, FORMATO.altura / CARTAO.altura);
  const x = -CARTAO.x * escala - (CARTAO.largura * escala - FORMATO.largura) / 2;
  const y = -CARTAO.y * escala;
  return pagina(`
    <img src="${urlDaTela}" style="
      position:absolute;left:${x}px;top:${y}px;
      width:${PRINT.largura * escala}px;height:${PRINT.altura * escala}px">
    <div style="
      position:absolute;inset:0;
      background:linear-gradient(180deg, rgba(251,246,236,.94) 0%, rgba(251,246,236,.60) 24%, rgba(251,246,236,0) 42%)">
    </div>`);
}

/**
 * B. O aparelho inteiro sobre fundo de marca.
 *
 * Mostra que e um app, e nao uma ilustracao solta — util quando a copy e um
 * convite para baixar. O respiro e a faixa de cima, e a tela entra cortada em
 * baixo de proposito: ela continua para fora da peca, o que sugere que ha mais
 * app do que cabe ali.
 */
function variandoB() {
  const larguraDoAparelho = Math.round(FORMATO.largura * 0.62);
  const escala = larguraDoAparelho / PRINT.largura;
  const topo = Math.round(FORMATO.altura * 0.30);
  /*
    O topo do aparelho cai no vao limpo logo acima do cartao.

    Antes o recorte comecava 150 pontos acima do cartao e pegava o fim do
    cartao de check-in: a peca abria com "seu broto." e "Contar" cortados ao
    meio, que e a primeira coisa que o olho encontra. Agora o cartao da
    Composta comeca a trinta pixels da borda, com creme acima e nada partido.
  */
  const RESPIRO = 30;
  const deslocamento = -(CARTAO.y * escala - RESPIRO);
  return pagina(`
    <div style="position:absolute;inset:0;background:
      radial-gradient(120% 70% at 50% 0%, ${CREME} 0%, ${CREME_FUNDO} 70%)"></div>
    <div class="aparelho" style="
      position:absolute;left:50%;transform:translateX(-50%);top:${topo}px;
      width:${larguraDoAparelho}px;height:${FORMATO.altura - topo + 40}px;
      border-radius:${Math.round(larguraDoAparelho * 0.11)}px;
      overflow:hidden;background:${CREME};
      box-shadow:0 ${Math.round(larguraDoAparelho * 0.05)}px ${Math.round(larguraDoAparelho * 0.12)}px rgba(62,107,84,.22),
                 0 2px 6px rgba(62,107,84,.10);
      border:${Math.max(2, Math.round(larguraDoAparelho * 0.008))}px solid rgba(62,107,84,.14)">
      <img src="${urlDaTela}" style="
        position:absolute;left:0;top:${deslocamento}px;
        width:${larguraDoAparelho}px;height:${PRINT.altura * escala}px">
    </div>`);
}

/**
 * C. So o ceu, ampliado.
 *
 * O maximo de silencio: as palavras flutuando, o broto de olhos fechados, e
 * nada mais. Nao parece print de app — parece ilustracao —, e e a melhor base
 * para uma copy longa. O preco e nao provar que existe um produto atras.
 */
function variandoC() {
  /*
    A faixa vai do topo do cartao ate logo abaixo das folhas do broto.

    A primeira versao ampliava o ceu ate encher a peca, e com isso cortava
    palavras no meio — "nitido", "ai da cabeca?". Palavra partida nao le como
    enquadramento ousado, le como erro de recorte. Aqui a faixa entra inteira,
    na escala da largura, e o resto da peca e creme da marca: a copy ganha mais
    da metade da area, sem disputar nada.
  */
  /*
    Onde a faixa termina, contado a partir do topo do cartao.

    Precisa passar das folhas do broto. Com um corte mais curto o degrade
    comecava em cima delas e o broto saia dissolvido pela metade — o
    personagem e a peca inteira, nao da para entrega-lo desbotado.
  */
  const ATE = CARTAO.y + 845;
  const escala = FORMATO.largura / CARTAO.largura;
  const alturaDaFaixa = Math.round((ATE - CARTAO.y) * escala);
  const x = -CARTAO.x * escala;
  return pagina(`
    <div style="position:absolute;inset:0;background:${CREME_FUNDO}"></div>
    <div style="position:absolute;left:0;top:0;width:${FORMATO.largura}px;height:${alturaDaFaixa}px;overflow:hidden">
      <img src="${urlDaTela}" style="
        position:absolute;left:${x}px;top:${-CARTAO.y * escala}px;
        width:${PRINT.largura * escala}px;height:${PRINT.altura * escala}px">
    </div>
    <div style="
      position:absolute;left:0;top:${alturaDaFaixa - 60}px;width:${FORMATO.largura}px;height:78px;
      background:linear-gradient(180deg, rgba(245,239,222,0) 0%, ${CREME_FUNDO} 58%)"></div>`);
}

const VARIANTES = [
  ['a-cartao-sangrado', variandoA, 'o cartão inteiro, copy no céu'],
  ['b-aparelho', variandoB, 'o app num aparelho, copy na faixa de cima'],
  ['c-so-o-ceu', variandoC, 'a faixa do céu em cima, copy no creme embaixo'],
];

(async () => {
  const browser = await chromium.launch();

  CARTAO = await capturarATela(browser);
  console.log(`cartão da Composta na captura: ${JSON.stringify(CARTAO)}`);

  const page = await browser.newPage({
    viewport: { width: FORMATO.largura, height: FORMATO.altura },
    deviceScaleFactor: 1,
  });

  for (const [nome, montar, sobre] of VARIANTES) {
    const htm = path.join(SAIDA, `.${pedido}-${nome}.html`);
    fs.writeFileSync(htm, montar(), 'utf8');
    await page.goto('file:///' + htm.split(path.sep).join('/'), { waitUntil: 'load' });
    /* Confere que a imagem entrou mesmo: creme liso nao reclama de nada. */
    const carregou = await page.evaluate(() => {
      const i = document.querySelector('img');
      return !!i && i.complete && i.naturalWidth > 0;
    });
    if (!carregou) throw new Error(`a tela nao carregou em ${nome}`);
    await page.waitForTimeout(300);
    const arquivo = path.join(SAIDA, `${pedido}-${nome}.png`);
    await page.screenshot({ path: arquivo });
    console.log(`  ${path.basename(arquivo)}  ${FORMATO.largura}×${FORMATO.altura}  — ${sobre}`);
    fs.unlinkSync(htm);
  }

  await browser.close();
  console.log(`\nEm capturas/organico/`);
})().catch((e) => { console.error('falhou:', e.message); process.exit(1); });
