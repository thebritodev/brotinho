/**
 * Confere o que o botão de assinar diz — que é onde o preço fica embaixo do
 * dedo de quem decide.
 *
 * Duas regras, e as duas já foram quebradas na prática:
 *
 * 1. **Os dois planos falam por mês.** O anual dizia "R$ 179,90/ano" ao lado de
 *    um mensal de "R$ 29,90/mês": o plano mais barato parecia seis vezes mais
 *    caro, porque os números estavam em unidades diferentes.
 *
 * 2. **O preço da loja tem precedência.** O botão era a única parte do paywall
 *    com o valor escrito à mão; os cartões já usavam o da loja, convertido e
 *    com o imposto da região. Fora do Brasil os dois se contradiziam na mesma
 *    tela.
 *
 * Uso: node scripts/testa-chamada-do-plano.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

let falhas = 0;
let casos = 0;

function confere(descricao, obtido, esperado) {
  casos += 1;
  const ok = obtido === esperado;
  if (!ok) falhas += 1;
  console.log(`  ${ok ? 'ok   ' : 'FALHA'} ${descricao}`);
  if (!ok) console.log(`        esperado ${JSON.stringify(esperado)}, veio ${JSON.stringify(obtido)}`);
}

(async () => {
  const saida = pastaTemporaria('chamada-do-plano');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'data', 'onboarding.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );

  /*
    O `tsc` emite espelhando a pasta comum das entradas, e ela muda.

    Enquanto `onboarding.ts` nao importava nada de fora de `src/data`, a saida
    era `onboarding.js` na raiz da pasta temporaria. Bastou um `import type` de
    `src/theme` para a pasta comum virar `src`, e o arquivo passar a sair em
    `data/onboarding.js` — com o caminho escrito a mao, o teste quebrou num
    `rename` de arquivo inexistente, sem dizer que o problema era esse.

    Procurar resolve de uma vez, para qualquer import que venha depois.
  */
  const procura = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        const achado = procura(p);
        if (achado) return achado;
      } else if (e.name === 'onboarding.js') return p;
    }
    return null;
  };
  const js = procura(saida);
  if (!js) throw new Error('nao achei onboarding.js na saida do tsc');
  const mjs = js.replace(/\.js$/, '.mjs');
  fs.renameSync(js, mjs);
  const { chamadaDoPlano, PLANS } = await import('file://' + mjs.split(path.sep).join('/'));

  console.log('— o que o botão de assinar diz —\n');

  /* Sem loja: os valores de reserva, e o anual já diluído. */
  confere('mensal sem loja', chamadaDoPlano('mensal'), 'Assinar por R$ 29,90/mês');
  confere('anual sem loja', chamadaDoPlano('anual'), 'Assinar por R$ 14,99/mês');

  /* O anual nunca mostra o total do ano no botão — é a regra inteira. */
  const anual = chamadaDoPlano('anual');
  confere('o anual não põe o total do ano no botão', anual.includes(PLANS.anual.price), false);
  confere('o anual fala em mês', anual.endsWith('/mês'), true);

  /* Com loja: o valor de lá manda nos dois. */
  confere(
    'mensal usa o preço da loja',
    chamadaDoPlano('mensal', { preco: '$4.99', precoMensal: null }),
    'Assinar por $4.99/mês',
  );
  confere(
    'anual usa o preço por mês da loja',
    chamadaDoPlano('anual', { preco: '$29.99', precoMensal: '$2.49' }),
    'Assinar por $2.49/mês',
  );

  /*
    A loja pode responder o total e não o diluído — acontece quando o produto
    não está configurado como assinatura anual na ficha. Aí é melhor cair na
    reserva em Reais do que anunciar o total do ano como se fosse mensal.
  */
  confere(
    'anual sem o diluído da loja cai na reserva, não no total',
    chamadaDoPlano('anual', { preco: '$29.99', precoMensal: null }),
    'Assinar por R$ 14,99/mês',
  );

  /* O total continua tendo onde aparecer: é o `fine`, embaixo do botão. */
  confere(
    'o total do ano continua escrito no rodapé',
    PLANS.anual.fine.includes(PLANS.anual.price),
    true,
  );

  console.log(`\n${casos} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})();
