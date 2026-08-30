/**
 * Confere as palavras de humor e os padrões que saem delas.
 *
 * Duas coisas aqui são decisões, não gosto, e as duas somem sem um guarda.
 *
 * **A palavra é substantivo.** Em português quase todo adjetivo concorda em
 * gênero, e uma lista de adjetivos obrigaria a escolher entre "ansioso" e
 * "ansiosa" — entre errar com metade das pessoas e perguntar o gênero de
 * alguém que só queria dizer como está. Foi exatamente esse o defeito que a
 * frase do padrão tinha. A próxima palavra a entrar na lista vem de quem
 * estiver com pressa, e adjetivo é o que vem à cabeça primeiro.
 *
 * **Nenhuma palavra aparece em dois humores.** `patterns` cita a palavra
 * sozinha — *a palavra que mais voltou foi "aflição"* —, e uma palavra que
 * pertencesse a dois humores tornaria a frase sem sentido.
 *
 * Confere também que nenhuma frase de padrão traz chave crua de volta, que é
 * como o defeito original aparecia na tela.
 *
 * Uso: node scripts/confere-humores.js
 */

const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');

/**
 * As terminações que denunciam adjetivo em português.
 *
 * Não é lista de palavras proibidas, é lista de **formas**: o que muda com o
 * gênero de quem fala. `-ão`/`-ã` fica de fora porque quase todo substantivo
 * bom desta lista termina assim — aflição, apreensão, exaustão, decepção.
 */
const FORMAS_DE_ADJETIVO = /(oso|osa|ado|ada|ido|ida|ico|ica|ivo|iva|ento|enta)$/;

const falhas = [];
const linhas = [];

function confere(nome, ok, detalhe) {
  linhas.push(`  ${ok ? 'ok  ' : 'FALHA'}  ${nome}${detalhe ? `   ${detalhe}` : ''}`);
  if (!ok) falhas.push(nome);
}

/**
 * Compila para CommonJS, e não para ESM como `confere-contraste.js`.
 *
 * Aquele script carrega `tokens.ts`, que não importa ninguém. Aqui são três
 * módulos que se importam entre si, e o TypeScript emite o caminho como está
 * escrito — `'../data/humores'`, sem extensão. O ESM do Node exige a extensão
 * e recusa; o CommonJS resolve, que é justamente o que os bundlers fazem.
 *
 * O resto das opções é o `tsconfig` do projeto repetido à mão — `strict`,
 * `esModuleInterop`, `jsx` do React Native. A lição é de um teste anterior,
 * que compilava sem `--strict` e por isso não estava testando este projeto,
 * e sim um parecido. Só muda o que emitir para CommonJS exige.
 */
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

function main() {
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'brotinho-humores-'));
  compila(
    [path.join('src', 'data', 'humores.ts'), path.join('src', 'state', 'derived.ts'), path.join('src', 'state', 'sanitize.ts')],
    saida,
  );
  const humores = require(path.join(saida, 'data', 'humores.js'));
  const derived = require(path.join(saida, 'state', 'derived.js'));
  const sanitize = require(path.join(saida, 'state', 'sanitize.js'));

  const { PALAVRAS_DO_HUMOR, ROTULO_DO_HUMOR } = humores;
  const chaves = Object.keys(PALAVRAS_DO_HUMOR);

  // --- as formas ---------------------------------------------------------
  const adjetivos = [];
  const vistas = new Map();
  const repetidas = [];
  for (const mood of chaves) {
    for (const p of PALAVRAS_DO_HUMOR[mood]) {
      if (FORMAS_DE_ADJETIVO.test(p)) adjetivos.push(`${p} (${mood})`);
      if (vistas.has(p)) repetidas.push(`${p}: ${vistas.get(p)} e ${mood}`);
      else vistas.set(p, mood);
    }
  }
  confere(
    'toda palavra é substantivo, não adjetivo',
    adjetivos.length === 0,
    adjetivos.length ? adjetivos.join(', ') : `${vistas.size} palavras`,
  );
  confere(
    'nenhuma palavra pertence a dois humores',
    repetidas.length === 0,
    repetidas.join(' · '),
  );

  const semPalavras = chaves.filter((m) => !PALAVRAS_DO_HUMOR[m] || PALAVRAS_DO_HUMOR[m].length < 3);
  confere('todo humor escolhível tem ao menos três palavras', semPalavras.length === 0, semPalavras.join(', '));

  // --- a palavra é conferida contra o humor dela -------------------------
  confere('a palavra certa do humor certo passa', humores.palavraValida('ansioso', 'aflição'));
  confere('a palavra de outro humor não passa', !humores.palavraValida('feliz', 'aflição'));
  confere('palavra inventada não passa', !humores.palavraValida('ansioso', 'jamanta'));

  const sujo = {
    app: 'brotinho',
    moodHistory: [
      { date: '2026-08-01', mood: 'ansioso', palavra: 'aflição' },
      { date: '2026-08-02', mood: 'feliz', palavra: 'aflição' },
      { date: '2026-08-03', mood: 'triste', palavra: 42 },
    ],
  };
  const limpo = sanitize.sanitizarDados(sujo);
  const h = limpo.moodHistory;
  confere('os três dias sobrevivem à limpeza', h.length === 3, `${h.length} de 3`);
  confere('a palavra válida é guardada', h.find((m) => m.date === '2026-08-01')?.palavra === 'aflição');
  confere(
    'a palavra do humor errado é descartada, e o dia fica',
    h.find((m) => m.date === '2026-08-02')?.palavra === undefined,
  );
  confere(
    'palavra que não é texto é descartada',
    h.find((m) => m.date === '2026-08-03')?.palavra === undefined,
  );

  // --- os padrões --------------------------------------------------------
  const base = sanitize.sanitizarDados({
    app: 'brotinho',
    settings: { analysis: true },
    journal: [
      { id: '1', createdAt: Date.now(), text: 'hoje foi pesado no trabalho, muito trabalho' },
      { id: '2', createdAt: Date.now(), text: 'de novo o trabalho me consumindo' },
      { id: '3', createdAt: Date.now(), text: 'trabalho, sempre o trabalho' },
      { id: '4', createdAt: Date.now(), text: 'consegui descansar um pouco do trabalho' },
    ],
    moodHistory: [
      { date: '2026-08-24', mood: 'ansioso', palavra: 'aflição' },
      { date: '2026-08-25', mood: 'ansioso', palavra: 'aflição' },
      { date: '2026-08-26', mood: 'ansioso', palavra: 'aflição' },
      { date: '2026-08-27', mood: 'triste', palavra: 'solidão' },
      { date: '2026-08-28', mood: 'leve' },
    ],
    practicesDone: [
      { topic: 'ansiedade', practice: 'Respiração 4-7-8', at: 1 },
      { topic: 'ansiedade', practice: 'Respiração 4-7-8', at: 2 },
      { topic: 'ansiedade', practice: 'Respiração 4-7-8', at: 3 },
    ],
  });

  const frases = derived.patterns(base);
  confere('há padrões com base suficiente', frases.length > 0, `${frases.length} frases`);

  const rotulos = Object.values(ROTULO_DO_HUMOR);
  const comChaveCrua = frases.filter((f) =>
    chaves.some((k) => f.includes(`"${k}"`) && !rotulos.includes(k)),
  );
  confere(
    'nenhuma frase mostra a chave crua do humor',
    comChaveCrua.length === 0,
    comChaveCrua.join(' · '),
  );

  confere(
    'a frase do humor predominante usa o rótulo',
    frases.some((f) => f.includes('você marcou "Ansioso"')),
    frases.find((f) => f.includes('marcou')) || 'nenhuma',
  );
  confere(
    'a palavra que mais voltou vira frase',
    frases.some((f) => f.includes('"aflição"')),
    frases.find((f) => f.includes('aflição')) || 'nenhuma',
  );
  confere(
    'a prática repetida vira frase',
    frases.some((f) => f.includes('Respiração 4-7-8')),
    frases.find((f) => f.includes('Respiração')) || 'nenhuma',
  );

  // O interruptor de análise governa o que lê texto, e só isso.
  const semAnalise = { ...base, settings: { ...base.settings, analysis: false } };
  const comAnalise = derived.patterns(base).length;
  const fechado = derived.patterns(semAnalise).length;
  confere(
    'desligar a análise tira as frases que leem o diário',
    fechado < comAnalise,
    `${comAnalise} com análise, ${fechado} sem`,
  );

  // A rotação é estável no dia e muda no dia seguinte.
  const hoje = derived.padraoDoDia(base, new Date('2026-08-30T10:00:00'));
  const maisTarde = derived.padraoDoDia(base, new Date('2026-08-30T23:00:00'));
  const amanha = derived.padraoDoDia(base, new Date('2026-08-31T10:00:00'));
  confere('o padrão do dia não muda durante o dia', hoje === maisTarde, String(hoje));
  confere('o padrão do dia muda no dia seguinte', hoje !== amanha, `${hoje} → ${amanha}`);
  confere(
    'sem base, não há padrão do dia',
    derived.padraoDoDia(sanitize.sanitizarDados({ app: 'brotinho' })) === null,
  );
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
  console.log(`${falhas.length} falha(s) nas palavras de humor.`);
  process.exit(1);
}
console.log(`${linhas.length} conferências · as palavras e os padrões estão de pé.`);
