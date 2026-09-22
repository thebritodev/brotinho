/**
 * Confere as raízes que saem do broto do adubo, na faixa da Composta.
 * Ver `raizesDoBroto`.
 *
 * ## O que é conferido, em cada largura de tela e em cada profundidade de terra
 *
 * - a rede tem os três níveis: principais saindo do pé, ramos saindo delas e
 *   pelinhos nas pontas — e cada nível é mais fino e mais apagado que o de
 *   cima;
 * - toda principal começa **no pé do broto**;
 * - todo ramo e todo pelinho começam **em cima** da raiz de onde saem, num
 *   ponto que está desenhado, e não solto na terra a alguns pontos dela, e
 *   essa raiz é de um nível acima da dele;
 * - nenhuma sobe acima do pé — raiz que sobe vira galho;
 * - nenhuma passa da margem das bordas da tela;
 * - nenhuma afunda além do ponto onde a terra começa a sumir, que é onde ela
 *   apareceria boiando na névoa;
 * - elas se espalham de verdade: fios dos dois lados, e a rede abrindo mais
 *   que um quinto da tela;
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
const COLUNAS = [0.5, 0.76, 0.8, 0.9];

/** 5 principais, 3 ramos em cada, 2 pelinhos por ramo e 2 na ponta da principal. */
const PRINCIPAIS = 5;
const RAMOS = 3;
const QUANTOS = PRINCIPAIS * (1 + RAMOS + RAMOS * 2 + 2);

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
        if (raizes.length !== QUANTOS) falhou(onde, `${raizes.length} fios, esperados ${QUANTOS}`);

        const porNivel = [0, 1, 2].map((n) => raizes.filter((r) => r.nivel === n));
        if (porNivel[0].length !== PRINCIPAIS) falhou(onde, `${porNivel[0].length} principais`);
        if (porNivel[1].length !== PRINCIPAIS * RAMOS) falhou(onde, `${porNivel[1].length} ramos`);
        if (!porNivel[2].length) falhou(onde, 'sem pelinhos nas pontas');

        /* Cada nível mais fino e mais apagado que o de cima: é o que dá a rede. */
        for (const n of [1, 2]) {
          const acima = porNivel[n - 1][0];
          const aqui = porNivel[n][0];
          if (!(aqui.espessura < acima.espessura)) falhou(onde, `nível ${n} não afina`);
          if (!(aqui.opacidade < acima.opacidade)) falhou(onde, `nível ${n} não clareia`);
        }

        const todas = [];
        raizes.forEach((r, i) => {
          const nome = `${onde}, fio ${i} (nível ${r.nivel})`;
          todas.push(...r.pontos);
          const p = r.pontos[0];

          if (r.nivel === 0) {
            if (r.pai !== null) falhou(nome, 'principal com pai');
            if (Math.abs(p.x - x) > 0.001 || Math.abs(p.y - PE) > 0.001) {
              falhou(nome, `não começa no pé do broto (${p.x.toFixed(1)}, ${p.y.toFixed(1)})`);
            }
          } else {
            const pai = r.pai === null ? null : raizes[r.pai];
            /*
              O pai é de um nível acima — não necessariamente o de cima: os
              pelinhos da ponta de uma principal nascem direto dela.
            */
            if (!pai || !(pai.nivel < r.nivel)) {
              falhou(nome, `pai inválido (${r.pai})`);
            } else {
              /* Nasce **em cima** do pai, num ponto que está desenhado. */
              const encostado = pai.pontos.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 0.01);
              if (!encostado) falhou(nome, 'nasce solto, fora da raiz de onde deveria sair');
            }
          }

          for (const q of r.pontos) {
            if (q.y < PE - 0.001) falhou(nome, `sobe acima do pé (y = ${q.y.toFixed(1)})`);
            if (q.y > PE + abaixo + 0.001) {
              falhou(nome, `afunda até ${q.y.toFixed(1)}, além da terra`);
            }
            if (q.x < R.MARGEM - 0.001 || q.x > largura - R.MARGEM + 0.001) {
              falhou(nome, `passa da borda (x = ${q.x.toFixed(1)})`);
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
