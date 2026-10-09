/**
 * Confere as contas da paisagem da Composta: a frase que se desmancha e os
 * dois canteiros.
 *
 * ## Por que estas três coisas, e não o desenho
 *
 * Porque são as três que **somem em silêncio**. Um desenho errado aparece na
 * primeira vez que alguém abre a tela; uma conta errada aqui só aparece depois
 * de trinta e seis segundos de voz, ou num jardim com quinze flores — estados
 * que ninguém atinge por acaso ao conferir uma tela.
 *
 * E há um motivo mais forte: a frase que se desmancha **não é calculada em
 * tempo de execução**. A tela monta uma interpolação por letra, de quatro
 * pontos, e deixa o `Animated` correr sozinho no driver nativo. Ou seja: o que
 * a pessoa vê é a interpolação, e `passoDaLetra` é só a descrição dela. Duas
 * descrições do mesmo movimento é o arranjo clássico que diverge na primeira
 * vez que alguém mexe numa delas — este arquivo é o que amarra as duas.
 *
 * Uso: node scripts/testa-paisagem-da-composta.js
 */

const { execFileSync } = require('child_process');
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

/** Lê a interpolação de quatro pontos do mesmo jeito que o `Animated` lê. */
function interpolar(entrada, saida, t) {
  if (t <= entrada[0]) return saida[0];
  for (let i = 1; i < entrada.length; i += 1) {
    if (t <= entrada[i]) {
      const a = entrada[i - 1];
      const b = entrada[i];
      return b === a ? saida[i] : saida[i - 1] + ((saida[i] - saida[i - 1]) * (t - a)) / (b - a);
    }
  }
  return saida[saida.length - 1];
}

(async () => {
  const saida = pastaTemporaria('paisagem-da-composta');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');
  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'components', 'brand', 'planoDaPaisagem.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );
  const js = path.join(saida, 'planoDaPaisagem.js');
  const mjs = js.replace(/\.js$/, '.mjs');
  require('fs').renameSync(js, mjs);
  const plano = await import('file://' + mjs.split(path.sep).join('/'));

  const {
    canteiroDaPratica,
    curvaDaLetra,
    desfoqueDaFrase,
    jardimEspalhado,
    passoDaLetra,
    SEGUNDOS_DA_COMPOSTA,
  } = plano;

  /* ---------- 1. A frase que se desmancha ---------- */

  console.log('\n— a frase se desmanchando —\n');

  /* A frase mais longa das sugestões tem 21 letras; o teste vai bem além. */
  const LETRAS = 40;
  for (let i = 0; i < LETRAS; i += 1) {
    const c = curvaDaLetra(i);

    confere(
      `letra ${i}`,
      c.comeca >= 2 && c.comeca <= 11,
      `começa a cair na repetição ${c.comeca.toFixed(2)} — fora de [2, 11]`,
    );
    confere(
      `letra ${i}`,
      Math.abs(c.termina - c.comeca - 3) < 1e-9,
      'a queda dela não dura três repetições',
    );
    /*
      Ela cai **para baixo**, sempre.

      O deslocamento lateral e o giro são sorteados e podem ir para qualquer
      lado; a descida não. Uma letra subindo seria a frase se desmanchando para
      o céu, que é o contrário da ferramenta inteira: o pensamento vira adubo,
      e adubo cai.
    */
    confere(`letra ${i}`, c.destino.dy > 0, `cai para cima (dy ${c.destino.dy})`);
    confere(
      `letra ${i}`,
      c.destino.dy >= 120 && c.destino.dy <= 260,
      `desce ${c.destino.dy.toFixed(0)}, fora da faixa do documento`,
    );

    /* Determinística: a mesma letra tem sempre a mesma queda. */
    const outra = curvaDaLetra(i);
    confere(
      `letra ${i}`,
      outra.comeca === c.comeca && outra.destino.dx === c.destino.dx,
      'a queda dela muda de uma chamada para a outra — a frase vai tremer em vez de afundar',
    );

    /*
      E as duas descrições do movimento batem.

      `passoDaLetra` é a conta direta; a tela usa a interpolação de quatro
      pontos. Conferidas em dez instantes, incluindo os dois cotovelos.
    */
    const entrada = [0, c.comeca, c.termina, 96];
    for (const r of [0, 1, c.comeca, (c.comeca + c.termina) / 2, c.termina, 20, 50]) {
      const direto = passoDaLetra(i, r);
      const porInterpolacao = {
        dy: interpolar(entrada, [0, 0, c.destino.dy, c.destino.dy], r),
        opacidade: interpolar(entrada, [1, 1, c.destino.opacidade, c.destino.opacidade], r),
      };
      confere(
        `letra ${i} em ${r}`,
        Math.abs(direto.dy - porInterpolacao.dy) < 1e-6 &&
          Math.abs(direto.opacidade - porInterpolacao.opacidade) < 1e-6,
        `a conta direta e a interpolação discordam: ${direto.dy.toFixed(2)} vs ${porInterpolacao.dy.toFixed(2)}`,
      );
    }
  }

  /*
    Na repetição zero a frase está intacta — toda ela, letra por letra.

    Parece óbvio e não é: basta `comeca` cair abaixo de zero para uma letra
    nascer já caindo, e a frase apareceria torta no instante em que a prática
    começa.
  */
  for (let i = 0; i < LETRAS; i += 1) {
    const p = passoDaLetra(i, 0);
    confere(
      `letra ${i} no começo`,
      p.opacidade === 1 && p.dx === 0 && p.dy === 0 && p.giro === 0,
      'a letra já nasce caindo',
    );
  }

  /*
    E some inteira dentro da prática.

    A sessão termina aos 36 segundos; no modo em voz alta o aparelho conta uma
    repetição a cada vez que ouve a frase, e no manual uma a cada dois
    segundos. O pior caso é o manual: 18 repetições. A última letra tem de ter
    sumido antes disso, senão a tela do fim chega com meia frase ainda de pé.
  */
  const PIOR_CASO = Math.floor(SEGUNDOS_DA_COMPOSTA / 2);
  for (let i = 0; i < LETRAS; i += 1) {
    const p = passoDaLetra(i, PIOR_CASO);
    confere(
      `letra ${i} no fim`,
      p.opacidade <= 0.09,
      `ainda está em ${p.opacidade.toFixed(2)} depois de ${PIOR_CASO} repetições`,
    );
  }

  /* O desfoque cresce e para em 2 — nunca passa, nunca volta. */
  let anterior = -1;
  for (let r = 0; r <= 40; r += 1) {
    const d = desfoqueDaFrase(r);
    confere('desfoque', d >= anterior, `diminuiu na repetição ${r}`);
    confere('desfoque', d <= 2, `passou de 2 na repetição ${r}`);
    anterior = d;
  }

  console.log(`  ${LETRAS} letras conferidas, até ${PIOR_CASO} repetições`);

  /* ---------- 2. O canteiro das telas da prática ---------- */

  console.log('\n— o canteiro, com o broto no caminho —\n');

  /*
    As três colunas em que o broto fica, nas três telas que têm canteiro.
    Qualquer flor a menos de 34 pontos delas nasce entre os pés dele.
  */
  for (const broto of [270, 300, 150]) {
    for (const quantas of [1, 3, 5, 10, 17, 40]) {
      const flores = canteiroDaPratica(quantas, broto);
      confere(
        `canteiro de ${quantas} evitando ${broto}`,
        flores.every((f) => Math.abs(f.x - broto) > 34),
        'uma flor nasceu em cima do broto',
      );
      confere(
        `canteiro de ${quantas} evitando ${broto}`,
        flores.length <= quantas,
        'o canteiro inventou flores que não existem',
      );
      confere(
        `canteiro de ${quantas} evitando ${broto}`,
        flores.every((f) => f.escala >= 0.8 && f.escala <= 1.15),
        'uma flor saiu de escala',
      );
      /* O índice é o da criação, e é dele que sai qual flor é. */
      confere(
        `canteiro de ${quantas} evitando ${broto}`,
        flores.every((f) => Number.isInteger(f.indice) && f.indice >= 0 && f.indice < quantas),
        'uma flor ficou sem índice de criação válido',
      );
    }
  }

  /* Zero flores é um canteiro vazio, e não um erro. */
  confere('canteiro vazio', canteiroDaPratica(0, 270).length === 0, 'inventou flor do nada');
  confere('canteiro negativo', canteiroDaPratica(-3, 270).length === 0, 'contou para trás');

  /* ---------- 3. O jardim inteiro ---------- */

  console.log('\n— o jardim espalhado —\n');

  for (const quantas of [1, 6, 7, 12, 13, 25, 60]) {
    const flores = jardimEspalhado(quantas, null);
    confere(`jardim de ${quantas}`, flores.length === quantas, 'perdeu ou inventou flor');

    /*
      Duas flores nunca ocupam o mesmo lugar.

      É o que separa um canteiro de uma pilha: sem isto, a sétima flor nasce
      exatamente em cima da primeira e o jardim deixa de crescer na tela
      enquanto cresce no disco.
    */
    const lugares = new Set(flores.map((f) => `${f.x}/${f.dy}`));
    confere(
      `jardim de ${quantas}`,
      lugares.size === quantas,
      'duas flores nasceram no mesmo ponto',
    );

    /* As fileiras ímpares entram meia casa, para o jardim não virar grade. */
    flores.forEach((f, i) => {
      const fileira = Math.floor(i / 6);
      confere(
        `jardim de ${quantas}, flor ${i}`,
        f.dy === fileira * 26 - 4,
        `a fileira ${fileira} não desceu o que devia`,
      );
      const coluna = i % 6;
      confere(
        `jardim de ${quantas}, flor ${i}`,
        f.x === 36 + coluna * 64 + (fileira % 2) * 30,
        `a coluna ${coluna} da fileira ${fileira} caiu em ${f.x}, e não onde a régua manda`,
      );
      confere(`jardim de ${quantas}, flor ${i}`, f.indice === i, 'o índice de criação saiu da ordem');
    });
  }

  /* O destaque é de uma só, e só quando alguém pediu. */
  const semDestaque = jardimEspalhado(10, null);
  confere(
    'destaque',
    semDestaque.every((f) => !f.destaque),
    'uma flor acendeu sem ninguém tocar nela',
  );
  const comDestaque = jardimEspalhado(10, 4);
  confere(
    'destaque',
    comDestaque.filter((f) => f.destaque).length === 1 && comDestaque[4].destaque === true,
    'o halo acendeu na flor errada, ou em mais de uma',
  );
  confere(
    'destaque fora da conta',
    jardimEspalhado(3, 9).every((f) => !f.destaque),
    'acendeu uma flor que não existe',
  );

  console.log(`\n${casos} caso(s) · ${falhas} falha(s)`);
  detalhes.forEach((d) => console.log(d));
  process.exit(falhas === 0 ? 0 : 1);
})();
