/**
 * Confere a queda dos farelos de terra que se soltam quando o buraco da Frase
 * do dia se abre. Ver `quedaDosFarelos` e `ChuvaDeFarelos`.
 *
 * ## O que é conferido
 *
 * Para buracos em várias alturas da tela — no topo, no meio, quase embaixo —
 * e em várias larguras de celular, em cada um dos três estágios:
 *
 * - todo farelo nasce **na borda** do buraco, e não no meio dele nem longe;
 * - todo farelo termina **abaixo do fim da camada**, com folga — é o que faz
 *   ele sumir por trás da barra de navegação, e não no meio da tela;
 * - nenhum sai pela lateral: do começo ao fim ele fica dentro da largura;
 * - a queda é gravidade: depois do ponto mais alto, só desce, e cada vez
 *   mais depressa;
 * - o pulinho do começo é para cima, e pequeno: terra espirrando, não saltando;
 * - a curva que vai para o `interpolate` tem entrada crescente — o Animated
 *   rejeita a que não tem;
 * - a mesma semente dá os mesmos farelos.
 *
 * Uso: node scripts/testa-queda-dos-farelos.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

const LARGURAS = [320, 360, 390, 412, 430];
/** Alturas da camada: celulares baixos e altos, sem a barra de navegação. */
const ALTURAS = [560, 680, 760, 840];
/** Onde o buraco está, em fração da altura da camada, no instante em que cede. */
const POSICOES = [0.08, 0.3, 0.55, 0.8, 0.95];
/** O buraco nos três estágios: como a faixa manda. Ver `COVA` em `FaixaDaFrase`. */
const TAMANHOS = [
  [44, 39],
  [53, 54],
  [62, 68],
];

let falhas = 0;
let casos = 0;
const detalhes = [];

function falhou(onde, mensagem) {
  falhas += 1;
  if (detalhes.length < 12) detalhes.push(`  FALHA ${onde}: ${mensagem}`);
}

(async () => {
  const saida = pastaTemporaria('queda-dos-farelos');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');
  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'components', 'brand', 'quedaDosFarelos.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );
  const js = path.join(saida, 'quedaDosFarelos.js');
  const mjs = js.replace(/\.js$/, '.mjs');
  fs.renameSync(js, mjs);
  const Q = await import('file://' + mjs.split(path.sep).join('/'));

  console.log(
    `— a queda dos farelos: ${LARGURAS.length} larguras × ${ALTURAS.length} alturas × ${POSICOES.length} posições × 3 estágios —\n`,
  );

  for (const largura of LARGURAS) {
    for (const fim of ALTURAS) {
      for (const pos of POSICOES) {
        for (let etapa = 0; etapa < 3; etapa++) {
          casos += 1;
          const [meiaLargura, meiaAltura] = TAMANHOS[etapa];
          const cx = largura / 2;
          const cy = fim * pos;
          const pedido = {
            cx, cy, meiaLargura, meiaAltura, fim, largura,
            quantos: Q.FARELOS_POR_ETAPA[etapa],
            semente: 7919 * (etapa + 1) + Math.round(cx),
          };
          const farelos = Q.soltarFarelos(pedido);
          const onde = `${largura}×${fim}, buraco a ${Math.round(pos * 100)}%, estágio ${etapa + 1}`;

          if (farelos.length !== Q.FARELOS_POR_ETAPA[etapa]) falhou(onde, `${farelos.length} farelos`);
          if (JSON.stringify(Q.soltarFarelos(pedido)) !== JSON.stringify(farelos)) {
            falhou(onde, 'a mesma semente deu farelos diferentes');
          }

          farelos.forEach((f, i) => {
            const nome = `${onde}, farelo ${i}`;

            /* Na borda: na elipse do buraco, alargada pela folga do nascimento. */
            const na = Math.hypot((f.x0 - cx) / (meiaLargura + 5), (f.y0 - cy) / (meiaAltura + 4));
            if (Math.abs(na - 1) > 0.01) falhou(nome, `nasce fora da borda (${na.toFixed(3)})`);

            if (!(f.duracaoMs > 0)) falhou(nome, `duração ${f.duracaoMs}`);
            if (f.duracaoMs > 2400) falhou(nome, `demora ${f.duracaoMs} ms para cair`);

            /* O pulinho: para cima, e pequeno. */
            const apice = f.vy < 0 ? (f.vy * f.vy) / (2 * Q.GRAVIDADE) : 0;
            if (f.vy >= 0) falhou(nome, 'não dá o pulinho para cima');
            if (apice > 18) falhou(nome, `sobe ${apice.toFixed(1)} pt — salta, não espirra`);

            const { inputRange: t, outputRange: y } = Q.curvaDaAltura(f);
            for (let k = 1; k < t.length; k++) {
              if (!(t[k] > t[k - 1])) falhou(nome, `entrada da curva não cresce em ${k}`);
            }
            if (Math.abs(y[0] - f.y0) > 0.001) falhou(nome, 'a curva não começa onde ele nasce');
            if (y[y.length - 1] < fim + Q.ALEM_DO_FIM - 0.5) {
              falhou(nome, `para em ${y[y.length - 1].toFixed(1)}, antes de passar de ${fim + Q.ALEM_DO_FIM}`);
            }

            /* Gravidade: depois do ponto mais alto, só desce, e acelerando. */
            const menor = y.indexOf(Math.min(...y));
            for (let k = menor + 1; k < y.length; k++) {
              if (!(y[k] > y[k - 1])) falhou(nome, `sobe de novo no ponto ${k}`);
              if (k > menor + 1 && y[k] - y[k - 1] < y[k - 1] - y[k - 2] - 1e-6) {
                falhou(nome, `desacelera no ponto ${k}`);
              }
            }

            /* Nunca sai pela lateral: o x é linear, basta o começo e o fim. */
            const xf = f.x0 + (f.vx * f.duracaoMs) / 1000;
            for (const x of [f.x0, xf]) {
              if (x < f.raio || x > largura - f.raio) falhou(nome, `sai pela lateral (x = ${x.toFixed(1)})`);
            }
          });
        }
      }
    }
  }

  detalhes.forEach((l) => console.log(l));
  console.log(`\n${casos} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})();
