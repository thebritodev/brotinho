/**
 * Confere a prática que o app oferece depois que a pessoa diz como está.
 *
 * O que se testa aqui não é o código: é uma decisão de produto que some fácil.
 * A oferta existe para **três** dos seis humores. Feliz, leve e neutro não
 * recebem nada, de propósito — a pesquisa de retenção desta categoria é clara
 * sobre app que não deixa a pessoa em paz, e oferecer exercício a quem acabou
 * de dizer que está bem é exatamente isso.
 *
 * É o tipo de regra que alguém "conserta" daqui a seis meses achando que é
 * caso esquecido. Se isso acontecer, este arquivo quebra e explica o porquê.
 *
 * As outras duas: a oferta tem de apontar para uma prática que **existe**
 * (senão a tela abre vazia), e "cansado" às onze da noite não é o mesmo que
 * "cansado" às três da tarde.
 *
 * Uso: node scripts/testa-sugestao.js
 */

const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');

/** Meio-dia e onze da noite do mesmo dia, para o teste não depender do relógio. */
const TARDE = new Date(2026, 7, 28, 15, 0, 0);
const NOITE = new Date(2026, 7, 28, 23, 0, 0);
const MADRUGADA = new Date(2026, 7, 28, 3, 0, 0);

(async () => {
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'sugestao-'));
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      '--jsx', 'react-jsx',
      path.join(RAIZ, 'src', 'data', 'sugestao.ts'),
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
  for (const a of arquivos) {
    let corpo = fs.readFileSync(a, 'utf8');
    corpo = corpo.replace(/from ['"](\.[^'"]*?)['"]/g, (_, r) => {
      const destino = path.resolve(path.dirname(a), r);
      const ehPasta = fs.existsSync(destino) && fs.statSync(destino).isDirectory();
      return `from '${r}${ehPasta ? '/index.js' : '.js'}'`;
    });
    fs.writeFileSync(a, corpo);
  }

  const alvoSug = arquivos.find((a) => a.endsWith('sugestao.js'));
  const alvoPra = arquivos.find((a) => a.endsWith('practices.js'));
  const { sugestaoParaOHumor } = await import('file://' + alvoSug.split(path.sep).join('/'));
  const { PRACTICE_TOPICS } = await import('file://' + alvoPra.split(path.sep).join('/'));

  let falhas = 0;
  // Contagem derivada: numero escrito a mao desanda na primeira vez que
  // alguem acrescenta um caso.
  let total = 0;
  const checa = (nome, fn) => {
    total += 1;
    let veredito;
    try {
      veredito = fn() || 'ok';
    } catch (e) {
      veredito = `LANÇOU  ${e.message}`;
    }
    if (veredito !== 'ok') falhas += 1;
    console.log(`  ${veredito === 'ok' ? 'ok   ' : 'FALHA'} ${nome.padEnd(46)} ${veredito}`);
  };

  // --- quem não recebe nada, e é assim de propósito ---
  for (const humor of ['feliz', 'leve', 'neutro']) {
    checa(`"${humor}" não recebe oferta nenhuma`, () => {
      const r = sugestaoParaOHumor({ humor, agora: TARDE });
      return r === null ? 'ok' : `ofereceu ${r.titulo} — ver o cabeçalho deste arquivo`;
    });
  }

  checa('sem humor marcado, não oferece nada', () => {
    const r = sugestaoParaOHumor({ humor: null, agora: TARDE });
    return r === null ? 'ok' : `ofereceu ${r.titulo} antes de ela dizer qualquer coisa`;
  });

  // --- quem recebe ---
  const ESPERADO = { ansioso: 'ansiedade', triste: 'tristeza', cansado: 'estresse' };
  for (const [humor, topico] of Object.entries(ESPERADO)) {
    checa(`"${humor}" de tarde aponta para ${topico}`, () => {
      const r = sugestaoParaOHumor({ humor, agora: TARDE });
      if (!r) return 'não ofereceu nada';
      return r.topico === topico ? 'ok' : `apontou para ${r.topico}`;
    });
  }

  checa('"cansado" às 23h vira insônia, não estresse', () => {
    const r = sugestaoParaOHumor({ humor: 'cansado', agora: NOITE });
    if (!r) return 'não ofereceu nada';
    return r.topico === 'insonia' ? 'ok' : `apontou para ${r.topico}`;
  });

  checa('"cansado" às 3h da manhã também é insônia', () => {
    const r = sugestaoParaOHumor({ humor: 'cansado', agora: MADRUGADA });
    if (!r) return 'não ofereceu nada';
    return r.topico === 'insonia' ? 'ok' : `apontou para ${r.topico}`;
  });

  // --- a oferta tem de existir de verdade ---
  checa('toda oferta aponta para uma prática que existe', () => {
    const problemas = [];
    for (const humor of ['ansioso', 'triste', 'cansado']) {
      // Um ano inteiro de sementes: a escolha gira com o dia, e uma delas
      // apontando para o vazio abriria a tela de prática em branco.
      for (let dia = 0; dia < 366; dia++) {
        const agora = new Date(2026, 0, 1 + dia, 15, 0, 0);
        const r = sugestaoParaOHumor({ humor, agora });
        if (!r) {
          problemas.push(`${humor} no dia ${dia} não ofereceu nada`);
          break;
        }
        const tema = PRACTICE_TOPICS.find((t) => t.key === r.topico);
        if (!tema) {
          problemas.push(`${humor}: tema ${r.topico} não existe`);
          break;
        }
        if (!tema.practices.some((p) => p.key === r.pratica)) {
          problemas.push(`${humor}: prática ${r.pratica} não existe em ${r.topico}`);
          break;
        }
      }
    }
    return problemas.length ? problemas.join('; ') : 'ok';
  });

  checa('a oferta é estável dentro do mesmo dia', () => {
    const manha = sugestaoParaOHumor({ humor: 'triste', agora: new Date(2026, 5, 10, 8, 0, 0) });
    const tarde = sugestaoParaOHumor({ humor: 'triste', agora: new Date(2026, 5, 10, 17, 30, 0) });
    if (!manha || !tarde) return 'não ofereceu';
    return manha.pratica === tarde.pratica
      ? 'ok'
      : `trocou de prática no meio do dia: ${manha.pratica} → ${tarde.pratica}`;
  });

  checa('o convite não cobra nem promete resultado', () => {
    const proibidas = [/você precisa/i, /deveria/i, /vai passar/i, /vai melhorar/i, /faça/i];
    const problemas = [];
    for (const humor of ['ansioso', 'triste', 'cansado']) {
      const r = sugestaoParaOHumor({ humor, agora: TARDE });
      for (const p of proibidas) {
        if (p.test(r.convite)) problemas.push(`"${r.convite}" bate em ${p}`);
      }
    }
    return problemas.length ? problemas.join('; ') : 'ok';
  });

  fs.rmSync(saida, { recursive: true, force: true });
  console.log(`\n${total} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
