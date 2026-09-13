/**
 * Confere a fala do broto no alto da tela inicial.
 *
 * ## Por que existe
 *
 * É a primeira coisa que a pessoa lê ao abrir o app, todo dia. Um texto nesse
 * lugar erra de dois jeitos, e os dois são invisíveis para o typecheck:
 *
 * 1. **Dizendo o que não é verdade** — "mais um dia e eu cresço" na véspera de
 *    nada. A fala sai de números que vêm do estado; trocar a ordem de dois
 *    `if` basta para ela passar a mentir todo dia.
 * 2. **Cobrando.** O app inteiro é construído em cima de não marcar falta (ver
 *    `docs/retencao.md`), e o lugar mais fácil de furar essa regra é
 *    justamente a frase que ninguém revisa depois de escrever.
 *
 * Então aqui se mede as duas coisas: a escolha certa em cada situação, e o
 * texto de todas as falas contra a lista de palavras que não podem aparecer.
 *
 * Uso: node scripts/testa-fala-da-home.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

(async () => {
  const saida = pastaTemporaria('fala-da-home');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'data', 'falaDaHome.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );

  const arquivos = [];
  const pilha = [saida];
  while (pilha.length) {
    const dir = pilha.pop();
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) pilha.push(p);
      else if (e.name.endsWith('.js')) arquivos.push(p);
    }
  }
  /* O Node ESM exige extensao no import; o tsc nao a escreve. */
  for (const a of arquivos) {
    let corpo = fs.readFileSync(a, 'utf8');
    corpo = corpo.replace(/from ['"](\.[^'"]*?)['"]/g, (_, r) => `from '${r}.js'`);
    fs.writeFileSync(a, corpo);
  }

  const mod = arquivos.find((a) => a.endsWith(`${path.sep}falaDaHome.js`));
  const { falaDaHome, TODAS_AS_FALAS } = await import(`file://${mod.replace(/\\/g, '/')}`);
  const saudacoes = arquivos.find((a) => a.endsWith(`${path.sep}saudacao.js`));
  const { TODAS_AS_SAUDACOES } = await import(`file://${saudacoes.replace(/\\/g, '/')}`);

  let total = 0;
  let falhas = 0;
  const checa = (nome, ok, detalhe = '') => {
    total += 1;
    if (ok) return console.log(`  ok    ${nome}`);
    falhas += 1;
    console.log(`  FALHA ${nome}${detalhe ? `\n        ${detalhe}` : ''}`);
  };

  /** Uma tarde qualquer, para a saudação não depender do relógio do teste. */
  const TARDE = new Date('2026-03-11T15:00:00');

  const base = { agora: TARDE, diasCuidados: 5, diasParaCrescer: null, fraseAberta: true };

  console.log('\na escolha certa em cada situacao:');

  checa(
    'vespera do crescimento fala do crescimento',
    falaDaHome({ ...base, diasParaCrescer: 1 }) === 'Mais um dia e eu cresço.',
  );
  checa(
    'antevespera tambem',
    falaDaHome({ ...base, diasParaCrescer: 2 }) === 'Faltam dois dias para eu crescer.',
  );
  /*
    Tres dias antes ja nao e noticia, e e o limite que separa "esta quase" de
    previsao do tempo. Sem este caso, alargar a janela para uma semana passaria
    despercebido.
  */
  checa(
    'tres dias antes nao vira contagem regressiva',
    falaDaHome({ ...base, diasParaCrescer: 3 }) !== 'Faltam dois dias para eu crescer.' &&
      !falaDaHome({ ...base, diasParaCrescer: 3 }).includes('crescer'),
  );
  checa(
    'o broto maduro nao promete crescimento nenhum',
    !falaDaHome({ ...base, diasParaCrescer: null }).includes('cresç'),
  );

  checa(
    'frase enterrada avisa que esta esperando',
    falaDaHome({ ...base, fraseAberta: false }) === 'A frase de hoje ainda está enterrada.',
  );
  checa(
    'frase ja lida nao fala dela',
    !falaDaHome({ ...base, fraseAberta: true }).includes('enterrada'),
  );
  /*
    O crescimento ganha da frase quando os dois valem. Se a ordem inverter, a
    vespera do crescimento - que acontece tres vezes por ciclo - some atras de
    um aviso que aparece todo santo dia.
  */
  checa(
    'crescimento vem antes da frase enterrada',
    falaDaHome({ ...base, diasParaCrescer: 1, fraseAberta: false }) === 'Mais um dia e eu cresço.',
  );

  checa(
    'sem nada a dizer, cai na saudacao do dia',
    TODAS_AS_SAUDACOES.includes(falaDaHome(base)),
    `veio "${falaDaHome(base)}"`,
  );

  console.log('\nestavel dentro do mesmo dia:');
  const manha = new Date('2026-03-11T09:00:00');
  const outraManha = new Date('2026-03-11T11:30:00');
  checa(
    'abrir duas vezes na mesma manha nao troca a frase',
    falaDaHome({ ...base, agora: manha }) === falaDaHome({ ...base, agora: outraManha }),
  );

  /*
    As palavras que nao podem aparecer, e o porque de cada familia.

    "Ja faz", "voce nao", "esqueceu" sao cobranca: marcam falta num app que nao
    marca falta. "Sequencia", "seguidos" e "ofensiva" sao placar. Os numeros
    escritos por extenso so passam quando sao a contagem que o proprio broto
    cumpre - por isso "dois dias" esta na lista de excecoes, e so ele.
  */
  const PROIBIDAS = [
    'já faz', 'faz tempo', 'você não', 'voce nao', 'esqueceu', 'esqueceste',
    'sequência', 'sequencia', 'seguidos', 'ofensiva', 'não perca', 'nao perca',
    'volte', 'precisa', 'deveria',
  ];
  console.log('\nnenhuma fala cobra nem faz placar:');
  for (const frase of TODAS_AS_FALAS) {
    const baixa = frase.toLowerCase();
    const achada = PROIBIDAS.find((p) => baixa.includes(p));
    checa(`"${frase}"`, !achada, achada ? `contém "${achada}"` : '');
  }

  console.log(`\n${total} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
