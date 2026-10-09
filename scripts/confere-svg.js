/**
 * Confere que nenhum desenho usa um gradiente sem defini-lo no mesmo `Svg`.
 *
 * ## O defeito que isto trava
 *
 * O broto da Composta saiu **todo preto** no celular. O motivo: o gradiente
 * das folhas estava definido no `Svg` do caule, e cada folha é um `Svg`
 * próprio — no Android um `Svg` não enxerga a definição que está noutro, e o
 * `fill` que não encontra o nome é desenhado preto.
 *
 * No navegador isso funciona, porque ali o nome vale para a página inteira.
 * Então o erro **não aparece** em nenhuma conferência feita daqui: só na mão
 * de quem abre o app. É o pior tipo de defeito para depender de olho, e o
 * melhor para uma conta boba resolver.
 *
 * ## A regra
 *
 * Em cada bloco `<Svg> … </Svg>`: quem usa `url(#…)` tem de definir gradiente
 * ali dentro — um `<Defs>` no próprio bloco, ou um componente de gradientes
 * como filho dele, que é como o `Sprout` faz.
 *
 * E, quando o bloco define os seus gradientes ali mesmo, **cada nome usado
 * tem de ser um dos nomes definidos**.
 *
 * Essa segunda metade eu tinha dado como impossível: "não dá para escrever sem
 * interpretar JavaScript, os nomes são montados com variável para serem únicos
 * por instância". Dá, e a saída é boba — os dois lados são o mesmo tipo de
 * texto, um `sol-${id}` de um lado e um `url(#sol-${id})` do outro. Trocando
 * toda interpolação por um símbolo, `sol-§` tem de bater com `sol-§`.
 *
 * Escrevi isso depois de um disco preto de 320 pontos aparecer no canto da
 * tela inicial, no aparelho do Pedro: o gradiente chamava `sol-` e o círculo
 * pedia `sol2-`, sobra de um nome que eu renomeei pela metade. A regra grossa
 * passou — havia um `<Defs>` ali — e o navegador não desenha nada no lugar,
 * então nenhuma captura mostrou.
 *
 * Uso: node scripts/confere-svg.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const FONTES = path.join(RAIZ, 'src');

/** Todos os `.tsx` de `src`. */
function arquivos(pasta) {
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    const cheio = path.join(pasta, item.name);
    if (item.isDirectory()) return arquivos(cheio);
    return item.name.endsWith('.tsx') ? [cheio] : [];
  });
}

/**
 * O arquivo com os comentários apagados, **no mesmo tamanho**.
 *
 * Apagados, e não removidos: as linhas precisam continuar onde estavam, senão
 * o número que a falha aponta manda quem for arrumar para o lugar errado.
 *
 * Sem isto, um trecho de código citado num comentário — e há um, explicando
 * justamente esta regra — contaria como desenho de verdade.
 */
function mascarar(texto) {
  const branco = (t) => t.replace(/[^\n]/g, ' ');
  return texto
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, branco)
    .replace(/\/\*[\s\S]*?\*\//g, branco)
    .replace(/^([ \t]*)\/\/.*$/gm, (t) => branco(t));
}

/** Os blocos `<Svg …> … </Svg>`, com a linha em que cada um começa. */
function blocosDeSvg(texto) {
  const blocos = [];
  let i = 0;
  while (true) {
    /* `<Svg` seguido de espaço ou `>`: senão `<SvgText` abriria um bloco falso. */
    const achou = texto.slice(i).match(/<Svg[\s>]/);
    if (!achou) break;
    const abre = i + achou.index;
    const fecha = texto.indexOf('</Svg>', abre);
    const fim = fecha < 0 ? texto.length : fecha;
    blocos.push({ linha: texto.slice(0, abre).split('\n').length, corpo: texto.slice(abre, fim) });
    i = fim + 6;
  }
  return blocos;
}

let falhas = 0;
let conferidos = 0;

for (const arquivo of arquivos(FONTES)) {
  const bruto = fs.readFileSync(arquivo, 'utf8');
  if (!bruto.includes('<Svg')) continue;
  const texto = mascarar(bruto);
  const curto = path.relative(RAIZ, arquivo).split(path.sep).join('/');

  for (const bloco of blocosDeSvg(texto)) {
    const usos = [...bloco.corpo.matchAll(/url\(#([^)]*)\)/g)].map((m) => m[1]);
    if (!usos.length) continue;
    conferidos += 1;

    /*
      Ou um `<Defs>` aqui mesmo, ou um componente de gradientes como filho —
      que é como o `Sprout` faz, com `<Gradientes id={…} />`.
    */
    const temDefs = /<Defs\b/.test(bloco.corpo);
    const temComponente = /<[A-Za-z]*Gradientes?\b/.test(bloco.corpo);
    if (!temDefs && !temComponente) {
      falhas += 1;
      const nome = usos[0].replace(/[`${}]/g, '');
      console.log(
        `  FALHA ${curto}:${bloco.linha}: usa url(#${nome}) e este Svg não define gradiente nenhum — no Android isso sai preto`,
      );
      continue;
    }

    /*
      O nome, sem o que varia: `sol-${id}` e `sol-${outraCoisa}` viram o mesmo
      `sol-§`. É o que permite comparar os dois lados sem saber o valor da
      variável — e é o bastante, porque o pedaço escrito à mão é justamente a
      parte que se erra ao renomear.
    */
    const semVariavel = (t) => t.replace(/\$\{[^}]*\}/g, '§').replace(/[`'"]/g, '').trim();

    /*
      Só quando o bloco define tudo sozinho. Com um componente de gradientes
      como filho, os nomes nascem lá dentro e esta comparação acusaria o que
      está certo.
    */
    if (temDefs && !temComponente) {
      /*
        O nome definido vem inteiro, com a interpolação dentro.

        A primeira versão cortava no primeiro `}` — `terra-${id}` virava
        `terra-${id` — e aí nenhum nome batia com nenhum: a conferência
        reprovava os doze desenhos certos do app. Pegar o literal inteiro
        entre crases, e a aspa quando o nome é fixo, resolve.
      */
      const definidos = new Set([
        ...[...bloco.corpo.matchAll(/\bid=\{`([^`]*)`\}/g)].map((m) => semVariavel(m[1])),
        ...[...bloco.corpo.matchAll(/\bid="([^"]*)"/g)].map((m) => semVariavel(m[1])),
      ]);
      for (const uso of usos) {
        const nome = semVariavel(uso);
        if (definidos.has(nome)) continue;
        falhas += 1;
        console.log(
          `  FALHA ${curto}:${bloco.linha}: usa url(#${nome}) e este Svg define ${
            [...definidos].join(', ') || 'nenhum'
          } — no Android um nome que não existe sai preto`,
        );
      }
    }
  }
}

console.log(`\n${conferidos} Svg com gradiente · ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
