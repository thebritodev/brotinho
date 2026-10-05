/**
 * Nenhum `Pressable` mora dentro de outro.
 *
 * ## Por que esta conferencia existe
 *
 * Porque ja aconteceu, e com a melhor das intencoes. Na faixa da frase da tela
 * inicial, a porta das "Guardadas" era um `Pressable` dentro do `Pressable`
 * grande que desenterra a frase do dia, e havia um comentario explicando por
 * que: guardar e reler sao coisas diferentes de desenterrar, e o leitor de tela
 * precisa dos dois anuncios.
 *
 * A intencao estava certa e a execucao errada. Aninhado:
 *
 * - vira `<button>` dentro de `<button>`, que e invalido em HTML -- no
 *   navegador o React reclama de hidratacao, e foi assim que isto apareceu;
 * - **o TalkBack nao garante alcancar o botao de dentro**, entao o segundo
 *   anuncio, que era a razao inteira do aninhamento, e justamente o que se
 *   perde;
 * - e o toque pode acabar contando para os dois alvos.
 *
 * A `FaixaDaComposta` ja tinha a regra escrita por extenso -- "dois alvos
 * concentricos que fazem a mesma coisa viram dois anuncios no leitor de tela" --
 * e mesmo assim o outro arquivo fez o contrario. Regra que mora so num
 * comentario e regra que um dia alguem contraria sem saber.
 *
 * ## A forma certa
 *
 * Alvos irmaos, nao aninhados: o grande fica atras, vazio, e o conteudo vem
 * numa camada por cima com `pointerEvents="box-none"`, deixando o toque passar
 * -- menos onde houver o alvo pequeno, que e irmao. Ver `FaixaDaFrase`.
 *
 * Uso: node scripts/confere-alvos-de-toque.js
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

/*
  Um alvo de toque nao e so um `<Pressable>`.

  A primeira versao desta conferencia procurava `<Pressable>` dentro de
  `<Pressable>`, e ela achou dois. Faltou o terceiro, que era o pior: no
  registro do diario o alvo de fora era um `<Card onPress={...}>`, e `Card` com
  `onPress` **e** uma `Pressable` por dentro. O alvo de fora ocupava o cartao
  inteiro e o de dentro tinha vinte e oito pontos.

  Entao a regra passou a ser semantica, e nao textual: neste projeto `onPress`
  quer dizer "isto e um botao". Vale para `Pressable`, `Card`, `CartaoHeroi`,
  `IconButton` e qualquer coisa que alguem escreva amanha — nenhuma lista para
  manter atualizada.
*/

/** A tag abre um alvo de toque? */
function ehAlvo(nome, corpo) {
  return nome === 'Pressable' || /\bonPress=/.test(corpo);
}

let casos = 0;
let falhas = 0;
const detalhes = [];

for (const arq of varrer(path.join(RAIZ, 'src'))) {
  const txt = fs.readFileSync(arq, 'utf8');
  if (!txt.includes('<Pressable')) continue;
  casos += 1;

  /*
    A pilha de tags, para saber quem esta dentro de quem.

    So componentes (inicial maiuscula) entram: `View`, `Text`, `Card`,
    `Pressable`. As minusculas do JSX nativo nao existem aqui.
  */
  const pilha = [];
  const eventos = [];
  for (const m of txt.matchAll(/<([A-Z][A-Za-z0-9_.]*)(?=[\s/>])/g)) {
    const fim = fimDaTag(txt, m.index);
    if (fim < 0) continue;
    eventos.push({
      i: m.index,
      tipo: txt[fim - 1] === '/' ? 'sozinha' : 'abre',
      nome: m[1],
      corpo: txt.slice(m.index, fim + 1),
    });
  }
  for (const m of txt.matchAll(/<\/([A-Z][A-Za-z0-9_.]*)>/g)) {
    eventos.push({ i: m.index, tipo: 'fecha', nome: m[1] });
  }
  eventos.sort((a, b) => a.i - b.i);

  const acusa = (e, fora) => {
    falhas += 1;
    detalhes.push(
      `  FALHA ${path.relative(RAIZ, arq)}:${txt.slice(0, e.i).split('\n').length}` +
        ` — <${e.nome}> é alvo de toque dentro de <${fora}>`,
    );
  };
  const foraDeTudo = () => pilha.find((t) => t.alvo);

  for (const e of eventos) {
    if (e.tipo === 'fecha') {
      const onde = pilha.map((t) => t.nome).lastIndexOf(e.nome);
      if (onde >= 0) pilha.length = onde;
      continue;
    }
    const alvo = ehAlvo(e.nome, e.corpo);
    if (alvo) {
      const fora = foraDeTudo();
      if (fora) acusa(e, fora.nome);
    }
    if (e.tipo === 'abre') pilha.push({ nome: e.nome, alvo });
  }
}

console.log(`${casos} arquivo(s) com alvo de toque, ${falhas} aninhamento(s)`);
if (falhas) {
  console.log('');
  for (const d of detalhes) console.log(d);
  console.log('');
  console.log('Alvos irmãos, não aninhados: ver o cabeçalho deste arquivo e `FaixaDaFrase`.');
  process.exit(1);
}
console.log('nenhum alvo de toque mora dentro de outro.');
process.exit(0);
