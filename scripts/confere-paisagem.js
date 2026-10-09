/**
 * Confere que a paisagem da tela inicial não segue o tema — e que nada do que
 * está desenhado em cima dela segue.
 *
 * ## A regra
 *
 * O alto da tela inicial é uma paisagem: céu, morros, nuvens, terra, broto. Ela
 * tem luz própria e é a mesma de dia e de noite. As cores vêm de
 * `ceuDaComposta` e `terraDoCanteiro`, que são constantes e não olham para o
 * tema.
 *
 * A consequência é a parte que escorrega: **tudo o que fica em cima da
 * paisagem herda a regra**. A saudação, as pastilhas do cabeçalho e as
 * palavras que caem ficam sobre o céu; o título, a linha e o convite ficam
 * sobre a terra. Um `colors.textPrimary` em qualquer um deles parece o certo —
 * é o que se escreve em todo o resto do app — e é exatamente o erro: no escuro
 * ele vira creme, e creme sobre o céu claro é texto que não existe.
 *
 * ## Por que um script, e não confiar na revisão
 *
 * Porque nada quebra. O app compila, o tipo fecha, a tela abre, a bateria
 * passa inteira. O defeito só aparece para quem abrir o app no tema escuro, e
 * só naquela faixa — que é a primeira coisa que a pessoa vê.
 *
 * O `confere-contraste.js` mede se os pares **escolhidos** têm contraste. Este
 * confere se são esses os pares que estão ligados na tela.
 *
 * Uso: node scripts/confere-paisagem.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

let falhas = 0;
let casos = 0;
const detalhes = [];

function confere(onde, condicao, mensagem) {
  casos += 1;
  if (condicao) return;
  falhas += 1;
  detalhes.push(`  FALHA ${onde}: ${mensagem}`);
}

function ler(...partes) {
  const arq = path.join(RAIZ, ...partes);
  if (!fs.existsSync(arq)) {
    console.log(`não achei ${partes.join('/')} — a paisagem mudou de casa?`);
    process.exit(1);
  }
  return fs.readFileSync(arq, 'utf8');
}

console.log('— a paisagem da tela inicial —\n');

/* ---------- 1. As duas paletas da paisagem não olham para o tema ---------- */

for (const arquivo of ['ceuDaComposta.ts', 'terraDoCanteiro.ts', 'ceuDoHumor.ts']) {
  const texto = ler('src', 'components', 'brand', arquivo);
  /*
    `ceuDoHumor` importa de `theme/tokens`, e tem de importar: as cores dos
    humores moram lá. O que ele não pode é importar o **gancho** — `useTema` é
    que devolve a paleta do tema em uso, e é ele que faria o céu anoitecer
    junto com o app. Importar a tabela crua é o contrário disso: é pegar a cor
    clara sempre, seja qual for o tema.
  */
  confere(
    arquivo,
    arquivo === 'ceuDoHumor.ts'
      ? !/from '\.\.\/\.\.\/theme'/.test(texto)
      : !/^import .*from .*theme/m.test(texto),
    'passou a importar do tema: estas cores existem justamente para não mudar com ele',
  );
  /* A chamada, e não a menção: o comentário que explica a regra cita o nome. */
  confere(
    arquivo,
    !/\buseTema\(/.test(texto),
    'passou a perguntar o tema: a paisagem é a mesma de dia e de noite',
  );
}

/*
  Aqui havia a seção 2: o céu e a terra da `FaixaDaComposta`.

  Ela guardava a emenda entre os dois — o vão preto que aparecia nas duas
  pontas quando o céu não descia até onde a curva da terra começava — e o fato
  de a crista ser escrita uma vez só. A faixa saiu do app com o redesenho da
  tela inicial, e com ela esses dois defeitos deixaram de ter onde acontecer: o
  cartão da Composta desenha a terra em três camadas chapadas, sem curva que
  possa divergir de si mesma.

  O que sobreviveu da ideia está na seção 4, aplicada ao cartão: a camada mais
  funda tem de ser a cor do corpo dele, que é a emenda invisível de hoje.
*/

/* ---------- 2. O cabeçalho saiu do céu ---------- */

/*
  Esta seção já cobrava o contrário, e a troca é o redesenho da tela inicial.

  Enquanto a Composta era uma faixa de borda a borda, a saudação ficava
  **dentro** do céu dela: tinha de usar `TEXTO_NO_CEU` e `VIDRO_NO_CEU`, porque
  o céu não anoitece com o app e o texto do tema sumiria lá em cima. Com a
  Composta de volta a cartão, o alto da tela é o creme de sempre — e aí a regra
  se inverte: usar as cores do céu ali escreveria marrom fixo sobre o fundo
  escuro do tema noturno.

  A conferência continua existindo, e continua cobrando a mesma ideia: **a cor
  do texto tem de combinar com o que está atrás dele**. O que mudou foi o que
  está atrás.
*/
const home = ler('src', 'screens', 'app', 'HomeScreen.tsx');

confere(
  'HomeScreen',
  !/TEXTO_NO_CEU|VIDRO_NO_CEU/.test(home),
  'o cabeçalho voltou a usar as cores do céu, e ele não fica mais em cima de um',
);
confere(
  'HomeScreen',
  !/name="bell"/.test(home),
  'o sininho voltou para a tela inicial: o caminho dos lembretes é dentro das configurações',
);

/* ---------- 3. O céu que sobrou, dentro do cartão ---------- */

/*
  As palavras da Composta continuam caindo por um céu que não segue o tema —
  ele é paisagem, e paisagem tem luz própria. Elas são a única coisa escrita em
  cima dele agora, e por isso são a única que ainda precisa de `TEXTO_NO_CEU`.
*/
const cartao = ler('src', 'components', 'brand', 'CartaoDaComposta.tsx');

confere(
  'CartaoDaComposta',
  /color: TEXTO_NO_CEU/.test(cartao),
  'as palavras caindo voltaram a seguir o tema, e o céu por onde elas caem não segue',
);
/*
  A camada mais funda da terra é a cor do corpo do cartão. É o que faz a
  ilustração não terminar numa borda: o chão onde a palavra some é o mesmo
  marrom em que o convite está escrito. Trocar uma das duas por outra cor abre
  uma costura no meio do cartão.
*/
confere(
  'CartaoDaComposta',
  (cartao.match(/palette\.brown700/g) || []).length >= 2,
  'a terra funda deixou de ser a cor do cartão: aparece uma emenda entre a cena e o texto',
);
/*
  O texto sobre a terra do cartão usa os dois tons já medidos em
  `terraDoCanteiro` — que são os que `confere-contraste` conhece. Escrever
  creme à mão ali tiraria o par de cores do alcance daquela régua.
*/
confere(
  'CartaoDaComposta',
  /TEXTO_NA_TERRA/.test(cartao) && /TEXTO_NA_TERRA_FRACO/.test(cartao),
  'o convite da Composta deixou de usar os tons medidos da terra',
);

/* ---------- 4. A barra de status ---------- */

/*
  Ela deixou de precisar de ajuste. A `BarraSobreOCeu` existia porque o céu
  claro encostava no alto da tela e, no tema escuro, o relógio branco sumia
  dentro dele. O alto da tela agora é o fundo do app, que acompanha o tema — e
  forçar ícones escuros ali deixaria o relógio invisível à noite, que é
  exatamente o defeito de antes, do outro lado.
*/
confere(
  'HomeScreen',
  !/BarraSobreOCeu|setStatusBarStyle\(/.test(home),
  'a tela inicial voltou a forçar o estilo da barra de status: o alto dela segue o tema agora',
);

console.log(`${casos} conferências, ${falhas} falha(s)`);
if (falhas) {
  console.log('');
  for (const d of detalhes) console.log(d);
  console.log('');
  console.log('Ver `ceuDaComposta` e `terraDoCanteiro` para o porquê da regra.');
  process.exit(1);
}
console.log('céu e terra têm luz própria, e o que está em cima deles também.');
process.exit(0);
