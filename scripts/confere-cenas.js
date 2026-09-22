/**
 * Confere que toda cena de tema de prática se mexe no toque.
 *
 * ## Por que
 *
 * Tocar num tema faz a cena dele se mexer antes de a tela trocar — a ampulheta
 * escorre, a chama treme, as gotas caem. É o que separa treze cartões
 * coloridos de treze coisas, e está escrito no topo de `desenhosDosTemas`.
 *
 * Só que uma cena parada **não quebra nada**: ela desenha, o cartão anima o
 * passo, a tela abre, e ninguém repara que aquele desenho foi o único que não
 * respondeu. Acrescentar detalhe a uma cena é exatamente a hora em que isso
 * acontece — o desenho novo entra sem o `p`, e o movimento some junto com o
 * trecho que foi reescrito.
 *
 * ## O que ele confere
 *
 * Para cada cena, que ela use o passo (`p`) em alguma coisa: transformação,
 * opacidade, o que for. É uma régua grossa — ela não diz se o movimento é
 * bonito —, mas pega o caso real: a cena que virou desenho estático.
 *
 * E confere que as treze existam, e que cada uma esteja no mapa que a tela lê.
 *
 * Uso: node scripts/confere-cenas.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const ARQ = path.join(RAIZ, 'src', 'components', 'brand', 'desenhosDosTemas.tsx');

const texto = fs.readFileSync(ARQ, 'utf8');

/** Os temas que a tela espera, lidos do mapa de cenas do próprio arquivo. */
/* Do `const CENAS` até o fecho: o tipo tem `=>` dentro, entao nao da para casar por `>`. */
const mapa = texto.match(/const CENAS[^{]*\{([\s\S]*?)\n\};/);
if (!mapa) throw new Error('não achei o mapa CENAS em desenhosDosTemas.tsx');
const temas = [...mapa[1].matchAll(/^\s+([a-z]+):\s*([A-Za-z]+),/gm)].map((m) => ({
  tema: m[1],
  cena: m[2],
}));

let falhas = 0;
console.log(`\n— as cenas dos temas: ${temas.length} —\n`);

for (const { tema, cena } of temas) {
  const inicio = texto.indexOf(`function ${cena}({ p }: CenaProps) {`);
  if (inicio < 0) {
    falhas += 1;
    console.log(`  FALHA ${tema}: não achei a função ${cena} recebendo o passo`);
    continue;
  }
  /* O corpo vai até a próxima função de cena, ou até o mapa. */
  const proxima = texto.slice(inicio + 1).search(/\nfunction [A-Z]|\nconst CENAS/);
  const corpo = texto.slice(inicio, proxima < 0 ? undefined : inicio + 1 + proxima);

  /* O passo é usado quando aparece como `curva(p` ou `(p,` em alguma conta. */
  const usos = (corpo.match(/curva\(p[,)]/g) || []).length + (corpo.match(/\bp\b\s*[,)]/g) || []).length;
  if (usos === 0) {
    falhas += 1;
    console.log(`  FALHA ${tema}: a cena não usa o passo — ela não se mexe no toque`);
  } else {
    console.log(`  ok    ${tema.padEnd(16)} ${usos} uso(s) do passo`);
  }
}

if (temas.length !== 13) {
  falhas += 1;
  console.log(`  FALHA o mapa tem ${temas.length} cenas, e os temas são 13`);
}

console.log(`\n${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
