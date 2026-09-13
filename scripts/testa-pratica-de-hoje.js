/**
 * Confere qual prática o cartão grande da tela inicial oferece.
 *
 * ## Por que existe
 *
 * É um cartão **fixo** do carrossel, e a decisão dele tem três candidatas em
 * ordem de prioridade. Duas coisas quebram sem ninguém ver:
 *
 * 1. **A ordem.** Se "continuar" passar na frente do humor de hoje, quem marcou
 *    "ansioso" hoje recebe a mesma prática de sempre, e a única parte do cartão
 *    que sabe algo sobre o dia de hoje deixa de existir. O typecheck não tem
 *    como notar: os dois caminhos devolvem o mesmo tipo.
 * 2. **O vazio.** Se alguma ponta puder devolver nada, a fileira do carrossel
 *    fica com um buraco no meio — e só em quem ainda não fez nada, que é
 *    justamente quem não vai reclamar.
 *
 * Uso: node scripts/testa-pratica-de-hoje.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

(async () => {
  const saida = pastaTemporaria('pratica-de-hoje');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck', '--jsx', 'react-jsx',
      path.join(RAIZ, 'src', 'data', 'praticaDeHoje.ts'),
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
    corpo = corpo.replace(/from ['"](\.[^'"]*?)['"]/g, (_, r) => {
      const destino = path.resolve(path.dirname(a), r);
      const ehPasta = fs.existsSync(destino) && fs.statSync(destino).isDirectory();
      return `from '${r}${ehPasta ? '/index.js' : '.js'}'`;
    });
    fs.writeFileSync(a, corpo);
  }

  const mod = arquivos.find((a) => a.endsWith(`${path.sep}praticaDeHoje.js`));
  const { praticaDeHoje } = await import(`file://${mod.replace(/\\/g, '/')}`);

  let total = 0;
  let falhas = 0;
  const checa = (nome, ok, detalhe = '') => {
    total += 1;
    if (ok) return console.log(`  ok    ${nome}`);
    falhas += 1;
    console.log(`  FALHA ${nome}${detalhe ? `\n        ${detalhe}` : ''}`);
  };

  /** Uma tarde qualquer, para nada aqui depender do relógio. */
  const AGORA = new Date('2026-03-11T15:00:00');
  const HOJE = '2026-03-11';

  const vazio = {
    profile: {}, moodHistory: [], journal: [], composts: [], garden: [],
    practicesDone: [], conselhos: [], conselhosGuardados: [], settings: {},
  };
  /** Uma prática feita há um tempo, para o caminho "continuar". */
  const comHistorico = {
    ...vazio,
    practicesDone: [
      { topic: 'insonia', practice: 'relaxamento-progressivo', at: Date.parse('2026-03-09T21:00:00') },
      { topic: 'foco', practice: 'respiracao-foco', at: Date.parse('2026-03-10T10:00:00') },
    ],
  };

  console.log('\nquem responde, e em que ordem:');

  const estreia = praticaDeHoje(vazio, AGORA);
  checa('instalacao nova recebe a de estreia', estreia.selo === 'para começar', `veio "${estreia.selo}"`);
  checa(
    'e a de estreia e o aterramento, a mesma da saida de emergencia',
    estreia.topico === 'ansiedade' && estreia.pratica === 'aterramento-54321',
    `veio ${estreia.topico}/${estreia.pratica}`,
  );

  const continuar = praticaDeHoje(comHistorico, AGORA);
  checa('com historico e sem humor, oferece continuar', continuar.selo === 'continuar');
  checa(
    'e continuar e a ULTIMA feita, nao a primeira',
    continuar.pratica === 'respiracao-foco',
    `veio ${continuar.pratica}`,
  );

  /*
    A prioridade, que e o caso que este teste existe para travar.

    Com historico E humor pesado de hoje, o humor tem de ganhar: e a unica das
    tres candidatas que sabe alguma coisa sobre hoje. Inverter a ordem e uma
    troca de duas linhas que nao quebra nada visivel.
  */
  const comHumor = { ...comHistorico, moodHistory: [{ date: HOJE, mood: 'ansioso' }] };
  const doHumor = praticaDeHoje(comHumor, AGORA);
  checa('o humor de hoje ganha do continuar', doHumor.selo === 'para hoje', `veio "${doHumor.selo}"`);
  checa(
    'e a pratica vem do tema do humor',
    doHumor.topico === 'ansiedade',
    `veio ${doHumor.topico}`,
  );

  /* Humor que nao tem oferta cai no proximo da fila, e nao no vazio. */
  const humorLeve = { ...comHistorico, moodHistory: [{ date: HOJE, mood: 'feliz' }] };
  checa('humor sem oferta propria cai no continuar', praticaDeHoje(humorLeve, AGORA).selo === 'continuar');

  /* Humor de ONTEM nao e humor de hoje. */
  const humorDeOntem = { ...comHistorico, moodHistory: [{ date: '2026-03-10', mood: 'ansioso' }] };
  checa('humor de ontem nao decide o cartao de hoje', praticaDeHoje(humorDeOntem, AGORA).selo === 'continuar');

  /* Pratica que saiu do repertorio nao serve de oferta. */
  const historicoMorto = {
    ...vazio,
    practicesDone: [{ topic: 'insonia', practice: 'pratica-que-nao-existe-mais', at: Date.now() }],
  };
  checa(
    'historico apontando para pratica inexistente cai na estreia',
    praticaDeHoje(historicoMorto, AGORA).selo === 'para começar',
  );

  console.log('\nnunca devolve vazio:');
  for (const [nome, dados] of [
    ['instalacao nova', vazio],
    ['com historico', comHistorico],
    ['com humor', comHumor],
    ['historico quebrado', historicoMorto],
  ]) {
    const r = praticaDeHoje(dados, AGORA);
    const inteiro =
      !!r && !!r.topico && !!r.pratica && !!r.titulo && !!r.convite && !!r.selo && !!r.duracao;
    checa(nome, inteiro, inteiro ? '' : `veio ${JSON.stringify(r)}`);
  }

  console.log(`\n${total} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
