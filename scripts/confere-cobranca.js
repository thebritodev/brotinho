/**
 * Confere, antes de compilar, se a build vai mesmo conseguir cobrar.
 *
 * Existe por causa de um erro que já aconteceu: a build 3 foi para a Apple sem a
 * chave do RevenueCat, e o botão "Assinar por R$ 179,90/ano" entrava no app de
 * graça. Nada quebrou, nada avisou — o app simplesmente se deu de presente, com
 * quatro compras submetidas junto na mesma versão.
 *
 * O motivo foi banal: as chaves estavam no `.env`, que não sobe para a nuvem de
 * compilação. Quem lê as variáveis na build é o EAS, e lá não havia nenhuma.
 *
 * Este script confere as três coisas que precisam ser verdade ao mesmo tempo, e
 * fala em português o que fazer quando alguma não é.
 *
 * Uso: node scripts/confere-cobranca.js [ambiente]     (padrão: production)
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');
const AMBIENTE = process.argv[2] || 'production';

const CHAVES = ['EXPO_PUBLIC_REVENUECAT_IOS', 'EXPO_PUBLIC_REVENUECAT_ANDROID'];
const PRODUTOS = ['brotinho_semanal', 'brotinho_mensal', 'brotinho_anual', 'brotinho_vitalicio'];

const problemas = [];
const ok = (t) => console.log(`  ok    ${t}`);
const falha = (t, comoResolver) => {
  console.log(`  FALHA ${t}`);
  problemas.push({ t, comoResolver });
};

// 1. O perfil de build precisa dizer de qual ambiente ele lê as variáveis.
//    Sem isto o EAS compila sem nenhuma delas, e não reclama.
const eas = JSON.parse(fs.readFileSync(path.join(RAIZ, 'eas.json'), 'utf8'));
const perfil = eas.build?.[AMBIENTE];
if (!perfil) {
  falha(`eas.json não tem o perfil "${AMBIENTE}"`, 'confira o nome do perfil');
} else if (perfil.environment !== AMBIENTE) {
  falha(
    `o perfil "${AMBIENTE}" não aponta para o ambiente "${AMBIENTE}"`,
    `abra eas.json e acrescente "environment": "${AMBIENTE}" dentro do perfil`,
  );
} else {
  ok(`eas.json: perfil "${AMBIENTE}" lê o ambiente "${AMBIENTE}"`);
}

// 2. As duas chaves precisam existir no EAS — não no .env.
let listagem = null;
try {
  listagem = execFileSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['eas-cli@latest', 'env:list', AMBIENTE, '--non-interactive'],
    { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' },
  );
} catch (e) {
  const saida = `${e.stdout || ''}${e.stderr || ''}`;
  falha(
    'não consegui perguntar ao EAS quais variáveis existem',
    saida.toLowerCase().includes('log in') || saida.toLowerCase().includes('token')
      ? 'rode `npx eas-cli login` neste terminal e tente de novo'
      : `o eas respondeu: ${saida.trim().split('\n').slice(-2).join(' ')}`,
  );
}

if (listagem !== null) {
  for (const chave of CHAVES) {
    if (listagem.includes(chave)) ok(`${chave} existe no ambiente ${AMBIENTE}`);
    else
      falha(
        `${chave} NÃO existe no ambiente ${AMBIENTE}`,
        `npx eas-cli env:create --environment ${AMBIENTE} --name ${chave} --value <a chave> --visibility sensitive`,
      );
  }
}

// 3. Os identificadores do código precisam ser os mesmos cadastrados nas lojas.
//    Na Apple um identificador não pode ser reaproveitado, então errar aqui
//    custa um produto novo.
const onboarding = fs.readFileSync(path.join(RAIZ, 'src', 'data', 'onboarding.ts'), 'utf8');
const faltando = PRODUTOS.filter((p) => !onboarding.includes(`'${p}'`));
if (faltando.length) falha(`identificador fora do código: ${faltando.join(', ')}`, 'confira PRODUTO_DO_PLANO');
else ok('os 4 identificadores de produto seguem no código');

const assinatura = fs.readFileSync(path.join(RAIZ, 'src', 'services', 'subscription.ts'), 'utf8');
if (/ENTITLEMENT = 'premium'/.test(assinatura)) ok("o direito continua se chamando 'premium'");
else falha('o nome do direito mudou no código', 'ele precisa ser igual ao do RevenueCat');

console.log('');
if (!problemas.length) {
  console.log(`Pode compilar: o ambiente "${AMBIENTE}" tem o que a cobrança precisa.`);
  process.exit(0);
}

console.log(`${problemas.length} problema(s). Compilar assim entrega o app de graça:\n`);
for (const p of problemas) console.log(`  · ${p.t}\n    → ${p.comoResolver}\n`);
process.exit(1);
