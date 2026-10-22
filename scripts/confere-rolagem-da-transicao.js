/**
 * A `ScreenTransition` nunca mora dentro de uma `ScrollView`.
 *
 * ## Por que esta conferencia existe
 *
 * Porque o onboarding fez isso e cortou seis telas de uma vez.
 *
 * A `ScreenTransition` desenha as duas camadas com `StyleSheet.absoluteFill`,
 * e e de proposito: absolutas as duas, a ordem de pintura e a mesma no Android
 * e no navegador. O preco e que **filho absoluto nao tem altura no layout**.
 *
 * Posta dentro de uma `ScrollView`, ela faz o conteiner de conteudo medir
 * exatamente a altura da janela. A `ScrollView` conclui que esta tudo a vista,
 * `scrollHeight` sai igual a `clientHeight`, nao ha o que rolar, e o
 * `overflow: hidden` da transicao corta o que passa. Nao e rolagem ruim: e
 * rolagem inexistente, e some sem erro nenhum.
 *
 * Medido num iPhone X (812 menos 44 do entalhe e 34 do indicador = 734 de area
 * util), antes do conserto: nos seis passos o conteudo descia abaixo da borda
 * e `scrollHeight - clientHeight` dava zero nos seis. O Pedro viu no
 * TestFlight como "o ultimo botao esta cortado", em quatro telas diferentes.
 *
 * ## A forma certa
 *
 * Ao contrario: a transicao por fora, com altura definida, e a `ScrollView`
 * **dentro** de cada camada. Ver `OnboardingScreen`.
 *
 * Uso: node scripts/confere-rolagem-da-transicao.js
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

/** O fim da tag de abertura, pulando chaves e textos. */
function fimDaTag(txt, i) {
  let chaves = 0;
  let aspas = null;
  for (let k = i; k < txt.length; k += 1) {
    const c = txt[k];
    if (aspas) {
      if (c === aspas) aspas = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      aspas = c;
      continue;
    }
    if (c === '{') chaves += 1;
    else if (c === '}') chaves -= 1;
    else if (c === '>' && chaves === 0) return k;
  }
  return -1;
}

function varrer(pasta, achados = []) {
  for (const e of fs.readdirSync(pasta, { withFileTypes: true })) {
    const cheio = path.join(pasta, e.name);
    if (e.isDirectory()) varrer(cheio, achados);
    else if (e.name.endsWith('.tsx')) achados.push(cheio);
  }
  return achados;
}

let casos = 0;
let falhas = 0;
const detalhes = [];

for (const arq of varrer(path.join(RAIZ, 'src'))) {
  const txt = fs.readFileSync(arq, 'utf8');
  if (!txt.includes('<ScreenTransition')) continue;
  casos += 1;

  const eventos = [];
  for (const m of txt.matchAll(/<([A-Z][A-Za-z0-9_.]*)(?=[\s/>])/g)) {
    const fim = fimDaTag(txt, m.index);
    if (fim < 0) continue;
    eventos.push({ i: m.index, tipo: txt[fim - 1] === '/' ? 'sozinha' : 'abre', nome: m[1] });
  }
  for (const m of txt.matchAll(/<\/([A-Z][A-Za-z0-9_.]*)>/g)) {
    eventos.push({ i: m.index, tipo: 'fecha', nome: m[1] });
  }
  eventos.sort((a, b) => a.i - b.i);

  const pilha = [];
  for (const e of eventos) {
    if (e.tipo === 'fecha') {
      const onde = pilha.lastIndexOf(e.nome);
      if (onde >= 0) pilha.length = onde;
      continue;
    }
    if (e.nome === 'ScreenTransition' && pilha.includes('ScrollView')) {
      falhas += 1;
      detalhes.push(
        `  FALHA ${path.relative(RAIZ, arq)}:${txt.slice(0, e.i).split('\n').length}` +
          ' — `ScreenTransition` dentro de `ScrollView`: a tela não vai rolar',
      );
    }
    if (e.tipo === 'abre') pilha.push(e.nome);
  }
}

console.log(`${casos} arquivo(s) com transição de tela, ${falhas} dentro de rolagem`);
if (falhas) {
  console.log('');
  for (const d of detalhes) console.log(d);
  console.log('');
  console.log('A rolagem vai **dentro** da transição: ver o cabeçalho deste arquivo.');
  process.exit(1);
}
console.log('nenhuma transição de tela mora dentro de uma rolagem.');
process.exit(0);
