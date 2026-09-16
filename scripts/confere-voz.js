/**
 * Confere quem pode mandar o app falar em voz alta.
 *
 * ## A regra
 *
 * O sintetizador só recebe **texto escrito pelo app**. Nunca o diário, nunca a
 * frase da Composta, nunca o nome de quem usa.
 *
 * O motivo está inteiro em `src/services/voz.ts`, e em uma linha é este: no
 * Android o motor de fala é do sistema, e o padrão pode sintetizar **na nuvem**
 * quando a voz off-line não está instalada. Texto do app já está dentro do
 * binário e na ficha da loja; o que a pessoa escreveu é a coisa que a política
 * de privacidade promete que não sai do aparelho.
 *
 * ## Por que um script, e não só um comentário
 *
 * Porque a quebra é silenciosa. `falar(entrada.text)` compila, roda, e soa
 * exatamente como o uso certo — a diferença é invisível em tudo, menos na
 * promessa. Nenhum tipo do TypeScript distingue "string do app" de "string da
 * pessoa", e nenhum teste de comportamento repara.
 *
 * O que dá para conferir de fora é **onde** a chamada mora. Uma lista curta de
 * arquivos autorizados não impede alguém de passar conteúdo errado dentro de um
 * deles, mas impede o caso real: alguém precisando de voz numa tela nova,
 * importando `falar` e mandando o texto que tem à mão.
 *
 * Quem acrescentar um arquivo aqui está declarando que leu a regra. É pouco, e
 * é honesto sobre o que é: um pedágio, não uma prova.
 *
 * Uso: node scripts/confere-voz.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', 'src');

/**
 * Onde `falar()` pode ser chamado.
 *
 * - `services/voz.ts` é a definição.
 * - `screens/practices/StepGuide.tsx` conduz os passos de uma prática, e o que
 *   ele fala vem de `data/practices.ts`.
 */
const AUTORIZADOS = new Set([
  path.join('services', 'voz.ts'),
  path.join('screens', 'practices', 'StepGuide.tsx'),
]);

/** Telas onde o conteúdo da pessoa vive. Chamar `falar` aqui é o erro a evitar. */
const PROIBIDOS_DE_PROPOSITO = [
  'JournalScreen',
  'CompostaScreen',
  'TherapySummaryScreen',
];

const arquivos = [];
(function anda(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) anda(p);
    else if (/\.tsx?$/.test(e.name)) arquivos.push(p);
  }
})(RAIZ);

/** Apaga comentários, para uma nota que cite `falar(` não virar acusação. */
function semComentarios(texto) {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^\s*\/\/.*$/gm, (m) => ' '.repeat(m.length));
}

let falhas = 0;
const erro = (onde, o) => {
  falhas += 1;
  console.log(`  FALHA ${onde}: ${o}`);
};

const chamadores = [];
for (const arq of arquivos) {
  const relativo = path.relative(RAIZ, arq);
  const codigo = semComentarios(fs.readFileSync(arq, 'utf8'));
  if (!/\bfalar\s*\(/.test(codigo)) continue;
  chamadores.push(relativo);
  if (!AUTORIZADOS.has(relativo)) {
    erro(
      relativo,
      'chama falar() sem estar na lista de autorizados — leia a regra em services/voz.ts',
    );
  }
}

for (const tela of PROIBIDOS_DE_PROPOSITO) {
  if (chamadores.some((c) => c.includes(tela))) {
    erro(tela, 'é uma tela de conteúdo da pessoa e não pode falar nada em voz alta');
  }
}

/* A lista de autorizados não pode envelhecer apontando para arquivo que sumiu. */
for (const esperado of AUTORIZADOS) {
  if (!fs.existsSync(path.join(RAIZ, esperado))) {
    erro(esperado, 'está na lista de autorizados e não existe mais');
  }
}

console.log(`\n${chamadores.length} arquivo(s) chamam falar(): ${chamadores.join(', ') || '(nenhum)'}`);
console.log(`${falhas} problema(s) de voz`);
process.exitCode = falhas ? 1 : 0;
