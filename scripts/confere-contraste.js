/**
 * Confere o contraste dos dois temas contra a WCAG.
 *
 * A paleta clara tem razões anotadas à mão nos comentários — 4,91 sobre o
 * creme, 5,26 nas duas direções do terracota. Elas foram calculadas uma vez e
 * nunca mais conferidas: qualquer ajuste de cor depois disso passou sem
 * ninguém recontar.
 *
 * A paleta escura nasce agora, e escolher tom escuro "no olho" é como escolher
 * clara no olho — dá quase certo, e o quase aparece em texto de apoio que some
 * para quem enxerga menos. Este arquivo existe para as duas paletas terem o
 * mesmo rigor.
 *
 * O piso é o da WCAG AA: **4,5** para texto normal, **3,0** para texto grande
 * e para elementos de interface (borda, ícone, chave).
 *
 * Uso: node scripts/confere-contraste.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

const AA_TEXTO = 4.5;
const AA_GRANDE = 3.0;

/** `tracos.contorno` — a tinta com que a carinha do humor é desenhada. */
const TINTA_DA_CARINHA = '#3A3630';

/** #RRGGBB para [r, g, b] em 0..255. */
function canais(hex) {
  const h = hex.replace('#', '');
  const largo = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(largo.slice(i, i + 2), 16));
}

/** Luminância relativa, na fórmula da WCAG. */
function luminancia(hex) {
  const [r, g, b] = canais(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function razao(frente, fundo) {
  const a = luminancia(frente);
  const b = luminancia(fundo);
  const [claro, escuro] = a > b ? [a, b] : [b, a];
  return (claro + 0.05) / (escuro + 0.05);
}

(async () => {
  const saida = pastaTemporaria('contraste');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck', '--jsx', 'react-jsx',
      path.join(RAIZ, 'src', 'theme', 'tokens.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );

  const alvo = path.join(saida, 'tokens.js');
  const comoModulo = alvo.replace(/\.js$/, '.mjs');
  fs.renameSync(alvo, comoModulo);
  const { TEMAS } = await import('file://' + comoModulo.split(path.sep).join('/'));

  /*
    A terra vem em separado, e numa pasta própria.

    Ela não está em `tokens.ts` de propósito: `terraDoCanteiro` existe
    justamente para o desenho **não** seguir o tema. Compilar os dois na
    mesma chamada mudaria a raiz comum de `src/theme` para `src`, e o
    `tokens.js` deixaria de estar onde as linhas acima o procuram.
  */
  const saidaDaTerra = pastaTemporaria('terra');
  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saidaDaTerra, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'components', 'brand', 'terraDoCanteiro.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );
  const terraJs = path.join(saidaDaTerra, 'terraDoCanteiro.js');
  const terraMjs = terraJs.replace(/\.js$/, '.mjs');
  fs.renameSync(terraJs, terraMjs);
  const terra = await import('file://' + terraMjs.split(path.sep).join('/'));

  let falhas = 0;
  const linha = (nome, frente, fundo, piso) => {
    const r = razao(frente, fundo);
    const ok = r >= piso;
    if (!ok) falhas += 1;
    console.log(
      `  ${ok ? 'ok   ' : 'FALHA'} ${nome.padEnd(44)} ${r.toFixed(2)} (mínimo ${piso})`,
    );
  };

  /*
    O convite da `FaixaDaComposta`, que fica escrito **em cima da terra**.

    Fora do laço dos temas de propósito: a terra é a mesma de dia e de
    noite, então este par de cores não tem dois casos — tem um.

    ## De onde saem os tons medidos

    O degradê da terra tem paradas em 0 (`TERRA_CLARA`), 0,14 (`TERRA`),
    0,46 (`TERRA_FUNDA`) e 1 (`TERRA_SOMBRA`), numa caixa de 226 pontos. O
    título ocupa de 0,32 a 0,46 dessa caixa, e a linha de 0,46 para baixo —
    ou seja, o pior tom sob o título é a mistura de `TERRA` com
    `TERRA_FUNDA` em 56%, e o pior sob a linha é o próprio `TERRA_FUNDA`.

    ## Por que a terceira linha existe

    Ela mede a linha de apoio contra `TERRA` — o tom que ela encostaria se
    o bloco de texto subisse. Dá 3,05, que **reprova** em texto normal. É
    o alarme: a folga de hoje não vem da cor escolhida, vem de a parada
    escura começar em 0,46. Quem mexer no degradê vai ver esta linha
    reprovar antes de a tela ficar ilegível no aparelho de alguém.
  */
  console.log('\n— texto sobre a terra (sem tema) —');
  const mistura = (a, b, q) =>
    '#' +
    canais(a)
      .map((v, i) => Math.round(v + q * (canais(b)[i] - v)).toString(16).padStart(2, 0))
      .join('');
  const sobOTitulo = mistura(terra.TERRA, terra.TERRA_FUNDA, 0.56);
  linha('título da Composta sobre a terra', terra.TEXTO_NA_TERRA, sobOTitulo, AA_TEXTO);
  linha('linha da Composta sobre a terra', terra.TEXTO_NA_TERRA_FRACO, terra.TERRA_FUNDA, AA_TEXTO);
  linha(
    'linha da Composta se subir até TERRA',
    terra.TEXTO_NA_TERRA_FRACO,
    terra.TERRA,
    AA_GRANDE,
  );

  for (const [nomeDoTema, t] of Object.entries(TEMAS)) {
    console.log(`\n— tema ${nomeDoTema} —`);
    const c = t.colors;
    /*
      A tinta dos icones e titulos. Ela **troca** entre os temas: `brown900` e
      quase preto no claro e quase branco no escuro, porque quem escreve
      `palette.brown900` quer "a cor mais forte deste tema", nao uma cor
      especifica. Medir o icone contra o tom exige a do tema em questao.
    */
    const tintaForte = t.palette.brown900;

    /*
      As cores de humor ficaram de fora deste arquivo, de propósito.

      A primeira versão media cada uma contra o fundo e reprovava o tema claro
      em todas as seis. O erro era da régua: aqueles tons se distinguem por
      **matiz**, e razão de contraste só enxerga luminosidade. Amarelo-claro e
      verde-claro podem ter a mesma luminância e ainda assim serem óbvios.

      A pergunta certa sobre eles é outra, e não é de contraste: se a matiz é
      o único canal, o gráfico não diz nada a quem não distingue matiz. Desde
      15/09/2026 ela não é: a semana e o mês desenham a carinha junto da cor,
      e o trimestre continua só com cor, com a conta por humor embaixo. As
      duas linhas abaixo medem o que esse segundo canal precisa para existir —
      a tinta do desenho sobre cada uma das seis cores.
    */

    // Texto sobre os três fundos onde ele de fato aparece.
    for (const [ondeNome, onde] of [
      ['fundo', c.bg],
      ['cartão', c.surface],
      ['cartão fundo', c.surfaceSunken],
    ]) {
      linha(`texto principal sobre ${ondeNome}`, c.textPrimary, onde, AA_TEXTO);
      linha(`texto de apoio sobre ${ondeNome}`, c.textSecondary, onde, AA_TEXTO);
      linha(`verde de link sobre ${ondeNome}`, c.primaryStrong, onde, AA_TEXTO);
      linha(`vermelho de perigo sobre ${ondeNome}`, c.danger, onde, AA_TEXTO);
    }

    /*
      A faixa da Composta: o alto do céu, e o que passa por ele.

      Fica fora do laço acima porque o céu **não é uma superfície de texto**.
      A primeira versão o enfiou lá e reprovou duas cores — texto de apoio e
      vermelho de perigo sobre `primarySoft` — que nunca são escritas ali. O
      céu carrega duas coisas só: a saudação e a palavra que cai, e as duas
      são `textPrimary`.

      As outras duas paradas do degradê (`bg` e `surfaceSunken`) já estão
      medidas logo acima, como fundo e cartão fundo.
    */
    linha('palavra caindo no alto do céu', c.textPrimary, c.primarySoft, AA_TEXTO);

    // O botão principal: é o que a pessoa precisa enxergar para fazer qualquer coisa.
    linha('texto do botão sobre o verde', c.textInverse, c.primary, AA_TEXTO);

    // Elementos de interface que a pessoa precisa enxergar para operar. A WCAG
    // 1.4.11 pede 3,0 aqui, e é o que vale para a chave, o botão e a borda que
    // delimita um controle.
    linha('borda forte sobre o fundo', c.borderStrong, c.bg, AA_GRANDE);
    linha('verde de preencher sobre o fundo', c.primary, c.bg, AA_GRANDE);

    /*
      A borda fina dos cartões tem piso próprio, e menor.

      Ela não delimita controle nenhum: o cartão já se separa do fundo pela cor
      da superfície, e a borda é acabamento. Exigir 3,0 dela reprovaria o tema
      claro, que funciona — o piso aqui é só "dá para ver que existe".
    */
    linha('borda fina sobre o cartão', c.border, c.surface, 1.2);

    /*
      A carinha do humor é desenhada com tinta escura sobre a cor do humor, nos
      dois temas. Se um tom de humor escurecer demais, o rostinho some — foi o
      que aconteceu na primeira paleta escura, em que os pastéis tinham sido
      escurecidos em vez de saturados.

      O piso é o de elemento gráfico: são traços de 2,4 a 2,6 de espessura.
    */
    /*
      A cor de humor como **fundo**: régua de distância, e não de posição.

      Ela não recebe texto — é o halo atrás do broto e o disco do jardim —,
      então a pergunta não é a da WCAG. É: dá para ver que tem cor ali, sem que
      aquilo vire um holofote? Perto demais do fundo, o halo some; longe demais,
      um círculo de 192 sobre marrom quase preto vira uma lua.

      **A primeira versão desta régua mediu posição** — "a cor fica entre o
      fundo da tela e o cartão" — e reprovou o tema claro nas seis, que é
      exatamente o erro que o comentário logo abaixo já contava sobre a outra
      régua. No claro os pastéis são mais escuros que o creme; no escuro os
      fundos são mais claros que a tela. Os dois estão certos, e a posição
      relativa simplesmente não é a mesma coisa nos dois temas.

      Distância é — mas só de um lado. **Só o teto.**

      A segunda versão pôs piso de 1,1 junto, e ele reprovou o amarelo e o creme
      do tema claro: 1,06 e 1,07. Aqueles dois se distinguem do creme por
      **matiz**, e razão de contraste só enxerga luminosidade — o mesmo motivo
      pelo qual as cores de humor ficaram fora deste arquivo. Terceira vez que
      uma régua de luminância cobra demais de cor codificada por matiz. Aqui
      corrigi a régua, como nas outras duas.

      O teto sobrevive porque a falha que ele pega é de luminosidade de
      verdade: pastilha clara usada como superfície acende a tela escura,
      independentemente da matiz dela. Foi essa a falha real, e é essa que não
      pode voltar.

      Vale a pena existir: esta cor já saiu errada três vezes — pastel
      escurecido, tom médio saturado, pastel claro como superfície — e nenhuma
      das três falhava neste arquivo, porque nenhuma era pergunta de contraste
      de texto.
    */
    for (const [humor, cor] of Object.entries(t.moodColorsFundo)) {
      const r = razao(cor, c.bg);
      const ok = r <= 1.45;
      if (!ok) falhas += 1;
      console.log(
        `  ${ok ? 'ok   ' : 'FALHA'} ${`fundo do humor "${humor}" não acende a tela`.padEnd(44)} ` +
          `${r.toFixed(2)} (máximo 1.45)`,
      );
    }

    for (const [humor, cor] of Object.entries(t.moodColors)) {
      linha(`carinha "${humor}" sobre a cor do humor`, TINTA_DA_CARINHA, cor, AA_GRANDE);
    }

    /*
      O número do dia no calendário do mês, sobre a cor do humor.

      Ele usa a mesma tinta da carinha, e isso é uma correção, não um detalhe:
      a versão anterior usava `palette.brown900`. No tema claro as duas são o
      mesmo hex, e por isso o erro durou — no escuro `brown900` troca de ponta
      e vira creme, enquanto a cor do humor continua clara nos dois temas. O
      número saía creme sobre pastel, e o dia registrado era o único do
      calendário sem data legível.

      A régua é a de texto normal, e não os 3,0 da carinha: dez pontos, texto
      de verdade, lido algarismo a algarismo.

      O que esta linha guarda é a **tinta contra a paleta**: se alguém
      escurecer as cores de humor, ela reprova. O que ela não alcança é a
      fiação do componente — trocar a cor de volta lá dentro passa por aqui.
      Isso está anotado no próprio `HumorNoTempo.tsx`, junto da linha.
    */
    for (const [humor, cor] of Object.entries(t.moodColors)) {
      linha(`número do dia sobre "${humor}"`, TINTA_DA_CARINHA, cor, AA_TEXTO);
    }

    /*
      Os treze tons dos temas de pratica -- e aqui a regua de luminancia e a
      certa, ao contrario dos tres casos acima.

      A diferenca nao e de rigor, e de funcao. Cor de humor codifica **qual**
      humor: quem distingue e a matiz, e cobrar luminancia dela reprova cor que
      funciona -- foi o erro que este arquivo cometeu tres vezes. O tom do tema
      nao codifica nada: quem diz "Ansiedade" e o icone e o titulo. O quadrado
      so precisa ser visivel e nao gritar, e isso e luminancia pura.

      Por isso os treze tem contraste **igual** de proposito, e e por isso que
      da para medi-los com um piso e um teto em vez de caso a caso.

      As reguas abaixo sao as falhas reais que existiam antes de o conjunto
      ganhar tons proprios, e nenhuma delas era pega por nada:

      - cinco dos treze ficavam entre 1,02 e 1,22 contra o cartao: sumiam;
      - `brown100` e `cream300` sao o mesmo hex, entao Solidao e Culpa tinham
        quadrados identicos no tema escuro;
      - e o teto impede a volta do erro que ja apareceu no halo do humor:
        pastilha clara usada como superficie acende a tela escura.
    */
    const tons = Object.entries(t.tintsDosTemas);

    for (const [tema, cor] of tons) {
      linha(`icone do tema "${tema}" sobre o tom`, tintaForte, cor, AA_GRANDE);

      const r = razao(cor, c.surface);
      const ok = r >= 1.15 && r <= 2.2;
      if (!ok) falhas += 1;
      console.log(
        `  ${ok ? 'ok   ' : 'FALHA'} ${`tom do tema "${tema}" aparece no cartao`.padEnd(44)} ` +
          `${r.toFixed(2)} (entre 1.15 e 2.2)`,
      );
    }

    /*
      E que dois temas nao tenham o mesmo quadrado.

      O piso e baixo de proposito: nao estou exigindo que os treze sejam bem
      distintos -- essa briga foi perdida na hora de escolher tons discretos
      em vez de neon, e quem diferencia e o icone. O que nao pode e colidir.
    */
    let perto = { a: '', b: '', d: Infinity };
    for (let i = 0; i < tons.length; i += 1) {
      for (let j = i + 1; j < tons.length; j += 1) {
        const [x, y] = [canais(tons[i][1]), canais(tons[j][1])];
        const d = Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
        if (d < perto.d) perto = { a: tons[i][0], b: tons[j][0], d };
      }
    }
    const distinto = perto.d >= 4;
    if (!distinto) falhas += 1;
    console.log(
      `  ${distinto ? 'ok   ' : 'FALHA'} ` +
        `${`tons mais parecidos: ${perto.a}/${perto.b}`.padEnd(44)} ` +
        `${perto.d.toFixed(1)} (minimo 4)`,
    );
  }
  console.log(`\n${falhas} falha(s) de contraste`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
