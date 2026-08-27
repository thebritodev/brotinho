/**
 * Confere o cartão "não voltou desde então".
 *
 * Este é o único lugar do app que faz uma **afirmação sobre a vida da pessoa**:
 * que uma dor específica não apareceu mais. Errar aqui não é um bug de layout —
 * é dizer a alguém que superou algo que ela ainda carrega, na tela inicial, sem
 * ela ter pedido.
 *
 * Por isso os casos são todos de risco: o mesmo assunto voltando com outras
 * palavras, voltando pelo diário em vez da composta, e o interruptor de análise
 * desligado.
 *
 * Uso: node scripts/testa-atravessou.js
 */

const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');

const DIA = 24 * 60 * 60 * 1000;
const HOJE = new Date(2026, 7, 25, 12, 0, 0);
const atras = (dias) => HOJE.getTime() - dias * DIA;

const base = (extra = {}) => ({
  profile: {}, moodHistory: [], journal: [], composts: [], garden: [],
  practicesDone: [], settings: { analysis: true }, ...extra,
});

const composta = (thought, dias) => ({ id: `c${dias}`, thought, reps: 8, secs: 60, createdAt: atras(dias) });
const registro = (text, dias) => ({ id: `j${dias}`, text, createdAt: atras(dias) });

/** [nome, dados, o que se espera: null ou trecho que deve aparecer no texto] */
const CASOS = [
  ['sem composta nenhuma', base(), null],
  [
    'composta de ontem é cedo demais',
    base({ composts: [composta('não vou dar conta do trabalho', 1)] }),
    null,
  ],
  [
    'composta de dois meses que não voltou',
    base({ composts: [composta('não vou dar conta do trabalho', 60)] }),
    'trabalho',
  ],
  [
    'voltou com as mesmas palavras',
    base({
      composts: [
        composta('não vou dar conta do trabalho', 60),
        composta('não vou dar conta do trabalho', 10),
      ],
    }),
    null,
  ],
  [
    'voltou com outras palavras — mesma dor',
    base({
      composts: [
        composta('nunca vou dar conta do trabalho', 60),
        composta('não dou conta desse trabalho', 5),
      ],
    }),
    null,
  ],
  [
    'voltou pelo diário, não pela composta',
    base({
      composts: [composta('não vou dar conta do trabalho', 60)],
      journal: [registro('hoje o trabalho me fez sentir que não dou conta', 3)],
    }),
    null,
  ],
  [
    'o diário fala de outra coisa: continua valendo',
    base({
      composts: [composta('não vou dar conta do trabalho', 60)],
      journal: [registro('almocei com a minha irmã e foi bom', 3)],
    }),
    'trabalho',
  ],
  [
    'duas atravessadas: vale a mais antiga',
    base({
      composts: [
        composta('ninguém gosta de mim mesmo', 200),
        composta('não vou dar conta do trabalho', 60),
      ],
    }),
    'ninguém',
  ],
  [
    'uma atravessou e a outra voltou: vale a que atravessou',
    base({
      composts: [
        composta('ninguém gosta de mim mesmo', 200),
        composta('não vou dar conta do trabalho', 60),
        composta('ninguém gosta de mim de verdade', 4),
      ],
    }),
    'trabalho',
  ],
  [
    'análise desligada: o app não afirma nada',
    base({
      composts: [composta('não vou dar conta do trabalho', 60)],
      settings: { analysis: false },
    }),
    null,
  ],
  [
    'texto curto demais não vira afirmação',
    base({ composts: [composta('cansei', 60)] }),
    null,
  ],
];

(async () => {
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'atravessou-'));
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  execFileSync(
    process.execPath,
    [tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--skipLibCheck', '--jsx', 'react-jsx',
      path.join(RAIZ, 'src', 'state', 'derived.ts')],
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
    fs.writeFileSync(a, corpo);
  }

  const alvo = arquivos.find((a) => a.endsWith('derived.js'));
  const { atravessou } = await import('file://' + alvo.split(path.sep).join('/'));

  let falhas = 0;
  for (const [nome, dados, esperado] of CASOS) {
    let veredito;
    try {
      const r = atravessou(dados, HOJE);
      if (esperado === null) {
        veredito = r === null ? 'ok' : `RUIM  devia calar, disse "${r.texto}"`;
      } else if (!r) {
        veredito = `RUIM  devia falar de "${esperado}" e calou`;
      } else if (!r.texto.toLowerCase().includes(esperado.toLowerCase())) {
        veredito = `RUIM  esperava "${esperado}", veio "${r.texto}"`;
      } else if (!r.quando || !r.quando.startsWith('Há')) {
        veredito = `RUIM  rótulo de tempo estranho: "${r.quando}"`;
      } else {
        veredito = 'ok';
      }
    } catch (e) {
      veredito = `LANÇOU  ${e.message}`;
    }
    if (veredito !== 'ok') falhas += 1;
    console.log(`  ${veredito === 'ok' ? 'ok   ' : 'FALHA'} ${nome.padEnd(44)} ${veredito}`);
  }

  fs.rmSync(saida, { recursive: true, force: true });
  console.log(`\n${CASOS.length} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
