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
 * Uso: node scripts/confere-cobranca.js [ambiente] [plataforma]
 *
 * - `ambiente`: padrão `production`
 * - `plataforma`: `android` torna a chave do Google Play obrigatória. Sem ela,
 *   é só aviso — o iOS não precisa dela, e um guarda que grita por algo que
 *   não vai ser usado é um guarda que se aprende a ignorar. Na build Android
 *   que vai para a loja, rode com `android`.
 *
 * Ele também confere que a build **não** vai mandar áudio para fora: a
 * declaração de privacidade das duas lojas diz que nada sai do aparelho, e
 * isso só é verdade enquanto `EXPO_PUBLIC_TRANSCRIPTION_URL` não chega à
 * build de produção.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');
const AMBIENTE = process.argv[2] || 'production';
const PLATAFORMA = process.argv[3] || '';

/**
 * As chaves, e se a falta de cada uma trava a build.
 *
 * A do iOS trava sempre. A do Android trava quando a build é Android — que é
 * quando a falta dela entrega o app de graça. Ver o `Uso` lá em cima.
 */
const CHAVES = [
  { nome: 'EXPO_PUBLIC_REVENUECAT_IOS', trava: true, loja: 'App Store' },
  { nome: 'EXPO_PUBLIC_REVENUECAT_ANDROID', trava: PLATAFORMA === 'android', loja: 'Google Play' },
];

/**
 * O endereço do servidor de transcrição.
 *
 * Existe no `.env` desta máquina, apontando para o servidor de teste na rede
 * de casa. Se ele chegasse à build de produção, o app passaria a mandar o
 * áudio do diário para fora — e as duas lojas receberam a declaração de que
 * nada sai do aparelho.
 */
const PROIBIDA_NA_LOJA = 'EXPO_PUBLIC_TRANSCRIPTION_URL';
/* Semanal e vitalicio sairam da venda; os produtos seguem nas lojas, mas o app nao os oferece. */
const PRODUTOS = ['brotinho_mensal', 'brotinho_anual'];

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
    // Sem `--non-interactive`: este subcomando não aceita esse flag, e passá-lo
    // fazia o script falhar sempre — um guarda que sempre grita é ignorado.
    ['eas-cli@latest', 'env:list', AMBIENTE],
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

const avisos = [];

if (listagem !== null) {
  for (const { nome, trava, loja } of CHAVES) {
    if (listagem.includes(nome)) {
      ok(`${nome} existe no ambiente ${AMBIENTE}`);
      continue;
    }
    const comoResolver = `npx eas-cli env:create --environment ${AMBIENTE} --name ${nome} --value <a chave> --visibility sensitive`;
    if (trava) {
      falha(`${nome} NÃO existe no ambiente ${AMBIENTE}`, comoResolver);
    } else {
      console.log(`  aviso ${nome} ainda não existe — necessária antes do lançamento na ${loja}`);
      avisos.push({ nome, comoResolver, loja });
    }
  }
}

// 2b. Nada pode mandar o diário para fora. A variável não pode estar no EAS, e o
//     `.env` — onde ela mora nesta máquina — não pode subir para a compilação.
//     Sem `.easignore`, o EAS sobe o que o Git não ignora; com ele, só o que
//     ele não ignora. As duas regras precisam deixar o `.env` de fora.
if (listagem !== null) {
  if (listagem.includes(PROIBIDA_NA_LOJA)) {
    falha(
      `${PROIBIDA_NA_LOJA} existe no ambiente ${AMBIENTE} — a build mandaria áudio para fora`,
      `npx eas-cli env:delete --environment ${AMBIENTE} --variable-name ${PROIBIDA_NA_LOJA}`,
    );
  } else {
    ok(`${PROIBIDA_NA_LOJA} não existe no ambiente ${AMBIENTE}`);
  }
}
const ignorados = (arquivo) => {
  const caminho = path.join(RAIZ, arquivo);
  if (!fs.existsSync(caminho)) return null;
  return fs
    .readFileSync(caminho, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim());
};
const regra = ignorados('.easignore') ?? ignorados('.gitignore') ?? [];
const qual = fs.existsSync(path.join(RAIZ, '.easignore')) ? '.easignore' : '.gitignore';
if (regra.some((l) => l === '.env' || l === '.env*' || l === '/.env')) {
  ok(`o .env fica fora da compilação (${qual})`);
} else {
  falha(`o ${qual} não deixa o .env de fora — ele subiria para a compilação`, `acrescente ".env" ao ${qual}`);
}

// 3. Os identificadores do código precisam ser os mesmos cadastrados nas lojas.
//    Na Apple um identificador não pode ser reaproveitado, então errar aqui
//    custa um produto novo.
const onboarding = fs.readFileSync(path.join(RAIZ, 'src', 'data', 'onboarding.ts'), 'utf8');
const faltando = PRODUTOS.filter((p) => !onboarding.includes(`'${p}'`));
if (faltando.length) falha(`identificador fora do código: ${faltando.join(', ')}`, 'confira PRODUTO_DO_PLANO');
else ok(`os ${PRODUTOS.length} identificadores de produto seguem no código`);

const assinatura = fs.readFileSync(path.join(RAIZ, 'src', 'services', 'subscription.ts'), 'utf8');
if (/ENTITLEMENT = 'premium'/.test(assinatura)) ok("o direito continua se chamando 'premium'");
else falha('o nome do direito mudou no código', 'ele precisa ser igual ao do RevenueCat');

console.log('');
if (!problemas.length) {
  console.log(`Pode compilar: o ambiente "${AMBIENTE}" tem o que a cobrança precisa.`);
  for (const a of avisos) {
    console.log(`
Pendente para a ${a.loja}: ${a.nome}
  → ${a.comoResolver}`);
  }
  process.exit(0);
}

console.log(`${problemas.length} problema(s). Compilar assim entrega o app de graça:\n`);
for (const p of problemas) console.log(`  · ${p.t}\n    → ${p.comoResolver}\n`);
process.exit(1);
