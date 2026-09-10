/**
 * Confere a conversão do passo salvo no rascunho do onboarding.
 *
 * ## Por que existe
 *
 * O rascunho guarda o **número** do passo em que a pessoa parou. Quando o nome
 * dela e o nome do broto viraram duas telas, um passo novo entrou na posição 2
 * e todos os seguintes andaram uma casa.
 *
 * Quem estivesse no meio do onboarding na hora de atualizar o app voltaria uma
 * tela antes da certa, se o número antigo fosse usado cru. Não quebra nada — as
 * respostas estão no rascunho —, mas é o tipo de erro que ninguém percebe
 * acontecendo e todo mundo percebe como "o app me mandou para trás".
 *
 * Nenhum teste de tela pega isso: só aparece em quem tinha um rascunho gravado
 * pela versão anterior. Então a conversão é conferida aqui, sozinha.
 *
 * Uso: node scripts/testa-passos-do-onboarding.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');

(async () => {
  const saida = pastaTemporaria('passos-onboarding');
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  execFileSync(
    process.execPath,
    [
      tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck', '--jsx', 'react-jsx',
      path.join(RAIZ, 'src', 'data', 'onboarding.ts'),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );

  const arquivos = [];
  const pilha = [saida];
  while (pilha.length) {
    const dir = pilha.pop();
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) pilha.push(p);
      else if (e.name.endsWith('.js')) arquivos.push(p);
    }
  }
  /* O Node ESM exige extensao no import; o tsc nao a escreve. */
  for (const a of arquivos) {
    let corpo = fs.readFileSync(a, 'utf8');
    corpo = corpo.replace(/from ['"](\.[^'"]*?)['"]/g, (_, r) => {
      const destino = path.resolve(path.dirname(a), r);
      const ehPasta = fs.existsSync(destino) && fs.statSync(destino).isDirectory();
      return `from '${r}${ehPasta ? '/index.js' : '.js'}'`;
    });
    fs.writeFileSync(a, corpo);
  }

  const mod = arquivos.find((a) => a.endsWith(`${path.sep}onboarding.js`));
  const { passoRestaurado, TOTAL, VERSAO_DOS_PASSOS } = await import(
    `file://${mod.replace(/\\/g, '/')}`
  );

  let total = 0;
  let falhas = 0;
  const checa = (nome, obtido, esperado) => {
    total += 1;
    if (obtido === esperado) return console.log(`  ok   ${nome}`);
    falhas += 1;
    console.log(`  FALHA ${nome}\n        veio ${obtido}, esperava ${esperado}`);
  };

  console.log(`\nrascunho da numeracao antiga (sem versao) · TOTAL=${TOTAL}:`);
  checa('introducao continua na introducao', passoRestaurado(0, undefined), 0);
  checa('quem parou no nome volta ao nome (so o dela, agora)', passoRestaurado(1, undefined), 1);
  checa('o check-in antigo (2) vira o novo (3)', passoRestaurado(2, undefined), 3);
  checa('"o que voce tem feito" antigo (4) vira o novo (5)', passoRestaurado(4, undefined), 5);
  checa('o paywall antigo (13) continua sendo o paywall (14)', passoRestaurado(13, undefined), 14);

  console.log('\nrascunho da numeracao atual:');
  checa('passo 2 e o nome do broto, e fica', passoRestaurado(2, VERSAO_DOS_PASSOS), 2);
  checa('passo 5 fica no 5', passoRestaurado(5, VERSAO_DOS_PASSOS), 5);

  console.log('\nlixo no disco:');
  checa('numero invalido vai para o comeco', passoRestaurado(NaN, undefined), 0);
  checa('passo negativo vai para o comeco', passoRestaurado(-3, VERSAO_DOS_PASSOS), 0);
  checa('passo alem do fim para no ultimo', passoRestaurado(99, VERSAO_DOS_PASSOS), TOTAL - 1);

  console.log(`\n${total} casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
