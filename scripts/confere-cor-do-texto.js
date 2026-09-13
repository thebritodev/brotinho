/**
 * Acha `<Text>` sem cor declarada.
 *
 * O React Native não herda cor de `<View>`: um `<Text>` sem `color` no estilo
 * cai no preto padrão. No tema claro isso passa despercebido a vida inteira —
 * preto sobre creme é exatamente o que se queria, e ninguém nota que a cor
 * nunca foi escolhida.
 *
 * No tema escuro o mesmo texto continua preto e some no fundo. Nem o typecheck
 * nem os testes enxergam isso: o código está correto, o app compila, e a frase
 * simplesmente não está lá para quem abrir o app à noite.
 *
 * Uso: node scripts/confere-cor-do-texto.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', 'src');

/**
 * Arquivos que podem ter texto preto de propósito.
 *
 * O `ErrorBoundary` fica fora do provedor de tema — ele é a tela de quando
 * algo quebrou, e depender do tema para desenhá-la seria não conseguir
 * desenhá-la justamente quando o tema for o que quebrou.
 */
const PERDOADOS = new Set(['ErrorBoundary.tsx']);

const arquivos = [];
(function anda(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) anda(p);
    else if (e.name.endsWith('.tsx')) arquivos.push(p);
  }
})(RAIZ);

/**
 * Apaga o que é comentário, mantendo as linhas no lugar.
 *
 * Sem isto o script acusa a si mesmo: um comentário que explica um `<Text>`
 * escreve `<Text>` e é lido como se fosse código. O primeiro falso positivo
 * apareceu num JSDoc do diário — a documentação de uma correção virando
 * defeito. Cada caractere de comentário vira espaço, e não `''`, para o número
 * da linha e a coluna continuarem valendo no que sobra.
 *
 * Só bloco (`/* *\/`, que cobre JSDoc e `{/* *\/}` do JSX) e linha que já
 * começa com `//`. Um `//` no meio da linha fica: quase sempre é `https://`
 * dentro de um texto, e apagar dali seria estragar código de verdade.
 */
function semComentarios(texto) {
  const vazio = (m) => m.replace(/[^\r\n]/g, ' ');
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, vazio)
    .replace(/^[ \t]*\/\/.*$/gm, vazio);
}

/**
 * Onde termina a tag de abertura que começa em `inicio`.
 *
 * Não dá para procurar o primeiro `>`: estilo é objeto, e `{{ fontSize: 14 }}`
 * tem `>` nenhum mas tem chaves, enquanto uma seta (`onPress={() => ...}`) tem
 * um `>` que não fecha tag nenhuma. Conta chaves e só aceita o `>` que estiver
 * fora delas.
 */
function fimDaTag(texto, inicio) {
  let chaves = 0;
  for (let i = inicio; i < texto.length; i++) {
    const ch = texto[i];
    if (ch === '{') chaves += 1;
    else if (ch === '}') chaves -= 1;
    else if (ch === '>' && chaves <= 0) return i;
  }
  return -1;
}

const achados = [];

for (const f of arquivos) {
  if (PERDOADOS.has(path.basename(f))) continue;
  const texto = semComentarios(fs.readFileSync(f, 'utf8'));

  /*
    A profundidade, e por que ela muda o veredito.

    Um `<Text>` dentro de outro `<Text>` **herda a cor do de fora** — é assim
    que se escreve meia frase em negrito no React Native, e é o único lugar em
    que herança de cor existe. Cobrar cor do de dentro seria cobrar que se
    repita o que já foi decidido uma linha acima, e a versão anterior deste
    script cobrava: acusava `HumorComPalavra`, onde a palavra em negrito é
    filha do texto que já tem cor.

    Quem está na raiz continua sendo cobrado igual. Só o filho é perdoado, e só
    porque o pai já respondeu por ele.
  */
  let profundidade = 0;
  const passos = [...texto.matchAll(/<\/?Text(?=[\s/>]|$)/g)];

  for (const passo of passos) {
    const i = passo.index;
    if (passo[0][1] === '/') {
      profundidade = Math.max(0, profundidade - 1);
      continue;
    }

    const fim = fimDaTag(texto, i);
    const tag = fim === -1 ? texto.slice(i) : texto.slice(i, fim + 1);
    const soZinho = /\/>\s*$/.test(tag);

    if (profundidade === 0) {
      // `color:` no estilo, ou um estilo vindo de fora por variável — nos dois
      // casos alguém já decidiu a cor.
      const temCor = /\bcolor\s*:/.test(tag) || /style=\{(\[|[a-zA-Z_$])/.test(tag);
      if (!temCor) {
        const linha = texto.slice(0, i).split(/\r?\n/).length;
        const trecho = texto.slice(i).split(/\r?\n/)[0].trim().slice(0, 60);
        achados.push(`${f.replace(RAIZ, 'src')}:${linha}  ${trecho}`);
      }
    }

    if (!soZinho) profundidade += 1;
  }
}

if (!achados.length) {
  console.log('Nenhum <Text> sem cor. Os dois temas ficam legíveis.');
  process.exit(0);
}

console.log(`${achados.length} <Text> sem cor declarada:\n`);
for (const a of achados) console.log('  ·', a);
console.log('\nNo tema escuro estes ficam pretos sobre fundo escuro.');
process.exit(1);
