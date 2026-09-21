/**
 * Confere o adubo da Composta: a palavra pousa, vira grãos, a seiva sobe pela
 * raiz e o broto dá o estirão — tudo no relógio das palavras. Ver
 * `aduboDaComposta`.
 *
 * ## O que é conferido
 *
 * Primeiro a conta da virada do relógio, sozinha (`curvaDoEvento`), com eventos
 * sorteados em todo o relógio:
 *
 * - a entrada da curva nunca volta para trás — o `Animated` recusa a que volta;
 * - na primeira volta nada acontece antes do começo do evento: nenhuma palavra
 *   pousou ainda;
 * - o valor em 2 é o mesmo do começo do laço em 1 — o laço não tem emenda.
 *
 * Depois o plano de verdade, para cada frase do repertório, em cada largura:
 *
 * - no instante do pouso, o meio da palavra está **na superfície** do monte —
 *   lido na própria curva de queda dela, a mesma que a faixa anima;
 * - a seiva termina no pé do broto, e começa num ponto de raiz;
 * - os três tempos vêm na ordem: grãos, seiva, estirão;
 * - nenhum evento dura uma volta inteira, senão ele se sobreporia a si mesmo.
 *
 * Uso: node scripts/testa-adubo-da-composta.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');
const LARGURAS = [320, 360, 390, 412, 430];

/* As mesmas contas da tela inicial e da faixa. Ver `HomeScreen` e `FaixaDaComposta`. */
const AFUNDA = 18;
const VELOCIDADE = 57;
const PE_DO_BROTO = 46;
const COLUNA_DO_BROTO = 0.8;
const quedaDaTela = (largura) => Math.round(Math.min(largura * 0.42, 172));

function frasesDoRepertorio() {
  const texto = fs.readFileSync(path.join(RAIZ, 'src', 'data', 'composta.ts'), 'utf8');
  const bloco = texto.match(/SUGESTOES_DA_COMPOSTA\s*=\s*\[([\s\S]*?)\]/);
  if (!bloco) throw new Error('não achei SUGESTOES_DA_COMPOSTA em data/composta.ts');
  return [...bloco[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}
const FRASES_DIFICEIS = ['desesperadamente', 'nunca', 'eu sou', 'ninguém nunca vai gostar de mim de verdade'];

let falhas = 0;
let casos = 0;
const detalhes = [];
function falhou(onde, mensagem) {
  falhas += 1;
  if (detalhes.length < 14) detalhes.push(`  FALHA ${onde}: ${mensagem}`);
}

/** Compila os módulos e troca os imports sem extensão, que o Node recusa. */
function compilar(modulos) {
  const saida = pastaTemporaria('adubo-da-composta');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');
  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      ...modulos.map((m) => path.join(RAIZ, 'src', 'components', 'brand', `${m}.ts`)),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );
  for (const nome of fs.readdirSync(saida).filter((n) => n.endsWith('.js'))) {
    const de = path.join(saida, nome);
    const texto = fs
      .readFileSync(de, 'utf8')
      .replace(/from '\.\/([A-Za-z]+)'/g, "from './$1.mjs'");
    fs.writeFileSync(de.replace(/\.js$/, '.mjs'), texto);
    fs.unlinkSync(de);
  }
  return (nome) => 'file://' + path.join(saida, `${nome}.mjs`).split(path.sep).join('/');
}

(async () => {
  const url = compilar(['aduboDaComposta', 'planoDaQueda', 'raizesDoBroto', 'quedaDosFarelos']);
  const A = await import(url('aduboDaComposta'));
  const Q = await import(url('planoDaQueda'));
  const R = await import(url('raizesDoBroto'));

  /* ---------- 1. A virada do relógio, com eventos sorteados ---------- */
  console.log('— a virada do relógio —\n');
  const PULSO = [[0, 0], [0.2, 1], [0.8, 1], [1, 0]];
  const POSICAO = [[0, 10], [0.5, 40], [1, 80]];
  let semente = 7;
  const acaso = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 400; k++) {
    casos += 1;
    const comeco = acaso() * 1.7;
    const duracao = 0.05 + acaso() * 0.8;
    const pontos = k % 2 ? PULSO : POSICAO;
    const repouso = pontos[0][1];
    const curva = A.curvaDoEvento(comeco, duracao, pontos);
    const onde = `evento em ${comeco.toFixed(3)} por ${duracao.toFixed(3)}`;

    for (let i = 1; i < curva.inputRange.length; i++) {
      if (curva.inputRange[i] < curva.inputRange[i - 1]) {
        falhou(onde, `a entrada volta em ${i}`);
        break;
      }
    }
    if (curva.inputRange[0] !== 0 || curva.inputRange[curva.inputRange.length - 1] !== 2) {
      falhou(onde, 'a curva não cobre o relógio de 0 a 2');
    }
    for (let t = 0; t < Math.min(comeco, 1); t += 0.01) {
      if (Q.lerCurva(curva, t) !== repouso) {
        falhou(onde, `mexe em ${t.toFixed(2)}, antes do pouso`);
        break;
      }
    }
    /* Logo depois do 1 é o começo do laço; em 2 é o fim dele. Têm de bater. */
    const depoisDoUm = valorLogoDepois(curva, 1);
    const emDois = Q.lerCurva(curva, 2);
    if (Math.abs(depoisDoUm - emDois) > 1e-6) {
      falhou(onde, `emenda no laço: ${depoisDoUm.toFixed(3)} em 1, ${emDois.toFixed(3)} em 2`);
    }
  }

  /* ---------- 2. O plano de verdade ---------- */
  const frases = [...frasesDoRepertorio(), ...FRASES_DIFICEIS];
  console.log(`— o adubo: ${frases.length} frases em ${LARGURAS.length} larguras —\n`);

  for (const largura of LARGURAS) {
    const queda = quedaDaTela(largura);
    const distancia = queda + AFUNDA;
    const raizes = R.raizesDoBroto({
      x: largura * COLUNA_DO_BROTO,
      y: PE_DO_BROTO,
      largura,
      fundo: 222 * 0.95,
    });
    for (const frase of frases) {
      casos += 1;
      const palavras = frase.split(/\s+/).filter(Boolean);
      const plano = Q.planejarQueda({ palavras, larguraDaTela: largura, distancia, velocidade: VELOCIDADE });
      const adubo = A.planejarAdubo({ plano, queda, distancia, largura, raizes });
      const superficie = A.superficieDoMonte(largura);

      adubo.forEach((a, i) => {
        const p = plano.palavras[i];
        const onde = `${largura} pt, "${frase}", "${p.palavra}"`;

        /* No instante do pouso, o meio da palavra está na superfície. */
        const andar = Q.curvaDaPalavra(p.inicio, plano.janela, [[0, 0], [1, distancia]]);
        const topo = Q.lerCurva(andar, a.noRelogio);
        const meio = topo + p.linha / 2;
        const chao = queda - 26 + superficie(p.centro);
        if (Math.abs(meio - chao) > 1) {
          falhou(onde, `no pouso o meio da palavra está a ${(meio - chao).toFixed(1)} pt da superfície`);
        }

        const pe = a.caminho[a.caminho.length - 1];
        if (Math.abs(pe.x - largura * COLUNA_DO_BROTO) > 0.01 || Math.abs(pe.y - PE_DO_BROTO) > 0.01) {
          falhou(onde, `a seiva termina em (${pe.x.toFixed(1)}, ${pe.y.toFixed(1)}), fora do pé`);
        }
        const inicio = a.caminho[0];
        const naRaiz = raizes.slice(0, 3).some((r) => r.pontos.some((q) => q.x === inicio.x && q.y === inicio.y));
        if (!naRaiz) falhou(onde, 'a seiva não começa num ponto de raiz');

        if (!(a.graos.comeco <= a.seiva.comeco && a.seiva.comeco < a.estirao.comeco)) {
          falhou(onde, 'os três tempos estão fora de ordem');
        }
        for (const [nome, e] of [['grãos', a.graos], ['seiva', a.seiva], ['estirão', a.estirao]]) {
          if (!(e.duracao > 0 && e.duracao < 1)) falhou(onde, `${nome} dura ${e.duracao.toFixed(2)} volta(s)`);
          /* A emenda rara da primeira volta — ver `curvaDoEvento`. */
          if (e.comeco + e.duracao > 2) falhou(onde, `${nome} atravessa a virada já na primeira vez`);
        }
      });
    }
  }

  detalhes.forEach((l) => console.log(l));
  console.log(`\n${casos} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})();

/** O valor da curva logo depois de `t` — o lado direito de um salto. */
function valorLogoDepois(curva, t) {
  const { inputRange: e, outputRange: s } = curva;
  let ultimo = -1;
  for (let i = 0; i < e.length; i++) if (e[i] === t) ultimo = i;
  if (ultimo >= 0) return s[ultimo];
  for (let i = 1; i < e.length; i++) {
    if (t < e[i]) return s[i - 1] + ((s[i] - s[i - 1]) * (t - e[i - 1])) / (e[i] - e[i - 1]);
  }
  return s[s.length - 1];
}
