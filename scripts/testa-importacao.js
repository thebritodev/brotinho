/**
 * Confere a volta do arquivo — a única porta do app que substitui o diário.
 *
 * `sanitizarDados` devolve um `AppData` válido para **qualquer** entrada,
 * inclusive lixo. Isso é a coisa certa na leitura do disco e a coisa errada
 * aqui: passar a ele um arquivo qualquer responderia "importado" e apagaria o
 * diário da pessoa com um estado vazio. Quem impede isso é a conferência do
 * envelope, e é ela que está sob teste.
 *
 * Duas regras, e as duas contam:
 *
 * 1. **Nada que não seja do Brotinho passa.** Recusar é o comportamento certo.
 * 2. **Tudo que é do Brotinho passa.** Um teste que só recusa seria satisfeito
 *    por uma função que recusa sempre — e aí a rede continuaria com uma ponta
 *    só. Por isso o caso de ida e volta no fim: exportar e reimportar tem de
 *    devolver o mesmo diário.
 *
 * Uso: node scripts/testa-importacao.js
 */

const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');
const HOJE = '2026-08-28';

/** Um diário de verdade, do tamanho de quem usa o app há algumas semanas. */
const DIARIO = {
  profile: {
    name: 'Ana',
    valores: ['Conexão', 'Calma'],
    sleepTime: '23:30',
    reminder: '21:00',
    onboarded: true,
  },
  settings: { reminders: true, analysis: true, appLock: false },
  journal: [
    { id: '1', createdAt: 1756000000000, text: 'hoje foi mais leve do que ontem' },
    { id: '2', createdAt: 1755900000000, text: 'briga no trabalho, fiquei remoendo' },
  ],
  composts: [
    { id: 'c1', createdAt: 1755800000000, thought: 'não vou dar conta', reps: 6, secs: 40 },
  ],
  moodHistory: [
    { date: '2026-08-27', mood: 'leve' },
    { date: '2026-08-26', mood: 'ansioso' },
  ],
  garden: [{ id: 'p1', dias: 21, maturedAt: '2026-08-14', valor: 'Calma', mood: 'feliz' }],
  practicesDone: [{ topic: 'ansiedade', practice: 'respiracao-4-7-8', at: 1755700000000 }],
  startedAt: '2026-07-10',
  stageSeen: 2,
  diasCuidadosMax: 19,
};

const envelope = (extra) =>
  JSON.stringify({
    app: 'Brotinho',
    formato: 1,
    exportadoEm: '2026-08-28T14:03:00.000Z',
    dados: DIARIO,
    ...extra,
  });

/** [nome, conteúdo do arquivo, o que tem de acontecer] */
const CASOS = [
  // --- o que não pode entrar ---
  ['arquivo vazio', '', 'ilegivel'],
  ['não é JSON', 'olá, tudo bem?', 'ilegivel'],
  ['JSON truncado no meio', '{"app":"Brotinho","dados":{"jour', 'ilegivel'],
  ['JSON que é uma lista', '[1,2,3]', 'nao-e-do-brotinho'],
  ['JSON que é null', 'null', 'nao-e-do-brotinho'],
  ['JSON que é número', '42', 'nao-e-do-brotinho'],
  ['objeto sem envelope', JSON.stringify(DIARIO), 'nao-e-do-brotinho'],
  [
    'de outro app',
    JSON.stringify({ app: 'OutroDiario', formato: 1, dados: DIARIO }),
    'nao-e-do-brotinho',
  ],
  ['sem o campo dados', JSON.stringify({ app: 'Brotinho', formato: 1 }), 'nao-e-do-brotinho'],
  [
    'dados é uma lista',
    JSON.stringify({ app: 'Brotinho', formato: 1, dados: [] }),
    'nao-e-do-brotinho',
  ],
  [
    'dados é texto',
    JSON.stringify({ app: 'Brotinho', formato: 1, dados: 'x' }),
    'nao-e-do-brotinho',
  ],
  ['sem formato', JSON.stringify({ app: 'Brotinho', dados: DIARIO }), 'nao-e-do-brotinho'],
  ['formato como texto', envelope({ formato: '1' }), 'nao-e-do-brotinho'],
  [
    'formato nulo',
    JSON.stringify({ app: 'Brotinho', formato: null, dados: DIARIO }),
    'nao-e-do-brotinho',
  ],
  ['formato de uma versão futura', envelope({ formato: 2 }), 'formato-mais-novo'],

  // --- o que precisa entrar ---
  ['o arquivo do próprio app', envelope(), 'ok'],
  ['formato mais antigo', envelope({ formato: 0 }), 'ok'],
  [
    'sem exportadoEm',
    JSON.stringify({ app: 'Brotinho', formato: 1, dados: DIARIO }),
    'ok',
  ],
  ['exportadoEm não é texto', envelope({ exportadoEm: 12345 }), 'ok'],
  ['diário vazio, mas do Brotinho', JSON.stringify({ app: 'Brotinho', formato: 1, dados: {} }), 'ok'],
  [
    'dados com lixo dentro',
    JSON.stringify({
      app: 'Brotinho',
      formato: 1,
      dados: { ...DIARIO, journal: [null, 7, { text: 'sobrevivi' }], garden: 'nada disso' },
    }),
    'ok',
  ],
];

(async () => {
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'importacao-'));
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  execFileSync(
    process.execPath,
    [
      tsc,
      '--outDir',
      saida,
      '--module',
      'esnext',
      '--target',
      'es2020',
      '--moduleResolution',
      'bundler',
      '--strict',
      '--skipLibCheck',
      // `derived.ts` importa tipos de `components`, que é uma pasta de .tsx.
      // Os tipos somem na compilação, mas o tsc ainda precisa saber lê-los.
      '--jsx',
      'react-jsx',
      path.join(RAIZ, 'src', 'services', 'importarDados.ts'),
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

  for (const a of arquivos) {
    let corpo = fs.readFileSync(a, 'utf8');
    corpo = corpo.replace(/from ['"](\.[^'"]*?)['"]/g, (_, r) => {
      const destino = path.resolve(path.dirname(a), r);
      const ehPasta = fs.existsSync(destino) && fs.statSync(destino).isDirectory();
      return `from '${r}${ehPasta ? '/index.js' : '.js'}'`;
    });
    // Os três módulos nativos. Nada aqui é usado por `lerExportacao`, que é o
    // que se testa — o seletor de arquivo e o disco não existem no Node.
    corpo = corpo
      .replace(/^import \{ Platform \} from 'react-native';$/m, "const Platform = { OS: 'ios' };")
      .replace(
        /^import \* as DocumentPicker from 'expo-document-picker';$/m,
        'const DocumentPicker = {};',
      )
      .replace(/^import \{ File \} from 'expo-file-system';$/m, 'const File = class {};');
    fs.writeFileSync(a, corpo);
  }

  const alvo = arquivos.find((a) => a.endsWith('importarDados.js'));
  const { lerExportacao } = await import('file://' + alvo.split(path.sep).join('/'));

  let falhas = 0;
  const checa = (nome, fn) => {
    let veredito;
    try {
      veredito = fn() || 'ok';
    } catch (e) {
      veredito = `LANÇOU  ${e.message}`;
    }
    if (veredito !== 'ok') falhas += 1;
    console.log(`  ${veredito === 'ok' ? 'ok   ' : 'FALHA'} ${nome.padEnd(38)} ${veredito}`);
  };

  for (const [nome, conteudo, esperado] of CASOS) {
    checa(nome, () => {
      const r = lerExportacao(conteudo, HOJE);
      const obtido = r.ok ? 'ok' : r.motivo;
      if (obtido !== esperado) return `esperava ${esperado}, veio ${obtido}`;
      // Um "ok" que devolve algo inutilizável não é um ok.
      if (r.ok && (!Array.isArray(r.dados.journal) || typeof r.dados.profile !== 'object'))
        return 'passou mas devolveu dados quebrados';
      return 'ok';
    });
  }

  // --- a prova de que a rede tem as duas pontas ---
  checa('ida e volta devolve o mesmo diário', () => {
    const r = lerExportacao(envelope(), HOJE);
    if (!r.ok) return `recusou o próprio arquivo: ${r.motivo}`;
    const d = r.dados;
    const problemas = [];
    if (d.journal.length !== 2) problemas.push(`journal ${d.journal.length}`);
    if (d.journal[0]?.text !== 'hoje foi mais leve do que ontem')
      problemas.push('texto do diário mudou');
    if (d.composts.length !== 1) problemas.push(`composts ${d.composts.length}`);
    if (d.composts[0]?.thought !== 'não vou dar conta')
      problemas.push('pensamento da composta mudou');
    if (d.moodHistory.length !== 2) problemas.push(`humores ${d.moodHistory.length}`);
    if (d.garden.length !== 1) problemas.push(`jardim ${d.garden.length}`);
    if (d.practicesDone.length !== 1) problemas.push(`práticas ${d.practicesDone.length}`);
    if (d.profile.name !== 'Ana') problemas.push(`nome "${d.profile.name}"`);
    if (d.startedAt !== '2026-07-10') problemas.push(`startedAt ${d.startedAt}`);
    if (d.diasCuidadosMax !== 19) problemas.push(`piso ${d.diasCuidadosMax}`);
    return problemas.length ? problemas.join('; ') : 'ok';
  });

  checa('a data do arquivo chega para a tela mostrar', () => {
    const r = lerExportacao(envelope(), HOJE);
    if (!r.ok) return 'recusou';
    return r.exportadoEm === '2026-08-28T14:03:00.000Z' ? 'ok' : `veio ${r.exportadoEm}`;
  });

  checa('sem exportadoEm, a tela recebe null e não "undefined"', () => {
    const r = lerExportacao(JSON.stringify({ app: 'Brotinho', formato: 1, dados: DIARIO }), HOJE);
    if (!r.ok) return 'recusou';
    return r.exportadoEm === null ? 'ok' : `veio ${JSON.stringify(r.exportadoEm)}`;
  });

  checa('arquivo do Brotinho vazio não vira diário cheio', () => {
    const r = lerExportacao(JSON.stringify({ app: 'Brotinho', formato: 1, dados: {} }), HOJE);
    if (!r.ok) return 'recusou';
    // A tela mostra estes números lado a lado antes de perguntar; se eles
    // mentissem, a comparação que protege a pessoa não protegeria nada.
    return r.dados.journal.length === 0 && r.dados.composts.length === 0
      ? 'ok'
      : 'inventou registros do nada';
  });

  const total = CASOS.length + 4;
  fs.rmSync(saida, { recursive: true, force: true });
  console.log(`\n${total} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
