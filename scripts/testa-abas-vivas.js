/**
 * Confere as regras das abas vivas. Ver `regrasDasAbas`.
 *
 * ## Por que existe
 *
 * A queixa "de tela em tela dá uma travada e um corte seco" voltou **quatro
 * vezes**. As três primeiras foram consertadas por fora — a transição, a
 * camada empilhada, o congelamento do elemento da aba — e voltaram porque a
 * causa continuou de pé: montar uma tela inteira dentro do toque. Medido no
 * navegador com a CPU desacelerada quatro vezes, ir para a Início travava a
 * linha por 899 ms, e o esmaecer não desenhava um único quadro do meio.
 *
 * As regras que tiram isso são três, e nenhuma delas quebra nada quando é
 * violada — é justamente por isso que elas voltam:
 *
 * 1. **aba montada não desmonta.** Se alguém devolver uma lista sem uma aba
 *    que já estava de pé, ela é montada de novo no toque seguinte e a travada
 *    volta inteira, sem nenhum erro na tela;
 * 2. **a que chega entra por cima, e a que sai fica opaca por baixo.** Se as
 *    duas esmaecerem juntas, o fundo do app aparece no meio da troca;
 * 3. **só uma aba se mexe, e a troca muda de dona no fim.** Se `seMexendo`
 *    virar no começo, o redesenho das folhas animadas cai dentro dos 220 ms
 *    da animação — 140 ms medidos — e a travada volta por dentro.
 *
 * Uso: node scripts/testa-abas-vivas.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

let falhas = 0;
let casos = 0;
const detalhes = [];

function confere(onde, condicao, mensagem) {
  casos += 1;
  if (condicao) return;
  falhas += 1;
  if (detalhes.length < 14) detalhes.push(`  FALHA ${onde}: ${mensagem}`);
}

(async () => {
  const saida = pastaTemporaria('abas-vivas');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');
  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'components', 'regrasDasAbas.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );
  const mjs = path.join(saida, 'regrasDasAbas.mjs');
  fs.renameSync(path.join(saida, 'regrasDasAbas.js'), mjs);
  const R = await import('file://' + mjs.split(path.sep).join('/'));

  const ABAS = ['home', 'broto', 'perfil'];

  console.log('— as abas vivas —\n');

  /* ---------- 1. Aba montada não desmonta ---------- */

  let montadas = ['home'];
  for (const destino of ['broto', 'perfil', 'home', 'broto', 'home', 'perfil', 'broto']) {
    const antes = montadas;
    montadas = R.proximasMontadas(montadas, destino);
    confere(
      `montadas -> ${destino}`,
      antes.every((c) => montadas.includes(c)),
      `perdeu aba montada: tinha [${antes}], ficou [${montadas}]`,
    );
    confere(`montadas -> ${destino}`, montadas.includes(destino), `${destino} não entrou`);
    confere(
      `montadas -> ${destino}`,
      new Set(montadas).size === montadas.length,
      `aba repetida: [${montadas}]`,
    );
  }
  confere('montadas', montadas.length === 3, `sobraram ${montadas.length} abas, e não 3`);

  /*
    A mesma lista, e não uma igual.

    É o que impede o efeito de aquecimento de se reagendar a cada render — ele
    depende da identidade da lista — e o que deixa o React reaproveitar os
    elementos das abas em vez de refazê-los.
  */
  const dePe = ['home', 'broto', 'perfil'];
  confere(
    'identidade',
    R.proximasMontadas(dePe, 'broto') === dePe,
    'devolveu uma lista nova para uma aba que já estava montada',
  );

  /* ---------- 2. Quem aparece, quem recebe toque ---------- */

  for (const ativa of ABAS) {
    for (const anterior of [null, ...ABAS.filter((c) => c !== ativa)]) {
      const cena = { ativa, anterior, seMexendo: anterior ?? ativa };
      const onde = `${ativa} <- ${anterior}`;
      const camadas = new Map(ABAS.map((c) => [c, R.camadaDaAba(c, cena)]));

      confere(onde, camadas.get(ativa).opacidade === null, 'a aba ativa não está na opacidade animada');
      confere(
        onde,
        ABAS.filter((c) => camadas.get(c).recebeToque).length === 1 && camadas.get(ativa).recebeToque,
        'toque em mais de uma aba, ou na aba errada',
      );
      /* A que sai fica **inteira** por baixo: esmaecendo junto, o fundo aparece. */
      if (anterior) {
        confere(
          onde,
          camadas.get(anterior).opacidade === 1,
          `a aba que sai está em ${camadas.get(anterior).opacidade}, e não inteira`,
        );
        confere(
          onde,
          camadas.get(anterior).altura < camadas.get(ativa).altura,
          'a aba que sai está por cima da que chega',
        );
      }
      for (const c of ABAS) {
        if (c === ativa || c === anterior) continue;
        confere(onde, camadas.get(c).opacidade === 0, `${c} aparece sem precisar`);
        confere(onde, camadas.get(c).altura < camadas.get(ativa).altura, `${c} está por cima da ativa`);
      }
    }
  }

  /* ---------- 3. Uma só se mexe, e a troca muda de dona no fim ---------- */

  for (const ativa of ABAS) {
    for (const seMexendo of ABAS) {
      const mexendo = ABAS.filter((c) => R.camadaDaAba(c, { ativa, anterior: null, seMexendo }).aVista);
      confere(
        `mexendo ${ativa}/${seMexendo}`,
        mexendo.length === 1 && mexendo[0] === seMexendo,
        `mexem [${mexendo}], e devia ser só ${seMexendo}`,
      );
    }
  }

  /*
    Durante a troca, quem se mexe é a que **sai**.

    Virando para a que chega no começo, o redesenho das folhas animadas cai
    dentro da animação. É a diferença entre 140 ms de linha travada no meio do
    esmaecer e zero.
  */
  const naTroca = { ativa: 'broto', anterior: 'home', seMexendo: 'home' };
  confere('troca', R.camadaDaAba('broto', naTroca).aVista === false, 'a aba que chega já se mexe durante a troca');
  confere('troca', R.camadaDaAba('home', naTroca).aVista === true, 'a aba que sai parou de se mexer durante a troca');
  /* Assentada, quem se mexe é a ativa e mais ninguém. */
  const assentada = { ativa: 'broto', anterior: null, seMexendo: 'broto' };
  confere('assentada', R.camadaDaAba('broto', assentada).aVista === true, 'a aba ativa não se mexe depois da troca');

  /* ---------- 4. O aquecimento ---------- */

  confere(
    'aquecimento',
    R.proximaAAquecer(['home'], ABAS) === 'broto',
    'a primeira a montar em silêncio não é o Brotinho',
  );
  confere(
    'aquecimento',
    R.proximaAAquecer(['home', 'broto'], ABAS) === 'perfil',
    'a segunda a montar em silêncio não é o Perfil',
  );
  confere(
    'aquecimento',
    R.proximaAAquecer(ABAS, ABAS) === null,
    'com tudo montado ele ainda pede mais uma — o efeito nunca pararia',
  );
  confere(
    'aquecimento',
    R.proximaAAquecer(['perfil'], ABAS) === 'home',
    'quem abre fora da Início não aquece a Início',
  );

  console.log(`${casos} conferências, ${falhas} falha(s)`);
  if (falhas) {
    console.log('');
    for (const d of detalhes) console.log(d);
    process.exit(1);
  }
  console.log('as abas ficam de pé, uma só se mexe, e a troca muda de dona no fim.');
  process.exit(0);
})();
