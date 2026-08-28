/**
 * Testa a conferência de frase da Composta.
 *
 * Cada caso aqui existe porque a versão anterior do `casaFrase.ts` errava nele.
 * As cinco regras do arquivo são sutis, e sem estes casos o raciocínio se perde
 * na primeira vez que alguém for "simplificar" o limiar.
 *
 * Não há framework de teste no projeto de propósito. Isto é um script: compila
 * o TypeScript num diretório temporário e roda os casos.
 *
 * Uso: node scripts/testa-casa-frase.js
 */

const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');
const FONTE = path.join(RAIZ, 'src', 'screens', 'composta', 'casaFrase.ts');

/** [alvo, [ [nome, o que foi dito, quantas repetições devem contar] ]] */
const GRUPOS = [
  [
    'não vou dar conta',
    [
      ['repete igual, 3 vezes', 'não vou dar conta não vou dar conta não vou dar conta', 3],
      ['reconhecedor comeu o acento', 'nao vou dar conta', 1],
      ['ordem trocada', 'dar conta não vou', 1],
      ['plural onde era singular', 'não vou dar contas', 1],
      ['duas, com ruído no meio', 'não vou dar conta hmm não vou dar conta', 2],
      ['ERRADA: outro assunto', 'vou comprar pão na padaria', 0],
      ['ERRADA: conversa solta', 'então eu falei pra ela que ia sair mais tarde', 0],
      ['ERRADA: contando números', 'um dois três quatro cinco seis', 0],
      ['ERRADA: só metade', 'não vou', 0],
    ],
  ],
  [
    'vou ser demitido',
    [
      ['repete igual, 3 vezes', 'vou ser demitido vou ser demitido vou ser demitido', 3],
      ['flexão errada do reconhecedor', 'vou ser demitida', 1],
      ['ERRADA: troca a palavra que importa', 'vou ser feliz', 0],
      ['ERRADA: só a palavra comum', 'vou vou vou vou vou', 0],
      ['ERRADA: outro assunto', 'preciso comprar leite hoje', 0],
    ],
  ],
  [
    'vai dar tudo errado',
    [
      ['repete igual, 4 vezes', 'vai dar tudo errado '.repeat(4), 4],
      ['ERRADA: o oposto, 3 de 4 palavras', 'vai dar tudo certo', 0],
      ['ERRADA: conversa', 'eu falei que ia dar certo mas ela não quis', 0],
    ],
  ],
  [
    'ninguém confia em mim',
    [
      ['repete igual, 2 vezes', 'ninguém confia em mim ninguém confia em mim', 2],
      ['sem acento', 'ninguem confia em mim', 1],
      ['ERRADA: metade', 'ninguém confia', 0],
      ['ERRADA: fala solta', 'hoje o dia tá bonito e eu vou sair', 0],
    ],
  ],
  [
    'sou fraco',
    [
      ['repete igual, 3 vezes', 'sou fraco sou fraco sou fraco', 3],
      ['ERRADA: o oposto', 'sou forte', 0],
      ['ERRADA: fala longa', 'eu sou uma pessoa que gosta de café pela manhã', 0],
    ],
  ],
];

(async () => {
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'casa-frase-'));

  // O binário do TypeScript direto, sem passar pelo npx: no Windows o
  // `spawnSync` de um `.cmd` falha com EINVAL desde as versões recentes do Node.
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');
  execFileSync(
    process.execPath,
    [tsc, FONTE, '--outDir', saida, '--module', 'esnext', '--target', 'es2020', '--strict', '--skipLibCheck'],
    { stdio: 'inherit', cwd: RAIZ },
  );

  const compilado = path.join(saida, 'casaFrase.js');
  const comoModulo = path.join(saida, 'casaFrase.mjs');
  fs.renameSync(compilado, comoModulo);

  const { criarConferidor, palavrasDoAlvo } = await import(
    'file://' + comoModulo.split(path.sep).join('/')
  );

  let total = 0;
  let falhas = 0;

  for (const [alvo, casos] of GRUPOS) {
    const modelo = criarConferidor(alvo);
    console.log(
      `\n"${alvo}"  ·  procura ${JSON.stringify(palavrasDoAlvo(alvo))}` +
        `  ·  mínimo ${modelo.minimo}  ·  chave "${modelo.chave}"`,
    );

    for (const [nome, dito, esperado] of casos) {
      total += 1;
      const contou = criarConferidor(alvo).conferir(dito);
      const ok = contou === esperado;
      if (!ok) falhas += 1;
      console.log(
        `  ${(ok ? 'ok' : 'FALHA').padEnd(5)} ${nome.padEnd(34)} contou ${String(contou).padStart(2)} · esperado ${esperado}`,
      );
    }
  }

  fs.rmSync(saida, { recursive: true, force: true });

  console.log(`\n${total} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
