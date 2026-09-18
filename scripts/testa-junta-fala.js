/**
 * Percorre o ditado do diário com a sequência de eventos que o Android manda
 * de verdade — inclusive a pausa no meio, que era onde tudo se perdia.
 *
 * ## O caso que este arquivo existe para travar
 *
 * Em modo contínuo o reconhecedor fecha um trecho a cada pausa (`isFinal:
 * true`) e **recomeça do zero** no seguinte. O gancho guardava só o último
 * evento, então quem falava, pausava e voltava a falar via o texto sumir e uma
 * frase nova começar do nada.
 *
 * O teste roda a sequência inteira e confere o texto a cada passo, não só no
 * fim: o que aparece na tela enquanto a pessoa fala importa tanto quanto o que
 * vai para o registro, porque é ele que ela usa para saber se está sendo ouvida.
 *
 * Uso: node scripts/testa-junta-fala.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

let falhas = 0;
let casos = 0;

function confere(descricao, obtido, esperado) {
  casos += 1;
  const ok = obtido === esperado;
  if (!ok) falhas += 1;
  console.log(`  ${ok ? 'ok   ' : 'FALHA'} ${descricao}`);
  if (!ok) {
    console.log(`        esperado: ${JSON.stringify(esperado)}`);
    console.log(`        obtido:   ${JSON.stringify(obtido)}`);
  }
}

(async () => {
  const saida = pastaTemporaria('junta-fala');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'services', 'juntaFala.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );

  const js = path.join(saida, 'juntaFala.js');
  const mjs = js.replace(/\.js$/, '.mjs');
  fs.renameSync(js, mjs);
  const { FALA_VAZIA, somarFala, textoDaFala } = await import(
    'file://' + mjs.split(path.sep).join('/')
  );

  console.log('— o ditado com pausa no meio —\n');

  /*
    A sequência é a de uma pessoa dizendo duas frases com uma pausa entre elas.
    Os parciais chegam palavra a palavra e vão se corrigindo; o `isFinal` chega
    quando o reconhecedor decide que aquela frase acabou.
  */
  const eventos = [
    { trecho: 'hoje', isFinal: false, entao: 'hoje' },
    { trecho: 'hoje foi', isFinal: false, entao: 'hoje foi' },
    { trecho: 'Hoje foi um dia difícil.', isFinal: true, entao: 'Hoje foi um dia difícil.' },

    /* A pausa. O reconhecedor recomeça do zero — e é aqui que se perdia tudo. */
    { trecho: 'mas', isFinal: false, entao: 'Hoje foi um dia difícil. mas' },
    {
      trecho: 'mas eu consegui',
      isFinal: false,
      entao: 'Hoje foi um dia difícil. mas eu consegui',
    },
    {
      trecho: 'Mas eu consegui atravessar.',
      isFinal: true,
      entao: 'Hoje foi um dia difícil. Mas eu consegui atravessar.',
    },
  ];

  let fala = FALA_VAZIA;
  for (const evento of eventos) {
    fala = somarFala(fala, { isFinal: evento.isFinal, trecho: evento.trecho });
    confere(
      `${evento.isFinal ? 'fechado ' : 'em curso'} ${JSON.stringify(evento.trecho)}`,
      textoDaFala(fala),
      evento.entao,
    );
  }

  console.log('\n— o resto —\n');

  /* Evento vazio não pode zerar a frase que ainda está sendo dita. */
  const dizendo = somarFala(FALA_VAZIA, { trecho: 'estou falando', isFinal: false });
  confere(
    'evento sem texto não apaga o que está em curso',
    textoDaFala(somarFala(dizendo, { trecho: '   ', isFinal: false })),
    'estou falando',
  );

  /* Parcial substitui parcial: a frase está sendo corrigida, não continuada. */
  confere(
    'dois parciais seguidos não se somam',
    textoDaFala(
      somarFala(somarFala(FALA_VAZIA, { trecho: 'eu que', isFinal: false }), {
        trecho: 'eu queria',
        isFinal: false,
      }),
    ),
    'eu queria',
  );

  /* Três pausas seguidas continuam somando, e não só a última. */
  const tres = ['Primeira.', 'Segunda.', 'Terceira.'].reduce(
    (acc, trecho) => somarFala(acc, { trecho, isFinal: true }),
    FALA_VAZIA,
  );
  confere('três trechos fechados somam os três', textoDaFala(tres), 'Primeira. Segunda. Terceira.');

  /* Nada falado ainda não vira espaço solto no começo do registro. */
  confere('fala vazia não vira espaço', textoDaFala(FALA_VAZIA), '');

  console.log(`\n${casos} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})();
