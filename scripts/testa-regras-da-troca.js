/**
 * Confere as regras da troca de tela. Ver `regrasDaTroca`.
 *
 * ## Por que existe
 *
 * Porque o lado da entrada é a única parte da transição que **erra em
 * silêncio**. Tudo o mais grita quando quebra: sem a camada de saída a tela
 * pisca para fora, sem opacidade travada duas telas aparecem juntas. Mas uma
 * tela que entra pelo lado errado só parece... outra transição. E foi assim
 * que o app acabou com quatro gramáticas ao mesmo tempo — uma tela subindo
 * vinte pontos ao lado de uma aba que desliza a tela inteira.
 *
 * `ladoDaTroca` é a decisão inteira, e ela é uma função pura de três
 * argumentos. Então dá para conferir sem abrir o app.
 *
 * Uso: node scripts/testa-regras-da-troca.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

let falhas = 0;
let casos = 0;
const detalhes = [];

function confere(onde, condicao, mensagem) {
  casos += 1;
  if (condicao) return;
  falhas += 1;
  detalhes.push(`  FALHA ${onde}: ${mensagem}`);
}

(async () => {
  const saida = pastaTemporaria('regras-da-troca');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');
  execFileSync(
    process.execPath,
    [
      /*
        `commonjs`, e nao `esnext` como o teste das abas.

        Este modulo importa do `regrasDasAbas` — e o `RECUO_DE_QUEM_SAI` mora
        la, porque foi ali que ele nasceu. Em ESM o Node exige a extensao no
        caminho, que o TypeScript nao escreve; em CommonJS o `require` resolve
        sozinho. O teste das abas nao passa por isso porque aquele arquivo nao
        importa nada.
      */
      tsc, '--outDir', saida, '--module', 'commonjs', '--target', 'es2020',
      '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'components', 'regrasDaTroca.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );

  const { DURACAO_DA_TROCA, FRACAO_DO_DESLIZE, RECUO_DE_QUEM_SAI, ladoDaTroca } = require(
    path.join(saida, 'regrasDaTroca.js'),
  );

  console.log('\n— as regras da troca de tela —\n');

  /* ---------- O lado ---------- */

  const PASSOS = ['lista', 'detalhe', 'fundo'];

  confere(
    'ladoDaTroca',
    ladoDaTroca('lista', 'detalhe', PASSOS) === 'forward',
    'avançar na sequência deixou de entrar pela direita',
  );
  confere(
    'ladoDaTroca',
    ladoDaTroca('detalhe', 'lista', PASSOS) === 'back',
    'voltar na sequência deixou de entrar pela esquerda — é o erro que não quebra nada e só parece outra transição',
  );
  confere(
    'ladoDaTroca',
    ladoDaTroca('lista', 'fundo', PASSOS) === 'forward',
    'pular um degrau para a frente deixou de avançar',
  );
  confere(
    'ladoDaTroca',
    ladoDaTroca('fundo', 'lista', PASSOS) === 'back',
    'pular dois degraus para trás deixou de voltar',
  );

  /*
    Sem ordem, avança. É o caso de uma tela que não pertence a sequência
    nenhuma, e avançar é o padrão do app — nunca ficar parado.
  */
  confere(
    'ladoDaTroca',
    ladoDaTroca('a', 'b') === 'forward',
    'sem ordem, a troca deixou de avançar',
  );
  /*
    E uma chave que não está na ordem também avança, em vez de escolher um lado
    por acaso. Acontece de verdade: uma tela nova entra no app antes de alguém
    lembrar de pô-la na lista.
  */
  confere(
    'ladoDaTroca',
    ladoDaTroca('lista', 'inedita', PASSOS) === 'forward' &&
      ladoDaTroca('inedita', 'lista', PASSOS) === 'forward',
    'uma chave fora da ordem deixou de avançar por padrão',
  );
  /*
    Trocar para a mesma tela não é voltar. Acontece quando a chave é
    recalculada e cai no mesmo lugar — e uma volta ali seria um solavanco para
    o lado errado sem que nada tenha mudado de profundidade.
  */
  confere(
    'ladoDaTroca',
    ladoDaTroca('detalhe', 'detalhe', PASSOS) === 'forward',
    'ficar no mesmo degrau passou a contar como voltar',
  );

  /* ---------- Os números ---------- */

  confere(
    'regrasDaTroca',
    DURACAO_DA_TROCA >= 180 && DURACAO_DA_TROCA <= 320,
    `a troca passou a durar ${DURACAO_DA_TROCA} ms: abaixo de 180 ela vira corte, acima de 320 vira espera`,
  );
  confere(
    'regrasDaTroca',
    FRACAO_DO_DESLIZE > 0.08 && FRACAO_DO_DESLIZE < 0.5,
    `a camada passou a andar ${FRACAO_DO_DESLIZE} da tela: pouco demais lê como "só mudou", muito demais desmancha a tela a cada toque`,
  );
  confere(
    'regrasDaTroca',
    RECUO_DE_QUEM_SAI > 0 && RECUO_DE_QUEM_SAI < 1,
    'o recuo de quem sai saiu do intervalo que faz as duas camadas se cruzarem',
  );

  console.log(`${casos} conferências, ${falhas} falha(s)`);
  if (falhas) {
    console.log('');
    for (const d of detalhes) console.log(d);
    console.log('');
    process.exit(1);
  }
  console.log('toda troca anda na horizontal, e o lado sai da ordem das telas.');
})();
