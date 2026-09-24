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

for (const arquivo of ['ceuDaComposta.ts', 'terraDoCanteiro.ts']) {
  const texto = ler('src', 'components', 'brand', arquivo);
  confere(
    arquivo,
    !/^import .*from .*theme/m.test(texto),
    'passou a importar do tema: estas cores existem justamente para não mudar com ele',
  );
  /* A chamada, e não a menção: o comentário que explica a regra cita o nome. */
  confere(
    arquivo,
    !/\buseTema\(/.test(texto),
    'passou a perguntar o tema: a paisagem é a mesma de dia e de noite',
  );
}

/* ---------- 2. O céu da faixa é o céu fixo ---------- */

const faixa = ler('src', 'components', 'brand', 'FaixaDaComposta.tsx');

confere(
  'FaixaDaComposta',
  /from '\.\/ceuDaComposta'/.test(faixa),
  'a faixa não usa mais `ceuDaComposta` — o céu voltou a anoitecer junto com o app',
);
for (const [oQue, marca] of [
  ['o degradê do céu', /stopColor=\{CEU_(ALTO|MEIO|BAIXO)\}/g],
  ['as nuvens', /stopColor=\{NUVEM\}/g],
  ['os morros', /stopColor=\{MORRO\}/g],
]) {
  confere('FaixaDaComposta', (faixa.match(marca) || []).length >= 3, `${oQue} deixou de usar a cor fixa`);
}
/*
  As três paradas do degradê do céu vinham de `colors`. Voltando para lá, o
  alto da tela inicial fica um bloco quase preto à noite, com as palavras
  caindo dentro dele.
*/
confere(
  'FaixaDaComposta',
  !/stopColor=\{colors\.(primarySoft|bg|surfaceSunken|surface)\}/.test(faixa),
  'o céu ou as nuvens voltaram a sair de `colors`',
);
confere(
  'FaixaDaComposta',
  !/stopColor=\{palette\./.test(faixa),
  'um dos desenhos da paisagem voltou a sair da paleta do tema',
);
/* As palavras caem **pelo** céu: elas seguem o céu, não o tema. */
confere(
  'FaixaDaComposta',
  /color: TEXTO_NO_CEU,/.test(faixa),
  'as palavras que caem não usam mais `TEXTO_NO_CEU`',
);
confere(
  'FaixaDaComposta',
  !/color: colors\.textPrimary,/.test(faixa),
  'alguma coisa desta faixa voltou a escrever com `colors.textPrimary`: sobre o céu claro, no escuro, isso é creme sobre creme',
);

/* ---------- 3. O cabeçalho mora dentro do céu ---------- */

const home = ler('src', 'screens', 'app', 'HomeScreen.tsx');

confere(
  'HomeScreen',
  /TEXTO_NO_CEU/.test(home) && /VIDRO_NO_CEU/.test(home),
  'o cabeçalho da tela inicial não usa mais as cores do céu',
);
confere(
  'HomeScreen',
  /color: TEXTO_NO_CEU, fontFamily: fonts\.display\.bold/.test(home),
  'a saudação "Oi, ..." voltou a seguir o tema, e ela fica em cima do céu claro',
);
/*
  No escuro o vidro é branco a 6%. Sobre este céu, isso é uma pastilha que não
  existe: os dois botões do cabeçalho somem e ninguém acha os lembretes nem as
  configurações.
*/
confere(
  'HomeScreen',
  (home.match(/background=\{VIDRO_NO_CEU\}/g) || []).length === 2,
  'as duas pastilhas do cabeçalho não têm mais o vidro claro',
);

/* ---------- 4. A barra de status ---------- */

/*
  No escuro ela é de ícones brancos, e o céu encosta no alto da tela: relógio e
  bateria sumiriam dentro dele. Quem pede ícones escuros enquanto a tela
  inicial está à vista é a `BarraSobreOCeu`.
*/
confere(
  'HomeScreen',
  /function BarraSobreOCeu\(\)/.test(home) && /<BarraSobreOCeu \/>/.test(home),
  'a `BarraSobreOCeu` sumiu: no escuro, o relógio e a bateria ficam brancos sobre o céu claro',
);
confere(
  'HomeScreen',
  /setStatusBarStyle\(/.test(home),
  'ninguém mais acerta o estilo da barra de status na tela inicial',
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
