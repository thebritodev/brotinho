/**
 * Confere a colheita do jardim.
 *
 * O jardim existe para ser memória de fases: cada planta guarda o valor e o
 * humor que marcaram **aquele ciclo**. Se os dois vierem da vida inteira, as
 * plantas saem iguais umas às outras e o jardim deixa de contar história —
 * vira uma fileira de troféus repetidos, que é exatamente o que o comentário
 * do `derived.ts` diz querer evitar.
 *
 * Era o caso do valor: ele saía de `livedValues`, que lê o diário inteiro.
 *
 * Uso: node scripts/testa-colheita.js
 */

const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');
const DIA = 24 * 60 * 60 * 1000;

function chaveDoDia(t) {
  const x = new Date(t);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

(async () => {
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'colheita-'));
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
  const { colheita, livedValues } = await import('file://' + alvo.split(path.sep).join('/'));

  const agora = Date.now();
  const diasAtras = (n) => agora - n * DIA;

  /*
    Uma pessoa que escreveu muito sobre CONEXÃO no primeiro ciclo (amigos,
    família, conversas) e, depois de colher a primeira planta, passou a
    escrever sobre CORAGEM (medo, enfrentar). A segunda planta tem de guardar
    coragem — não conexão de novo.
  */
  const primeiraColheita = chaveDoDia(diasAtras(30));

  const dados = {
    settings: { analysis: true },
    moodHistory: [
      { date: chaveDoDia(diasAtras(40)), mood: 'triste' },
      { date: chaveDoDia(diasAtras(35)), mood: 'triste' },
      { date: chaveDoDia(diasAtras(10)), mood: 'feliz' },
      { date: chaveDoDia(diasAtras(5)), mood: 'feliz' },
    ],
    journal: [
      { id: 'a', text: 'conversei com a minha família e abracei meus amigos', createdAt: diasAtras(45) },
      { id: 'b', text: 'juntos, a família e os amigos me ajudaram muito', createdAt: diasAtras(40) },
      { id: 'c', text: 'tive coragem de enfrentar o medo, encarei aquilo', createdAt: diasAtras(9) },
      { id: 'd', text: 'de novo coragem: enfrentei o medo sem fugir', createdAt: diasAtras(4) },
    ],
    composts: [],
    practicesDone: [],
    garden: [{ id: 'p1', maturedAt: primeiraColheita, dias: 21, valor: 'conexao', mood: 'triste' }],
  };

  let falhas = 0;
  const checa = (nome, condicao, detalhe = '') => {
    const ok = Boolean(condicao);
    if (!ok) falhas += 1;
    console.log(`  ${ok ? 'ok   ' : 'FALHA'} ${nome}${ok || !detalhe ? '' : `  — ${detalhe}`}`);
  };

  const p2 = colheita(dados);

  checa('a vida inteira ainda diz conexão', livedValues(dados)[0]?.value === 'conexao',
    String(livedValues(dados)[0]?.value));
  checa('a segunda planta guarda o valor do SEU ciclo', p2.valor === 'coragem', String(p2.valor));
  checa('e o humor do seu ciclo', p2.mood === 'feliz', String(p2.mood));
  checa('não repete o valor da planta anterior', p2.valor !== dados.garden[0].valor);
  checa('o id não colide com a planta existente', p2.id !== 'p1');

  // Primeira planta: sem jardim anterior, o período é a vida toda.
  const semJardim = { ...dados, garden: [] };
  const p1 = colheita(semJardim);
  checa('a primeira planta olha a vida toda', p1.valor === 'conexao', String(p1.valor));

  // Análise desligada: o app não infere valor nenhum.
  const semAnalise = { ...dados, settings: { analysis: false } };
  checa('análise desligada não infere valor', colheita(semAnalise).valor === null,
    String(colheita(semAnalise).valor));

  // Um ciclo sem nada escrito não inventa valor.
  const semTexto = { ...dados, journal: dados.journal.slice(0, 2) };
  checa('ciclo sem texto novo não herda o valor antigo', colheita(semTexto).valor === null,
    String(colheita(semTexto).valor));

  fs.rmSync(saida, { recursive: true, force: true });
  console.log(`\n8 casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
