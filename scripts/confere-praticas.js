/**
 * Confere a integridade dos textos das práticas.
 *
 * São 31 práticas escritas à mão, e nada no TypeScript impede que duas tenham
 * a mesma chave, que um passo fique com o texto vazio, ou que um guia de
 * respiração some para zero segundo. Erros assim não quebram o app: eles
 * aparecem como uma tela em branco no meio de um exercício de ansiedade.
 *
 * A chave importa mais do que parece: `practicesDone` grava `topic/practice`
 * como identificador do que a pessoa fez, e o resumo para a terapia lê de
 * volta por ali. Chave repetida embaralha o histórico de alguém.
 *
 * Uso: node scripts/confere-praticas.js
 */

const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');

(async () => {
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'praticas-'));
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  // O arquivo importa tipos e cores; `isolatedModules` não serve porque
  // precisamos do valor. Compilar só ele, com os imports resolvidos, é o
  // caminho mais curto para ler o dado de verdade em vez de por regex.
  execFileSync(
    process.execPath,
    [tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck', '--jsx', 'react-jsx',
      path.join(RAIZ, 'src', 'data', 'practices.ts')],
    { stdio: 'inherit', cwd: RAIZ },
  );

  const achar = (nome) => {
    const pilha = [saida];
    while (pilha.length) {
      const dir = pilha.pop();
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) pilha.push(p);
        else if (e.name === nome) return p;
      }
    }
    throw new Error(`não achei ${nome}`);
  };

  // Dá extensão aos imports relativos, para o Node resolver os arquivos gerados.
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
  // `../theme` é uma pasta com index — vira `../theme/index.js`, não `../theme.js`.
  for (const a of arquivos) {
    let corpo = fs.readFileSync(a, 'utf8');
    corpo = corpo.replace(/from ['"](\.[^'"]*?)['"]/g, (_, r) => {
      const destino = path.resolve(path.dirname(a), r);
      const ehPasta = fs.existsSync(destino) && fs.statSync(destino).isDirectory();
      return `from '${r}${ehPasta ? '/index.js' : '.js'}'`;
    });
    fs.writeFileSync(a, corpo);
  }

  const alvo = achar('practices.js');
  const { PRACTICE_TOPICS } = await import('file://' + alvo.split(path.sep).join('/'));

  const problemas = [];
  const erro = (onde, o_que) => problemas.push(`${onde}: ${o_que}`);
  const texto = (v) => typeof v === 'string' && v.trim().length > 0;

  const chavesDeTema = new Set();
  let total = 0;

  for (const tema of PRACTICE_TOPICS) {
    const t = tema.key || '(sem chave)';
    if (!texto(tema.key)) erro(t, 'tema sem chave');
    if (chavesDeTema.has(tema.key)) erro(t, 'chave de tema repetida');
    chavesDeTema.add(tema.key);
    for (const campo of ['title', 'icon', 'tint', 'intro']) {
      if (!texto(tema[campo])) erro(t, `tema sem ${campo}`);
    }
    if (!Array.isArray(tema.practices) || !tema.practices.length) {
      erro(t, 'tema sem práticas');
      continue;
    }

    const chavesDePratica = new Set();
    for (const p of tema.practices) {
      total += 1;
      const onde = `${t}/${p.key || '(sem chave)'}`;
      if (!texto(p.key)) erro(onde, 'prática sem chave');
      if (chavesDePratica.has(p.key)) erro(onde, 'chave de prática repetida dentro do tema');
      chavesDePratica.add(p.key);

      for (const campo of ['title', 'duration', 'summary', 'illustration', 'why']) {
        if (!texto(p[campo])) erro(onde, `sem ${campo}`);
      }
      if (!Array.isArray(p.steps) || !p.steps.length) erro(onde, 'sem passos');
      else
        p.steps.forEach((s, i) => {
          if (!texto(s.title)) erro(onde, `passo ${i + 1} sem título`);
          if (!texto(s.text)) erro(onde, `passo ${i + 1} sem texto`);
        });

      if (!p.guide) continue;

      if (p.guide.kind === 'breathing') {
        const fases = p.guide.phases;
        if (!Array.isArray(fases) || !fases.length) erro(onde, 'guia de respiração sem fases');
        else
          fases.forEach((f, i) => {
            if (!texto(f.label)) erro(onde, `fase ${i + 1} sem rótulo`);
            if (!(f.seconds > 0)) erro(onde, `fase ${i + 1} com ${f.seconds}s — o guia travaria aqui`);
            if (!['in', 'hold', 'out'].includes(f.motion)) erro(onde, `fase ${i + 1} com motion inválido`);
          });
        if (!(p.guide.cycles > 0)) erro(onde, 'guia de respiração com zero ciclos');
      } else if (p.guide.kind === 'steps') {
        const passos = p.guide.steps;
        if (!Array.isArray(passos) || !passos.length) erro(onde, 'guia sem passos');
        else
          passos.forEach((s, i) => {
            if (!texto(s.label)) erro(onde, `guia, passo ${i + 1} sem rótulo`);
            if (!texto(s.text)) erro(onde, `guia, passo ${i + 1} sem texto`);
            if (!(s.seconds > 0)) erro(onde, `guia, passo ${i + 1} com ${s.seconds}s`);
          });
      } else {
        erro(onde, `tipo de guia desconhecido: ${p.guide.kind}`);
      }
    }
  }

  fs.rmSync(saida, { recursive: true, force: true });

  console.log(`${PRACTICE_TOPICS.length} temas · ${total} práticas`);
  if (!problemas.length) {
    console.log('Nenhum problema.');
    process.exit(0);
  }
  console.log(`\n${problemas.length} problema(s):`);
  for (const p of problemas) console.log(`  · ${p}`);
  process.exit(1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
