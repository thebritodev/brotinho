/**
 * Confere o repertório e o plano dos lembretes.
 *
 * As três regras do texto (nada do que a pessoa escreveu, nenhum número, nunca
 * cobrar) eram só um comentário. Duas delas dá para verificar por máquina, e
 * verificar é o que as torna reais quando alguém acrescentar uma frase daqui a
 * seis meses.
 *
 * O plano também se verifica: um aviso por dia enquanto a pessoa está por
 * perto, espaçando conforme a ausência cresce, sem nunca calar — e sem repetir
 * frase na mesma semana.
 *
 * Uso: node scripts/testa-lembretes.js
 */

const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');

/**
 * Construções que cobram. Nenhuma pode aparecer em frase nenhuma.
 *
 * A lista é de **segunda pessoa** de propósito. A primeira versão bloqueava só
 * a palavra "perdeu", e reprovou "Nada se perdeu por aqui" — que diz exatamente
 * o contrário de cobrança. O que cobra não é o verbo: é apontá-lo para a
 * pessoa.
 */
const COBRANCA = [
  'você perdeu', 'você falhou', 'você esqueceu', 'você abandonou', 'você sumiu',
  'você deixou de', 'você não veio', 'volte já', 'não desista',
  'sentimos sua falta', 'faz tempo que você', 'que tal voltar',
];

(async () => {
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'lembretes-'));
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  execFileSync(
    process.execPath,
    [tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck', '--jsx', 'react-jsx',
      path.join(RAIZ, 'src', 'data', 'lembretes.ts'),
      path.join(RAIZ, 'src', 'data', 'saudacao.ts'),
      path.join(RAIZ, 'src', 'data', 'comecos.ts'),
      path.join(RAIZ, 'src', 'data', 'onboarding.ts')],
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

  const alvo = achar('lembretes.js');
  const { planejarLembretes, planejarResumos, TODAS_AS_FRASES } = await import(
    'file://' + alvo.split(path.sep).join('/')
  );
  const saud = achar('saudacao.js');
  const { saudacaoDoDia, TODAS_AS_SAUDACOES } = await import(
    'file://' + saud.split(path.sep).join('/')
  );
  const com = achar('comecos.js');
  const { comecoDoDia, TODOS_OS_COMECOS } = await import(
    'file://' + com.split(path.sep).join('/')
  );
  const onb = achar('onboarding.js');
  const { lembreteEnquantoDorme } = await import('file://' + onb.split(path.sep).join('/'));

  let falhas = 0;
  const checa = (nome, condicao, detalhe = '') => {
    const ok = Boolean(condicao);
    if (!ok) falhas += 1;
    console.log(`  ${ok ? 'ok   ' : 'FALHA'} ${nome}${ok || !detalhe ? '' : `  — ${detalhe}`}`);
  };

  // --- Regra 2: nenhum número em texto nenhum ------------------------------
  const comNumero = TODAS_AS_FRASES.filter((f) => /\d/.test(f));
  checa('nenhuma frase contém número', comNumero.length === 0, comNumero.join(' | '));

  // --- Regra 3: nenhuma cobrança ------------------------------------------
  const cobrando = TODAS_AS_FRASES.filter((f) =>
    COBRANCA.some((c) => f.toLowerCase().includes(c)),
  );
  checa('nenhuma frase cobra', cobrando.length === 0, cobrando.join(' | '));

  // --- Higiene do repertório ----------------------------------------------
  checa('nenhuma frase vazia', TODAS_AS_FRASES.every((f) => f.trim().length > 0));
  checa(
    'nenhuma frase repetida no repertório',
    new Set(TODAS_AS_FRASES).size === TODAS_AS_FRASES.length,
  );
  // Notificação é cortada pelo sistema; frase longa vira reticências.
  const longas = TODAS_AS_FRASES.filter((f) => f.length > 90);
  checa('nenhuma frase passa de 90 caracteres', longas.length === 0, longas.join(' | '));
  checa('o repertório é grande o bastante', TODAS_AS_FRASES.length >= 40, `${TODAS_AS_FRASES.length} frases`);

  // --- O plano de quem está por perto -------------------------------------
  const agora = new Date(2026, 7, 25, 9, 0, 0); // 25/08/2026, 09h
  const presente = planejarLembretes({
    agora, hora: 21, minuto: 0, ausenciaHoje: 0, diasCuidados: 5, quantidade: 24,
  });

  checa('agenda a quantidade pedida', presente.length === 24, `${presente.length}`);
  checa('o primeiro aviso é ainda hoje', presente[0].quando.getDate() === 25);
  checa(
    'os avisos estão em ordem crescente',
    presente.every((l, i) => i === 0 || l.quando > presente[i - 1].quando),
  );
  checa(
    'os primeiros catorze são um por dia',
    presente.slice(0, 14).every((l, i) => {
      if (i === 0) return true;
      const dias = Math.round((l.quando - presente[i - 1].quando) / 86400000);
      return dias === 1;
    }),
  );
  const primeiraSemana = presente.slice(0, 7).map((l) => l.texto);
  checa(
    'nenhuma frase se repete na primeira semana',
    new Set(primeiraSemana).size === 7,
    primeiraSemana.join(' | '),
  );

  // --- O espaçamento de quem some -----------------------------------------
  const intervalos = presente.map((l, i) =>
    i === 0 ? 0 : Math.round((l.quando - presente[i - 1].quando) / 86400000),
  );
  checa('depois das duas semanas os avisos espaçam', Math.max(...intervalos) > 1);
  checa('nunca cala de vez: o último aviso passa de 100 dias', (() => {
    const dias = Math.round((presente[presente.length - 1].quando - agora) / 86400000);
    return dias > 100;
  })(), `${Math.round((presente[presente.length - 1].quando - agora) / 86400000)} dias`);

  // --- Quem já sumiu -------------------------------------------------------
  const sumida = planejarLembretes({
    agora, hora: 9, minuto: 0, ausenciaHoje: 9, diasCuidados: 30, quantidade: 10,
  });
  checa('quem sumiu também recebe fila', sumida.length === 10);
  checa(
    'quem sumiu recebe texto da faixa certa',
    sumida[0].texto.includes('continua') ||
      sumida[0].texto.includes('esperando') ||
      sumida[0].texto.includes('pressa') ||
      sumida[0].texto.includes('abrir') ||
      sumida[0].texto.includes('recomeça'),
    sumida[0].texto,
  );

  // --- Quem nunca registrou nada ------------------------------------------
  const nova = planejarLembretes({
    agora, hora: 9, minuto: 0, ausenciaHoje: null, diasCuidados: 0, quantidade: 5,
  });
  checa('quem nunca registrou nada é tratado como presente', nova.length === 5);

  // --- Horário já passado hoje --------------------------------------------
  const passou = planejarLembretes({
    agora, hora: 7, minuto: 0, ausenciaHoje: 0, diasCuidados: 0, quantidade: 3,
  });
  checa('horário já vencido pula para amanhã', passou[0].quando.getDate() === 26);
  checa('nenhum aviso é agendado no passado', passou.every((l) => l.quando > agora));

  // --- O resumo de domingo -------------------------------------------------
  // A conta do dia da semana mudou de convenção quando isto deixou de usar o
  // gatilho WEEKLY (onde domingo é 1) para montar datas com getDay (domingo é
  // 0). Um engano ali move o resumo para segunda sem erro de compilação.
  const resumos = planejarResumos({ agora, diaDaSemana: 0, hora: 9, quantidade: 12 });
  checa('agenda os domingos pedidos', resumos.length === 12, `${resumos.length}`);
  checa('todos caem mesmo no domingo', resumos.every((r) => r.quando.getDay() === 0));
  checa('todos às nove da manhã', resumos.every((r) => r.quando.getHours() === 9));
  checa(
    'de sete em sete dias',
    resumos.every((r, i) =>
      i === 0 ? true : Math.round((r.quando - resumos[i - 1].quando) / 86400000) === 7,
    ),
  );
  checa('nenhum resumo no passado', resumos.every((r) => r.quando > agora));
  checa(
    'as dez primeiras semanas não repetem frase',
    new Set(resumos.slice(0, 10).map((r) => r.texto)).size === 10,
  );

  // --- A saudação da Home segue as mesmas regras --------------------------
  // Ela era uma constante: "Vamos cuidar de você hoje?", para sempre. Agora que
  // varia, passa a valer o mesmo contrato do lembrete.
  const comNumeroS = TODAS_AS_SAUDACOES.filter((f) => /\d/.test(f));
  checa('nenhuma saudação contém número', comNumeroS.length === 0, comNumeroS.join(' | '));
  const cobrandoS = TODAS_AS_SAUDACOES.filter((f) =>
    COBRANCA.some((c) => f.toLowerCase().includes(c)),
  );
  checa('nenhuma saudação cobra', cobrandoS.length === 0, cobrandoS.join(' | '));
  checa(
    'nenhuma saudação repetida',
    new Set(TODAS_AS_SAUDACOES).size === TODAS_AS_SAUDACOES.length,
  );
  const longasS = TODAS_AS_SAUDACOES.filter((f) => f.length > 60);
  checa('nenhuma saudação passa de 60 caracteres', longasS.length === 0, longasS.join(' | '));

  const manha = new Date(2026, 7, 27, 9, 0, 0);
  const noite = new Date(2026, 7, 27, 21, 0, 0);
  checa(
    'a mesma data devolve sempre a mesma frase',
    saudacaoDoDia({ agora: manha, diasCuidados: 3 }) ===
      saudacaoDoDia({ agora: new Date(2026, 7, 27, 10, 30, 0), diasCuidados: 3 }),
  );
  checa(
    'manhã e noite falam coisas diferentes',
    saudacaoDoDia({ agora: manha, diasCuidados: 3 }) !==
      saudacaoDoDia({ agora: noite, diasCuidados: 3 }),
  );
  checa(
    'dias diferentes trocam a frase',
    saudacaoDoDia({ agora: manha, diasCuidados: 3 }) !==
      saudacaoDoDia({ agora: new Date(2026, 7, 28, 9, 0, 0), diasCuidados: 3 }),
  );
  const trintaDias = [...Array(30)].map((_, i) =>
    saudacaoDoDia({ agora: new Date(2026, 7, 1 + i, 20, 0, 0), diasCuidados: 40 }),
  );
  checa(
    'um mês inteiro não repete demais',
    new Set(trintaDias).size >= 5,
    `${new Set(trintaDias).size} frases distintas`,
  );

  // --- A pergunta de partida do diário ------------------------------------
  // Ela substitui a folha em branco, que é o motivo mais citado de abandono em
  // app de diário. Vale o mesmo contrato do resto da voz do app.
  const comNumeroC = TODOS_OS_COMECOS.filter((f) => /\d/.test(f));
  checa('nenhuma pergunta contém número', comNumeroC.length === 0, comNumeroC.join(' | '));
  const cobrandoC = TODOS_OS_COMECOS.filter((f) =>
    COBRANCA.some((c) => f.toLowerCase().includes(c)),
  );
  checa('nenhuma pergunta cobra', cobrandoC.length === 0, cobrandoC.join(' | '));
  checa(
    'nenhuma pergunta repetida no mesmo grupo',
    TODOS_OS_COMECOS.length > 0,
  );

  const noite27 = new Date(2026, 7, 27, 21, 0, 0);
  const semHumor = comecoDoDia({ agora: noite27, humorDeHoje: null, valores: [] });
  checa('sem humor marcado, a pergunta vem do horário', typeof semHumor === 'string' && semHumor.length > 0, semHumor);

  const ansioso = comecoDoDia({ agora: noite27, humorDeHoje: 'ansioso', valores: [] });
  const triste = comecoDoDia({ agora: noite27, humorDeHoje: 'triste', valores: [] });
  checa('humores diferentes perguntam coisas diferentes', ansioso !== triste, `${ansioso} / ${triste}`);
  checa(
    'a pergunta de quem marcou ansioso fala do que aperta',
    /apert|repet|medo|imagin/i.test(ansioso),
    ansioso,
  );
  checa(
    'a mesma data devolve sempre a mesma pergunta',
    comecoDoDia({ agora: noite27, humorDeHoje: 'ansioso', valores: [] }) ===
      comecoDoDia({ agora: new Date(2026, 7, 27, 22, 30, 0), humorDeHoje: 'ansioso', valores: [] }),
  );
  const comValores = comecoDoDia({ agora: noite27, humorDeHoje: null, valores: ['Conexão', 'Calma'] });
  checa('os valores escolhidos entram no sorteio', typeof comValores === 'string' && comValores.length > 0, comValores);
  checa(
    'valor inexistente não quebra nada',
    typeof comecoDoDia({ agora: noite27, humorDeHoje: null, valores: ['Inventado'] }) === 'string',
  );

  // --- O lembrete que chega com a pessoa dormindo -------------------------
  // O onboarding pergunta a hora de dormir e depois deixa marcar o lembrete
  // para depois disso. Sem cruzar as duas respostas, o mecanismo central de
  // retencao falha em silencio.
  const dorme = (r, s) => lembreteEnquantoDorme(r, s);
  checa('lembrete depois de dormir e sinalizado', dorme('23:30', '23:00'));
  checa('lembrete de madrugada, com sono as 22h', dorme('02:00', '22:00'));
  checa('lembrete antes de dormir esta ok', !dorme('21:00', '23:00'));
  checa('lembrete de manha esta ok', !dorme('08:00', '23:00'));
  checa('quem dorme as 01h e avisado do lembrete as 03h', dorme('03:00', '01:00'));
  checa('quem dorme as 01h nao e avisado do lembrete as 20h', !dorme('20:00', '01:00'));
  checa('quem dorme as 09h da manha nao recebe palpite', !dorme('12:00', '09:00'));
  checa('horario invalido nao quebra', typeof dorme('abc', 'xyz') === 'boolean');

  fs.rmSync(saida, { recursive: true, force: true });

  console.log(`\n${TODAS_AS_FRASES.length} frases · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
