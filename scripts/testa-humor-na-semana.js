/**
 * Confere a fita de humor da semana, no Perfil e no resumo para a terapia.
 *
 * ## O que se trava aqui
 *
 * **A ordem dos rótulos.** Antes eram os últimos sete dias terminando hoje, e
 * isso fazia a fita girar: numa quarta saía Q S S D S T Q, numa sexta saía
 * S S D S T Q Q. Ninguém lê calendário assim — a ordem D S T Q Q S S é a que
 * está na cabeça de quem olha, e uma fita que muda de ordem obriga a ler os
 * rótulos em vez de reconhecer a posição.
 *
 * O caso roda **os sete dias da semana** como se fossem "hoje", justamente
 * porque o defeito antigo só aparecia em alguns deles. Um teste rodado numa
 * segunda-feira não teria pego nada.
 *
 * **A diferença entre dia futuro e dia sem registro.** Os dois estão vazios e
 * não são a mesma coisa: um é o tempo, o outro é uma ausência da pessoa.
 * Confundir os dois faz o app cobrar uma coisa que ainda nem pôde acontecer, e
 * faz o PDF do terapeuta mostrar como lacuna o que é só quinta-feira que vem.
 *
 * Uso: node scripts/testa-humor-na-semana.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');
const ESPERADA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Uma semana de setembro de 2026: domingo 6 a sábado 12. */
const DOMINGO = 6;

const dia = (n) => `2026-09-${String(n).padStart(2, '0')}`;

(async () => {
  const saida = pastaTemporaria('humor-na-semana');
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

  const mod = arquivos.find((a) => a.endsWith('derived.js'));
  const { moodWeek } = await import(`file://${mod.replace(/\\/g, '/')}`);

  /** Humor marcado na semana toda, para o dia futuro nao vir vazio por falta de dado. */
  const dados = {
    moodHistory: Array.from({ length: 7 }, (_, i) => ({
      date: dia(DOMINGO + i),
      mood: 'neutro',
    })),
  };

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

  const NOMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  console.log('\nordem dos rotulos, rodando cada dia da semana como "hoje":');

  for (let i = 0; i < 7; i += 1) {
    const hoje = new Date(2026, 8, DOMINGO + i, 12, 0, 0);
    checa(`${NOMES[i]} (${dia(DOMINGO + i)})`, () => {
      const fita = moodWeek(dados, hoje);
      const ordem = fita.map((d) => d.day);
      if (ordem.join('') !== ESPERADA.join('')) {
        return `saiu ${ordem.join(' ')} em vez de ${ESPERADA.join(' ')}`;
      }
      /*
        A parte que importa: a letra tem de bater com o dia REAL daquela data.
        So conferir a sequencia nao prova nada — as letras vem da posicao no
        array e ficariam certas mesmo com a conta das datas errada.
      */
      const tortos = fita
        .map((d, pos) => {
          const real = new Date(`${d.date}T12:00:00`).getDay();
          return real === pos ? null : `${d.day} caiu em ${d.date}, que e ${NOMES[real]}`;
        })
        .filter(Boolean);
      return tortos.length ? tortos.join('; ') : 'ok';
    });
  }

  console.log('\ndia futuro:');

  checa('numa segunda, os cinco dias seguintes sao futuro', () => {
    const fita = moodWeek(dados, new Date(2026, 8, DOMINGO + 1, 12, 0, 0));
    const futuros = fita.map((d) => d.futuro);
    const esperado = [false, false, true, true, true, true, true];
    return JSON.stringify(futuros) === JSON.stringify(esperado)
      ? 'ok'
      : `saiu ${JSON.stringify(futuros)}`;
  });

  checa('num sabado nada e futuro', () => {
    const fita = moodWeek(dados, new Date(2026, 8, DOMINGO + 6, 12, 0, 0));
    return fita.some((d) => d.futuro) ? 'algum dia veio como futuro' : 'ok';
  });

  checa('hoje nunca e futuro', () => {
    const problemas = [];
    for (let i = 0; i < 7; i += 1) {
      const fita = moodWeek(dados, new Date(2026, 8, DOMINGO + i, 12, 0, 0));
      if (fita[i].futuro) problemas.push(NOMES[i]);
    }
    return problemas.length ? `veio futuro em: ${problemas.join(', ')}` : 'ok';
  });

  checa('o humor registrado aparece no dia certo', () => {
    const so = { moodHistory: [{ date: dia(DOMINGO + 3), mood: 'feliz' }] };
    const fita = moodWeek(so, new Date(2026, 8, DOMINGO + 6, 12, 0, 0));
    const marcados = fita.map((d, i) => (d.mood ? i : -1)).filter((i) => i >= 0);
    return JSON.stringify(marcados) === JSON.stringify([3])
      ? 'ok'
      : `humor apareceu nas posicoes ${JSON.stringify(marcados)}`;
  });

  /*
    A palavra mais exata tem de chegar à fita: é por ela que o Perfil e o PDF
    da terapia a mostram. Antes ela ficava gravada e nenhuma tela a lia.
  */
  checa('a palavra do dia chega na fita, no dia certo', () => {
    const so = { moodHistory: [{ date: dia(DOMINGO + 2), mood: 'ansioso', palavra: 'preocupação' }] };
    const fita = moodWeek(so, new Date(2026, 8, DOMINGO + 6, 12, 0, 0));
    const comPalavra = fita.map((d, i) => (d.palavra ? `${i}:${d.palavra}` : null)).filter(Boolean);
    return JSON.stringify(comPalavra) === JSON.stringify(['2:preocupação'])
      ? 'ok'
      : `palavras na fita: ${JSON.stringify(comPalavra)}`;
  });

  checa('dia sem palavra nao ganha palavra', () => {
    const fita = moodWeek(dados, new Date(2026, 8, DOMINGO + 6, 12, 0, 0));
    return fita.some((d) => 'palavra' in d) ? 'apareceu palavra sem ninguem ter escolhido' : 'ok';
  });

  checa('a semana passada nao vaza para esta', () => {
    // Sabado anterior ao domingo desta semana.
    const so = { moodHistory: [{ date: dia(DOMINGO - 1), mood: 'triste' }] };
    const fita = moodWeek(so, new Date(2026, 8, DOMINGO + 3, 12, 0, 0));
    return fita.every((d) => d.mood === null) ? 'ok' : 'um dia da semana passada apareceu';
  });

  console.log(`\n${total} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
