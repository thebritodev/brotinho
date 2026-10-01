/**
 * Confere o resumo de um periodo. Ver `resumoDoPeriodo`, em `derived`.
 *
 * ## Por que existe
 *
 * Porque todos os numeros desta tela saem do **mesmo corte de datas**, e um
 * corte feito duas vezes e um corte que pode divergir. O defeito que isso
 * produz e um resumo dizendo "5 registros" ao lado de uma lista com 4 — e esse
 * tipo de incoerencia, numa tela que a pessoa leva para a terapia, custa a
 * confianca no app inteiro.
 *
 * A outra razao e a porcentagem. Ela e calculada sobre os dias **com
 * registro**, e nao sobre os dias do periodo: quem registrou dois dias numa
 * semana nao esteve "71% sem humor". Essa decisao e invisivel no codigo e
 * obvia no resultado, que e exatamente o tipo de coisa que um teste segura.
 *
 * `agora` e parametro da funcao justamente para isto: sem ele, o teste
 * dependeria do dia em que alguem resolvesse roda-lo.
 *
 * Uso: node scripts/testa-resumo-do-periodo.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

let falhas = 0;
let casos = 0;
const detalhes = [];

function confere(nome, obtido, esperado) {
  casos += 1;
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (ok) {
    console.log(`  ok    ${nome}`);
    return;
  }
  falhas += 1;
  console.log(`  FALHA ${nome}`);
  detalhes.push(
    `        esperado ${JSON.stringify(esperado)}, veio ${JSON.stringify(obtido)}`,
  );
}

/** Procura um arquivo na saida do tsc, que espelha a pasta comum das entradas. */
function procura(dir, nome) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      const achado = procura(p, nome);
      if (achado) return achado;
    } else if (e.name === nome) return p;
  }
  return null;
}

const saida = pastaTemporaria('resumo-do-periodo');
const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');
execFileSync(
  process.execPath,
  [
    /*
      `commonjs`, pelo mesmo motivo do teste das regras da troca: `derived`
      importa de varias pastas, e o `tsc` emite esses imports sem extensao.
      Num `.mjs` isso nao resolve — ESM exige a extensao escrita.
    */
    /*
      `--jsx` entra porque `derived` importa do barril de componentes, e ele
      arrasta os `.tsx` junto. Sem a bandeira o `tsc` para na primeira linha
      de JSX, num erro que nao tem nada a ver com o que se quer medir aqui.
    */
    tsc, '--outDir', saida, '--module', 'commonjs', '--target', 'es2020',
    '--jsx', 'react-jsx', '--esModuleInterop',
    '--moduleResolution', 'node', '--strict', '--skipLibCheck',
    path.join(RAIZ, 'src', 'state', 'derived.ts'),
  ],
  { stdio: 'inherit', cwd: RAIZ },
);
const js = procura(saida, 'derived.js');
if (!js) throw new Error('nao achei derived.js na saida do tsc');
const { resumoDoPeriodo } = require(js);

/* Um dia qualquer, fixo: 1 de outubro de 2026, uma quinta-feira. */
const HOJE = new Date('2026-10-01T12:00:00');
const dia = (quantosAtras) => {
  const d = new Date(HOJE);
  d.setDate(d.getDate() - quantosAtras);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${String(d.getDate()).padStart(2, '0')}`;
};
const emMs = (quantosAtras) => {
  const d = new Date(HOJE);
  d.setDate(d.getDate() - quantosAtras);
  return d.getTime();
};

const base = {
  profile: {},
  moodHistory: [],
  journal: [],
  composts: [],
  practicesDone: [],
  garden: [],
};

console.log('\n— o resumo de um periodo —\n');

/* 1. A porcentagem e sobre os dias com registro. */
{
  const r = resumoDoPeriodo(
    {
      ...base,
      moodHistory: [
        { date: dia(0), mood: 'ansioso' },
        { date: dia(1), mood: 'ansioso' },
        { date: dia(2), mood: 'leve' },
        { date: dia(3), mood: 'leve' },
      ],
    },
    7,
    HOJE,
  );
  confere(
    'dois humores em quatro dias: metade cada, e nao um setimo',
    r.humores.map((h) => [h.mood, h.pct]),
    [
      ['ansioso', 50],
      ['leve', 50],
    ],
  );
}

/* 2. O corte de datas exclui o que ficou de fora da janela. */
{
  const dados = {
    ...base,
    moodHistory: [
      { date: dia(1), mood: 'leve' },
      /* Oito dias atras: fora dos sete, dentro dos trinta. */
      { date: dia(8), mood: 'triste' },
    ],
    journal: [{ createdAt: emMs(1) }, { createdAt: emMs(20) }],
    composts: [
      { id: 'a', createdAt: emMs(2), thought: 'vou ser demitido' },
      { id: 'b', createdAt: emMs(15), thought: 'vai dar tudo errado' },
    ],
    practicesDone: [
      { topic: 'ansiedade', practice: 'Respiracao 4-7-8', at: emMs(1) },
      { topic: 'ansiedade', practice: 'Respiracao 4-7-8', at: emMs(2) },
      { topic: 'ansiedade', practice: 'Aterramento', at: emMs(12) },
    ],
  };
  const sete = resumoDoPeriodo(dados, 7, HOJE);
  const trinta = resumoDoPeriodo(dados, 30, HOJE);

  confere('sete dias: so o humor de ontem', sete.humores.map((h) => h.mood), ['leve']);
  confere(
    'trinta dias: os dois humores',
    trinta.humores.map((h) => h.mood).sort(),
    ['leve', 'triste'],
  );
  confere('sete dias: um registro no diario', sete.registros, 1);
  confere('trinta dias: dois registros', trinta.registros, 2);
  confere('sete dias: duas praticas', sete.praticas, 2);
  confere('trinta dias: tres praticas', trinta.praticas, 3);
  confere('sete dias: uma composta', sete.compostas, 1);
  confere('trinta dias: duas compostas', trinta.compostas, 2);
  confere('a pratica mais feita nos sete', sete.praticaMaisFeita, 'Respiracao 4-7-8');
  confere(
    'a lista de pensamentos acompanha o corte',
    sete.pensamentos.map((p) => p.texto),
    ['vou ser demitido'],
  );
}

/* 3. As contagens e a lista nunca se contradizem. */
{
  const composts = [0, 1, 2, 3, 4, 5].map((i) => ({
    id: String(i),
    createdAt: emMs(i),
    thought: `pensamento ${i}`,
  }));
  const r = resumoDoPeriodo({ ...base, composts }, 7, HOJE);
  confere('seis compostas contadas', r.compostas, 6);
  /*
    A lista mostra no maximo quatro, e isso **nao** e uma contradicao: o numero
    diz quantas foram, a lista mostra as mais recentes. O teste existe para
    deixar essa diferenca escrita — se um dia alguem derivar a contagem do
    tamanho da lista, cai aqui.
  */
  confere('a lista mostra as quatro mais recentes', r.pensamentos.length, 4);
  confere('e a mais recente vem primeiro', r.pensamentos[0].texto, 'pensamento 0');
}

/* 4. A repesagem chega junto, quando existe. */
{
  const r = resumoDoPeriodo(
    {
      ...base,
      composts: [
        {
          id: 'a',
          createdAt: emMs(2),
          thought: 'vou ser demitido',
          peso: { quando: emMs(0), resposta: 'menos' },
        },
        { id: 'b', createdAt: emMs(3), thought: 'sem repesagem' },
      ],
    },
    7,
    HOJE,
  );
  confere('o peso respondido vem junto', r.pensamentos[0].peso, 'menos');
  confere('e o nao respondido vem nulo', r.pensamentos[1].peso, null);
}

/* 5. Sem registro nenhum, nada quebra. */
{
  const r = resumoDoPeriodo(base, 7, HOJE);
  confere('vazio: nenhum humor', r.humores, []);
  confere('vazio: nenhuma palavra', r.palavras, []);
  confere('vazio: zero registros', r.registros, 0);
  confere('vazio: nenhuma pratica mais feita', r.praticaMaisFeita, null);
}

/* 6. As palavras do humor sao contadas e ordenadas. */
{
  const r = resumoDoPeriodo(
    {
      ...base,
      moodHistory: [
        { date: dia(0), mood: 'ansioso', palavra: 'aflicao' },
        { date: dia(1), mood: 'ansioso', palavra: 'aflicao' },
        { date: dia(2), mood: 'cansado', palavra: 'exaustao' },
        { date: dia(3), mood: 'leve' },
      ],
    },
    7,
    HOJE,
  );
  confere(
    'as palavras saem da mais usada para a menos',
    r.palavras,
    [
      { palavra: 'aflicao', n: 2 },
      { palavra: 'exaustao', n: 1 },
    ],
  );
}

console.log('');
for (const d of detalhes) console.log(d);
console.log(`\n${casos} casos · ${falhas} falha(s)`);
if (falhas) process.exit(1);
