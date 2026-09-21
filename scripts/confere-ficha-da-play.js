/**
 * Confere a ficha do Google Play contra o que o Play Console aceita.
 *
 * ## Por que existe
 *
 * Os textos da ficha moram em `docs/ficha-google-play.md` e são colados no
 * console **à mão**, um campo de cada vez. Um caractere a mais e o console
 * recusa o campo — só que isso se descobre no meio do envio, com a tela aberta
 * e a paciência no fim. As imagens têm o mesmo tipo de regra: tamanho exato, e
 * o gráfico de destaque não pode ter transparência.
 *
 * São contas que a máquina faz em um segundo. Este script faz.
 *
 * ## O que ele confere
 *
 * - os quatro textos da ficha cabem nos limites do Google;
 * - a descrição completa traz as duas frases que a política de apps de saúde
 *   exige, com todas as letras — app de saúde sem elas é recusado;
 * - o ícone tem 512 × 512 e o destaque 1024 × 500, sem transparência;
 * - existem pelo menos duas capturas, no máximo oito, todas entre 320 e 3840
 *   pixels de lado;
 * - os links obrigatórios estão na ficha e são https.
 *
 * Ele **não** acessa a internet: se os endereços ainda respondem é outra
 * conferência, feita na hora do envio.
 *
 * ## Por que as imagens ficam fora da bateria
 *
 * O ícone, o destaque e as capturas são **gerados** (`graficos-da-play.js`,
 * `capturas.js`) e o Git os ignora. Num checkout limpo eles não existem — e
 * a bateria, que roda em checkout limpo antes de cada commit, quebrava por
 * causa de um arquivo que ninguém esqueceu de versionar: ele não é para ser
 * versionado. Na bateria entram só os textos; as imagens são conferidas
 * rodando este script sozinho, na hora de subir para o console.
 *
 * Uso:
 *   node scripts/confere-ficha-da-play.js              textos e imagens
 *   node scripts/confere-ficha-da-play.js --so-textos  só os textos e os links
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const RAIZ = path.join(__dirname, '..');
const SO_TEXTOS = process.argv.includes('--so-textos');
const FICHA = path.join(RAIZ, 'docs', 'ficha-google-play.md');

/** Os limites do Play Console, em caracteres. */
const LIMITES = [
  { titulo: 'Nome do app', limite: 30 },
  { titulo: 'Descrição curta', limite: 80 },
  { titulo: 'Descrição completa', limite: 4000 },
  { titulo: 'Novidades desta versão', limite: 500 },
];

/**
 * As frases que a política de apps de saúde do Google exige na descrição.
 *
 * Conferidas contra o texto exato da política em 13/09/2026. Ver a seção 4.1
 * da ficha.
 */
const EXIGIDAS = [
  'não é um dispositivo médico',
  'não faz diagnósticos',
  'consulte um profissional de saúde',
];

const LINKS = [
  'https://thebritodev.github.io/brotinho/privacidade.html',
  'https://thebritodev.github.io/brotinho/suporte.html',
  'https://thebritodev.github.io/brotinho/',
];

let falhas = 0;
function ok(mensagem) {
  console.log(`  ok    ${mensagem}`);
}
function falhou(mensagem) {
  falhas += 1;
  console.log(`  FALHA ${mensagem}`);
}

/** O primeiro bloco de código depois do título que começa com `titulo`. */
function blocoDe(texto, titulo) {
  const linhas = texto.split(/\r?\n/);
  const i = linhas.findIndex((l) => l.startsWith('### ') && l.includes(titulo));
  if (i < 0) return null;
  const abre = linhas.findIndex((l, k) => k > i && l.startsWith('```'));
  if (abre < 0) return null;
  const fecha = linhas.findIndex((l, k) => k > abre && l.startsWith('```'));
  if (fecha < 0) return null;
  return linhas.slice(abre + 1, fecha).join('\n').trim();
}

function imagem(arquivo) {
  const png = PNG.sync.read(fs.readFileSync(path.join(RAIZ, arquivo)));
  /* Transparente é qualquer pixel com alfa abaixo do máximo. */
  let transparente = false;
  for (let i = 3; i < png.data.length; i += 4) {
    if (png.data[i] !== 255) {
      transparente = true;
      break;
    }
  }
  return { largura: png.width, altura: png.height, transparente };
}

console.log('\n— a ficha do Google Play —\n');

const texto = fs.readFileSync(FICHA, 'utf8');

for (const { titulo, limite } of LIMITES) {
  const bloco = blocoDe(texto, titulo);
  if (bloco === null) {
    falhou(`${titulo}: não achei o texto na ficha`);
    continue;
  }
  /*
    O Google conta caracteres, e o console conta a quebra de linha junto. Um
    texto medido sem elas passa aqui e estoura lá.
  */
  const conta = bloco.length;
  if (conta > limite) falhou(`${titulo}: ${conta} caracteres, o limite é ${limite}`);
  else ok(`${titulo}: ${conta} de ${limite} caracteres`);
}

const completa = blocoDe(texto, 'Descrição completa') ?? '';
for (const frase of EXIGIDAS) {
  if (completa.includes(frase)) ok(`a descrição traz "${frase}"`);
  else falhou(`a descrição não traz "${frase}" — a política de apps de saúde exige`);
}

if (SO_TEXTOS) {
  console.log('  —     imagens fora desta conferência: rode sem --so-textos antes de subir');
} else {
  const icone = imagem('loja/google-play/icone-512.png');
  if (icone.largura === 512 && icone.altura === 512) ok('o ícone tem 512 × 512');
  else falhou(`o ícone tem ${icone.largura} × ${icone.altura}, e o Google quer 512 × 512`);

  const destaque = imagem('loja/google-play/destaque-1024x500.png');
  if (destaque.largura === 1024 && destaque.altura === 500) ok('o destaque tem 1024 × 500');
  else falhou(`o destaque tem ${destaque.largura} × ${destaque.altura}, e o Google quer 1024 × 500`);
  if (destaque.transparente) falhou('o destaque tem transparência, e o Google recusa alfa nesse campo');
  else ok('o destaque não tem transparência');

  const capturas = fs
    .readdirSync(path.join(RAIZ, 'capturas'))
    .filter((n) => /^\d/.test(n) && n.endsWith('.png'))
    .sort();
  if (capturas.length < 2) falhou(`${capturas.length} captura(s): o Google exige pelo menos 2`);
  else if (capturas.length > 8) falhou(`${capturas.length} capturas: o Google aceita no máximo 8`);
  else ok(`${capturas.length} capturas, entre 2 e 8`);

  for (const nome of capturas) {
    const c = imagem(path.join('capturas', nome));
    const menor = Math.min(c.largura, c.altura);
    const maior = Math.max(c.largura, c.altura);
    if (menor < 320 || maior > 3840) {
      falhou(`${nome}: ${c.largura} × ${c.altura}, fora da faixa de 320 a 3840`);
    }
  }
  if (capturas.length) ok('todas as capturas cabem na faixa de 320 a 3840 pixels');
}

for (const link of LINKS) {
  if (texto.includes(link)) ok(`a ficha aponta para ${link}`);
  else falhou(`a ficha não aponta para ${link}`);
}

const pronta = SO_TEXTOS
  ? 'Os textos estão prontos. As imagens não foram conferidas aqui.'
  : 'A ficha está pronta para colar no console.';
console.log(`\n${falhas === 0 ? pronta : `${falhas} falha(s).`}\n`);
process.exit(falhas === 0 ? 0 : 1);
