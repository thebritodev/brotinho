/**
 * Confere que o app de desenvolvimento tem identidade própria — e que o app
 * de verdade não foi arrastado junto.
 *
 * ## Por que isto merece um teste
 *
 * O `app.config.js` existe para que o development build e o APK da loja possam
 * conviver no mesmo aparelho. Ele faz isso trocando o pacote do Android, e
 * pacote é a coisa mais perigosa de se errar neste projeto: um engano que
 * deixasse `com.brotinho.app.dev` vazar para o perfil de produção publicaria na
 * Play Store um app que **não é** o que já está lá — e quem tem o Brotinho
 * instalado nunca receberia a atualização, porque para o Android seria outro
 * app. Não há como desfazer isso depois de publicado.
 *
 * O erro simétrico é mais fácil de cometer e mais silencioso: mexer no arquivo
 * e o de desenvolvimento voltar a nascer com o pacote de produção. Aí os dois
 * param de conviver de novo, sem nada avisando — só o incômodo de reinstalar
 * 100 MB toda vez que se quer trocar de um para o outro.
 *
 * ## O que ele afirma
 *
 * Que em qualquer perfil que não seja `development` a configuração sai
 * **idêntica** ao `app.json`, campo por campo; e que em `development` mudam
 * exatamente quatro coisas, nem uma a mais.
 *
 * Não chama o `expo config` de propósito: aquilo leva vinte segundos por
 * perfil e traz junto tudo o que os plugins acrescentam. O que importa aqui é
 * a decisão deste arquivo, e ela é testável direto.
 *
 * Uso: node scripts/confere-identidade.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const doApp = require(path.join(RAIZ, 'app.json')).expo;
const identidade = require(path.join(RAIZ, 'app.config.js'));

/** Os quatro campos que o perfil de desenvolvimento pode mexer, e só eles. */
const PERMITIDO_MUDAR = ['name', 'scheme', 'android.package', 'ios.bundleIdentifier'];

let falhas = 0;

function ok(condicao, descricao, detalhe = '') {
  if (!condicao) falhas += 1;
  console.log(`  ${condicao ? 'ok   ' : 'FALHA'} ${descricao}${detalhe ? `  ${detalhe}` : ''}`);
}

/** Achata em `a.b.c: valor`, para comparar duas configurações campo a campo. */
function achatar(objeto, prefixo = '', saida = {}) {
  for (const [chave, valor] of Object.entries(objeto ?? {})) {
    const caminho = prefixo ? `${prefixo}.${chave}` : chave;
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) achatar(valor, caminho, saida);
    else saida[caminho] = JSON.stringify(valor);
  }
  return saida;
}

function comPerfil(perfil) {
  const antes = process.env.EAS_BUILD_PROFILE;
  if (perfil === undefined) delete process.env.EAS_BUILD_PROFILE;
  else process.env.EAS_BUILD_PROFILE = perfil;
  try {
    /* Cópia funda: o `config` não pode sair mutado de uma chamada para a outra. */
    return identidade({ config: JSON.parse(JSON.stringify(doApp)) });
  } finally {
    if (antes === undefined) delete process.env.EAS_BUILD_PROFILE;
    else process.env.EAS_BUILD_PROFILE = antes;
  }
}

console.log('— a identidade do app por perfil —\n');

/* 1. O app de verdade sai intocado, em todo perfil que não seja o de dev. */
const original = achatar(doApp);
for (const perfil of [undefined, 'preview', 'production']) {
  const saiu = achatar(comPerfil(perfil));
  const mudou = Object.keys({ ...original, ...saiu }).filter((k) => original[k] !== saiu[k]);
  ok(
    mudou.length === 0,
    `perfil ${perfil ?? '(nenhum)'} devolve o app.json intacto`,
    mudou.length ? `mudou: ${mudou.join(', ')}` : '',
  );
}

/* 2. O de desenvolvimento muda os quatro campos, e nenhum outro. */
const dev = achatar(comPerfil('development'));
const mudou = Object.keys({ ...original, ...dev }).filter((k) => original[k] !== dev[k]);
ok(
  mudou.length === PERMITIDO_MUDAR.length && PERMITIDO_MUDAR.every((c) => mudou.includes(c)),
  'development muda exatamente os quatro campos previstos',
  `mudou: ${mudou.join(', ') || 'nada'}`,
);

/* 3. E muda para valores que de fato separam os dois apps. */
const pacoteReal = doApp.android.package;
ok(
  JSON.parse(dev['android.package']) !== pacoteReal,
  'o pacote do Android do dev é diferente do de produção',
  `${pacoteReal} → ${JSON.parse(dev['android.package'] ?? '""')}`,
);
ok(
  JSON.parse(dev['ios.bundleIdentifier']) !== doApp.ios.bundleIdentifier,
  'o bundle do iOS do dev é diferente do de produção',
);
ok(!!dev.scheme, 'o dev tem `scheme` próprio, para o QR não cair no Expo Go');
ok(
  original.scheme === undefined,
  'o app de produção continua sem `scheme`, como sempre esteve',
);

console.log(`\n${falhas} falha(s) de identidade`);
process.exit(falhas === 0 ? 0 : 1);
