/**
 * A trava que roda dentro da build faz o que promete?
 *
 * Ela so dispara no servidor do EAS, onde as variaveis `EAS_BUILD_*` existem —
 * entao aqui elas sao simuladas, e o que se confere e o codigo de saida em
 * cada cenario. Os dois que importam sao os extremos: **producao sem a chave
 * tem de falhar**, e **desenvolvimento sem a chave tem de passar**. Travar o
 * desenvolvimento seria trocar um acidente por outro: ninguem conseguiria mais
 * compilar o app para testar.
 *
 * Uso: node scripts/testa-trava-da-build.js
 */
const { spawnSync } = require('child_process');
const path = require('path');

const TRAVA = path.join(__dirname, 'trava-da-build.js');

let casos = 0;
let falhas = 0;
const detalhes = [];

function confere(nome, ambiente, esperado) {
  casos += 1;
  const r = spawnSync(process.execPath, [TRAVA], {
    env: { ...process.env, ...ambiente },
    encoding: 'utf8',
  });
  const deu = r.status;
  const ok = deu === esperado;
  if (!ok) {
    falhas += 1;
    detalhes.push(`  FALHA ${nome}: esperava sair com ${esperado}, saiu com ${deu}`);
  }
  console.log(`  ${ok ? 'ok   ' : 'FALHA'} ${nome.padEnd(52)} saiu com ${deu}`);
}

/* As variaveis que a trava le, zeradas: o ambiente desta maquina nao pode
   vazar para dentro do teste e mascarar um caso. */
const LIMPO = {
  EAS_BUILD_PROFILE: '',
  EAS_BUILD_PLATFORM: '',
  EXPO_PUBLIC_REVENUECAT_IOS: '',
  EXPO_PUBLIC_REVENUECAT_ANDROID: '',
  EXPO_PUBLIC_TRANSCRIPTION_URL: '',
};

console.log('— a trava da build —\n');

confere('fora do EAS, não tem o que conferir', { ...LIMPO }, 0);

confere(
  'produção android sem a chave: para a build',
  { ...LIMPO, EAS_BUILD_PROFILE: 'production', EAS_BUILD_PLATFORM: 'android' },
  1,
);

confere(
  'produção ios sem a chave: para a build',
  { ...LIMPO, EAS_BUILD_PROFILE: 'production', EAS_BUILD_PLATFORM: 'ios' },
  1,
);

confere(
  'produção android com a chave: segue',
  {
    ...LIMPO,
    EAS_BUILD_PROFILE: 'production',
    EAS_BUILD_PLATFORM: 'android',
    EXPO_PUBLIC_REVENUECAT_ANDROID: 'goog_umaChaveQualquer',
  },
  0,
);

confere(
  'produção ios com a chave: segue',
  {
    ...LIMPO,
    EAS_BUILD_PROFILE: 'production',
    EAS_BUILD_PLATFORM: 'ios',
    EXPO_PUBLIC_REVENUECAT_IOS: 'appl_umaChaveQualquer',
  },
  0,
);

confere(
  'desenvolvimento sem chave nenhuma: segue',
  { ...LIMPO, EAS_BUILD_PROFILE: 'development', EAS_BUILD_PLATFORM: 'android' },
  0,
);

confere(
  'preview sem chave nenhuma: segue',
  { ...LIMPO, EAS_BUILD_PROFILE: 'preview', EAS_BUILD_PLATFORM: 'ios' },
  0,
);

confere(
  'produção com a transcrição ligada: para a build',
  {
    ...LIMPO,
    EAS_BUILD_PROFILE: 'production',
    EAS_BUILD_PLATFORM: 'ios',
    EXPO_PUBLIC_REVENUECAT_IOS: 'appl_umaChaveQualquer',
    EXPO_PUBLIC_TRANSCRIPTION_URL: 'https://exemplo.com/transcrever',
  },
  1,
);

/* E o gancho precisa continuar ligado no `package.json`: a trava mais bem
   escrita do mundo nao serve se o EAS nunca a chamar. */
const pkg = require(path.join(__dirname, '..', 'package.json'));
casos += 1;
const ligado = /trava-da-build/.test(pkg.scripts['eas-build-pre-install'] || '');
if (!ligado) {
  falhas += 1;
  detalhes.push('  FALHA o gancho `eas-build-pre-install` não chama mais a trava');
}
console.log(`  ${ligado ? 'ok   ' : 'FALHA'} o gancho \`eas-build-pre-install\` chama a trava`);

console.log('');
console.log(`${casos} conferências, ${falhas} falha(s)`);
if (falhas) {
  console.log('');
  for (const d of detalhes) console.log(d);
  process.exit(1);
}
console.log('a trava para a build de loja sem cobrança, e deixa passar o resto.');
process.exit(0);
