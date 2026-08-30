/**
 * Joga lixo no `sanitizarDados` e confere que ele não estoura.
 *
 * Esta é a camada que separa "perdi uma preferência" de "o app não abre mais".
 * Ela roda no carregamento, dentro de uma promessa de hidratação: se lançar,
 * a tela fica **branca para sempre**, sem mensagem e sem saída, e a pessoa
 * conclui que perdeu o diário inteiro.
 *
 * Os casos aqui são os que acontecem de verdade: gravação interrompida no meio,
 * backup restaurado de uma versão antiga do app, campo que mudou de tipo entre
 * versões, e o disco devolvendo algo que não é nem objeto.
 *
 * A regra que se testa é uma só: **nunca lançar, e sempre devolver algo
 * utilizável.**
 *
 * Uso: node scripts/testa-sanitize.js
 */

const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');
const HOJE = '2026-08-23';

/** [nome, o que veio do disco] */
const CASOS = [
  ['nada', undefined],
  ['nulo', null],
  ['texto solto', 'não sou nem objeto'],
  ['número', 42],
  ['lista no lugar do objeto', [1, 2, 3]],
  ['objeto vazio', {}],
  ['JSON truncado (perfil pela metade)', { profile: { name: 'Ana' } }],

  ['tentou virou texto', { profile: { tentou: 'terapia' } }],
  ['tentou virou número', { profile: { tentou: 99 } }],
  ['valores com lixo dentro', { profile: { valores: ['conexao', 5, null, 'saude'] } }],
  ['hora fora do intervalo', { profile: { sleepTime: '99:99', reminder: '-1:70' } }],
  ['hora sem formato', { profile: { sleepTime: 'de noite' } }],

  ['humores com entradas quebradas', { moodHistory: [{ date: 1, mood: 'feliz' }, null, 'x', { date: '2026-01-01', mood: 'inventado' }] }],
  ['diário com item sem texto', { journal: [{ id: 'a' }, { text: 'ok', createdAt: 'ontem' }, 7] }],
  ['compostagens negativas', { composts: [{ thought: 'x', reps: -5, secs: -1, createdAt: 0 }] }],
  ['jardim com planta torta', { garden: [{ dias: 'muitos', maturedAt: null, mood: 42 }] }],
  ['práticas com chave estranha', { practicesDone: [{ topic: 9, practice: {}, at: 'agora' }] }],

  ['settings com tipos trocados', { settings: { reminders: 'sim', vibracao: 1, somDaRespiracao: null } }],
  ['startedAt inválido', { startedAt: 'quando eu era feliz' }],
  ['stageSeen absurdo', { stageSeen: 9999 }],

  ['tudo errado ao mesmo tempo', {
    profile: 'x', moodHistory: 'y', journal: 3, composts: null,
    garden: {}, practicesDone: false, settings: [], startedAt: [], stageSeen: 'a',
  }],
];

(async () => {
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'sanitize-'));
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  execFileSync(
    process.execPath,
    [tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck', '--jsx', 'react-jsx', '--allowJs', 'false',
      path.join(RAIZ, 'src', 'state', 'sanitize.ts')],
    { stdio: 'inherit', cwd: RAIZ },
  );

  // O tsc espelha a estrutura de pastas quando há mais de um arquivo de entrada.
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
    throw new Error(`não achei ${nome} em ${saida}`);
  };

  const alvo = achar('sanitize.js');
  const comoModulo = alvo.replace(/\.js$/, '.mjs');
  fs.renameSync(alvo, comoModulo);
  // Os imports irmãos precisam da extensão para o Node resolver.
  let corpo = fs.readFileSync(comoModulo, 'utf8');
  corpo = corpo.replace(/from ['"](\.[^'"]*?)['"]/g, (_, r) => `from '${r}.js'`);
  fs.writeFileSync(comoModulo, corpo);

  const { sanitizarDados } = await import('file://' + comoModulo.split(path.sep).join('/'));

  let falhas = 0;

  for (const [nome, entrada] of CASOS) {
    let veredito;
    try {
      const r = sanitizarDados(entrada, HOJE);

      const problemas = [];
      if (r == null || typeof r !== 'object') problemas.push('não devolveu objeto');
      else {
        if (typeof r.profile !== 'object' || r.profile == null) problemas.push('profile inutilizável');
        else if (!Array.isArray(r.profile.tentou)) problemas.push('profile.tentou não é lista');
        for (const campo of ['moodHistory', 'journal', 'composts', 'garden', 'practicesDone']) {
          if (!Array.isArray(r[campo])) problemas.push(`${campo} não é lista`);
        }
        if (typeof r.settings !== 'object' || r.settings == null) problemas.push('settings inutilizável');
      }

      veredito = problemas.length ? 'RUIM  ' + problemas.join('; ') : 'ok';
      if (problemas.length) falhas += 1;
    } catch (e) {
      veredito = 'LANÇOU  ' + e.message;
      falhas += 1;
    }
    console.log(`  ${veredito.startsWith('ok') ? 'ok   ' : 'FALHA'} ${nome.padEnd(38)} ${veredito}`);
  }

  fs.rmSync(saida, { recursive: true, force: true });
  console.log(`\n${CASOS.length} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
