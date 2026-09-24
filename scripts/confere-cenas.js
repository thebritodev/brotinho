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

/* ---------- Os temas que já viraram cenário ---------- */

/*
  As treze estão sendo refeitas uma a uma, de objeto para lugar, em
  `cenariosDosTemas`. O que vale lá vale igual: cena parada não quebra nada, ela
  só deixa de responder ao toque e ninguém repara.

  E vale uma regra a mais, que é o que deixa a travessia acontecer sem a grade
  desalinhar: a caixa de um cartão com cenário tem de medir exatamente o mesmo
  que a de um cartão com objeto. Enquanto as duas formas convivem numa fileira,
  é essa soma que segura as fileiras batendo.
*/
const ARQ_CENARIOS = path.join(RAIZ, 'src', 'components', 'brand', 'cenariosDosTemas.tsx');
const cenarios = fs.readFileSync(ARQ_CENARIOS, 'utf8');
const mapaDeCenarios = cenarios.match(/const CENARIOS[^{]*\{([\s\S]*?)\n\};/);
if (!mapaDeCenarios) {
  falhas += 1;
  console.log('  FALHA não achei o mapa CENARIOS em cenariosDosTemas.tsx');
} else {
  const pares = [...mapaDeCenarios[1].matchAll(/^\s+([a-z]+):\s*(\w+),/gm)];
  console.log(`\n— os temas que já viraram cenário: ${pares.length} —\n`);
  for (const [, tema, funcao] of pares) {
    const inicio = cenarios.indexOf(`function ${funcao}(`);
    if (inicio < 0) {
      falhas += 1;
      console.log(`  FALHA ${tema}: não achei a função ${funcao}`);
      continue;
    }
    const proxima = cenarios.slice(inicio + 1).search(/\nfunction [A-Z]|\nconst CENARIOS/);
    const corpo = cenarios.slice(inicio, proxima < 0 ? undefined : inicio + 1 + proxima);
    const usos = (corpo.match(/curva\(p[,)]/g) || []).length;
    if (usos === 0) {
      falhas += 1;
      console.log(`  FALHA ${tema}: a cena não usa o passo — ela não se mexe no toque`);
    } else {
      console.log(`  ok    ${tema.padEnd(16)} ${usos} uso(s) do passo`);
    }
  }

  /*
    Nada atravessa a borda de um cartão com cenário: ele é uma janela, e o que
    se vê por ela acaba nela. Um desenho irmão pendurado embaixo do cartão é
    justamente o que foi tirado — ele lia como sobra, e não como "apoiado na
    tela".
  */
  if (/SobraDoCenario/.test(cenarios)) {
    falhas += 1;
    console.log('  FALHA voltou a existir desenho fora da janela — o cenário tem de caber no cartão');
  }
}

/* A soma das duas caixas, lida do próprio cartão. */
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
