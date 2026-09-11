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
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

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

  ['conselhos virou texto', { conselhos: 'ontem' }],
  ['conselhos com lixo dentro', { conselhos: [{ date: 'ontem', id: 'x' }, null, 7, { id: 'sem-data' }] }],
  ['conselhos com dois registros no mesmo dia', {
    conselhos: [{ date: '2026-03-14', id: 'a' }, { date: '2026-03-14', id: 'b' }],
  }],
  ['guardadas viraram objeto', { conselhosGuardados: { um: 'tudo-urgente' } }],
  ['guardadas com repetidas e lixo', { conselhosGuardados: ['tudo-urgente', 'tudo-urgente', 3, null, ''] }],

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
  const saida = pastaTemporaria('sanitize');
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
        for (const campo of ['moodHistory', 'journal', 'composts', 'garden', 'practicesDone', 'conselhos', 'conselhosGuardados']) {
          if (!Array.isArray(r[campo])) problemas.push(`${campo} não é lista`);
        }
        if (typeof r.settings !== 'object' || r.settings == null) problemas.push('settings inutilizável');
        for (const campo of ['boasVindasVistas', 'jardimAberto']) {
          if (typeof r[campo] !== 'boolean') problemas.push(`${campo} não é booleano`);
        }
        if (Array.isArray(r.conselhos)) {
          const dias = r.conselhos.map((c) => c && c.date);
          if (new Set(dias).size !== dias.length) problemas.push('conselhos com dia repetido');
          if (r.conselhos.some((c) => !c || typeof c.date !== 'string' || typeof c.id !== 'string')) {
            problemas.push('conselhos com registro malformado');
          }
        }
        if (Array.isArray(r.conselhosGuardados)) {
          if (r.conselhosGuardados.some((g) => typeof g !== 'string' || g === '')) {
            problemas.push('guardadas com id inválido');
          }
          if (new Set(r.conselhosGuardados).size !== r.conselhosGuardados.length) {
            problemas.push('guardadas repetidas');
          }
        }
      }

      veredito = problemas.length ? 'RUIM  ' + problemas.join('; ') : 'ok';
      if (problemas.length) falhas += 1;
    } catch (e) {
      veredito = 'LANÇOU  ' + e.message;
      falhas += 1;
    }
    console.log(`  ${veredito.startsWith('ok') ? 'ok   ' : 'FALHA'} ${nome.padEnd(38)} ${veredito}`);
  }

  /*
    As duas marcas de "já viu", e o que o disco antigo significa para cada uma.

    Não bastava conferir o tipo. O dado gravado antes delas existirem não tem o
    campo, e as duas leem essa ausência de jeitos opostos de propósito: quem já
    tinha passado do onboarding já chegou, e não recebe boas-vindas no décimo
    mês; mas quem nunca abriu o jardim é exatamente quem a dica procura.
  */
  const ESPERADOS = [
    ['usava o app antes das boas-vindas existirem', { profile: { onboarded: true } }, 'boasVindasVistas', true],
    ['estava no meio do onboarding na atualização', { profile: { onboarded: false } }, 'boasVindasVistas', false],
    ['instalação nova', {}, 'boasVindasVistas', false],
    ['gravado como não vista, mesmo já dentro', { profile: { onboarded: true }, boasVindasVistas: false }, 'boasVindasVistas', false],
    ['boas-vindas com lixo vale como ausente', { profile: { onboarded: true }, boasVindasVistas: 'sim' }, 'boasVindasVistas', true],
    ['usava o app antes da dica do jardim', { profile: { onboarded: true } }, 'jardimAberto', false],
    ['jardim já aberto', { jardimAberto: true }, 'jardimAberto', true],
    ['jardim com lixo não conta como aberto', { jardimAberto: 'true' }, 'jardimAberto', false],
  ];
  console.log('\nmarcas de "já viu":');
  for (const [nome, entrada, campo, esperado] of ESPERADOS) {
    const obtido = sanitizarDados(entrada, HOJE)[campo];
    const ok = obtido === esperado;
    if (!ok) falhas += 1;
    console.log(`  ${ok ? 'ok   ' : 'FALHA'} ${nome.padEnd(46)} ${ok ? 'ok' : `veio ${obtido}, esperava ${esperado}`}`);
  }

  console.log(`\n${CASOS.length + ESPERADOS.length} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
