/**
 * Confere o catálogo de espécies e as três que são oferecidas no fim do ciclo.
 *
 * ## Por que isto precisa de teste
 *
 * Porque o erro aqui é silencioso e demora vinte e um dias para aparecer.
 *
 * `escolhasApos` roda **uma vez a cada ciclo**, na tela de colheita. Se ela
 * devolver a espécie atual, a pessoa vê "escolha a próxima" com a opção de
 * continuar igual — e o mecanismo inteiro, que existe para o segundo ciclo
 * não ser o primeiro de novo, deixa de fazer o que promete. Se devolver duas
 * em vez de três, a tela fica com uma coluna vazia. Nenhum dos dois quebra
 * nada: os dois desenham, compilam e ficam na tela mentindo.
 *
 * E há a parte das cores: doze tons por espécie, escritos à mão. Faltar um
 * deixa `undefined` chegando num `fill` de SVG — que no Android não desenha e
 * não reclama.
 *
 * Uso: node scripts/testa-especies.js
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

/** Os humores do app, como `tokens` os define. */
const HUMORES = ['feliz', 'leve', 'ansioso', 'triste', 'cansado', 'neutro'];

/** Os doze tons que uma espécie precisa ter. Faltar um vira `fill` vazio. */
const TONS = [
  'contornoFolha', 'folha', 'folhaClara', 'folhaLuz', 'folhaSombra',
  'bulboLuz', 'bulboSombra', 'bulboCurva',
  'haste', 'vaso', 'vasoLuz', 'vasoSombra', 'vasoRisco',
];

const COR = /^#[0-9A-Fa-f]{6}$/;

(async () => {
  const saida = pastaTemporaria('especies');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');
  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'data', 'especies.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );
  /* O `tsc` segue o import de tipo e recria a árvore de pastas; acha o arquivo. */
  const achar = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (
    e.isDirectory() ? achar(path.join(dir, e.name)) : [path.join(dir, e.name)]
  ));
  const js = achar(saida).find((a) => a.endsWith('especies.js'));
  const mjs = js.replace(/\.js$/, '.mjs');
  fs.renameSync(js, mjs);
  const mod = await import('file://' + mjs.split(path.sep).join('/'));

  const {
    ESPECIES,
    ESPECIE_PADRAO,
    ORDEM_DAS_ESPECIES,
    QUANTAS_ESCOLHAS,
    escolhasApos,
    especieValida,
  } = mod;

  /* ---------- 1. O catálogo ---------- */

  console.log('\n— as espécies —\n');

  confere(
    'catálogo',
    ORDEM_DAS_ESPECIES.length >= QUANTAS_ESCOLHAS + 1,
    `${ORDEM_DAS_ESPECIES.length} espécies não dão para oferecer ${QUANTAS_ESCOLHAS} sem repetir a atual`,
  );
  confere('catálogo', ESPECIE_PADRAO in ESPECIES, 'a espécie padrão não está no catálogo');

  for (const chave of ORDEM_DAS_ESPECIES) {
    const e = ESPECIES[chave];
    confere(chave, !!e, 'está na ordem mas não no catálogo');
    if (!e) continue;
    confere(chave, e.chave === chave, 'a chave de dentro não bate com a de fora');
    confere(chave, !!e.nome && !!e.sobre, 'ficou sem nome ou sem a linha de descrição');

    for (const tom of TONS) {
      confere(`${chave}.${tom}`, COR.test(e.tinta[tom] ?? ''), `não é uma cor: ${e.tinta[tom]}`);
    }
    confere(`${chave}.flor`, COR.test(e.flor?.petala ?? ''), 'pétala sem cor');
    confere(`${chave}.flor`, COR.test(e.flor?.miolo ?? ''), 'miolo sem cor');
    confere(
      chave,
      e.responde === null || HUMORES.includes(e.responde),
      `responde a "${e.responde}", que não é um humor`,
    );
  }

  /*
    Duas espécies não podem ter a mesma cabeça.

    É a peça que a pessoa olha primeiro — e é por ela que as três colunas da
    tela de escolha se distinguem. Dois bulbos iguais fazem a escolha virar um
    sorteio entre duas coisas que parecem a mesma.
  */
  const cabecas = new Map();
  for (const chave of ORDEM_DAS_ESPECIES) {
    const cor = ESPECIES[chave]?.tinta.bulboLuz;
    confere(
      chave,
      !cabecas.has(cor),
      `tem a mesma cabeça de ${cabecas.get(cor)} — as duas ficam iguais na tela de escolha`,
    );
    cabecas.set(cor, chave);
  }

  /* A espécie padrão é a que já existia: ninguém muda de cor na atualização. */
  const padrao = ESPECIES[ESPECIE_PADRAO].tinta;
  confere('padrão', padrao.folha === '#6F9079', 'o verde da folha de sempre mudou');
  confere('padrão', padrao.vaso === '#C08363', 'o terracota do vaso de sempre mudou');
  confere('padrão', padrao.bulboLuz === '#C6DACB', 'a luz do bulbo de sempre mudou');

  console.log(`  ${ORDEM_DAS_ESPECIES.length} espécies, ${TONS.length} tons cada`);

  /* ---------- 2. O que é oferecido no fim do ciclo ---------- */

  console.log('\n— as três ofertas —\n');

  for (const atual of ORDEM_DAS_ESPECIES) {
    for (const humor of [...HUMORES, null]) {
      const onde = `de ${atual}, humor ${humor}`;
      const ofertas = escolhasApos(atual, humor);

      confere(onde, ofertas.length === QUANTAS_ESCOLHAS, `ofereceu ${ofertas.length}`);
      /*
        A atual nunca entra. É a regra inteira do mecanismo: se ela entrasse,
        "escolher a próxima" incluiria não mudar nada.
      */
      confere(onde, !ofertas.includes(atual), 'ofereceu a espécie que já está plantada');
      confere(onde, new Set(ofertas).size === ofertas.length, 'repetiu uma espécie');
      confere(
        onde,
        ofertas.every((k) => k in ESPECIES),
        'ofereceu uma espécie que não existe',
      );

      /* A que responde ao humor do período vem primeiro, quando existe. */
      const respondem = ORDEM_DAS_ESPECIES.filter(
        (k) => k !== atual && humor !== null && ESPECIES[k].responde === humor,
      );
      if (respondem.length) {
        confere(
          onde,
          ofertas[0] === respondem[0],
          `a primeira é ${ofertas[0]}, e quem responde a "${humor}" é ${respondem[0]}`,
        );
      }

      /* Determinística: remontar a tela não troca as opções sob o dedo. */
      const outra = escolhasApos(atual, humor);
      confere(onde, outra.join() === ofertas.join(), 'as ofertas mudaram de uma chamada para a outra');
    }
  }

  /* ---------- 3. O que chega torto do disco ---------- */

  console.log('\n— lixo no disco —\n');

  confere('inválida', especieValida('bananeira') === ESPECIE_PADRAO, 'aceitou espécie inexistente');
  confere('nula', especieValida(null) === ESPECIE_PADRAO, 'não tratou `null`');
  confere('vazia', especieValida('') === ESPECIE_PADRAO, 'não tratou o texto vazio');
  confere('válida', especieValida('lavanda') === 'lavanda', 'recusou uma espécie que existe');
  /*
    E nada de chave de protótipo: o JSON do disco não é código de confiança, e
    `'constructor' in ESPECIES` é verdadeiro em qualquer objeto.
  */
  confere(
    'protótipo',
    especieValida('constructor') === ESPECIE_PADRAO,
    'deixou uma chave de protótipo passar por espécie',
  );
  confere(
    'protótipo',
    especieValida('toString') === ESPECIE_PADRAO,
    'deixou uma chave de protótipo passar por espécie',
  );

  console.log(`\n${casos} caso(s) · ${falhas} falha(s)`);
  detalhes.forEach((d) => console.log(d));
  process.exit(falhas === 0 ? 0 : 1);
})();
