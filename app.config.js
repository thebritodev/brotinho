/**
 * O app de desenvolvimento ganha identidade própria, para conviver com o real.
 *
 * ## O problema que isto resolve
 *
 * O `development build` e o APK normal saíam os dois com o pacote
 * `com.brotinho.app`. Android não instala dois apps com o mesmo pacote: o
 * segundo **substitui** o primeiro. Na prática havia um Brotinho só no
 * aparelho, e qual dos dois ele era dependia de qual tinha entrado por último
 * pelo cabo — sem nada na tela inicial que dissesse qual.
 *
 * Isso quebrava as duas coisas ao mesmo tempo. Para testar um ajuste em
 * segundos era preciso ter o de desenvolvimento instalado; para ver o app como
 * a pessoa vê, o normal. Alternar entre os dois custava uma reinstalação de
 * 100 MB cada vez, e o `exp://` ainda por cima caía no Expo Go, que não roda
 * este projeto.
 *
 * ## Como funciona
 *
 * O `app.json` continua sendo a fonte da verdade — ele não foi tocado. Este
 * arquivo recebe o conteúdo dele em `config` e devolve igual, **exceto** na
 * build de desenvolvimento, onde troca três coisas:
 *
 * - **o pacote**, que é o que permite os dois viverem lado a lado;
 * - **o nome**, que é o que diz qual é qual na tela inicial do celular;
 * - **o `scheme`**, que é o que faz o QR abrir neste app em vez de no Expo Go.
 *
 * O app de verdade continua sem `scheme`, de propósito: dá-lo seria uma
 * mudança no binário que a Apple já revisou, e ela não tem nada a ver com
 * poder testar no celular.
 *
 * ## As três situações, e por que são três
 *
 * Quem chama este arquivo não é só o EAS. São três chamadores, e cada um
 * precisa de uma resposta diferente:
 *
 * 1. **A build de desenvolvimento** (`EAS_BUILD_PROFILE=development`): nome,
 *    pacote e `scheme` trocados. É ela que grava `brotinho-dev://` no binário.
 * 2. **As outras builds** (`preview`, `production`): o `app.json` intacto. É o
 *    app que vai para a loja.
 * 3. **`expo start` aqui na máquina** (nenhum perfil): o `app.json` **mais o
 *    `scheme`**, e só ele.
 *
 * A terceira é a correção de um defeito, e vale contar porque o sintoma não
 * aponta para cá. Antes, servir localmente caía no caso 2 — sem `scheme`. Só
 * que é o `scheme` que o `expo start --dev-client` usa para montar o endereço
 * do QR: sem ele a CLI não tem como escrever `brotinho-dev://`, e cai no
 * `exp://`, que é o endereço do **Expo Go**. O celular então abria o Expo Go,
 * que não roda este projeto — tem `react-native-purchases` e
 * `expo-speech-recognition`, que não existem lá dentro —, e a tela dizia
 * "error loading app". O servidor estava certo, o pacote estava certo, o app
 * de desenvolvimento estava instalado: o que estava errado era para quem o QR
 * apontava.
 *
 * Aqui só o `scheme` entra, e nome e pacote ficam como estão. Servir não
 * produz binário nenhum — este valor existe para a CLI escrever um endereço —,
 * então trocar a identidade do app não teria para quem servir. A exceção é
 * `expo prebuild` / `expo run:android` nesta máquina, que passariam a gerar um
 * `com.brotinho.app` com `scheme`. Essa build nunca sobe para loja; quem sobe
 * sai do EAS, pelo caso 2.
 */

/** O sufixo é o mesmo nos três lugares; escrever uma vez evita desencontro. */
const MARCA_DE_DEV = 'dev';

/** O endereço que o app de desenvolvimento registra, e que o QR precisa usar. */
const SCHEME_DE_DEV = `brotinho-${MARCA_DE_DEV}`;

module.exports = ({ config }) => {
  const perfil = process.env.EAS_BUILD_PROFILE;

  /* Caso 3: servindo aqui. O `scheme`, e nada mais — ver o cabeçalho. */
  if (!perfil) return { ...config, scheme: SCHEME_DE_DEV };

  /* Caso 2: preview e production saem como o `app.json` manda. */
  if (perfil !== 'development') return config;

  /* Caso 1: a build que vira o app de desenvolvimento no aparelho. */
  return {
    ...config,
    name: `${config.name} ${MARCA_DE_DEV}`,
    scheme: SCHEME_DE_DEV,
    android: {
      ...config.android,
      package: `${config.android.package}.${MARCA_DE_DEV}`,
    },
    ios: {
      ...config.ios,
      bundleIdentifier: `${config.ios.bundleIdentifier}.${MARCA_DE_DEV}`,
    },
  };
};
