#!/usr/bin/env node
/**
 * Nenhuma `View` posicionada pode medir zero por zero sem alguém saber por quê.
 *
 * ## O defeito que isto guarda
 *
 * No iPhone, o contorno em forma de pílula em cima do broto dormindo, no passo
 * do sono do onboarding. Voltou a cada build por semanas, e não aparecia no
 * navegador.
 *
 * A arquitetura nova do React Native recicla as `View` nativas: a de uma opção
 * que sai de tela é guardada e reaproveitada pela próxima `View` que precisar.
 * Ao reaproveitar, quem apaga as camadas de sombra (`boxShadow`) da dona
 * antiga é o `invalidateLayer` — e ele começa com
 *
 *     if (CGSizeEqualToSize(layer.bounds.size, CGSizeZero)) return;
 *
 * Uma `View` de tamanho zero nunca apaga nada. A caixa dos zês do broto
 * (`ArDoBroto`) era `{ position: 'absolute', left: 0, top: 0 }` com filhos
 * todos absolutos — zero por zero. Quando a peça reaproveitada para ela tinha
 * sido uma opção do onboarding, o anel de luz da sombra da opção continuava
 * desenhado, do tamanho da opção, a partir do canto do broto.
 *
 * ## A regra
 *
 * Toda `View` (ou `Animated.View`) com `position: 'absolute'` precisa dizer o
 * próprio tamanho: `width`, `height`, `right`, `bottom`, `flex`, `inset` ou
 * `StyleSheet.absoluteFill`. A exceção é a caixa que ganha tamanho de um
 * filho que ocupa lugar — um `Svg` com largura e altura, por exemplo —, e
 * essas ficam listadas abaixo, uma por uma, com o motivo. Uma caixa nova sem
 * tamanho reprova até alguém conferir e pôr aqui.
 *
 * O que esta regra não vê: o estilo que vem de uma variável, e não escrito no
 * próprio JSX. O `caixas-zero` que achou o defeito é uma sonda no navegador,
 * que mede todas as caixas de verdade; esta é a parte que cabe na bateria.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', 'src');

/**
 * As caixas sem medida que **têm** tamanho, pelo filho.
 *
 * Cada uma foi conferida: o filho dela ocupa lugar (um texto, um Svg com
 * largura e altura, um broto), e a caixa mede o que ele mede. A `marca` é um
 * trecho da tag de abertura, com os espaços normalizados; se a tag mudar, a
 * caixa reprova e precisa ser conferida de novo — que é o que se quer.
 */
const CONFERIDAS = [
  { arquivo: 'components/brand/AnimatedSprout.tsx', marca: "position: 'absolute', left: 0, top: 0 }}>",
    porque: 'o `Sprout` da cabeça dentro, um Svg com largura e altura' },
  { arquivo: 'components/brand/cenaDoDiario.tsx', marca: 'left: 30, top: 30',
    porque: 'um `Sprout` dentro, um Svg com largura e altura' },
  { arquivo: 'components/brand/PracticeTopicCard.tsx', marca: 'left: 0, top: 0 }} pointerEvents',
    porque: 'a cena do tema dentro, um Svg com largura e altura' },
  { arquivo: 'components/brand/CartaoDaComposta.tsx', marca: 'top: 14, left: 14,',
    porque: 'o selo, com o texto dentro' },
  { arquivo: 'components/brand/GradeDeTemas.tsx', marca: 'top: 10, left: 10,',
    porque: 'o selo, com o texto dentro' },
  { arquivo: 'components/brand/ProgressStem.tsx', marca: 'outputRange: [0.7, 0]',
    porque: 'o botão bege da folha, um Svg de 30 por 30' },
  { arquivo: 'components/brand/ProgressStem.tsx', marca: 'outputRange: [0, 1]',
    porque: 'a folha verde, um Svg de 30 por 30' },
  { arquivo: 'components/brand/useCompartilharFrase.tsx', marca: 'left: -STORY.largura - 100',
    porque: 'o cartão do story inteiro dentro, em tamanho cheio' },
  { arquivo: 'components/navigation/BottomNav.tsx', marca: "position: 'absolute', zIndex: 0",
    porque: 'a marca do botão central, um Svg com tamanho' },
  { arquivo: 'screens/app/ConselhosGuardadosScreen.tsx', marca: 'left: xDoBroto - quadro.largura / 2',
    porque: 'o `AnimatedSprout` dentro, com moldura própria' },
  { arquivo: 'screens/onboarding/Paywall.tsx', marca: 'top: -11, alignSelf',
    porque: 'o selo "Mais popular", com o texto dentro' },
];

const MEDIDAS = /\b(width|height|right|bottom|flex|flexGrow|inset|minWidth|minHeight)\s*:/;

function arquivos(dir) {
  const saida = [];
  for (const nome of fs.readdirSync(dir)) {
    const p = path.join(dir, nome);
    if (fs.statSync(p).isDirectory()) saida.push(...arquivos(p));
    else if (p.endsWith('.tsx')) saida.push(p);
  }
  return saida;
}

/** O literal `{{ ... }}` que começa em `inicio`, com as chaves balanceadas. */
function literalDoEstilo(texto, inicio) {
  let nivel = 0;
  for (let i = inicio; i < texto.length; i += 1) {
    if (texto[i] === '{') nivel += 1;
    else if (texto[i] === '}') {
      nivel -= 1;
      if (nivel === 0) return texto.slice(inicio, i + 1);
    }
  }
  return '';
}

function semComentarios(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

let falhas = 0;
let caixas = 0;
const usadas = new Set();

for (const arquivo of arquivos(RAIZ)) {
  const texto = fs.readFileSync(arquivo, 'utf8').replace(/\r\n/g, '\n');
  const relativo = path.relative(RAIZ, arquivo).replace(/\\/g, '/');
  const tag = /<(Animated\.)?View\b/g;
  let m;
  while ((m = tag.exec(texto))) {
    /* O fim da tag de abertura: o primeiro `>` fora de chaves. */
    let nivel = 0;
    let fim = -1;
    for (let i = m.index; i < texto.length; i += 1) {
      const c = texto[i];
      if (c === '{') nivel += 1;
      else if (c === '}') nivel -= 1;
      else if (c === '>' && nivel === 0) {
        fim = i;
        break;
      }
    }
    if (fim < 0) continue;
    const abertura = texto.slice(m.index, fim + 1);
    const s = abertura.indexOf('style={{');
    if (s < 0) continue;
    const estilo = semComentarios(literalDoEstilo(abertura, s + 'style='.length));
    if (!/position:\s*'absolute'/.test(estilo)) continue;
    if (MEDIDAS.test(estilo) || /absoluteFill/.test(estilo)) continue;

    caixas += 1;
    const linha = texto.slice(0, m.index).split('\n').length;
    const primeira = texto.slice(m.index).split('\n')[0].trim();
    const corrida = abertura.replace(/\s+/g, ' ');
    const conferida = CONFERIDAS.find((c) => c.arquivo === relativo && corrida.includes(c.marca));
    if (conferida) {
      usadas.add(conferida);
      console.log(`  ok    ${relativo}:${linha} — sem medida, mas ${conferida.porque}`);
      continue;
    }
    falhas += 1;
    console.log(`  FALHA ${relativo}:${linha} — View posicionada sem tamanho: ${primeira.slice(0, 90)}`);
  }
}

for (const c of CONFERIDAS) {
  if (!usadas.has(c)) {
    console.log(`  aviso ${c.arquivo} — a caixa conferida não existe mais; tire da lista`);
  }
}

console.log(`\n${caixas} caixa(s) posicionada(s) sem medida, ${falhas} falha(s)`);
if (falhas) {
  console.log(
    'No iPhone, uma View de tamanho zero não apaga a sombra da View nativa que ela reaproveitou.\n'
      + 'Dê a ela um tamanho (right/bottom, width/height) ou, se um filho dá o tamanho, confira e liste em CONFERIDAS.',
  );
  process.exit(1);
}
