/**
 * Confere quando o Brotinho devolve uma frase compostada para ser pesada.
 *
 * ## Por que existe
 *
 * `compostaParaRepesar` tem **cinco travas**, e quatro delas protegem a pessoa,
 * não o código. Nenhuma aparece no typecheck: todas devolvem `Compost | null`,
 * e quebrar qualquer uma continua compilando.
 *
 * 1. **Dia pesado.** Devolver a alguém a própria frase mais dura num dia em que
 *    ela marcou "triste" é crueldade com passos extras. Se esta trava cair, o
 *    app faz exatamente isso — e só com quem está pior.
 * 2. **Uma por dia.** Sem ela, responder uma pergunta faz a seguinte aparecer no
 *    mesmo instante. Quem compostou cinco frases na semana recebe cinco
 *    perguntas em fila, e fila é dever de casa.
 * 3. **Uma por dor.** Quem compostou a mesma frase três vezes responde uma vez.
 * 4. **O interruptor de análise.** Vale para toda leitura de texto no app.
 * 5. **Os sete dias.** Perguntar cedo demais não mede nada.
 *
 * Uso: node scripts/testa-repesagem.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

(async () => {
  const saida = pastaTemporaria('repesagem');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck', '--jsx', 'react-jsx',
      path.join(RAIZ, 'src', 'state', 'derived.ts'),
    ],
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
  /* O Node ESM exige extensao no import; o tsc nao a escreve. */
  for (const a of arquivos) {
    let corpo = fs.readFileSync(a, 'utf8');
    corpo = corpo.replace(/from ['"](\.[^'"]*?)['"]/g, (_, r) => {
      const destino = path.resolve(path.dirname(a), r);
      const ehPasta = fs.existsSync(destino) && fs.statSync(destino).isDirectory();
      return `from '${r}${ehPasta ? '/index.js' : '.js'}'`;
    });
    fs.writeFileSync(a, corpo);
  }

  const mod = arquivos.find((a) => a.endsWith(`${path.sep}derived.js`));
  const { compostaParaRepesar, DIAS_ATE_REPESAR } = await import(
    `file://${mod.replace(/\\/g, '/')}`
  );

  let total = 0;
  let falhas = 0;
  const checa = (nome, ok, detalhe = '') => {
    total += 1;
    if (ok) return console.log(`  ok    ${nome}`);
    falhas += 1;
    console.log(`  FALHA ${nome}${detalhe ? `\n        ${detalhe}` : ''}`);
  };

  /** Uma tarde qualquer, para nada aqui depender do relógio. */
  const AGORA = new Date('2026-03-11T15:00:00');
  const HOJE = '2026-03-11';
  const DIA = 24 * 60 * 60 * 1000;
  /** Quantos dias atrás, em milissegundos. */
  const atras = (n) => AGORA.getTime() - n * DIA;

  const base = {
    profile: {}, moodHistory: [], journal: [], composts: [], garden: [],
    practicesDone: [], conselhos: [], conselhosGuardados: [],
    settings: { analysis: true },
  };

  const composta = (id, thought, dias, peso) => ({
    id, thought, createdAt: atras(dias), reps: 12, secs: 34,
    ...(peso ? { peso } : null),
  });

  console.log('\nquando a frase volta:');

  checa(
    'sem composta nenhuma, nao volta nada',
    compostaParaRepesar(base, AGORA) === null,
  );

  const recente = { ...base, composts: [composta('a', 'nao vou dar conta', 2)] };
  checa(
    `com ${DIAS_ATE_REPESAR - 5} dias, ainda e cedo`,
    compostaParaRepesar(recente, AGORA) === null,
  );

  const madura = { ...base, composts: [composta('a', 'nao vou dar conta', 9)] };
  const volta = compostaParaRepesar(madura, AGORA);
  checa('com nove dias, volta', volta?.id === 'a', `veio ${JSON.stringify(volta)}`);

  console.log('\nas travas que protegem a pessoa:');

  for (const humor of ['triste', 'ansioso', 'cansado']) {
    checa(
      `dia marcado como "${humor}" nao recebe a pergunta`,
      compostaParaRepesar(
        { ...madura, moodHistory: [{ date: HOJE, mood: humor }] },
        AGORA,
      ) === null,
    );
  }
  checa(
    'mas um dia leve recebe',
    compostaParaRepesar(
      { ...madura, moodHistory: [{ date: HOJE, mood: 'leve' }] },
      AGORA,
    )?.id === 'a',
  );

  checa(
    'com a analise desligada, nao pergunta nada',
    compostaParaRepesar({ ...madura, settings: { analysis: false } }, AGORA) === null,
  );

  /*
    Uma por dia. A segunda composta esta madura e sem resposta; o que impede a
    pergunta e a PRIMEIRA ja ter sido respondida hoje.
  */
  const jaRespondeuHoje = {
    ...base,
    composts: [
      composta('a', 'nao vou dar conta', 9, { quando: AGORA.getTime(), resposta: 'menos' }),
      composta('b', 'estou atrasado na vida', 10),
    ],
  };
  checa(
    'respondeu uma hoje, a proxima fica para amanha',
    compostaParaRepesar(jaRespondeuHoje, AGORA) === null,
  );
  checa(
    'e a mesma resposta ONTEM nao segura a de hoje',
    compostaParaRepesar(
      {
        ...base,
        composts: [
          composta('a', 'nao vou dar conta', 9, { quando: atras(1), resposta: 'menos' }),
          composta('b', 'estou atrasado na vida', 10),
        ],
      },
      AGORA,
    )?.id === 'b',
  );

  checa(
    'dispensar tambem conta como perguntado — nao volta a insistir',
    compostaParaRepesar(
      { ...base, composts: [composta('a', 'nao vou dar conta', 9, { quando: atras(3), resposta: null })] },
      AGORA,
    ) === null,
  );

  console.log('\numa pergunta por dor, nao por sessao:');

  /*
    A mesma dor, tres vezes, e uma ja respondida. As outras duas nao voltam:
    perguntar de novo sobre a mesma frase seria insistir.
  */
  const mesmaDorTresVezes = {
    ...base,
    composts: [
      composta('a', 'nunca vou dar conta de nada', 30, { quando: atras(20), resposta: 'igual' }),
      composta('b', 'nao vou dar conta disso', 12),
      composta('c', 'nao vou dar conta', 9),
    ],
  };
  checa(
    'dor ja respondida nao volta, nem numa sessao diferente',
    compostaParaRepesar(mesmaDorTresVezes, AGORA) === null,
    `veio ${JSON.stringify(compostaParaRepesar(mesmaDorTresVezes, AGORA))}`,
  );

  /* Duas dores diferentes, as duas maduras: ganha a que espera ha mais tempo. */
  const duasDores = {
    ...base,
    composts: [
      composta('nova', 'estou atrasado na vida', 8),
      composta('velha', 'ninguem se importa comigo', 20),
    ],
  };
  checa(
    'entre dores diferentes, a mais antiga vem primeiro',
    compostaParaRepesar(duasDores, AGORA)?.id === 'velha',
    `veio ${compostaParaRepesar(duasDores, AGORA)?.id}`,
  );

  /*
    Mesma dor compostada duas vezes, nenhuma respondida: pergunta uma vez, e
    sobre a sessao MAIS RECENTE — a redacao mais fresca na memoria de quem
    escreveu.
  */
  const repetida = {
    ...base,
    composts: [
      composta('antiga', 'nunca vou dar conta de nada', 25),
      composta('recente', 'nao vou dar conta de nada', 9),
    ],
  };
  checa(
    'da mesma dor, pergunta sobre a sessao mais recente',
    compostaParaRepesar(repetida, AGORA)?.id === 'recente',
    `veio ${compostaParaRepesar(repetida, AGORA)?.id}`,
  );

  console.log(`\n${total - falhas} de ${total} passaram.`);
  if (falhas) process.exit(1);
})();
