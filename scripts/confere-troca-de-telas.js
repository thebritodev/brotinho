/**
 * Confere que a troca de tela continua sem travada e sem corte seco.
 *
 * ## Por que existe
 *
 * Esta é a quinta vez que a mesma queixa é consertada: "de tela em tela dá uma
 * travada e um corte seco, a transição não está fluida". As quatro anteriores
 * consertaram e voltaram, e voltaram porque **nenhuma das regras que consertam
 * isso quebra alguma coisa quando é violada**. O app abre, as telas trocam,
 * nada dá erro, nenhum tipo reclama, a bateria de testes passa inteira. Só
 * fica ruim — e ruim só aparece no aparelho, depois do commit.
 *
 * Então o que este arquivo guarda não é comportamento: é a **forma** do código
 * nos quatro lugares onde a travada nasce. Medido no navegador com a CPU
 * desacelerada quatro vezes, para parecer um celular médio:
 *
 * | o que fazia | linha travada |
 * | ----------- | ------------- |
 * | montar a aba de destino no toque | 899 ms, e zero quadros de animação |
 * | ler o contexto no alto de uma tela | 140 ms, dentro da animação |
 * | virar o "quem se mexe" no começo da troca | 140 ms, dentro da animação |
 * | redesenhar a tela empilhada que está saindo | 215 ms, em cima do deslize |
 *
 * E uma que não é travada, é **o piscar**: trocar as abas com uma dissolução
 * mostra, por 220 ms, duas telas inteiras uma dentro da outra — a terra escura
 * da Início lavando por cima do claro do Brotinho. Por isso nenhuma camada
 * pode ser translúcida.
 *
 * ## O que ele confere
 *
 * 1. as abas não dividem um lugar na árvore: o `MainTabs` desenha as três pela
 *    `AbasVivas`, e não uma por vez numa `ScreenTransition` com chave;
 * 2. o elemento de cada aba é congelado num `useMemo` — refeito a cada render,
 *    abrir uma prática redesenharia as três abas por baixo;
 * 3. a `AbasVivas` desenha a **lista** de abas montadas, e não só a ativa;
 * 4. o "quem pode se mexer" vira no fim da troca, e não junto com o `anterior`;
 * 5. a `CamadaEmpilhada` congela a tela de dentro em vez de chamar `render` no
 *    JSX, e a cobertura da aba é avisada por ela no fim da animação, em vez de
 *    sair direto de `sub !== null`;
 * 6. **nenhum corpo de tela lê `useCoberta` ou `useAbaAVista`** — quem lê um
 *    contexto é redesenhado quando ele muda, e os dois mudam no instante de um
 *    toque. Só folha pequena pode ler: a faixa animada, o gatilho de um aviso;
 * 7. a `ScreenTransition` desenha **a tela que sai**, e nenhuma das camadas da
 *    troca anima opacidade.
 *
 * ## A sexta vez, e o que ela acrescentou
 *
 * As cinco primeiras consertaram a travada. A sexta era o que sobrava depois
 * dela: a `ScreenTransition` animava só quem chega. A tela velha sumia no
 * mesmo quadro do toque, e sumir num quadro é a definição de corte seco, por
 * mais suave que seja a entrada — não adianta a metade boa quando falta a
 * outra. Media-se nove a dezesseis quadros de animação e a queixa continuava,
 * porque o que a pessoa via era metade de uma transição.
 *
 * Junto veio o **piscar** de novo, e no único lugar que ainda o tinha: a
 * `CamadaEmpilhada` entrava esmaecendo de zero a um. Congelado o meio da
 * animação no navegador, liam-se as duas telas ao mesmo tempo — o cabeçalho
 * das Configurações escrito por cima do "Oi, Pedro". É a mesma regra das abas:
 * nenhuma camada de troca pode ser translúcida.
 *
 * Uso: node scripts/confere-troca-de-telas.js
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

const ler = (...partes) => {
  const arq = path.join(RAIZ, ...partes);
  if (!fs.existsSync(arq)) {
    console.log(`não achei ${partes.join('/')} — a troca de tela mudou de casa?`);
    process.exit(1);
  }
  return fs.readFileSync(arq, 'utf8');
};

console.log('— a troca de tela —\n');

/* ---------- 1 e 2: as abas, no MainTabs ---------- */

const mainTabs = ler('src', 'navigation', 'MainTabs.tsx');

confere(
  'MainTabs',
  /<AbasVivas\b/.test(mainTabs),
  'as abas não passam mais pela `AbasVivas` — sem ela, ir para outra aba monta a tela de destino inteira dentro do toque',
);
confere(
  'MainTabs',
  !/transitionKey=\{tab\}/.test(mainTabs),
  'a aba voltou para uma `ScreenTransition` com chave: trocar a chave desmonta a aba que está e monta a outra do zero',
);
confere(
  'MainTabs',
  /const abas = useMemo\(/.test(mainTabs),
  'o elemento de cada aba não está congelado num `useMemo`: refeito a cada render, abrir uma prática redesenha as três abas por baixo',
);
/* A forma da declaração, e não a menção: um comentário pode citar o nome antigo. */
confere(
  'MainTabs',
  !/\bconst renderTab = /.test(mainTabs),
  'voltou a existir um `renderTab`, que desenha a aba a cada render em vez de lê-la do mapa congelado',
);
confere(
  'MainTabs',
  /<ProvedorDeCobertura value=\{coberta\}/.test(mainTabs),
  'a cobertura voltou a sair direto de `sub`: assim ela vira no toque, e o redesenho de quem a lê cai dentro do deslize',
);
confere(
  'MainTabs',
  /aoCobrir=\{setCoberta\}/.test(mainTabs),
  'a `CamadaEmpilhada` não avisa mais quando cobriu a aba — ver o `aoCobrir` dela',
);

/* ---------- 3 e 4: a AbasVivas ---------- */

const abasVivas = ler('src', 'components', 'AbasVivas.tsx');

confere(
  'AbasVivas',
  /\bnoAr\.map\(/.test(abasVivas),
  'a `AbasVivas` não desenha mais a lista de abas montadas — desenhando só a ativa, ela volta a ser uma troca que desmonta',
);
confere(
  'AbasVivas',
  /proximasMontadas\(/.test(abasVivas) && /proximaAAquecer\(/.test(abasVivas),
  'a `AbasVivas` deixou de usar as regras de `regrasDasAbas` — elas são o que o `testa-abas-vivas` guarda',
);
/*
  Nenhuma camada pode esmaecer. Foi assim que a troca de aba comecou: uma
  dissolução, que tirou a travada e trouxe o piscar — duas telas inteiras uma
  dentro da outra por 220 ms. A opacidade de uma camada vem da regra, que só
  devolve 0 ou 1; ligá-la ao relógio da animação traz o piscar de volta.
*/
confere(
  'AbasVivas',
  /opacity: camada\.opacidade,/.test(abasVivas),
  'a opacidade da camada não vem mais da regra — só a regra garante que ela seja sempre 0 ou 1',
);
confere(
  'AbasVivas',
  !/opacity:[^,\n]*\bt\b/.test(abasVivas),
  'a camada voltou a esmaecer com o relógio da animação: duas telas translúcidas aparecem uma dentro da outra, que é o piscar',
);
/*
  O "quem se mexe" não pode virar no mesmo instante que o `anterior`.

  Virando junto, o contexto muda no começo da troca, as folhas animadas
  redesenham, e os 140 ms disso caem dentro dos 220 ms do esmaecer.
*/
const juntoComOAnterior = /setAnterior\(saindo\);[\s\S]{0,200}?setSeMexendo\(/.test(abasVivas);
confere(
  'AbasVivas',
  !juntoComOAnterior,
  'o `setSeMexendo` voltou para o começo da troca, junto com o `setAnterior`: o redesenho das folhas animadas volta para dentro da animação',
);
confere(
  'AbasVivas',
  /setSeMexendo\(/.test(abasVivas),
  'ninguém mais liga de volta o "quem se mexe": as abas ficariam todas paradas',
);
/*
  O `InteractionManager` parece o lugar certo para o aquecimento e não é: neste
  app ele nunca roda. `Animated.timing` nasce com `isInteraction` ligado, e a
  faixa da Composta roda um laço que não acaba — a fila do InteractionManager
  fica parada para sempre. O aquecimento simplesmente não acontecia, sem erro
  nenhum na tela, e a primeira troca de aba voltava a pagar a montagem inteira.
*/
/* A chamada, e não a menção: o comentário que explica isto cita o nome. */
confere(
  'AbasVivas',
  !/InteractionManager\.\w+\(/.test(abasVivas),
  'o aquecimento voltou para o `InteractionManager`, que nunca roda enquanto houver um `Animated.loop` sem `isInteraction: false` no app',
);

/*
  A revelacao em circulo precisa durar o bastante para ser vista.

  Ela ja estava escrita e rodando quando o Pedro pediu "adicione a animacao
  circular": em 220 ms — o numero herdado da dissolucao — o circulo atravessa
  os 850 pontos de diagonal da tela e o que se ve e a tela nova aparecendo de
  uma vez, com um instante de borda curva que o olho nao registra. Uma animacao
  que ninguem ve e uma animacao que nao existe.

  O numero do documento e 720. O minimo aqui e 500, que e por onde o circulo
  comeca a ser lido como circulo.
*/
const duracaoDaTroca = Number(/const TROCA_MS = (\d+);/.exec(abasVivas)?.[1] ?? 0);
confere(
  'AbasVivas',
  duracaoDaTroca >= 500,
  `a troca de aba dura ${duracaoDaTroca || '?'} ms: curto demais para a revelacao em circulo ser vista — o documento usa 720`,
);
/*
  E ela tem de continuar sendo uma revelacao, e nao um corte.

  As duas pecas: a `JanelaRedonda`, que e o recorte que cresce, e a leitura de
  `camada.revela`, que e quem decide que a aba que chega entra recortada. Sem
  uma delas a troca volta a ser a aba nova aparecendo inteira de uma vez.
*/
confere(
  'AbasVivas',
  /<JanelaRedonda/.test(abasVivas) && /camada\.revela/.test(abasVivas),
  'a `JanelaRedonda` saiu do caminho da troca: a aba que chega volta a aparecer inteira de uma vez, sem o circulo',
);

/* ---------- 10: o icone do broto nao se preenche ---------- */

/*
  No documento a aba escolhida preenche o desenho do broto. Aqui nao, e o
  pedido foi do Pedro: a 26 pontos os preenchimentos fecham os vaos entre a
  cabeca e as duas folhas, e o icone vira uma mancha verde com um tijolinho
  embaixo. Selecionado troca a tinta do traco e engrossa, como os outros dois
  icones da barra. Ver `IconeDoBroto`.
*/
const barra = ler('src', 'components', 'navigation', 'BottomNav.tsx');
const corpoDoIcone = barra.slice(
  barra.indexOf('function IconeDoBroto'),
  barra.indexOf('\n}\n', barra.indexOf('function IconeDoBroto')),
);
confere(
  'BottomNav (IconeDoBroto)',
  corpoDoIcone.length > 200,
  'nao achei o corpo do `IconeDoBroto` — a varredura esta olhando no lugar errado',
);
confere(
  'BottomNav (IconeDoBroto)',
  !/fill=\{[^}]*ativa/.test(corpoDoIcone),
  'o icone do broto voltou a se preencher quando a aba esta escolhida: a 26 pontos os vaos entre a cabeca e as folhas fecham, e sobra uma mancha verde',
);
confere(
  'BottomNav (IconeDoBroto)',
  /ativa \? colors\.primaryStrong/.test(corpoDoIcone),
  'o traco do icone do broto nao muda mais de cor quando a aba esta escolhida — sem preenchimento e sem isto, nada distingue a aba aberta',
);

/* ---------- 5: a CamadaEmpilhada ---------- */

const camada = ler('src', 'components', 'CamadaEmpilhada.tsx');

confere(
  'CamadaEmpilhada',
  !/\{render\(mostrada\)\}/.test(camada),
  'a tela empilhada voltou a ser desenhada no JSX: ela é redesenhada inteira no toque do Voltar, em cima do deslize de saída',
);
confere(
  'CamadaEmpilhada',
  /desenhada\.current/.test(camada),
  'a tela empilhada não está mais congelada entre renders',
);
confere(
  'CamadaEmpilhada',
  /aoCobrir\(true\)/.test(camada) && /aoCobrir\(false\)/.test(camada),
  'a camada não avisa mais os dois lados da cobertura',
);

/* ---------- 7: a que sai anda, e ninguém é translúcido ---------- */

const transicao = ler('src', 'components', 'ScreenTransition.tsx');

confere(
  'ScreenTransition',
  /testID="transicao-que-sai"/.test(transicao),
  'a transição não desenha mais a tela que sai: ela volta a sumir num quadro só, que é o corte seco',
);
confere(
  'ScreenTransition',
  /\{noDeSaida\.current\}/.test(transicao),
  'a tela que sai deixou de ser o elemento congelado do quadro anterior — desse jeito ela é montada de novo dentro do toque',
);
confere(
  'ScreenTransition',
  /key=\{String\(saindo\)\}/.test(transicao) && /key=\{String\(transitionKey\)\}/.test(transicao),
  'as duas camadas perderam a `key`: sem ela o React remonta a que sai em vez de reconhecê-la',
);
confere(
  'ScreenTransition',
  !/opacity: t\b/.test(transicao),
  'a transição voltou a animar opacidade: duas telas inteiras uma dentro da outra por um quinto de segundo',
);
confere(
  'CamadaEmpilhada',
  !/opacity: t\b/.test(camada),
  'a camada empilhada voltou a entrar esmaecendo, e com ela o piscar de duas telas ao mesmo tempo',
);
confere(
  'CamadaEmpilhada',
  /backgroundColor: colors\.bg/.test(camada),
  'a camada empilhada ficou sem fundo próprio: sem ele, opaca ou não, o que está por baixo aparece',
);

/* ---------- 8: uma gramatica so ---------- */

/*
  Toda troca do app anda na horizontal, na mesma distancia e no mesmo tempo, e
  o lado sai da **ordem** das telas em vez de ser escolhido a mao em cada
  `return`. Era a mao que produzia as quatro gramaticas: um `mode="sobe"` aqui,
  um `forward` ali, e passos que nao se mexiam porque nenhum `return` tinha
  transicao nenhuma.
*/
confere(
  'ScreenTransition',
  /* A forma do codigo, e nao a mencao: o comentario que conta a historia cita o nome. */
  !/\|\s*'sobe'/.test(transicao) && !/mode = 'sobe'/.test(transicao),
  'voltou a existir um modo que nao desliza na horizontal — e ele ao lado de uma aba que desliza a tela inteira e o que se le como "cada tela faz uma coisa"',
);
confere(
  'ScreenTransition',
  /FRACAO_DO_DESLIZE/.test(transicao) && /DURACAO_DA_TROCA/.test(transicao),
  'a transicao voltou a ter numeros proprios em vez dos de `regrasDaTroca`',
);
confere(
  'CamadaEmpilhada',
  /FRACAO_DO_DESLIZE/.test(camada) && /DURACAO_DA_TROCA/.test(camada),
  'a camada empilhada voltou a ter deslize e duracao proprios, parecidos com os das telas mas diferentes',
);

/*
  E nenhuma tela escolhe o lado na mao: quem passa `ordem` deixa a decisao com
  a regra, e quem passa `mode` decide sozinho — foi assim que um passo da
  Composta subia enquanto o vizinho deslizava.
*/
const TELAS_QUE_TROCAM = [
  ['screens', 'app', 'PracticesScreen.tsx'],
  ['screens', 'app', 'SettingsScreen.tsx'],
  ['screens', 'app', 'PrivacyScreen.tsx'],
  ['screens', 'composta', 'CompostaScreen.tsx'],
  ['screens', 'practices', 'PracticeDetailScreen.tsx'],
  ['navigation', 'RootNavigator.tsx'],
];
for (const partes of TELAS_QUE_TROCAM) {
  const texto = ler('src', ...partes);
  const nome = partes[partes.length - 1].replace('.tsx', '');
  confere(
    nome,
    !/<ScreenTransition[^>]*mode=/.test(texto),
    'esta tela voltou a escolher o lado da troca na mao, em vez de declarar a `ordem` das telas dela',
  );
  confere(
    nome,
    /ordem=\{/.test(texto),
    'esta tela nao declara mais a ordem das suas telas — sem ela, voltar entra pelo mesmo lado de avancar',
  );
}

/* ---------- 9: a cena do cartão para quando a tela assume ---------- */

const toque = ler('src', 'hooks', 'useToqueAnimado.ts');

confere(
  'useToqueAnimado',
  /ONDE_A_TELA_COMECA\b/.test(toque),
  'o toque voltou a navegar só no fim da cena: 350 ms de cartão, depois a tela — dois movimentos em fila, e o vão entre eles é lido como corte',
);
confere(
  'useToqueAnimado',
  /animacao\.stop\(\)/.test(toque),
  'a cena não para mais quando a navegação sai: ela redesenha o cartão a cada quadro enquanto a tela de destino monta, e as duas disputam a mesma linha',
);

/* ---------- 6: contexto só em folha ---------- */

/** Os dois contextos que mudam no instante de um toque. */
const CONTEXTOS = ['useCoberta', 'useAbaAVista'];

const telas = [];
const varrer = (pasta) => {
  for (const nome of fs.readdirSync(pasta, { withFileTypes: true })) {
    const cheio = path.join(pasta, nome.name);
    if (nome.isDirectory()) varrer(cheio);
    else if (nome.name.endsWith('.tsx')) telas.push(cheio);
  }
};
varrer(path.join(RAIZ, 'src', 'screens'));

confere('telas', telas.length > 20, `achei só ${telas.length} telas — a varredura está olhando no lugar errado`);

for (const arq of telas) {
  const texto = fs.readFileSync(arq, 'utf8');
  if (!CONTEXTOS.some((c) => texto.includes(c))) continue;
  const linhas = texto.split(/\r?\n/);
  const curto = path.relative(RAIZ, arq).split(path.sep).join('/');

  /*
    O corpo de cada componente exportado: da linha do `export function` até a
    primeira linha que é só `}`. Componentes pequenos declarados antes dele —
    o `GatilhoDaCelebracao`, o `BrotoDaAba` — ficam de fora, que é o ponto: ler
    o contexto neles redesenha um componente que devolve `null` ou um desenho.
  */
  for (let i = 0; i < linhas.length; i += 1) {
    if (!/^export (default )?function /.test(linhas[i])) continue;
    const nome = linhas[i].match(/function (\w+)/)?.[1] ?? '?';
    let fim = i + 1;
    while (fim < linhas.length && linhas[fim] !== '}') fim += 1;
    const corpo = linhas.slice(i, fim).join('\n');
    for (const contexto of CONTEXTOS) {
      confere(
        `${curto} (${nome})`,
        !new RegExp(`\\b${contexto}\\(`).test(corpo),
        `o corpo da tela chama \`${contexto}()\`: a tela inteira é redesenhada quando a resposta muda, que é no instante de um toque — leia numa folha pequena, como a \`FaixaDaComposta\` faz`,
      );
    }
    i = fim;
  }
}

console.log(`${casos} conferências, ${falhas} falha(s)`);
if (falhas) {
  console.log('');
  for (const d of detalhes) console.log(d);
  console.log('');
  console.log('Ver `AbasVivas`, `CamadaEmpilhada` e `regrasDasAbas` para o porquê de cada regra.');
  process.exit(1);
}
console.log('a troca de tela não monta nada, não redesenha nada e não lê contexto no lugar errado.');
process.exit(0);
