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
 * ## A onda fica **atras** do aparelho
 *
 * Ela e desenhada depois dele no documento, e filho posicionado que vem
 * depois pinta por cima: a faixa de terra cobria os icones da barra do app.
 * O `z-index` resolve sem mexer em posicao — a terra passa a ser fundo, que e
 * o que ela sempre quis ser.
 *
 * Uso: node scripts/quadros-da-loja.js [quadro]
 *   quadro: 1..6, ou `todos`
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

/**
 * Onde esta, em cada captura, o pedaco que o zoom amplia.
 *
 * Escrito por `capturas.js` no mesmo instante da foto, com o mesmo layout na
 * frente. Coordenada digitada a mao quebra calada na primeira vez que a tela
 * muda de altura — e quem olha a loja nao tem como saber que quebrou.
 */
const DESTAQUES = (() => {
  const f = path.join(CAPTURAS, 'destaques.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
})();

/** O tamanho da captura, em pixels — as fotos saem todas do mesmo molde. */
const CAPTURA_L = 1242;
const CAPTURA_A = 2688;

function comoDataUri(arquivo) {
  const b = fs.readFileSync(path.join(CAPTURAS, arquivo));
  return 'data:image/png;base64,' + b.toString('base64');
}

/** A moldura do aparelho, com a captura dentro. */
function aparelho({ imagem, largura, inclinacao = 0, sombra = true, desfoque = 0 }) {
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
        <img src="${imagem}" style="
          width:100%;height:100%;object-fit:cover;object-position:top;display:block;
          ${desfoque ? `filter:blur(${desfoque}px) brightness(.8) saturate(.92);` : ''}
        ">
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

/**
 * Os seis quadros, na ordem em que aparecem na ficha.
 *
 * Cada um tem **um** trabalho. O primeiro e o unico que aparece no resultado
 * de busca, ao lado do icone, e por isso leva o mecanismo — a coisa que
 * nenhum concorrente tem. Os outros cinco sao lidos por quem ja parou.
 */
/**
 * O pedaco ampliado, pousado por cima do aparelho.
 *
 * E a tecnica que o Heat usa: um cartao da interface e arrancado da tela,
 * ampliado e posto na frente, enquanto o resto do aparelho fica borrado. O
 * olho nao tem para onde fugir — vai no elemento que o titulo cita.
 *
 * O recorte sai de `background-position`, e nao de uma imagem cortada: a
 * captura inteira entra como fundo, ampliada pela escala, e deslocada para a
 * regiao certa aparecer na janela. Assim nao ha segundo arquivo para
 * envelhecer fora de sincronia com o primeiro.
 */
function ampliado({ imagem, caixa: medida, larguraFinal, folga = {}, topo = 58 }) {
  /*
    A folga em volta do retangulo medido, e ela nao e enfeite.

    A medida sai da uniao dos **textos** dos tres passos, e os numeros ficam
    numa coluna a esquerda, fora dela. Sem folga o recorte entregava tres
    paragrafos soltos no lugar de uma sequencia — a informacao que faz a
    mecanica ser entendida estava justamente no que ficou de fora.
  */
  const fx = folga.x || 0;
  const fy = folga.y || 0;
  const x0 = Math.max(0, medida.x - fx);
  const y0 = Math.max(0, medida.y - fy);
  const caixa = {
    x: x0,
    y: y0,
    largura: Math.min(CAPTURA_L, medida.x + medida.largura + fx) - x0,
    altura: Math.min(CAPTURA_A, medida.y + medida.altura + fy) - y0,
  };
  const escala = larguraFinal / caixa.largura;
  const alturaFinal = Math.round(caixa.altura * escala);
  return `
    <div style="
      position:absolute;
      left:50%;
      top:${topo}%;
      transform:translate(-50%,-50%) rotate(-1.5deg);
      width:${Math.round(larguraFinal)}px;
      height:${alturaFinal}px;
      border-radius:34px;
      background-image:url('${imagem}');
      background-size:${Math.round(CAPTURA_L * escala)}px ${Math.round(CAPTURA_A * escala)}px;
      background-position:-${Math.round(caixa.x * escala)}px -${Math.round(caixa.y * escala)}px;
      box-shadow:0 36px 90px rgba(28,24,20,.42), 0 0 0 10px rgba(251,246,236,.96);
      z-index:3;
    "></div>`;
}

const QUADROS = [
  {
    arquivo: '3-composta.png',
    /* Ver `ampliado`: os tres passos saem da tela e viram o assunto. */
    zoom: 760,
    /*
      Larga na horizontal, estreita na vertical.

      Os numeros dos passos moram a esquerda do texto medido, entao a folga
      lateral tem de busca-los. A vertical nao: com 120 em cima, o recorte
      trazia junto uma fatia cortada do titulo, e meia linha de texto cortada
      no alto de um cartao le como defeito, nao como recorte.
    */
    folga: { x: 120, y: 26 },
    frase: ['Tire o pensamento', 'da cabeça'],
    sub: 'Repita em voz alta até ele virar só som.',
  },
  {
    arquivo: '4-diario.png',
    frase: ['Um diário que não sai', 'do seu aparelho'],
    sub: 'Nem eu consigo ler o que você escreve.',
  },
  {
    arquivo: '5-praticas.png',
    frase: ['41 práticas guiadas,', 'em 13 temas'],
    sub: 'Para a ansiedade, a tristeza, a insônia e o resto.',
  },
  {
    arquivo: '6-brotinho.png',
    frase: ['Ele cresce com', 'o seu cuidado'],
    sub: 'Cada dia em que você se cuida vira uma folha.',
  },
  {
    arquivo: '2-frase-do-dia.png',
    zoom: 800,
    folga: { x: 40, y: 30 },
    /*
      A peca sobe para **cobrir** o original.

      Aqui o que se amplia e a propria frase, e ela continua legivel atras do
      desfoque: sem subir, o quadro mostrava a mesma frase duas vezes, uma
      borrada e uma nitida, que le como falha de montagem. Pousada em cima do
      original, sobra uma leitura so.
    */
    zoomTopo: 32,
    frase: ['Uma frase por dia,', 'enterrada na terra'],
    sub: 'Toque no papel para desenterrar a de hoje.',
  },
  {
    arquivo: '7-terapia.png',
    frase: ['Um resumo para', 'levar à terapia'],
    sub: 'O que você sentiu nas últimas semanas, em uma página.',
  },
];

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
  c: ({ imagem, frase, sub, zoom, caixa, folga, zoomTopo }) => `
    <div style="
      width:${LARGURA}px;height:${ALTURA}px;background:${CREME};
      display:flex;flex-direction:column;align-items:center;
      padding:150px 60px 0;box-sizing:border-box;overflow:hidden;position:relative;
    ">
      <!--
        A terra vem **primeiro** e fica no fundo.

        Desenhada depois do aparelho ela pintava por cima, e a faixa cobria os
        ícones da barra do app. Primeiro no documento e com \`z-index\` zero,
        ela volta a ser o que era para ser: chão atrás do aparelho.
      -->
      <svg viewBox="0 0 1179 320" style="position:absolute;left:0;bottom:0;width:${LARGURA}px;z-index:0">
        <path d="M0 120 C300 40 760 180 1179 70 L1179 320 L0 320 Z" fill="${VERDE}" opacity=".16"/>
        <path d="M0 190 C340 120 820 240 1179 150 L1179 320 L0 320 Z" fill="${VERDE}" opacity=".22"/>
      </svg>

      <div style="position:relative;z-index:1;font:800 112px/1.06 'Baloo 2';color:${MARROM};text-align:center;letter-spacing:-2px">
        ${frase[0]}<br>${destaque(frase[1], TERRACOTA)}
      </div>
      <!--
        A legenda tem altura fixa, e isso e sobre o conjunto, nao sobre ela.

        Uma legenda de duas linhas empurra o aparelho para baixo so naquele
        quadro, e quem desliza a ficha ve o telefone pulando de posicao a cada
        passada. Com a caixa reservada, o aparelho comeca na mesma altura nos
        seis, e a unica coisa que se mexe e o que deve se mexer: a tela.
      -->
      <div style="position:relative;z-index:1;height:128px;display:flex;align-items:center;justify-content:center;margin-top:30px">
        <div style="font:600 44px/1.4 'Nunito';color:${VERDE_FORTE};text-align:center;max-width:980px">${sub}</div>
      </div>
      <div style="position:relative;z-index:1;margin-top:26px">
        ${aparelho({ imagem, largura: 820, inclinacao: 2, desfoque: zoom ? 7 : 0 })}
        ${zoom && caixa ? ampliado({ imagem, caixa, larguraFinal: zoom, folga, topo: zoomTopo }) : ''}
      </div>
    </div>`,
};

(async () => {
  const pedido = (process.argv[2] || 'todos').toLowerCase();
  const quais =
    pedido === 'todos'
      ? QUADROS.map((_, i) => i)
      : [Number(pedido) - 1].filter((i) => i >= 0 && i < QUADROS.length);
  if (!quais.length) {
    console.error('use um número de 1 a ' + QUADROS.length + ', ou `todos`');
    process.exit(1);
  }
  fs.mkdirSync(SAIDA, { recursive: true });

  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: LARGURA, height: ALTURA } });

  for (const i of quais) {
    const q = QUADROS[i];
    const fonte = path.join(CAPTURAS, q.arquivo);
    if (!fs.existsSync(fonte)) {
      console.error(`  faltou capturas/${q.arquivo} — rode \`node scripts/capturas.js\` antes`);
      continue;
    }
    const html = `<!doctype html><html><head><meta charset="utf-8">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>*{margin:0;padding:0;box-sizing:border-box}body{background:${CREME}}</style>
    </head><body>${TRATAMENTOS.c({
      imagem: comoDataUri(q.arquivo),
      frase: q.frase,
      sub: q.sub,
      zoom: q.zoom,
      folga: q.folga || {},
      zoomTopo: q.zoomTopo,
      caixa: DESTAQUES[q.arquivo],
    })}</body></html>`;

    await p.setContent(html, { waitUntil: 'networkidle' });
    /* As fontes do Google chegam depois do `networkidle` em alguns casos. */
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(500);

    const arquivo = path.join(SAIDA, `${i + 1}-${q.arquivo.replace(/^\d+-/, '')}`);
    await p.screenshot({ path: arquivo });
    console.log(`  ${path.relative(RAIZ, arquivo)}  ${LARGURA} × ${ALTURA}`);
  }
  await b.close();
})();
