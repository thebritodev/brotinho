/**
 * Confere o que o broto responde depois que a pessoa escreve.
 *
 * Três regras aqui não são estilo, e as três somem sem um guarda:
 *
 * 1. **Só fato verificável.** Contar quantas vezes um assunto voltou é
 *    conferível no aparelho da pessoa. Dizer o que ela sente não é — e é o tipo
 *    de afirmação que a diretriz 1.4.1 da Apple desaconselha de um app sem
 *    profissional a bordo.
 * 2. **Nunca a notícia ruim.** O app tem como saber que o dia seguinte foi
 *    pior, e não diz. Sem este teste, a próxima frase entra sem esse cuidado:
 *    a versão negativa é sempre a mais fácil de escrever.
 * 3. **Calar é resposta válida.** Sem nada específico, silêncio. Frase genérica
 *    depois de um desabafo denuncia que ninguém prestou atenção.
 *
 * E o interruptor de análise continua governando toda leitura de texto.
 *
 * Uso: node scripts/testa-resposta.js
 */

const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');

const falhas = [];
const linhas = [];

function confere(nome, ok, detalhe) {
  linhas.push(`  ${ok ? 'ok  ' : 'FALHA'}  ${nome}${detalhe ? `   ${detalhe}` : ''}`);
  if (!ok) falhas.push(nome);
}

function compila(arquivos, saida) {
  execFileSync(
    process.execPath,
    [
      path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc'),
      '--outDir', saida, '--rootDir', path.join(RAIZ, 'src'),
      '--module', 'commonjs', '--moduleResolution', 'node',
      '--target', 'es2020', '--lib', 'DOM,ESNext',
      '--strict', '--esModuleInterop', '--skipLibCheck',
      '--allowJs', '--resolveJsonModule', '--jsx', 'react-native',
      ...arquivos.map((a) => path.join(RAIZ, a)),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );
}

const DIA = 24 * 60 * 60 * 1000;
const HOJE = new Date('2026-08-31T20:00:00');

const chave = (d) => {
  const x = new Date(d);
  const mes = String(x.getMonth() + 1).padStart(2, '0');
  const dia = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${mes}-${dia}`;
};

function main() {
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'brotinho-resposta-'));
  compila(
    [path.join('src', 'data', 'resposta.ts'), path.join('src', 'state', 'sanitize.ts')],
    saida,
  );
  const { respostaAoRegistro } = require(path.join(saida, 'data', 'resposta.js'));
  const { sanitizarDados } = require(path.join(saida, 'state', 'sanitize.js'));

  const base = (extra) =>
    sanitizarDados(Object.assign({ app: 'brotinho', settings: { analysis: true } }, extra));

  // --- 1. o assunto que volta ---------------------------------------------
  const doTrabalho = [
    { id: '1', createdAt: HOJE.getTime() - 10 * DIA, text: 'o trabalho me consumindo de novo' },
    { id: '2', createdAt: HOJE.getTime() - 5 * DIA, text: 'de novo o trabalho consumindo tudo' },
  ];
  const assunto = base({ journal: doTrabalho });
  const r1 = respostaAoRegistro({
    data: assunto,
    texto: 'o trabalho consumindo de novo',
    agora: HOJE,
  });
  confere('o assunto que volta vira frase', !!r1 && r1.includes('3 vezes'), r1 || 'silêncio');

  const umaVez = base({ journal: [doTrabalho[0]] });
  const r2 = respostaAoRegistro({
    data: umaVez,
    texto: 'o trabalho consumindo tudo',
    agora: HOJE,
  });
  confere('uma repetição só não vira frase', r2 === null, r2 || 'silêncio');

  const semAnalise = base({ settings: { analysis: false }, journal: doTrabalho });
  const r3 = respostaAoRegistro({
    data: semAnalise,
    texto: 'o trabalho consumindo de novo',
    agora: HOJE,
  });
  confere('desligar a análise cala a frase de assunto', !r3 || !r3.includes('vezes'), r3 || 'silêncio');

  // --- 2. o dia seguinte, e só quando alivia ------------------------------
  const antes = new Date(HOJE.getTime() - 8 * DIA);
  const depois = new Date(HOJE.getTime() - 7 * DIA);
  const escreveuAntes = [{ id: '1', createdAt: antes.getTime(), text: 'dia muito pesado hoje' }];

  const aliviou = base({
    journal: escreveuAntes,
    moodHistory: [
      { date: chave(HOJE), mood: 'ansioso' },
      { date: chave(antes), mood: 'ansioso' },
      { date: chave(depois), mood: 'leve' },
    ],
  });
  const r4 = respostaAoRegistro({ data: aliviou, texto: 'hoje foi dificil', agora: HOJE });
  confere('o alívio do dia seguinte vira frase', !!r4 && r4.includes('Leve'), r4 || 'silêncio');

  const piorou = base({
    journal: escreveuAntes,
    moodHistory: [
      { date: chave(HOJE), mood: 'ansioso' },
      { date: chave(antes), mood: 'ansioso' },
      { date: chave(depois), mood: 'triste' },
    ],
  });
  const r5 = respostaAoRegistro({ data: piorou, texto: 'hoje foi dificil', agora: HOJE });
  confere('o dia seguinte pior NAO vira frase', r5 === null, r5 || 'silêncio');

  // --- 3. o silêncio como resposta ----------------------------------------
  const semNada = base({
    journal: [
      { id: '1', createdAt: HOJE.getTime() - 9 * DIA, text: 'fui ao mercado e voltei cedo' },
      { id: '2', createdAt: HOJE.getTime() - 3 * DIA, text: 'assisti um filme muito bom' },
    ],
    moodHistory: [{ date: chave(HOJE), mood: 'leve' }],
  });
  const r6 = respostaAoRegistro({ data: semNada, texto: 'conversei com minha irma', agora: HOJE });
  confere('sem nada específico, silêncio', r6 === null, r6 || 'silêncio');

  // --- 4. o primeiro registro, uma vez só ---------------------------------
  const primeiro = base({
    journal: [{ id: '1', createdAt: HOJE.getTime(), text: 'primeira vez escrevendo aqui' }],
  });
  const r7 = respostaAoRegistro({
    data: primeiro,
    texto: 'primeira vez escrevendo aqui',
    id: '1',
    agora: HOJE,
  });
  confere('o primeiro registro é recebido', !!r7 && r7.includes('Primeiro registro'), r7 || 'silêncio');

  const segundo = base({
    journal: [
      { id: '1', createdAt: HOJE.getTime() - DIA, text: 'primeira vez escrevendo aqui' },
      { id: '2', createdAt: HOJE.getTime(), text: 'outra coisa qualquer de hoje' },
    ],
  });
  const r8 = respostaAoRegistro({
    data: segundo,
    texto: 'outra coisa qualquer de hoje',
    id: '2',
    agora: HOJE,
  });
  confere('a boas-vindas não se repete', !r8 || !r8.includes('Primeiro registro'), r8 || 'silêncio');

  // --- 5. nada de interpretar sentimento ----------------------------------
  const PROIBIDAS = ['você parece', 'você está se sentindo', 'entendo', 'sinto muito', 'deve ser'];
  const ditas = [r1, r4, r7].filter(Boolean);
  const interpretam = ditas.filter((f) => PROIBIDAS.some((p) => f.toLowerCase().includes(p)));
  confere(
    'nenhuma frase interpreta o que a pessoa sente',
    interpretam.length === 0,
    interpretam.join(' · ') || `${ditas.length} frases conferidas`,
  );

  // --- 6. o registro não conta como repetição de si mesmo -----------------
  const soEle = base({
    journal: [{ id: '9', createdAt: HOJE.getTime(), text: 'o trabalho me consumindo de novo' }],
  });
  const r9 = respostaAoRegistro({
    data: soEle,
    texto: 'o trabalho me consumindo de novo',
    id: '9',
    agora: HOJE,
  });
  confere('o próprio registro não conta como repetição', !r9 || !r9.includes('vezes'), r9 || 'silêncio');
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}

for (const l of linhas) console.log(l);
console.log('');
if (falhas.length) {
  console.log(`${falhas.length} falha(s) na resposta do broto.`);
  process.exit(1);
}
console.log(`${linhas.length} conferências · o broto responde sem inventar.`);
