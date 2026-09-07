const { withGradleProperties } = require('expo/config-plugins');

/**
 * Deixa a build Android carregar só as arquiteturas pedidas.
 *
 * ## Por que isto existe
 *
 * Por padrão o APK leva as quatro: `arm64-v8a`, `armeabi-v7a`, `x86` e
 * `x86_64`. Isso dá 162 MB, e um celular usa **uma** delas — as outras três são
 * peso morto que ele baixa, guarda e verifica à toa. Só `arm64-v8a` derruba o
 * arquivo para perto de 55 MB.
 *
 * O motivo imediato foi um APK de desenvolvimento que travava em 100% no
 * aparelho sem dizer por quê. Arquivo íntegro, mesma assinatura do anterior que
 * havia instalado, mesmas permissões, mesmas bibliotecas nativas — tudo isso
 * medido. Sobrou o que o tamanho encosta: espaço para descompactar e tempo de
 * verificação. Um arquivo três vezes menor tira essas duas da mesa.
 *
 * ## Por que uma variável de ambiente, e não sempre
 *
 * Porque a loja precisa do contrário. Um APK ou AAB de produção tem de atender
 * aparelhos que não são o seu, e cortar `armeabi-v7a` deixaria de fora todo
 * telefone de 32 bits. Sem `BROTINHO_ARQUITETURAS` definida, este plugin não
 * mexe em nada — o perfil `production` continua exatamente como era, e quem
 * ler isto daqui a um ano não precisa desconfiar de nada por causa dele.
 *
 * Uso: definir `BROTINHO_ARQUITETURAS` no perfil do `eas.json`, por exemplo
 * `"arm64-v8a"` ou `"arm64-v8a,armeabi-v7a"`.
 */
const CHAVE = 'reactNativeArchitectures';

module.exports = function arquiteturasDoAndroid(config) {
  const pedidas = process.env.BROTINHO_ARQUITETURAS;
  if (!pedidas) return config;

  return withGradleProperties(config, (c) => {
    // Tira a linha que o template do Expo já escreve, para não ficarem duas.
    c.modResults = c.modResults.filter(
      (item) => !(item.type === 'property' && item.key === CHAVE),
    );
    c.modResults.push({ type: 'property', key: CHAVE, value: pedidas });
    return c;
  });
};
