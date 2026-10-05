/**
 * As regras da `CamadaEmpilhada`: quando a tela de dentro e refeita.
 *
 * ## Por que este arquivo existe
 *
 * Porque o congelamento da camada ja entregou um defeito grave ao Pedro: todos
 * os cartoes de pratica da tela inicial abriam a **mesma** pratica. A camada
 * refazia a tela de dentro quando a *chave* mudava, e a chave e a identidade da
 * tela, nao a do conteudo -- abrir a pratica da ansiedade e voltar deixava um
 * elemento guardado sob a chave `praticas`, e abrir qualquer outra pratica
 * reaproveitava aquele elemento.
 *
 * O defeito e invisivel em tipo, em lint e em leitura rapida: o codigo errado e
 * uma comparacao que parece obviamente certa. O que o pega e a regra escrita
 * em `regrasDaCamada.ts` e conferida aqui.
 *
 * Uso: node scripts/testa-camada-empilhada.js
 */
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

let falhas = 0;
let casos = 0;
const detalhes = [];

function confere(onde, condicao, mensagem) {
  casos += 1;
  if (condicao) return;
  falhas += 1;
  if (detalhes.length < 14) detalhes.push(`  FALHA ${onde}: ${mensagem}`);
}

(async () => {
  const saida = pastaTemporaria('camada-empilhada');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');
  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      path.join(RAIZ, 'src', 'components', 'regrasDaCamada.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );
  const mjs = path.join(saida, 'regrasDaCamada.mjs');
  fs.renameSync(path.join(saida, 'regrasDaCamada.js'), mjs);
  const R = await import('file://' + mjs.split(path.sep).join('/'));

  console.log('— a camada empilhada —\n');

  /* ---------- 1. A conta das aberturas ---------- */

  confere(
    'abrir conta',
    R.contaAbertura(null, 'praticas', 0) === 1,
    'passar de fechada para aberta tem de contar como abertura nova',
  );
  confere(
    'trocar de tela conta',
    R.contaAbertura('praticas', 'diario', 3) === 4,
    'trocar direto de uma tela empilhada para outra e uma abertura nova',
  );
  confere(
    'fechar nao conta',
    R.contaAbertura('praticas', null, 3) === 3,
    'fechar nao pode contar: e durante o fechamento que o congelamento precisa valer',
  );
  confere(
    'parada nao conta',
    R.contaAbertura('praticas', 'praticas', 3) === 3,
    'sem mudanca nao ha abertura nova',
  );
  /*
    Idempotencia: a conta roda no corpo do render, que o React pode chamar
    duas vezes para a mesma mudanca. Duas chamadas seguidas tem de dar o mesmo
    numero, senao cada render dobraria a contagem e a tela seria refeita a cada
    quadro -- que e o oposto do que a camada existe para fazer.
  */
  let n = R.contaAbertura(null, 'praticas', 0);
  n = R.contaAbertura('praticas', 'praticas', n);
  confere('a conta e idempotente', n === 1, `duas chamadas seguidas deram ${n}, esperado 1`);

  /* ---------- 2. Quando refazer ---------- */

  confere(
    'sem nada guardado',
    R.precisaRedesenhar(null, 'praticas', 1) === true,
    'a primeira abertura tem de desenhar',
  );
  confere(
    'mesma tela, mesma abertura',
    R.precisaRedesenhar({ chave: 'praticas', abertura: 1 }, 'praticas', 1) === false,
    'durante uma abertura o elemento fica congelado: e isso que tira a travada do Voltar',
  );
  confere(
    'outra tela',
    R.precisaRedesenhar({ chave: 'praticas', abertura: 1 }, 'diario', 2) === true,
    'tela diferente tem de ser desenhada',
  );
  /* O caso que o Pedro encontrou. */
  confere(
    'mesma tela, abertura nova',
    R.precisaRedesenhar({ chave: 'praticas', abertura: 1 }, 'praticas', 2) === true,
    'reabrir a mesma tela com outro conteudo tem de redesenhar — sem isto, todos os cartoes de pratica abrem a mesma pratica',
  );
  confere(
    'fechada nao desenha',
    R.precisaRedesenhar({ chave: 'praticas', abertura: 1 }, null, 1) === false,
    'sem tela mostrada nao ha o que desenhar, e o elemento tem de seguir congelado no deslize de saida',
  );

  /* ---------- 3. A viagem inteira, como o dedo faz ---------- */

  /*
    Abre a ansiedade, volta, abre o estresse. O segundo elemento tem de ser
    outro. Esta e a sequencia exata do relato, rodada pela regra.
  */
  let abertura = 0;
  let anterior = null;
  let guardado = null;
  const passo = (aberta, mostrada, conteudo) => {
    abertura = R.contaAbertura(anterior, aberta, abertura);
    anterior = aberta;
    if (mostrada !== null && R.precisaRedesenhar(guardado, mostrada, abertura)) {
      guardado = { chave: mostrada, abertura, conteudo };
    }
    return guardado;
  };

  passo('praticas', 'praticas', 'ansiedade');
  confere(
    'a viagem: abriu na ansiedade',
    guardado && guardado.conteudo === 'ansiedade',
    `abriu em ${guardado && guardado.conteudo}`,
  );
  /* O Voltar: a camada fecha, e o elemento fica como estava — de proposito. */
  passo(null, 'praticas', 'ansiedade');
  confere(
    'a viagem: o Voltar nao redesenha',
    guardado && guardado.conteudo === 'ansiedade',
    'durante a saida o elemento tem de ficar parado',
  );
  passo(null, null, null);
  passo('praticas', 'praticas', 'estresse');
  confere(
    'a viagem: a segunda abertura e outra pratica',
    guardado && guardado.conteudo === 'estresse',
    `abriu em ${guardado && guardado.conteudo} — e o defeito que o Pedro relatou`,
  );

  /* E sem passar pelo fechado: pratica, diario, pratica de novo. */
  passo('diario', 'diario', 'diario');
  passo('praticas', 'praticas', 'tristeza');
  confere(
    'a viagem: voltar das praticas por outra tela',
    guardado && guardado.conteudo === 'tristeza',
    `abriu em ${guardado && guardado.conteudo}`,
  );

  console.log(`${casos} conferências, ${falhas} falha(s)`);
  if (falhas) {
    console.log('');
    for (const d of detalhes) console.log(d);
    console.log('');
    console.log('Ver `regrasDaCamada` e `CamadaEmpilhada` para o porquê de cada regra.');
    process.exit(1);
  }
  console.log('a camada empilhada refaz a tela a cada abertura, e só a cada abertura.');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
