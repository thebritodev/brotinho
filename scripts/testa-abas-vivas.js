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
 * 2. **ninguém esmaece.** As duas que participam da troca são opacas e andam
 *    lado a lado, e somadas cobrem a tela em todo instante. Camada translúcida
 *    é o piscar: a Início tem terra escura no alto e as outras duas são
 *    claras, e numa dissolução entre elas aparecem, por 220 ms, duas telas
 *    inteiras uma dentro da outra;
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

  /** A ordem da barra de baixo, que é a que decide de que lado a aba entra. */
  const ABAS = ['broto', 'home', 'perfil'];

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

  /* ---------- 2. Ninguém esmaece, e a tela nunca fica descoberta ---------- */

  /** Onde a camada está, em larguras de tela, num instante `t` da troca. */
  const faixa = (camada, t) => {
    const x = camada.desliza ? camada.desliza[0] + (camada.desliza[1] - camada.desliza[0]) * t : 0;
    return [x, x + 1];
  };

  for (const ativa of ABAS) {
    for (const anterior of [null, ...ABAS.filter((c) => c !== ativa)]) {
      const cena = { ativa, anterior, seMexendo: anterior ?? ativa, ordem: ABAS };
      const onde = `${ativa} <- ${anterior}`;
      const camadas = new Map(ABAS.map((c) => [c, R.camadaDaAba(c, cena)]));

      confere(onde, camadas.get(ativa).opacidade === 1, 'a aba ativa não está inteira');
      confere(
        onde,
        ABAS.filter((c) => camadas.get(c).recebeToque).length === 1 && camadas.get(ativa).recebeToque,
        'toque em mais de uma aba, ou na aba errada',
      );

      /*
        A regra que tira o piscar: nenhuma camada translúcida, nunca. Zero ou
        um, e mais nada — duas telas com opacidade no meio aparecem uma dentro
        da outra.
      */
      for (const c of ABAS) {
        const o = camadas.get(c).opacidade;
        confere(onde, o === 0 || o === 1, `${c} está translúcida (${o}) — é assim que o piscar volta`);
      }
      for (const c of ABAS) {
        if (c === ativa || c === anterior) continue;
        confere(onde, camadas.get(c).opacidade === 0, `${c} aparece sem precisar`);
        confere(onde, camadas.get(c).desliza === null, `${c} anda sem participar da troca`);
      }

      if (!anterior) {
        confere(onde, camadas.get(ativa).desliza === null, 'a aba parada está andando');
        continue;
      }

      /*
        As duas que andam cobrem a tela em qualquer instante.

        A tela é o intervalo [0, 1]. Se em algum momento sobrar um pedaço sem
        nenhuma das duas por cima, ali aparece o fundo — e um rasgo de fundo
        atravessando a tela é piscar igual.
      */
      const folga = 1e-9;
      for (const t of [0, 0.02, 0.1, 0.25, 0.5, 0.75, 0.9, 0.98, 1]) {
        const [aI, aF] = faixa(camadas.get(ativa), t);
        const [pI, pF] = faixa(camadas.get(anterior), t);
        const cobre =
          Math.min(aI, pI) <= folga &&
          Math.max(aF, pF) >= 1 - folga &&
          Math.max(aI, pI) <= Math.min(aF, pF) + folga;
        confere(onde, cobre, `em t=${t} a tela fica descoberta: ativa [${aI}, ${aF}], saindo [${pI}, ${pF}]`);
      }

      /* Elas andam para lados opostos, e a que chega acaba no lugar. */
      const daAtiva = camadas.get(ativa).desliza;
      const daAnterior = camadas.get(anterior).desliza;
      confere(onde, daAtiva[1] === 0, 'a aba que chega não termina no lugar');
      confere(onde, daAnterior[0] === 0, 'a aba que sai não começa no lugar');
      confere(onde, Math.abs(daAtiva[0]) === 1, 'a aba que chega não entra de uma tela inteira');
      confere(
        onde,
        Math.sign(daAtiva[0]) === -Math.sign(daAnterior[1]),
        'as duas não andam para o mesmo lado',
      );
      /*
        E a que sai anda **menos**. É o que faz as duas se cruzarem em vez de
        se encostarem, e é o que não deixa aparecer um fio de fundo entre elas.
      */
      confere(
        onde,
        Math.abs(daAnterior[1]) > 0 && Math.abs(daAnterior[1]) < 1,
        `a que sai anda ${Math.abs(daAnterior[1])} tela: andando a tela inteira, as duas se encostam e abre um fio de fundo`,
      );
      /* A que chega cobre a que sai — senão o cruzamento aparece como remendo. */
      confere(
        onde,
        camadas.get(ativa).altura > camadas.get(anterior).altura,
        'a aba que sai está por cima da que chega',
      );

      /* O movimento na tela é o movimento do dedo na barra. */
      const paraADireita = ABAS.indexOf(ativa) > ABAS.indexOf(anterior);
      confere(
        onde,
        daAtiva[0] === (paraADireita ? 1 : -1),
        `a aba ${ativa} entra pelo lado errado da barra`,
      );
    }
  }

  /* ---------- 3. Uma só se mexe, e a troca muda de dona no fim ---------- */

  for (const ativa of ABAS) {
    for (const seMexendo of ABAS) {
      const mexendo = ABAS.filter(
        (c) => R.camadaDaAba(c, { ativa, anterior: null, seMexendo, ordem: ABAS }).aVista,
      );
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
  const naTroca = { ativa: 'broto', anterior: 'home', seMexendo: 'home', ordem: ABAS };
  confere('troca', R.camadaDaAba('broto', naTroca).aVista === false, 'a aba que chega já se mexe durante a troca');
  confere('troca', R.camadaDaAba('home', naTroca).aVista === true, 'a aba que sai parou de se mexer durante a troca');
  /* Assentada, quem se mexe é a ativa e mais ninguém. */
  const assentada = { ativa: 'broto', anterior: null, seMexendo: 'broto', ordem: ABAS };
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
  /* Quem abre fora da Início aquece as outras duas do mesmo jeito. */
  confere(
    'aquecimento',
    R.proximaAAquecer(['perfil'], ABAS) === 'broto',
    'quem abre no Perfil não aquece mais nada',
  );
  confere(
    'aquecimento',
    R.proximaAAquecer(['perfil', 'broto'], ABAS) === 'home',
    'a Início fica de fora do aquecimento de quem abre no Perfil',
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
