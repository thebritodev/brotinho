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
const os = require('os');
const path = require('path');
const fs = require('fs');

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
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'contraste-'));
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

  let falhas = 0;
  const linha = (nome, frente, fundo, piso) => {
    const r = razao(frente, fundo);
    const ok = r >= piso;
    if (!ok) falhas += 1;
    console.log(
      `  ${ok ? 'ok   ' : 'FALHA'} ${nome.padEnd(44)} ${r.toFixed(2)} (mínimo ${piso})`,
    );
  };

  for (const [nomeDoTema, t] of Object.entries(TEMAS)) {
    console.log(`\n— tema ${nomeDoTema} —`);
    const c = t.colors;

    /*
      As cores de humor ficaram de fora deste arquivo, de propósito.

      A primeira versão media cada uma contra o fundo e reprovava o tema claro
      em todas as seis. O erro era da régua: aqueles tons se distinguem por
      **matiz**, e razão de contraste só enxerga luminosidade. Amarelo-claro e
      verde-claro podem ter a mesma luminância e ainda assim serem óbvios.

      A pergunta certa sobre eles é outra, e não é de contraste: o gráfico
      codifica humor **só** por cor, o que não serve para quem não distingue
      matiz. Isso vale para os dois temas e está anotado em `docs/retencao.md`
      como achado em aberto — não é coisa que este medidor resolva.
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
    for (const [humor, cor] of Object.entries(t.moodColors)) {
      linha(`carinha "${humor}" sobre a cor do humor`, TINTA_DA_CARINHA, cor, AA_GRANDE);
    }
  }

  fs.rmSync(saida, { recursive: true, force: true });
  console.log(`\n${falhas} falha(s) de contraste`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
