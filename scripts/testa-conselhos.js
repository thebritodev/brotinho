/**
 * Confere as frases de "Sem rodeios" e a ordem em que elas saem.
 *
 * ## O que se testa aqui não é código, são duas decisões
 *
 * **A primeira é de voz.** As frases daqui falam duro, ao contrário de todo o
 * resto do app, e a única coisa que separa "duro" de "acusatório" é uma régra
 * escrita no cabeçalho de `data/conselhos.ts`: o sujeito duro da frase é um
 * mecanismo — a ansiedade, a culpa, a comparação, a ruminação —, nunca a
 * pessoa. Num dia ruim, "você sempre faz isso" não é conselho, é sentença.
 *
 * Nenhum teste sabe julgar isso de verdade. O que dá para travar é o
 * vocabulário que denuncia a versão errada, e é o que está aqui: quem escrever
 * a frase número 47 daqui a seis meses vai esbarrar nisto antes de mandar.
 *
 * **A segunda é de ordem**, e ela tem uma armadilha que só aparece no dia 21.
 * Pegar sempre a frase mais antiga parece a resposta óbvia — só que passada a
 * primeira volta o histórico é uma permutação, a mais antiga é sempre
 * exatamente uma, e a ordem vira uma fila fixa que se repete para sempre. O
 * caso `a ordem muda entre uma volta e outra` existe por causa disso, e ele
 * reprova aquele desenho: foi verificado sabotando a função para pegar só a
 * primeira candidata, e o caso quebra.
 *
 * Uso: node scripts/testa-conselhos.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

/** Vira YYYY-MM-DD a partir de um dia corrido desde 01/01/2026. */
const dia = (n) => {
  const d = new Date(2026, 0, 1 + n);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const nd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${nd}`;
};

(async () => {
  const saida = pastaTemporaria('conselhos');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'data', 'conselhos.ts'),
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

  const mod = arquivos.find((a) => a.endsWith('conselhos.js'));
  const { CONSELHOS, conselhoDoDia, entreAspas } = await import(`file://${mod.replace(/\\/g, '/')}`);

  let total = 0;
  let falhas = 0;
  const checa = (nome, fn) => {
    total += 1;
    let r;
    try {
      r = fn();
    } catch (e) {
      r = `estourou: ${e.message}`;
    }
    if (r === 'ok') return console.log(`  ok   ${nome}`);
    falhas += 1;
    console.log(`  FALHA ${nome}\n        ${r}`);
  };

  /** Roda `dias` dias seguidos, guardando cada frase como o app guardaria. */
  const percorrer = (dias) => {
    let vistos = [];
    const saiu = [];
    for (let n = 0; n < dias; n += 1) {
      const hoje = dia(n);
      const c = conselhoDoDia({ vistos, hoje });
      saiu.push(c.id);
      vistos = [{ date: hoje, id: c.id }, ...vistos];
    }
    return saiu;
  };

  console.log('\nfrases:');

  checa('todo id é único', () => {
    // Id repetido faria duas frases dividirem o mesmo lugar no histórico: uma
    // delas nunca sairia, e guardar uma guardaria a outra junto.
    const ids = CONSELHOS.map((c) => c.id);
    const repetidos = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    return repetidos.length ? `repetidos: ${repetidos.join(', ')}` : 'ok';
  });

  checa('nenhuma frase acusa a pessoa', () => {
    /*
      O que estas expressões pegam é a forma acusatória, não a dura. "Pare de
      esperar que as pessoas sejam como você" passa: manda, mas o alvo é uma
      expectativa. "Você sempre faz isso" não passaria: o alvo é ela.
    */
    const proibidas = [
      [/você (sempre|nunca) /i, 'sentença sobre a pessoa'],
      [/a culpa é sua/i, 'atribui culpa'],
      [/você deveria/i, 'cobra sem oferecer'],
      [/(você é|voce e) (um|uma|o|a) /i, 'define a pessoa'],
      [/o problema é você/i, 'aponta a pessoa como o problema'],
      [/pare de ser/i, 'manda a pessoa deixar de ser o que é'],
    ];
    const problemas = [];
    for (const c of CONSELHOS) {
      for (const [re, porque] of proibidas) {
        if (re.test(c.texto)) problemas.push(`${c.id}: ${porque}`);
      }
    }
    return problemas.length ? problemas.join('; ') : 'ok';
  });

  checa('nenhuma frase promete resultado', () => {
    // Mesma regra que o `testa-sugestao` já impõe ao convite da prática: este
    // app não diz "vai passar" para ninguém.
    const proibidas = [/vai passar/i, /vai melhorar/i, /tudo vai ficar bem/i, /você vai superar/i];
    const problemas = CONSELHOS.filter((c) => proibidas.some((p) => p.test(c.texto))).map((c) => c.id);
    return problemas.length ? problemas.join(', ') : 'ok';
  });

  checa('as aspas são as curvas, e o texto guardado não as tem', () => {
    /*
      As aspas moram na apresentação, não no dado. Se um dia alguém as escrever
      dentro do texto, a tela sairá com aspas duplas — e as expressões de voz
      logo acima, que leem o texto cru, passariam a topar com pontuação que não
      é da frase.
    */
    const problemas = [];
    for (const c of CONSELHOS) {
      if (/[“”"]/.test(c.texto)) problemas.push(c.id + ' já tem aspas no dado');
    }
    const exemplo = entreAspas('teste');
    if (exemplo !== '“teste”') problemas.push('entreAspas devolveu ' + exemplo);
    return problemas.length ? problemas.join('; ') : 'ok';
  });

  checa('as três frases originais estão intactas', () => {
    // São a referência de voz do arquivo. Se alguém as reescrever, o sotaque de
    // todas as outras deixa de ter de onde vir.
    const esperadas = ['pessoas-nao-sao-voce', 'prever-evitar-controlar', 'ansiedade-mente'];
    const faltando = esperadas.filter((id) => !CONSELHOS.some((c) => c.id === id));
    return faltando.length ? `sumiram: ${faltando.join(', ')}` : 'ok';
  });

  console.log('\nordem:');

  checa('a mesma data devolve sempre a mesma frase', () => {
    const vistos = [];
    const a = conselhoDoDia({ vistos, hoje: '2026-03-14' });
    const b = conselhoDoDia({ vistos, hoje: '2026-03-14' });
    return a.id === b.id ? 'ok' : `${a.id} != ${b.id}`;
  });

  checa('reabrir no mesmo dia devolve a frase já anotada', () => {
    const vistos = [{ date: '2026-03-14', id: 'tudo-urgente' }];
    const c = conselhoDoDia({ vistos, hoje: '2026-03-14' });
    return c.id === 'tudo-urgente' ? 'ok' : `veio ${c.id}`;
  });

  checa('uma frase apagada do repertório não deixa o dia vazio', () => {
    const vistos = [{ date: '2026-03-14', id: 'frase-que-nao-existe-mais' }];
    const c = conselhoDoDia({ vistos, hoje: '2026-03-14' });
    return c && c.texto ? 'ok' : 'devolveu nada';
  });

  const minimo = Math.max(1, Math.floor(CONSELHOS.length / 2));

  checa(`nenhuma frase volta antes de ${minimo} dias`, () => {
    const saiu = percorrer(120);
    const problemas = [];
    for (let i = 1; i < saiu.length; i += 1) {
      // `lastIndexOf` com fromIndex negativo conta do fim e varreria o array
      // inteiro; por isso o laço começa em 1 em vez de 0.
      const antes = saiu.lastIndexOf(saiu[i], i - 1);
      if (antes >= 0 && i - antes < minimo) {
        problemas.push(`${saiu[i]} voltou depois de ${i - antes} dia(s), no dia ${i + 1}`);
      }
    }
    return problemas.length ? problemas.slice(0, 3).join('; ') : 'ok';
  });

  checa('a ordem muda entre uma volta e outra', () => {
    /*
      O caso que reprova "pegar sempre a mais antiga". Com aquele desenho, a
      volta 2 sai idêntica à volta 1 e este caso quebra — foi conferido
      sabotando a função.
    */
    const saiu = percorrer(CONSELHOS.length * 3);
    const volta = (n) => saiu.slice(n * CONSELHOS.length, (n + 1) * CONSELHOS.length).join('>');
    return volta(0) !== volta(1) && volta(1) !== volta(2)
      ? 'ok'
      : 'a sequência se repete igual a cada volta';
  });

  checa('em 120 dias o repertório inteiro sai pelo menos uma vez', () => {
    const saiu = new Set(percorrer(120));
    const nunca = CONSELHOS.filter((c) => !saiu.has(c.id)).map((c) => c.id);
    return nunca.length ? `nunca saíram: ${nunca.join(', ')}` : 'ok';
  });

  checa('quem some por meses volta sem repetir a última que viu', () => {
    // O histórico não é uma fila de dias seguidos: pode ter buracos enormes.
    const vistos = [{ date: '2026-01-05', id: 'tudo-urgente' }];
    const c = conselhoDoDia({ vistos, hoje: '2026-09-30' });
    return c.id !== 'tudo-urgente' ? 'ok' : 'repetiu a última';
  });

  console.log(`\n${total} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
