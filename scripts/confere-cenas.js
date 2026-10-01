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

/* ---------- A arte dos treze temas ---------- */

/*
  As cenas de paisagem sairam; no lugar entrou um objeto por tema, no estilo do
  documento de redesenho — ver `artesDosTemas`. O que este bloco guarda e o que
  importa continuar sendo verdade:

  1. **Os treze temas tem arte.** Um tema sem arte cai no icone de recuo, que e
     legivel mas quebra a grade: doze cartoes com objeto e um com um icone
     pequeno no canto le como cartao que nao carregou.
  2. **Toda arte se mexe no toque.** E a unica animacao que elas tem: o
     documento punha um laco infinito em cada uma, e treze lacos rodando num
     carrossel e o que faz uma lista engasgar ao rolar. Arte parada nao quebra
     nada — ela so deixa de responder, e ninguem repara.
*/
const ARQ_ARTES = path.join(RAIZ, 'src', 'components', 'brand', 'artesDosTemas.tsx');
const artes = fs.readFileSync(ARQ_ARTES, 'utf8');
const mapaDeArtes = artes.match(/const ARTES[^{]*\{([\s\S]*?)\n\};/);
if (!mapaDeArtes) {
  falhas += 1;
  console.log('  FALHA nao achei o mapa ARTES em artesDosTemas.tsx');
} else {
  const pares = [...mapaDeArtes[1].matchAll(/^\s+([a-z]+):\s*(\w+),/gm)];
  console.log(`\n— a arte dos temas: ${pares.length} —\n`);

  if (pares.length !== temas.length) {
    falhas += 1;
    console.log(
      `  FALHA a arte cobre ${pares.length} temas, e os temas sao ${temas.length}`,
    );
  }

  /* `temas` guarda pares {tema, cena}; aqui so interessa a chave. */
  const comArte = new Set(pares.map(([, tema]) => tema));
  for (const { tema } of temas) {
    if (!comArte.has(tema)) {
      falhas += 1;
      console.log(`  FALHA ${tema}: nao tem arte`);
    }
  }

  for (const [, tema, funcao] of pares) {
    const inicio = artes.indexOf(`function ${funcao}(`);
    if (inicio < 0) {
      falhas += 1;
      console.log(`  FALHA ${tema}: nao achei a funcao ${funcao}`);
      continue;
    }
    const proxima = artes.slice(inicio + 1).search(/\nfunction [A-Z]|\nconst ARTES/);
    const corpo = artes.slice(inicio, proxima < 0 ? undefined : inicio + 1 + proxima);
    const usos = (corpo.match(/curva\(p[,)]/g) || []).length;
    if (usos === 0) {
      falhas += 1;
      console.log(`  FALHA ${tema}: a arte nao usa o passo — ela nao se mexe no toque`);
    } else {
      console.log(`  ok    ${tema.padEnd(16)} ${usos} uso(s) do passo`);
    }
  }
}

const ARQ_CARTAO = path.join(RAIZ, 'src', 'components', 'brand', 'PracticeTopicCard.tsx');
const cartao = fs.readFileSync(ARQ_CARTAO, 'utf8');
const numero = (nome) => {
  const m = cartao.match(new RegExp(`${nome}\\s*=\\s*(\\d+)`));
  return m ? Number(m[1]) : null;
};
const comObjeto = (numero('ALTURA_NA_GRADE') ?? 0) + (numero('SOBRA_DO_DESENHO') ?? 0);
const comCenario = (numero('ALTURA_COM_CENARIO') ?? 0) + (numero('RESPIRO_DO_CENARIO') ?? 0);
console.log('\n— a caixa dos dois formatos de cartão —\n');
if (comObjeto > 0 && comObjeto === comCenario) {
  console.log(`  ok    objeto ${comObjeto} = cenário ${comCenario}`);
} else {
  falhas += 1;
  console.log(
    `  FALHA a caixa com objeto mede ${comObjeto} e a com cenário ${comCenario}: enquanto as duas formas convivem, as fileiras da grade desalinham`,
  );
}

console.log(`\n${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
