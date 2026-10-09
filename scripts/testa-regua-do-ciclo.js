/**
 * Confere as contas da régua do ciclo.
 *
 * ## Por que ela precisa de teste, sendo só uma barra
 *
 * Porque ela já errou duas vezes, e as duas vezes passaram por aqui sem que
 * nada quebrasse. A barra da tela inicial contava o **estágio atual** e
 * aparecia vazia debaixo de "faltam 11 dias para florescer"; a do jardim era
 * linear de 0 a 21 com os quatro nomes espalhados em larguras iguais, embora
 * os estágios abram nos dias 3 e 10. Nenhum dos dois é um defeito que estoura:
 * os dois desenham, compilam e ficam na tela mentindo.
 *
 * O que este arquivo amarra é a única promessa que a régua faz:
 *
 *     quando o broto evolui, o trecho aceso termina exatamente em cima da
 *     marca do estágio novo.
 *
 * Isso é uma coincidência entre duas contas diferentes — a dos intervalos, que
 * desenham a barra, e a das marcas, que posicionam os desenhos. Duas descrições
 * do mesmo lugar é o arranjo que diverge na primeira vez que alguém mexe numa
 * delas.
 *
 * Uso: node scripts/testa-regua-do-ciclo.js
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
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

const perto = (a, b) => Math.abs(a - b) < 1e-9;

/** As larguras que a régua encontra de verdade, da mais estreita à de tablet. */
const LARGURAS = [244, 248, 260, 284, 299, 314, 320, 368, 400, 460, 524, 700];

(async () => {
  const saida = pastaTemporaria('regua-do-ciclo');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');
  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'components', 'brand', 'planoDoCiclo.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );
  const js = path.join(saida, 'planoDoCiclo.js');
  const mjs = js.replace(/\.js$/, '.mjs');
  fs.renameSync(js, mjs);
  const plano = await import('file://' + mjs.split(path.sep).join('/'));

  const {
    AR_ENTRE_MARCAS,
    LADO_MAXIMO,
    LADO_MINIMO,
    NOMES_DAS_MARCAS,
    VAO_DO_INTERVALO,
    NOMES_DAS_MARCAS: NOMES,
    larguraDoNome,
    marcaDeAgora,
    posicoesDosRotulos,
    menorFolgaEntreMarcos,
    planoDaRegua,
    xDoDia,
  } = plano;

  /* ---------- 1. Os números de que a régua depende ---------- */

  console.log('\n— os marcos, lidos de `derived` —\n');

  /*
    A régua é dimensionada em cima de 0, 3, 10 e 21.

    Ela não importa `derived`, de propósito: é isso que deixa este teste
    compilá-la sozinha. O preço é que os marcos aparecem em dois lugares, e o
    pagamento é aqui — se alguém mudar `STAGE_AT` ou `MATURIDADE`, este teste
    cai e diz que a folga mais estreita da régua precisa ser reconferida.
  */
  const derived = fs.readFileSync(path.join(RAIZ, 'src', 'state', 'derived.ts'), 'utf8');
  const mStage = /STAGE_AT: Record<SproutStage, number> = \{([^}]*)\}/.exec(derived);
  const mMaturidade = /MATURIDADE = (\d+)/.exec(derived);
  confere('derived', !!mStage, 'não achei `STAGE_AT` — a régua ficou sem referência');
  confere('derived', !!mMaturidade, 'não achei `MATURIDADE`');

  const abertura = mStage
    ? [...mStage[1].matchAll(/(\d+):\s*(\d+)/g)].map((m) => Number(m[2]))
    : [];
  const MATURIDADE = mMaturidade ? Number(mMaturidade[1]) : 0;
  const MARCOS = [...abertura, MATURIDADE];

  confere(
    'derived',
    abertura.length === 3 && abertura[0] === 0 && abertura[1] === 3 && abertura[2] === 10,
    `os estágios abrem em ${abertura.join(', ')} — a régua foi dimensionada para 0, 3 e 10`,
  );
  confere(
    'derived',
    MATURIDADE === 21,
    `o ciclo tem ${MATURIDADE} dias — a régua foi desenhada com vinte e um intervalos`,
  );
  confere(
    'régua',
    NOMES_DAS_MARCAS.length === MARCOS.length,
    'sobra ou falta nome para as marcas',
  );
  confere(
    'régua',
    perto(menorFolgaEntreMarcos(MARCOS, MATURIDADE), 3 / 21),
    'a folga mais estreita deixou de ser a da Semente para o Broto',
  );

  console.log(`  marcos ${MARCOS.join(', ')} · ciclo de ${MATURIDADE} dias`);

  /* ---------- 2. A geometria, em toda largura que existe ---------- */

  console.log('\n— a régua em cada largura —\n');

  for (const largura of LARGURAS) {
    const p = planoDaRegua(largura, MARCOS, MATURIDADE);
    const onde = `largura ${largura}`;

    confere(
      onde,
      p.lado >= LADO_MINIMO && p.lado <= LADO_MAXIMO,
      `o desenho saiu com ${p.lado}, fora de [${LADO_MINIMO}, ${LADO_MAXIMO}]`,
    );
    confere(onde, p.barra > 0, 'não sobrou barra para ser barra');
    confere(onde, p.intervalos.length === MATURIDADE, 'o número de intervalos não é o do ciclo');

    /*
      Nenhum desenho sai da régua.

      O primeiro fica no dia zero e o último no dia vinte e um: centrados de
      verdade, os dois ficariam metade para fora. O recuo de meio desenho em
      cada ponta é o que resolve, e é o que isto confere.
    */
    for (const marca of p.marcas) {
      confere(
        `${onde}, marca ${marca.dia}`,
        marca.x - p.lado / 2 >= -1e-9,
        `o desenho vaza ${(p.lado / 2 - marca.x).toFixed(1)} pela esquerda`,
      );
      confere(
        `${onde}, marca ${marca.dia}`,
        marca.x + p.lado / 2 <= largura + 1e-9,
        `o desenho vaza ${(marca.x + p.lado / 2 - largura).toFixed(1)} pela direita`,
      );
      confere(
        `${onde}, marca ${marca.dia}`,
        perto(marca.x, xDoDia(p, marca.dia, MATURIDADE)),
        'a marca não está onde o dia dela cai',
      );
    }

    /*
      E nenhum encosta no vizinho — a não ser quando a tela é estreita demais
      para isso ser possível, e aí o piso de legibilidade ganha. É uma escolha,
      e está escrita em `ladoDaMarca`; o teste confere que ela só vale quando
      precisa valer.
    */
    const cabe = Math.floor(((3 / 21) * largura) / (1 + 3 / 21)) - AR_ENTRE_MARCAS;
    if (cabe >= LADO_MINIMO) {
      for (let i = 1; i < p.marcas.length; i += 1) {
        confere(
          `${onde}, marcas ${p.marcas[i - 1].dia}→${p.marcas[i].dia}`,
          p.marcas[i].x - p.marcas[i - 1].x >= p.lado + AR_ENTRE_MARCAS - 1e-9,
          `sobrou ${(p.marcas[i].x - p.marcas[i - 1].x - p.lado).toFixed(2)} de ar entre dois desenhos, e não ${AR_ENTRE_MARCAS}`,
        );
      }
    }

    /* Os intervalos andam para a frente, não se sobrepõem e têm largura. */
    for (let i = 0; i < p.intervalos.length; i += 1) {
      const it = p.intervalos[i];
      confere(`${onde}, intervalo ${i}`, it.dia === i, 'o intervalo perdeu o dia dele');
      confere(`${onde}, intervalo ${i}`, it.largura > 0, 'intervalo sem largura');
      if (i > 0) {
        const antes = p.intervalos[i - 1];
        confere(
          `${onde}, intervalo ${i}`,
          it.esquerda >= antes.esquerda + antes.largura - 1e-9,
          'dois intervalos se sobrepõem',
        );
      }
    }

    /* A barra começa e termina na mesma folga de meio vão, nas duas pontas. */
    const primeiro = p.intervalos[0];
    const ultimo = p.intervalos[p.intervalos.length - 1];
    confere(
      onde,
      perto(primeiro.esquerda, xDoDia(p, 0, MATURIDADE) + VAO_DO_INTERVALO / 2),
      'a barra não começa no dia zero',
    );
    confere(
      onde,
      perto(
        ultimo.esquerda + ultimo.largura,
        xDoDia(p, MATURIDADE, MATURIDADE) - VAO_DO_INTERVALO / 2,
      ),
      'a barra não termina na flor',
    );

    /*
      ---- A promessa ----

      Em cada marca, a fronteira entre o intervalo que acende e o que não
      acende cai **exatamente** no centro da marca. É isso que faz o trecho
      aceso terminar embaixo do desenho novo no dia em que o broto evolui.
    */
    for (const marca of p.marcas) {
      if (marca.dia === 0) continue;
      const anterior = p.intervalos[marca.dia - 1];
      const fronteira = anterior.esquerda + anterior.largura + VAO_DO_INTERVALO / 2;
      confere(
        `${onde}, evolução no dia ${marca.dia}`,
        perto(fronteira, marca.x),
        `o aceso termina em ${fronteira.toFixed(2)} e o desenho está em ${marca.x.toFixed(2)}`,
      );
    }

    /*
      Os quatro nomes cabem, na ordem, sem se encostar e sem sair da régua.

      Era um nome só — o da etapa de agora — e o Pedro pediu os quatro. A
      Semente e o Broto estão a um sétimo da barra um do outro, então
      centrá-los nos riscos os sobrepõe: quem resolve é `posicoesDosRotulos`,
      e é o que está conferido aqui em toda largura que existe.
    */
    const CORPO = 11;
    const FOLGA = 5;
    const larguras = NOMES.map((n) => larguraDoNome(n, CORPO));
    const esquerdas = posicoesDosRotulos(
      p.marcas.map((m) => m.x),
      larguras,
      largura,
      FOLGA,
    );
    confere(onde, esquerdas.length === NOMES.length, 'perdeu um nome pelo caminho');
    esquerdas.forEach((x, i) => {
      confere(
        `${onde}, nome ${NOMES[i]}`,
        x >= -1e-9,
        `saiu pela esquerda em ${x.toFixed(1)}`,
      );
      confere(
        `${onde}, nome ${NOMES[i]}`,
        x + larguras[i] <= largura + 1e-9,
        `passa da régua em ${(x + larguras[i] - largura).toFixed(1)}`,
      );
      if (i === 0) return;
      /* Não encostam, e mantêm a ordem — o nome do dia 3 nunca fica antes do dia 0. */
      confere(
        `${onde}, nomes ${NOMES[i - 1]}→${NOMES[i]}`,
        x >= esquerdas[i - 1] + larguras[i - 1] + FOLGA - 1e-9,
        `só ${(x - esquerdas[i - 1] - larguras[i - 1]).toFixed(1)} de vão, e o mínimo é ${FOLGA}`,
      );
    });
    /*
      E cada nome fica **perto** do risco dele.

      Caber é metade: quatro nomes espalhados em colunas iguais também cabem, e
      era esse o defeito original do jardim. O desvio tolerado é o que a
      sobreposição obriga, e não mais do que isso.
    */
    esquerdas.forEach((x, i) => {
      const centro = x + larguras[i] / 2;
      confere(
        `${onde}, nome ${NOMES[i]}`,
        Math.abs(centro - p.marcas[i].x) <= 46,
        `ficou a ${Math.abs(centro - p.marcas[i].x).toFixed(0)} do risco dele`,
      );
    });
  }

  console.log(`  ${LARGURAS.length} larguras conferidas`);

  /* ---------- 3. O caso que o Pedro viu ---------- */

  console.log('\n— o relato: dez dias cuidados —\n');

  /*
    "diz 10 dias cuidados faltam 11 para florecer porem a barra ta 1/11 ao
    inves de 11/21."

    Aos dez dias o broto acabou de virar Plantinha. A régua tem de acender dez
    dos vinte e um intervalos, e o décimo tem de terminar embaixo do desenho da
    Plantinha — que é a marca do dia 10, e não a terceira de quatro colunas
    iguais.
  */
  const p = planoDaRegua(299, MARCOS, MATURIDADE);
  const acesos = p.intervalos.filter((it) => it.dia < 10);
  confere('dez dias', acesos.length === 10, `acendeu ${acesos.length} intervalos, e não dez`);

  const plantinha = p.marcas[2];
  confere('dez dias', plantinha.dia === 10, 'a Plantinha deixou de abrir no dia 10');
  const fim = acesos[acesos.length - 1];
  confere(
    'dez dias',
    perto(fim.esquerda + fim.largura + VAO_DO_INTERVALO / 2, plantinha.x),
    'o trecho aceso não termina embaixo da Plantinha',
  );
  confere(
    'dez dias',
    marcaDeAgora(MARCOS, 10) === 2 && NOMES_DAS_MARCAS[2] === 'Plantinha',
    'o rótulo de agora não é Plantinha',
  );

  /*
    E a proporção que ele esperava ver: dez de vinte e um, não zero de onze.
    Um sétimo da barra a mais do que a marca anterior, e menos da metade dela.
  */
  const fracao = (fim.esquerda + fim.largura + VAO_DO_INTERVALO / 2 - p.recuo) / p.barra;
  confere(
    'dez dias',
    perto(fracao, 10 / 21),
    `o aceso parou em ${(fracao * 100).toFixed(1)}% da barra, e não em 47,6%`,
  );

  /* ---------- 4. Qual marca está valendo ---------- */

  console.log('\n— a marca de agora —\n');

  const esperado = (dias) => {
    if (dias >= 21) return 3;
    if (dias >= 10) return 2;
    if (dias >= 3) return 1;
    return 0;
  };
  for (let dias = -5; dias <= 40; dias += 1) {
    confere(
      `dia ${dias}`,
      marcaDeAgora(MARCOS, dias) === esperado(Math.max(0, dias)),
      `caiu na marca ${marcaDeAgora(MARCOS, dias)} em vez de ${esperado(Math.max(0, dias))}`,
    );
  }
  /*
    Nunca `-1`, nem para quem não cuidou de dia nenhum. A semente é o começo, e
    não a ausência de começo — um `-1` aqui viraria `marcas[-1].x` e uma tela
    branca no primeiro dia de uso, que é o pior dia possível para isso.
  */
  confere('dia nenhum', marcaDeAgora(MARCOS, 0) === 0, 'o primeiro dia não tem marca');
  confere('dia negativo', marcaDeAgora(MARCOS, -1) === 0, 'contou para trás');

  console.log(`\n${casos} caso(s) · ${falhas} falha(s)`);
  detalhes.forEach((d) => console.log(d));
  process.exit(falhas === 0 ? 0 : 1);
})();
