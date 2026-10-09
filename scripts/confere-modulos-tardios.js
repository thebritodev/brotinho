/**
 * Confere que nenhum módulo nativo recém-chegado pode derrubar o app no boot.
 *
 * ## O defeito, que já aconteceu
 *
 * `expo-clipboard` entrou no projeto e foi importado no alto de
 * `guardarFrase.ts`. O `index` do pacote chama `requireNativeModule` na hora em
 * que é importado; quem importa aquele arquivo é a tela de compartilhar, que é
 * importada pela tela inicial. Resultado: o grafo de módulos inteiro passava
 * por ali **antes da primeira tela**, e num aparelho com uma build anterior ao
 * pacote o app abria em tela vermelha:
 *
 *     [runtime not ready]: Error: Cannot find native module 'ExpoClipboard'
 *
 * Não é uma falha de desenvolvimento. É o mesmo formato que `compartilharFrase`
 * conta por extenso: um módulo nativo pode estar no `package.json`, dentro do
 * `.dex` e autolinkado, e ainda assim não ser encontrado em execução. A
 * diferença entre "um botão não funciona" e "o app não abre" é inteiramente
 * **onde** o `require` acontece.
 *
 * ## A regra
 *
 * Os módulos desta lista são carregados dentro da função que os usa, em
 * `try`/`catch`, e nunca no alto de um arquivo. Com isso, a pior coisa que
 * acontece num binário sem eles é o botão dizer que não dá.
 *
 * ## Por que uma lista, e por que só ela
 *
 * Porque a regra não vale para todo módulo nativo: `expo-audio`,
 * `expo-notifications` e companhia estão em todos os binários do app desde o
 * começo, e carregá-los tarde só esconderia erro de verdade. O que precisa de
 * cuidado é o módulo **novo** — o que chegou depois de uma build existir e vai
 * encontrar aparelhos sem ele por aí.
 *
 * Quando um destes estiver em toda build que importa, é só tirar daqui. A lista
 * é curta de propósito: ela é a memória de quais pacotes ainda estão nessa
 * janela.
 *
 * ## Cada módulo diz onde é a casa dele
 *
 * A lista era de nomes, e a casa era uma só, fixa em `guardarFrase.ts`. Isso
 * passou enquanto os dois módulos tardios eram os daquele arquivo; quando
 * `expo-image-picker` chegou, para a foto de perfil, a regra mandava carregá-lo
 * tarde num serviço novo — e a conferência exigia encontrá-lo no arquivo
 * errado. Um guarda que só aceita a resposta de ontem é um guarda que a pessoa
 * seguinte desliga.
 *
 * Uso: node scripts/confere-modulos-tardios.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

/**
 * Os módulos nativos que chegaram depois da última build publicada, e o
 * arquivo onde cada um é carregado tarde.
 */
const TARDIOS = {
  'expo-clipboard': path.join('src', 'services', 'guardarFrase.ts'),
  'expo-media-library': path.join('src', 'services', 'guardarFrase.ts'),
  'expo-image-picker': path.join('src', 'services', 'fotoDePerfil.ts'),
};

function arquivos(dir) {
  const achados = [];
  const cheio = path.join(RAIZ, dir);
  if (!fs.existsSync(cheio)) return achados;
  for (const nome of fs.readdirSync(cheio)) {
    const p = path.join(cheio, nome);
    if (fs.statSync(p).isDirectory()) achados.push(...arquivos(path.join(dir, nome)));
    else if (/\.tsx?$/.test(nome)) achados.push(path.join(dir, nome));
  }
  return achados;
}

let casos = 0;
const falhas = [];

function confere(onde, condicao, mensagem) {
  casos += 1;
  if (condicao) return;
  falhas.push(`  FALHA ${onde}: ${mensagem}`);
}

console.log('— os módulos nativos recém-chegados —\n');

const todos = arquivos('src');

for (const [modulo, CASA] of Object.entries(TARDIOS)) {
  /*
    `import ... from 'x'` em qualquer lugar de `src`. O `import type` não conta:
    ele é apagado na emissão e nunca chega a executar nada.
  */
  const importa = new RegExp(`^\\s*import\\s+(?!type\\b)[^;]*from\\s+['"]${modulo}['"]`, 'm');
  for (const rel of todos) {
    const texto = fs.readFileSync(path.join(RAIZ, rel), 'utf8');
    confere(
      rel,
      !importa.test(texto),
      `importa \`${modulo}\` no alto do arquivo — num binário sem o módulo, isso derruba o app no boot`,
    );
  }

  /* E ele precisa estar carregado tarde em algum lugar, senão a lista mente. */
  const casa = fs.readFileSync(path.join(RAIZ, CASA), 'utf8');
  confere(
    CASA,
    casa.includes(`require('${modulo}')`),
    `não carrega \`${modulo}\` tarde: ou a lista está errada, ou o módulo saiu do app`,
  );
}

/*
  O ajudante existe em cada casa, e é ele que engole o erro do módulo ausente.

  Uma cópia por arquivo, e não um módulo compartilhado: importar o ajudante de
  fora traria o arquivo de fora para o grafo, e o grafo é exatamente o que esta
  conferência existe para manter curto.
*/
for (const CASA of new Set(Object.values(TARDIOS))) {
  const casa = fs.readFileSync(path.join(RAIZ, CASA), 'utf8');
  confere(
    CASA,
    /function moduloTardio</.test(casa) && /catch\s*\{\s*\n?\s*return null;/.test(casa),
    'o `moduloTardio` sumiu ou deixou de devolver `null` quando o módulo não existe',
  );
}

console.log(`${casos} conferências, ${falhas.length} falha(s)`);
if (falhas.length) {
  console.log('');
  for (const f of falhas) console.log(f);
  console.log('');
  console.log('Ver `moduloTardio`, em `src/services/guardarFrase.ts`.');
  process.exit(1);
}
console.log('nenhum módulo recém-chegado roda antes da primeira tela.');
process.exit(0);
