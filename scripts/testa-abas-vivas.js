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
        A tela nunca fica descoberta, em instante nenhum.

        Com a revelação em círculo isso deixou de ser uma conta de cruzamento e
        virou uma coisa mais simples de garantir: **as duas camadas ficam
        paradas**, uma em cima da outra. A de baixo cobre a tela inteira o
        tempo todo; a de cima é recortada pelo círculo. Nenhum ponto da tela
        fica sem cobertura porque nenhuma das duas sai do lugar.

        O teste, então, é o contrário do antigo: antes ele media se as duas se
        cruzavam direito; agora ele cobra que nenhuma das duas ande.
      */
      const folga = 1e-9;
      for (const t of [0, 0.02, 0.5, 0.98, 1]) {
        const [aI, aF] = faixa(camadas.get(ativa), t);
        const [pI, pF] = faixa(camadas.get(anterior), t);
        const cobre =
          Math.min(aI, pI) <= folga &&
          Math.max(aF, pF) >= 1 - folga &&
          Math.max(aI, pI) <= Math.min(aF, pF) + folga;
        confere(onde, cobre, `em t=${t} a tela fica descoberta: ativa [${aI}, ${aF}], saindo [${pI}, ${pF}]`);
      }

      /* A que chega é a revelada, e é a única. */
      confere(onde, camadas.get(ativa).revela === true, 'a aba que chega não é revelada em círculo');
      confere(
        onde,
        ABAS.filter((c) => camadas.get(c).revela).length === 1,
        'mais de uma camada revelando: o círculo é só da que chega',
      );
      confere(
        onde,
        camadas.get(ativa).desliza === null && camadas.get(anterior).desliza === null,
        'alguma camada voltou a andar — parada é o que garante que a tela não fica descoberta',
      );
      /* A que chega cobre a que sai: o círculo abre **por cima** dela. */
      confere(
        onde,
        camadas.get(ativa).altura > camadas.get(anterior).altura,
        'a aba que sai está por cima da que chega',
      );

      /*
        Quem diz de onde a tela veio agora é o círculo, e não o lado.

        O deslize dizia isso pelo sentido: a aba da direita entrava pela
        direita. A revelação diz melhor — ela nasce no **ícone tocado**, e não
        apenas do lado dele. O que este teste guardava virou responsabilidade
        da `AbasVivas`, que congela a origem no instante da troca, e da
        `BottomNav`, que a mede com `pageX`/`pageY`.
      */
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
