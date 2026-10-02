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

/* ---------- 2. O céu da faixa é o céu fixo ---------- */

const faixa = ler('src', 'components', 'brand', 'FaixaDaComposta.tsx');

confere(
  'FaixaDaComposta',
  /from '\.\/ceuDaComposta'/.test(faixa),
  'a faixa não usa mais `ceuDaComposta` — o céu voltou a anoitecer junto com o app',
);
/*
  O degradê do céu deixou de ser três constantes e virou três paradas que saem
  do humor de hoje — ver `ceuDoHumor`. A regra que importa não mudou: elas
  continuam fora do tema. Quem garante isso agora é a conferência de
  `ceuDoHumor.ts` logo acima, que proíbe `useTema` e o import do gancho; aqui
  fica só a forma, para o degradê não voltar a ser escrito à mão com `colors`.
*/
for (const [oQue, marca, quantas] of [
  ['o degradê do céu', /stopColor=\{ceu\.(alto|meio|baixo)\}/g, 3],
  ['os morros', /stopColor=\{MORRO\}/g, 3],
  /*
    As nuvens deixaram de ser degradê e viraram a nuvem recortada da `Cena` —
    uma `View` que anda, e não um `Stop` dentro do `Svg`. A cor continua sendo
    a fixa, só que entregue por propriedade.
  */
  ['as nuvens', /cor=\{NUVEM\}/g, 1],
]) {
  confere('FaixaDaComposta', (faixa.match(marca) || []).length >= quantas, `${oQue} deixou de usar a cor fixa`);
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
/*
  O balão de fala é o caso em que a regra escorrega para o **fundo**.

  A letra já era fixa, e por isso ninguém olhava duas vezes: o `BalaoDoBroto`
  se pinta com `colors.surface`, que no escuro é quase preto. Resultado: texto
  quase preto dentro de uma caixa quase preta, em cima de um céu claro. O
  `tom="noCeu"` é o branco que não anoitece — ver `BALAO_NO_CEU`.
*/
confere(
  'FaixaDaComposta',
  /* Dentro da abertura da tag, e não em qualquer lugar do arquivo: o
     comentário logo acima dela cita o nome do tom, e um `includes` solto
     passaria com o comentário e a propriedade apagada. */
  !/<BalaoDoBroto/.test(faixa) || /<BalaoDoBroto[^>]*tom="noCeu"/.test(faixa),
  'o balão de fala do broto perdeu o `tom="noCeu"`: no escuro ele fica preto com o texto fixo escuro dentro',
);

/*
  A emenda entre o céu e a terra.

  A terra é uma curva: no meio ela sobe bem acima da crista, nas pontas ela
  entra uns dez pontos abaixo dela. O céu terminava quatro pontos abaixo da
  crista, e entre o fim de um e o começo da outra sobrava um triângulo em cada
  borda que ninguém pintava. No navegador aparecia o creme do fundo e ninguém
  notou; no Android aparecia preto, e foi assim que o Pedro viu.

  O que esta conferência cobra é que a altura do céu continue **saindo da
  curva**, e não de um número escolhido. Um número volta a divergir no dia em
  que alguém mexer na curva — que é exatamente como o defeito nasceu.
*/
confere(
  'FaixaDaComposta',
  faixa.includes('const EMENDA =')
    && faixa.includes('Math.max(CURVA_DA_TERRA.BORDA_ESQUERDA, CURVA_DA_TERRA.BORDA_DIREITA)'),
  'a emenda do céu com a terra virou número solto: ela tem de sair da própria curva',
);
confere(
  'FaixaDaComposta',
  (faixa.match(/crista \+ EMENDA/g) || []).length >= 3,
  'o céu não desce mais até a emenda: volta o vão preto nas duas pontas',
);
/* A curva é escrita uma vez e usada pelo preenchimento e pelo fio do alto. */
confere(
  'FaixaDaComposta',
  (faixa.match(/CRISTA_DA_TERRA\(largura\)/g) || []).length >= 2,
  'o alto da terra voltou a ser escrito duas vezes: as duas cópias divergem',
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
/*
  Uma pastilha, e não duas: o sininho saiu. Os lembretes moram dentro das
  configurações, e o documento desenha um botão só no canto do céu.
*/
confere(
  'HomeScreen',
  (home.match(/background=\{VIDRO_NO_CEU\}/g) || []).length === 1,
  'a pastilha do cabeçalho não tem mais o vidro claro',
);
confere(
  'HomeScreen',
  !/name="bell"/.test(home),
  'o sininho voltou para a tela inicial: o caminho dos lembretes é dentro das configurações',
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
