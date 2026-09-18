/**
 * Percorre a queda das palavras da faixa da Composta, quadro a quadro, para
 * cada frase — e confere que nenhuma palavra encosta em outra.
 *
 * ## O defeito que isto trava
 *
 * Em "vai dar tudo errado", o "vai" caía certo e as outras três partiam
 * juntas, com "dar" e "errado" uma por cima da outra. Eram dois defeitos: o
 * escalonamento feito por temporizadores do JavaScript, que se juntavam numa
 * travada e nunca mais se separavam, e duas colunas a dezesseis pontos uma
 * da outra. Ver `planoDaQueda`.
 *
 * O primeiro não aparece no navegador — ele depende de o JavaScript travar
 * no aparelho. Por isso o teste não tenta reproduzir a travada: ele confere
 * a propriedade que a torna inofensiva, que é **um relógio só**. As curvas
 * de todas as palavras são lidas no mesmo instante do mesmo relógio, e é
 * nisso que o teste mede.
 *
 * ## O que é conferido, em cada frase e em cada largura de tela
 *
 * - na primeira volta, as palavras aparecem **uma depois da outra**, na ordem
 *   da frase, e nada aparece no primeiro quadro;
 * - em nenhum instante duas palavras no ar se encostam — a caixa de cada uma
 *   é medida com o tombo daquele instante;
 * - nenhuma palavra sai pela borda da tela;
 * - a volta não tem emenda: o valor de tudo em 2 é o mesmo que em 1.
 *
 * As frases são as do repertório, lidas do arquivo — frase nova entra no
 * teste sozinha — e mais algumas feitas para quebrar a conta: palavra longa,
 * frase longa, uma palavra só.
 *
 * Uso: node scripts/testa-queda-da-composta.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

/* As mesmas contas da tela inicial e da faixa. Ver `HomeScreen` e `FaixaDaComposta`. */
const AFUNDA = 18;
const VELOCIDADE = 57;
const distanciaDaTela = (largura) => Math.round(Math.min(largura * 0.42, 172)) + AFUNDA;

const LARGURAS = [320, 360, 390, 412, 430];

/** As que o app mostra, lidas do arquivo — frase nova entra no teste sozinha. */
function frasesDoRepertorio() {
  const texto = fs.readFileSync(path.join(RAIZ, 'src', 'data', 'composta.ts'), 'utf8');
  const bloco = texto.match(/SUGESTOES_DA_COMPOSTA\s*=\s*\[([\s\S]*?)\]/);
  if (!bloco) throw new Error('não achei SUGESTOES_DA_COMPOSTA em data/composta.ts');
  return [...bloco[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

/** Feitas para quebrar a conta. */
const FRASES_DIFICEIS = [
  'desesperadamente',
  'nunca',
  'eu sou',
  'ninguém nunca vai gostar de mim de verdade',
  'irresponsabilidade constrangedora',
];

let falhas = 0;
let casos = 0;
const detalhes = [];

function falhou(onde, mensagem) {
  falhas += 1;
  if (detalhes.length < 12) detalhes.push(`  FALHA ${onde}: ${mensagem}`);
}

(async () => {
  const saida = pastaTemporaria('queda-da-composta');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');
  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'components', 'brand', 'planoDaQueda.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );
  const js = path.join(saida, 'planoDaQueda.js');
  const mjs = js.replace(/\.js$/, '.mjs');
  fs.renameSync(js, mjs);
  const Q = await import('file://' + mjs.split(path.sep).join('/'));

  const repertorio = frasesDoRepertorio();
  const frases = [...repertorio, ...FRASES_DIFICEIS];
  console.log(`— a queda das palavras: ${repertorio.length} frase(s) do repertório e ${FRASES_DIFICEIS.length} difícil(eis), em ${LARGURAS.length} larguras —\n`);

  const OPACIDADE = Q.OPACIDADE_NA_QUEDA;
  const VISIVEL = 0.05;
  const PASSO = 0.0015;

  for (const frase of frases) {
    for (const largura of LARGURAS) {
      casos += 1;
      const onde = `"${frase}" em ${largura} pt`;
      const palavras = frase.split(/\s+/).filter(Boolean);
      const distancia = distanciaDaTela(largura);
      const plano = Q.planejarQueda({ palavras, larguraDaTela: largura, distancia, velocidade: VELOCIDADE });

      const curvas = plano.palavras.map((p) => ({
        p,
        y: Q.curvaDaPalavra(p.inicio, plano.janela, [[0, 0], [1, distancia]]),
        op: Q.curvaDaPalavra(p.inicio, plano.janela, OPACIDADE),
        giro: Q.curvaDaPalavra(p.inicio, plano.janela, [[0, 0], [1, p.lado * Q.TOMBO]]),
      }));

      /* 1. A volta sem emenda. */
      for (const c of curvas) {
        for (const [nome, curva] of [['queda', c.y], ['opacidade', c.op], ['tombo', c.giro]]) {
          const um = Q.lerCurva(curva, 1);
          const dois = Q.lerCurva(curva, 2);
          if (Math.abs(um - dois) > 1e-6) falhou(onde, `${nome} de "${c.p.palavra}" tem emenda: ${um.toFixed(3)} em 1, ${dois.toFixed(3)} em 2`);
        }
      }

      /* 2. O primeiro quadro está vazio. */
      for (const c of curvas) {
        if (Q.lerCurva(c.op, 0) > VISIVEL) falhou(onde, `"${c.p.palavra}" já aparece no primeiro quadro`);
      }

      /* 3. Na primeira volta, aparecem em ordem, cada uma depois da anterior. */
      const primeira = curvas.map((c) => {
        for (let t = 0; t <= 1; t += PASSO) if (Q.lerCurva(c.op, t) > VISIVEL) return t;
        return Infinity;
      });
      for (let i = 1; i < primeira.length; i++) {
        if (!(primeira[i] > primeira[i - 1] + PASSO)) {
          falhou(onde, `"${curvas[i].p.palavra}" aparece junto com "${curvas[i - 1].p.palavra}" (t=${primeira[i].toFixed(3)} e ${primeira[i - 1].toFixed(3)})`);
        }
      }

      /* 4. Em todo instante: ninguém encosta em ninguém, e ninguém sai da tela. */
      for (let t = 0; t <= 2 + 1e-9; t += PASSO) {
        const caixas = [];
        for (const c of curvas) {
          if (Q.lerCurva(c.op, t) <= VISIVEL) continue;
          const graus = Math.abs(Q.lerCurva(c.giro, t));
          const r = (graus * Math.PI) / 180;
          const w = c.p.largura * Math.cos(r) + c.p.linha * Math.sin(r);
          const h = c.p.linha * Math.cos(r) + c.p.largura * Math.sin(r);
          const cy = Q.lerCurva(c.y, t) + c.p.linha / 2;
          const caixa = { nome: c.p.palavra, x0: c.p.centro - w / 2, x1: c.p.centro + w / 2, y0: cy - h / 2, y1: cy + h / 2 };
          if (caixa.x0 < 0 || caixa.x1 > largura) {
            falhou(onde, `"${caixa.nome}" sai pela borda (${caixa.x0.toFixed(1)} a ${caixa.x1.toFixed(1)})`);
          }
          caixas.push(caixa);
        }
        for (let a = 0; a < caixas.length; a++) {
          for (let b = a + 1; b < caixas.length; b++) {
            const A = caixas[a];
            const B = caixas[b];
            const encosta = A.x0 < B.x1 && B.x0 < A.x1 && A.y0 < B.y1 && B.y0 < A.y1;
            if (encosta) {
              falhou(onde, `"${A.nome}" e "${B.nome}" se encostam em t=${t.toFixed(3)}`);
              t = Infinity; /* um encontro por caso basta para o relatório */
              break;
            }
          }
          if (t === Infinity) break;
        }
      }
    }
  }

  detalhes.forEach((l) => console.log(l));
  console.log(`\n${casos} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})();
