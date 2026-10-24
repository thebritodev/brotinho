#!/usr/bin/env node
/**
 * A contagem do modo acústico da Composta, contra sons simulados.
 *
 * O modo acústico é o de sempre num iPhone sem reconhecimento de fala no
 * aparelho (do XS para trás), e foi lá que o Pedro viu "qualquer barulho
 * continua sendo entendido como repetição". A regra está em
 * `src/screens/composta/contagemPeloSom.ts`; aqui ela recebe, dez vezes por
 * segundo como o medidor de verdade, se houve voz naquele instante — e a
 * conta que sai tem de ser a de uma pessoa, não a de um microfone.
 *
 * Os cenários de barulho têm de dar **zero**. Os de fala têm de dar o número
 * de frases ditas, com folga de uma para o arredondamento.
 */
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');
const DT = 0.1;

/** Uma sequência de trechos: [segundos com voz, segundos em silêncio], repetida. */
function sinal(trechos, vezes = 1) {
  const leituras = [];
  for (let n = 0; n < vezes; n += 1) {
    for (const [voz, pausa] of trechos) {
      for (let t = 0; t < Math.round(voz / DT); t += 1) leituras.push(true);
      for (let t = 0; t < Math.round(pausa / DT); t += 1) leituras.push(false);
    }
  }
  return leituras;
}

(async () => {
  const saida = pastaTemporaria('contagem-pelo-som');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');
  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'screens', 'composta', 'contagemPeloSom.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );
  const js = path.join(saida, 'contagemPeloSom.js');
  const mjs = js.replace(/\.js$/, '.mjs');
  fs.renameSync(js, mjs);
  const C = await import('file://' + mjs.split(path.sep).join('/'));

  const contar = (frase, leituras) => {
    const estado = C.contagemInicial();
    const voz = C.vozDeUmaRepeticao(frase);
    let reps = 0;
    for (const temVoz of leituras) if (C.passoPeloSom(estado, temVoz, DT, voz)) reps += 1;
    return reps;
  };

  const FRASE = 'não vou dar conta';
  const voz = C.vozDeUmaRepeticao(FRASE);
  console.log(`— a contagem pelo som: "${FRASE}", ${C.silabasDe(FRASE)} sílabas, ${voz.toFixed(2)} s de voz por repetição —\n`);

  const casos = [
    /* Barulho: tem de dar zero. */
    { nome: 'silêncio, 30 s', leituras: sinal([[0, 30]]), espera: [0, 0] },
    { nome: 'tosse de 0,3 s a cada segundo e pouco, 20 vezes', leituras: sinal([[0.3, 1.0]], 20), espera: [0, 0] },
    { nome: '"ah" de 0,4 s com 0,6 s de pausa, 20 vezes', leituras: sinal([[0.4, 0.6]], 20), espera: [0, 0] },
    { nome: 'três tosses curtas seguidas (0,2 s, 0,4 s entre elas), 10 vezes', leituras: sinal([[0.2, 0.4], [0.2, 0.4], [0.2, 1.5]], 10), espera: [0, 0] },
    { nome: 'porta, talher, palma: estouros de 0,1 s, 50 vezes', leituras: sinal([[0.1, 0.5]], 50), espera: [0, 0] },
    { nome: 'uma palavra solta de 0,5 s com pausa, 15 vezes', leituras: sinal([[0.5, 0.8]], 15), espera: [0, 0] },
    /* Fala: tem de dar o número de frases. */
    { nome: '10 frases de 0,7 s com fôlego de 0,5 s', leituras: sinal([[0.7, 0.5]], 10), espera: [10, 10] },
    { nome: '10 frases de 0,6 s, ditas depressa, com 0,3 s entre elas', leituras: sinal([[0.6, 0.3]], 10), espera: [10, 10] },
    { nome: '10 frases de 0,9 s, ditas devagar, com 0,6 s entre elas', leituras: sinal([[0.9, 0.6]], 10), espera: [10, 10] },
    { nome: '"sem pausar": 6 s de fala corrida', leituras: sinal([[6, 1]]), espera: [9, 10] },
    { nome: 'fala com uma tosse no meio de cada frase', leituras: sinal([[0.4, 0.1], [0.3, 0.6]], 8), espera: [8, 8] },
  ];

  let falhas = 0;
  for (const c of casos) {
    const reps = contar(FRASE, c.leituras);
    const ok = reps >= c.espera[0] && reps <= c.espera[1];
    if (!ok) falhas += 1;
    const alvo = c.espera[0] === c.espera[1] ? `${c.espera[0]}` : `${c.espera[0]} a ${c.espera[1]}`;
    console.log(`  ${ok ? 'ok   ' : 'FALHA'} ${c.nome}: ${reps} (esperado ${alvo})`);
  }

  /* A frase longa precisa de mais voz; a de uma palavra, do piso. */
  const longa = 'eu nunca vou conseguir mudar nada na minha vida';
  const curta = 'ok';
  const okLonga = C.vozDeUmaRepeticao(longa) > voz * 2;
  const okCurta = C.vozDeUmaRepeticao(curta) === C.MENOR_REPETICAO;
  if (!okLonga) falhas += 1;
  if (!okCurta) falhas += 1;
  console.log(`  ${okLonga ? 'ok   ' : 'FALHA'} frase longa pede mais voz: ${C.vozDeUmaRepeticao(longa).toFixed(2)} s`);
  console.log(`  ${okCurta ? 'ok   ' : 'FALHA'} frase de uma palavra fica no piso: ${C.vozDeUmaRepeticao(curta).toFixed(2)} s`);

  console.log(`\n${casos.length + 2} conferências, ${falhas} falha(s)`);
  process.exit(falhas ? 1 : 0);
})();
