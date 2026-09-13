/**
 * Gera as duas imagens que o Google Play exige e a App Store não pede.
 *
 *   loja/google-play/icone-512.png        512 × 512
 *   loja/google-play/destaque-1024x500.png  1024 × 500
 *
 * O ícone é o `assets/icon.png` reduzido — tem que ser o mesmo desenho que está
 * no aparelho, e não uma segunda arte que envelhece sozinha.
 *
 * O gráfico de destaque não existe em lugar nenhum do app: é a faixa que
 * aparece no topo da ficha da Play e em coleções editoriais, e ela é montada
 * aqui a partir da paleta e da marca, para nascer da mesma fonte que o resto.
 * Nada de transparência nele — o Google recusa PNG com alfa nesse campo.
 *
 * Uso: node scripts/graficos-da-play.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');
const SAIDA = path.join(RAIZ, 'loja', 'google-play');

/** Da paleta (src/theme/tokens.ts). Copiadas, não importadas: isto é Node puro. */
const CORES = {
  green900: '#2E4A3B',
  green500: '#5B8A72',
  green100: '#E3EDE6',
  green50: '#F1F6F2',
  cream100: '#FBF6EC',
  brown400: '#716B60',
};

/** O trevo de três laços, nos mesmos números do BrotinhoMark.tsx. */
function marca(traco) {
  return `
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <g transform="translate(50 50) scale(0.76) translate(-50 -52.4)">
        <ellipse cx="30.5" cy="63.5" rx="18" ry="10.8"
                 transform="rotate(-38 30.5 63.5)"
                 fill="none" stroke="${traco}" stroke-width="8.8" />
        <ellipse cx="69.5" cy="63.5" rx="18" ry="10.8"
                 transform="rotate(38 69.5 63.5)"
                 fill="none" stroke="${traco}" stroke-width="8.8" />
        <circle cx="50" cy="28.3" r="16.5"
                fill="none" stroke="${traco}" stroke-width="8.8" />
        <path d="M 50 32 L 50 93" fill="none" stroke="${traco}"
              stroke-width="5.1" stroke-linecap="round" />
      </g>
    </svg>`;
}

const FONTES =
  '<link rel="preconnect" href="https://fonts.googleapis.com">' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2' +
  '?family=Baloo+2:wght@600;800&family=Nunito:wght@400;600&display=swap">';

/**
 * A faixa de destaque.
 *
 * O fundo repete o `FundoDaTela`: creme por baixo, um halo verde claro em cima
 * e uma descida suave — a mesma luz que a tela inicial tem, para quem abre a
 * ficha reconhecer o app antes de ler o nome.
 */
function paginaDoDestaque() {
  return `<!doctype html><html><head><meta charset="utf-8">${FONTES}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 1024px; height: 500px; overflow: hidden; }
    .faixa {
      width: 1024px; height: 500px; position: relative;
      background:
        radial-gradient(120% 90% at 50% 0%, ${CORES.green100} 0%, rgba(227,237,230,0) 62%),
        linear-gradient(180deg, ${CORES.cream100} 0%, ${CORES.green50} 100%);
      display: flex; align-items: center; justify-content: center; gap: 56px;
    }
    .disco {
      width: 232px; height: 232px; border-radius: 50%;
      background: ${CORES.green500};
      display: flex; align-items: center; justify-content: center;
      flex: none;
      box-shadow: 0 18px 44px rgba(46, 74, 59, 0.18);
    }
    .disco svg { width: 232px; height: 232px; }
    .texto { display: flex; flex-direction: column; gap: 14px; }
    h1 {
      font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 96px;
      line-height: 1; color: ${CORES.green900}; letter-spacing: -0.5px;
    }
    p {
      font-family: 'Nunito', sans-serif; font-weight: 600; font-size: 34px;
      line-height: 1.25; color: ${CORES.brown400};
    }
  </style></head><body>
    <div class="faixa">
      <div class="disco">${marca(CORES.cream100)}</div>
      <div class="texto">
        <h1>Brotinho</h1>
        <p>Desabafe e cuide da ansiedade</p>
      </div>
    </div>
  </body></html>`;
}

/** O ícone: o mesmo arquivo do app, só reduzido para 512. */
function paginaDoIcone(base64) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin: 0; padding: 0; }
    body { width: 512px; height: 512px; overflow: hidden; }
    img { width: 512px; height: 512px; display: block; }
  </style></head><body><img src="data:image/png;base64,${base64}"></body></html>`;
}

async function main() {
  fs.mkdirSync(SAIDA, { recursive: true });
  const navegador = await chromium.launch();

  const gerar = async (nome, html, largura, altura) => {
    const pagina = await navegador.newPage({
      viewport: { width: largura, height: altura },
      deviceScaleFactor: 1,
    });
    await pagina.setContent(html, { waitUntil: 'networkidle' });
    await pagina.evaluate(() => document.fonts.ready);
    const destino = path.join(SAIDA, nome);
    await pagina.screenshot({ path: destino, type: 'png' });
    await pagina.close();
    const bytes = fs.readFileSync(destino);
    console.log(
      `  ${nome}  ${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}  ` +
        `${(bytes.length / 1024).toFixed(0)} KB`,
    );
  };

  const icone = fs.readFileSync(path.join(RAIZ, 'assets', 'icon.png')).toString('base64');
  await gerar('icone-512.png', paginaDoIcone(icone), 512, 512);
  await gerar('destaque-1024x500.png', paginaDoDestaque(), 1024, 500);

  await navegador.close();
  console.log(`\nEm ${path.relative(RAIZ, SAIDA)}/`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
