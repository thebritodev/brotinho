/**
 * Confere as raízes que saem do broto do adubo, na faixa da Composta.
 * Ver `raizesDoBroto`.
 *
 * ## O que é conferido, em cada largura de tela e em cada profundidade de terra
 *
 * - toda raiz principal começa **no pé do broto**, e os fios menores começam
 *   em cima de uma principal;
 * - nenhuma sobe acima do pé — raiz que sobe vira galho;
 * - nenhuma passa da margem das bordas da tela;
 * - nenhuma afunda além do ponto onde a terra começa a sumir, que é onde ela
 *   apareceria boiando na névoa;
 * - elas se espalham de verdade: pelo menos um fio de cada lado, e a mais
 *   larga abrindo mais que um quinto da tela;
 * - a mesma semente desenha sempre a mesma raiz.
 *
 * Uso: node scripts/testa-raizes-do-broto.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

const LARGURAS = [320, 360, 390, 412, 430];
/** Onde a terra começa a sumir, contado do pé do broto. Terra rasa e terra funda. */
const FUNDOS = [60, 90, 130, 190];
/** Onde o broto fica, em fração da largura — hoje 0,76; as outras são seguro. */
const COLUNAS = [0.5, 0.76, 0.9];

let falhas = 0;
let casos = 0;
const detalhes = [];

function falhou(onde, mensagem) {
  falhas += 1;
  if (detalhes.length < 12) detalhes.push(`  FALHA ${onde}: ${mensagem}`);
}

(async () => {
  const saida = pastaTemporaria('raizes-do-broto');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');
  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'components', 'brand', 'raizesDoBroto.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );
  /*
    O `tsc` deixa o import sem extensao, que o Node recusa em modulo. Os dois
    arquivos viram `.mjs` e o import passa a apontar para o nome novo.
  */
  const mjs = ['raizesDoBroto', 'quedaDosFarelos'].map((nome) => {
    const de = path.join(saida, `${nome}.js`);
    const para = path.join(saida, `${nome}.mjs`);
    fs.renameSync(de, para);
    return para;
  })[0];
  fs.writeFileSync(
    mjs,
    fs.readFileSync(mjs, 'utf8').replace("'./quedaDosFarelos'", "'./quedaDosFarelos.mjs'"),
  );
  const R = await import('file://' + mjs.split(path.sep).join('/'));

  console.log(
    `— as raízes do broto: ${LARGURAS.length} larguras × ${FUNDOS.length} profundidades × ${COLUNAS.length} colunas —\n`,
  );

  const PE = 46;

  for (const largura of LARGURAS) {
    for (const abaixo of FUNDOS) {
      for (const coluna of COLUNAS) {
        casos += 1;
        const x = largura * coluna;
        const pedido = { x, y: PE, largura, fundo: PE + abaixo };
        const raizes = R.raizesDoBroto(pedido);
        const onde = `${largura} pt, terra ${abaixo} abaixo do pé, broto em ${coluna}`;

        if (JSON.stringify(R.raizesDoBroto(pedido)) !== JSON.stringify(raizes)) {
          falhou(onde, 'a mesma semente deu raízes diferentes');
        }
        if (raizes.length !== 6) falhou(onde, `${raizes.length} fios`);

        const principais = raizes.slice(0, 3);
        const todas = [];
        raizes.forEach((r, i) => {
          const nome = `${onde}, fio ${i}`;
          todas.push(...r.pontos);

          if (i < 3) {
            const p = r.pontos[0];
            if (Math.abs(p.x - x) > 0.001 || Math.abs(p.y - PE) > 0.001) {
              falhou(nome, `não começa no pé do broto (${p.x.toFixed(1)}, ${p.y.toFixed(1)})`);
            }
          } else {
            /* O fio menor nasce em cima da principal de onde ele sai. */
            const p = r.pontos[0];
            const perto = principais.some((m) =>
              m.pontos.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 6),
            );
            if (!perto) falhou(nome, 'nasce solto, fora das raízes principais');
          }

          for (const p of r.pontos) {
            if (p.y < PE - 0.001) falhou(nome, `sobe acima do pé (y = ${p.y.toFixed(1)})`);
            if (p.y > PE + abaixo + 0.001) falhou(nome, `afunda até ${p.y.toFixed(1)}, além da terra`);
            if (p.x < R.MARGEM - 0.001 || p.x > largura - R.MARGEM + 0.001) {
              falhou(nome, `passa da borda (x = ${p.x.toFixed(1)})`);
            }
          }

          if (!(r.espessura > 0) || !(r.opacidade > 0 && r.opacidade < 1)) {
            falhou(nome, `espessura ${r.espessura}, opacidade ${r.opacidade}`);
          }
        });

        /* Espalhar é o pedido: não pode virar um tufo só para um lado. */
        const esquerda = todas.filter((p) => p.x < x - 8).length;
        const direita = todas.filter((p) => p.x > x + 8).length;
        if (esquerda === 0 || direita === 0) falhou(onde, 'não se espalha para os dois lados');
        const abre = Math.max(...todas.map((p) => p.x)) - Math.min(...todas.map((p) => p.x));
        const cabe = Math.min(largura - 2 * R.MARGEM, largura * 0.2);
        if (abre < cabe * 0.99) falhou(onde, `abre só ${abre.toFixed(0)} pt`);
      }
    }
  }

  detalhes.forEach((l) => console.log(l));
  console.log(`\n${casos} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})();
