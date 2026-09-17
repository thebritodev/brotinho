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
 * O `scheme` só existe no de desenvolvimento, de propósito. Dar um ao app de
 * verdade seria uma mudança no binário que a Apple já revisou, e ela não tem
 * nada a ver com poder testar no celular. Fica para quando houver motivo.
 *
 * ## Por que `EAS_BUILD_PROFILE`
 *
 * É a variável que o EAS define com o nome do perfil durante a build. Rodando
 * `expo start` aqui na máquina ela não existe, e o app volta a ser o normal —
 * o que é certo: quem decide a identidade é o binário instalado no aparelho,
 * não o servidor que serve o JavaScript.
 */

/** O sufixo é o mesmo nos três lugares; escrever uma vez evita desencontro. */
const MARCA_DE_DEV = 'dev';

module.exports = ({ config }) => {
  if (process.env.EAS_BUILD_PROFILE !== 'development') return config;

  return {
    ...config,
    name: `${config.name} ${MARCA_DE_DEV}`,
    scheme: `brotinho-${MARCA_DE_DEV}`,
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
