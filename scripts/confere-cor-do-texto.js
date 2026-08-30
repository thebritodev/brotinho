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

const achados = [];

for (const f of arquivos) {
  if (PERDOADOS.has(path.basename(f))) continue;
  const texto = fs.readFileSync(f, 'utf8');
  const linhas = texto.split(/\r?\n/);

  for (let i = 0; i < linhas.length; i++) {
    // `<Text` sozinho no fim da linha conta: a tag continua abaixo. A primeira
    // versão exigia um caractere depois e deixou passar exatamente esses —
    // achados medindo a cor na tela, não lendo o código.
    if (!/<Text(\s|>|$)/.test(linhas[i])) continue;

    // Junta a tag de abertura inteira, que pode ocupar várias linhas.
    let tag = '';
    let profundidade = 0;
    let j = i;
    for (; j < linhas.length && j < i + 40; j++) {
      tag += linhas[j];
      for (const ch of linhas[j]) {
        if (ch === '{') profundidade += 1;
        if (ch === '}') profundidade -= 1;
      }
      if (profundidade <= 0 && /(^|[^=])>\s*$/.test(linhas[j])) break;
    }

    // `color:` no estilo, ou um estilo vindo de fora por variável — nos dois
    // casos alguém já decidiu a cor.
    const temCor = /\bcolor\s*:/.test(tag) || /style=\{(\[|[a-zA-Z_$])/.test(tag);
    if (!temCor) {
      achados.push(`${f.replace(RAIZ, 'src')}:${i + 1}  ${linhas[i].trim().slice(0, 60)}`);
    }
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
