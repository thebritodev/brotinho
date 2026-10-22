/**
 * A trava que roda **dentro** da build, no servidor do EAS.
 *
 * ## Por que esta existe, se ja ha o `confere-cobranca`
 *
 * Porque aquele so arma se alguem o chamar. `npm run loja:android` chama; um
 * `eas build --profile production --platform android` digitado direto nao
 * chama nada. E foi um caminho assim que entregou a build 3 para a Apple sem a
 * chave da RevenueCat, com o app se dando de presente.
 *
 * Esta roda como `eas-build-pre-install`, que o EAS executa em toda build,
 * antes de instalar qualquer coisa. Nao ha como pular: ou ela passa, ou a
 * build falha ali.
 *
 * ## E ela confere o que o outro nao pode
 *
 * O `confere-cobranca` pergunta ao EAS, de fora, **se a variavel esta
 * cadastrada**. Esta roda dentro do ambiente de verdade e olha o valor que a
 * build vai mesmo compilar. E a diferenca entre "existe no painel" e "chegou
 * aqui" — e e exatamente no vao entre as duas que a build 3 passou.
 *
 * Sem dependencia nenhuma de proposito: ela roda **antes** do `npm install`.
 */

const perfil = process.env.EAS_BUILD_PROFILE || '';
const plataforma = process.env.EAS_BUILD_PLATFORM || '';

/* Fora do EAS isto nao tem o que fazer: nenhuma variavel de build existe. */
if (!perfil || !plataforma) {
  console.log('[trava-da-build] fora do EAS; nada a conferir.');
  process.exit(0);
}

console.log(`[trava-da-build] perfil "${perfil}", plataforma "${plataforma}"`);

const problemas = [];

/*
  A chave da loja. So em producao: as builds de desenvolvimento e de preview
  existem justamente para rodar o app sem cobrar, e `cobrancaDisponivel()`
  devolve falso sem ela, o que faz o paywall deixar passar. Ver
  `OnboardingScreen`.
*/
if (perfil === 'production') {
  const daPlataforma = plataforma === 'ios'
    ? 'EXPO_PUBLIC_REVENUECAT_IOS'
    : 'EXPO_PUBLIC_REVENUECAT_ANDROID';
  const valor = (process.env[daPlataforma] || '').trim();
  if (!valor) {
    problemas.push(
      `${daPlataforma} não chegou nesta build.\n` +
        '    Sem ela a cobrança não liga, o paywall deixa passar, e o app vai\n' +
        '    para a loja de graça. Foi o que aconteceu na build 3.\n' +
        `    → npx eas-cli env:create --environment production --name ${daPlataforma} --value <a chave> --visibility sensitive`,
    );
  } else {
    console.log(`[trava-da-build] ok  ${daPlataforma} chegou (${valor.length} caracteres)`);
  }
}

/*
  E nada pode mandar o diario para fora.

  A declaracao de privacidade das duas lojas diz que nada sai do aparelho, e
  isso so e verdade enquanto esta variavel nao chega a uma build de producao.
*/
if (perfil === 'production') {
  const fora = (process.env.EXPO_PUBLIC_TRANSCRIPTION_URL || '').trim();
  if (fora) {
    problemas.push(
      'EXPO_PUBLIC_TRANSCRIPTION_URL chegou numa build de produção.\n' +
        '    As duas lojas receberam a promessa de que o áudio não sai do\n' +
        '    aparelho. Com esta variável, sai.\n' +
        '    → npx eas-cli env:delete --environment production --name EXPO_PUBLIC_TRANSCRIPTION_URL',
    );
  } else {
    console.log('[trava-da-build] ok  o áudio não tem para onde ir');
  }
}

if (problemas.length) {
  console.error('');
  console.error(`[trava-da-build] ${problemas.length} problema(s) — a build para aqui:`);
  console.error('');
  for (const p of problemas) console.error('  · ' + p + '\n');
  process.exit(1);
}

console.log('[trava-da-build] pode seguir.');
process.exit(0);
