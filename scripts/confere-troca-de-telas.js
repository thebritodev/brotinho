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
 *    toque. Só folha pequena pode ler: a faixa animada, o gatilho de um aviso.
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
