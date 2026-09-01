/**
 * Confere o arco da primeira semana.
 *
 * O cartão "Seu broto percebeu" só fala com cinco registros, então ele fica
 * vazio exatamente na semana em que apps desta categoria perdem mais de 90%
 * das pessoas. `proximoPasso` ocupa esse espaço até haver padrão de verdade.
 *
 * Quatro regras que somem sem um guarda:
 *
 * 1. **Perde para os padrões.** Uma observação sobre a própria pessoa vale
 *    mais que uma apresentação do app, sempre.
 * 2. **Não conta dias seguidos, e não marca falta.** Quem some por duas
 *    semanas e volta continua de onde parou. O motivo clínico de o app não ter
 *    ofensiva nem placar está em `docs/retencao.md`.
 * 3. **Um de cada vez.** Nunca duas apresentações na mesma tela.
 * 4. **Tem hora de calar.** Passados catorze dias de uso, o app para de se
 *    explicar — senão vira o balão de dica que ninguém desliga.
 *
 * Uso: node scripts/testa-primeira-semana.js
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
const chave = (d) => {
  const x = new Date(d);
  const mes = String(x.getMonth() + 1).padStart(2, '0');
  const dia = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${mes}-${dia}`;
};
const atras = (n) => chave(Date.now() - n * DIA);

function main() {
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'brotinho-semana-'));
  compila(
    [path.join('src', 'data', 'primeiraSemana.ts'), path.join('src', 'state', 'sanitize.ts')],
    saida,
  );
  const { proximoPasso } = require(path.join(saida, 'data', 'primeiraSemana.js'));
  const { sanitizarDados } = require(path.join(saida, 'state', 'sanitize.js'));

  const base = (extra) =>
    sanitizarDados(Object.assign({ app: 'brotinho', settings: { analysis: true } }, extra));

  // --- a ordem: do centro para a periferia --------------------------------
  const recemChegado = base({ moodHistory: [{ date: atras(0), mood: 'leve' }] });
  const p1 = proximoPasso(recemChegado);
  confere('quem nunca escreveu ouve do diário', !!p1 && p1.frase.includes('diário'), p1 && p1.frase);
  confere('e a promessa vem junto', !!p1 && p1.frase.includes('não sai deste aparelho'));

  const jaEscreveu = base({
    moodHistory: [{ date: atras(0), mood: 'leve' }],
    journal: [{ id: '1', createdAt: Date.now() - DIA, text: 'escrevi alguma coisa' }],
  });
  const p2 = proximoPasso(jaEscreveu);
  confere(
    'quem já escreveu ouve das práticas',
    !!p2 && p2.frase.includes('exercícios') && p2.destino === 'praticas',
    p2 && p2.frase,
  );

  const jaPraticou = base({
    moodHistory: [
      { date: atras(0), mood: 'leve' },
      { date: atras(1), mood: 'ansioso' },
    ],
    journal: [{ id: '1', createdAt: Date.now() - DIA, text: 'escrevi alguma coisa' }],
    practicesDone: [{ topic: 'ansiedade', practice: 'Respiração 4-7-8', at: Date.now() - DIA }],
  });
  const p3 = proximoPasso(jaPraticou);
  confere(
    'depois vem a palavra do humor',
    !!p3 && p3.frase.includes('palavras mais exatas'),
    p3 && p3.frase,
  );

  // Quem já escolheu palavra não ouve sobre ela.
  const comPalavra = base({
    moodHistory: [
      { date: atras(0), mood: 'ansioso', palavra: 'aflição' },
      { date: atras(1), mood: 'ansioso' },
      { date: atras(2), mood: 'triste' },
      { date: atras(3), mood: 'leve' },
    ],
    journal: [{ id: '1', createdAt: Date.now() - DIA, text: 'escrevi alguma coisa' }],
    practicesDone: [{ topic: 'ansiedade', practice: 'Respiração 4-7-8', at: Date.now() - DIA }],
  });
  const p4 = proximoPasso(comPalavra);
  confere(
    'quem já escolheu palavra ouve do jardim',
    !!p4 && p4.frase.includes('jardim') && p4.destino === 'jardim',
    p4 && p4.frase,
  );

  // --- um de cada vez ------------------------------------------------------
  confere(
    'nunca devolve mais de um passo',
    [p1, p2, p3, p4].every((p) => !p || typeof p.frase === 'string'),
  );

  // --- a palavra não é oferecida cedo demais ------------------------------
  const primeiroDia = base({
    moodHistory: [{ date: atras(0), mood: 'ansioso' }],
    journal: [{ id: '1', createdAt: Date.now(), text: 'escrevi alguma coisa' }],
    practicesDone: [{ topic: 'ansiedade', practice: 'Respiração 4-7-8', at: Date.now() }],
  });
  const p5 = proximoPasso(primeiroDia);
  confere(
    'com um humor só, a palavra ainda não é oferecida',
    !p5 || !p5.frase.includes('palavras mais exatas'),
    (p5 && p5.frase) || 'silêncio',
  );

  // --- tem hora de calar ---------------------------------------------------
  const veterano = base({
    moodHistory: Array.from({ length: 20 }).map((_, i) => ({ date: atras(i), mood: 'leve' })),
  });
  confere('passados catorze dias, silêncio', proximoPasso(veterano) === null);

  // --- ausência não zera nem pune -----------------------------------------
  const sumiuEVoltou = base({
    moodHistory: [
      { date: atras(0), mood: 'leve' },
      { date: atras(20), mood: 'leve' },
    ],
    journal: [{ id: '1', createdAt: Date.now() - 20 * DIA, text: 'escrevi ha tempos' }],
  });
  const p6 = proximoPasso(sumiuEVoltou);
  confere(
    'quem sumiu e voltou continua de onde parou',
    !!p6 && p6.frase.includes('exercícios'),
    (p6 && p6.frase) || 'silêncio',
  );

  // --- nenhuma frase cobra, marca falta ou conta dias seguidos ------------
  const PROIBIDAS = ['você não', 'faltou', 'perdeu', 'sequência', 'seguidos', 'ofensiva', 'volte'];
  const todas = [p1, p2, p3, p4, p6].filter(Boolean).map((p) => p.frase);
  const cobram = todas.filter((f) => PROIBIDAS.some((t) => f.toLowerCase().includes(t)));
  confere(
    'nenhuma frase cobra ou marca falta',
    cobram.length === 0,
    cobram.join(' · ') || `${todas.length} frases conferidas`,
  );

  // --- o destino é sempre uma tela que a Home consegue abrir --------------
  const DESTINOS = ['praticas', 'jardim', null];
  confere(
    'todo destino é abrível pela tela inicial',
    [p1, p2, p3, p4, p6].filter(Boolean).every((p) => DESTINOS.includes(p.destino)),
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
  console.log(`${falhas.length} falha(s) no arco da primeira semana.`);
  process.exit(1);
}
console.log(`${linhas.length} conferências · a primeira semana tem o que mostrar.`);
