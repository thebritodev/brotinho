/**
 * Confere que ninguém chama `Animated.loop` na mão.
 *
 * ## A regra
 *
 * Laço infinito só por `lacoDeIdaEVolta` ou `lacoQueSoVai`, de
 * `src/components/laco.ts`.
 *
 * ## Por que um script, e não um comentário
 *
 * Porque a quebra é invisível. `Animated.loop(Animated.timing(v, {
 * useNativeDriver: true }))` compila, roda, não avisa nada — e no
 * `react-native-web` o valor nunca sai de zero. No aparelho funciona. A
 * diferença só aparece na única superfície em que este app consegue ser
 * conferido sem um celular na mão, que é justamente onde ninguém suspeita de
 * estar vendo a versão quebrada.
 *
 * O porquê inteiro está em `src/components/laco.ts`. Aqui fica o pedágio: quem
 * quiser um laço novo passa pelos dois ajudantes, e quem precisar mesmo de
 * `Animated.loop` cru tem de vir até este arquivo dizer por quê.
 *
 * Uso: node scripts/confere-lacos.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', 'src');

/** Onde `Animated.loop` pode aparecer: a definição dos dois ajudantes. */
const AUTORIZADOS = new Set([path.join('components', 'laco.ts')]);

const arquivos = [];
(function anda(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) anda(p);
    else if (/\.tsx?$/.test(e.name)) arquivos.push(p);
  }
})(RAIZ);

const falhas = [];
let olhados = 0;

for (const arquivo of arquivos) {
  const relativo = path.relative(RAIZ, arquivo);
  const texto = fs.readFileSync(arquivo, 'utf8');
  olhados += 1;

  const linhas = texto.split('\n');
  linhas.forEach((linha, i) => {
    if (!/Animated\.loop\s*\(/.test(linha)) return;
    // Uma menção dentro de comentário é explicação, não chamada.
    const antes = linha.slice(0, linha.indexOf('Animated.loop'));
    if (/^\s*(\*|\/\/|\/\*)/.test(antes)) return;
    if (AUTORIZADOS.has(relativo)) return;
    falhas.push(`${relativo}:${i + 1}`);
  });
}

console.log(`\nConfere os lacos infinitos — ${olhados} arquivos\n`);

if (falhas.length) {
  console.log('  FALHA  Animated.loop fora de components/laco.ts:');
  for (const f of falhas) console.log(`           ${f}`);
  console.log('\n  Use lacoDeIdaEVolta ou lacoQueSoVai. O porque esta em src/components/laco.ts.\n');
  process.exit(1);
}

console.log('  ok    todo laco infinito passa pelos ajudantes\n');
