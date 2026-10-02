import { Platform } from 'react-native';

import { File, Paths } from 'expo-file-system';
import type Svg from 'react-native-svg';

import { limparExportacoes } from './limparExportacoes';
import { pngDaFrase } from './compartilharFrase';

/**
 * As duas saídas que não passam pela folha do sistema: salvar e copiar.
 *
 * ## Por que elas existem
 *
 * O documento desenha três botões na tela de compartilhar — "Postar nos
 * stories", "Salvar imagem" e "Copiar texto" —, e eu tinha entregue só o
 * primeiro, argumentando que a folha do sistema já oferece os outros dois. O
 * argumento é verdadeiro e é fraco: a folha oferece **se** a pessoa souber
 * procurar, com dois toques a mais e com um nome diferente em cada aparelho.
 * Um botão que diz o que faz vale mais do que um caminho que existe.
 *
 * ## Por que a galeria entra só para escrever
 *
 * `expo-media-library` declara, por padrão, permissão de **ler** a galeria
 * inteira: `READ_EXTERNAL_STORAGE`, `READ_MEDIA_IMAGES` e
 * `READ_MEDIA_VISUAL_USER_SELECTED`. Num app cuja promessa é que nada sai do
 * aparelho, isso apareceria na ficha da Play como "Fotos e vídeos: ler" — e a
 * tela de privacidade teria de desdizer o que ela diz hoje.
 *
 * As três estão bloqueadas no `app.json` (`android.blockedPermissions`), e a
 * permissão é pedida com `writeOnly`. Do Android 10 para cima isso não precisa
 * de permissão nenhuma — o sistema grava por armazenamento com escopo; abaixo
 * disso, basta a de escrita. No iPhone, o que o sistema pergunta é só "pode
 * **adicionar** às fotos?".
 *
 * O resultado é que o app ganha o botão sem ganhar o direito de olhar as
 * fotos de ninguém, que é a única forma de ter os dois.
 *
 * ## Por que os dois módulos são carregados tarde, e não no alto do arquivo
 *
 * Porque **módulo nativo que não está no binário derruba o app inteiro**, e
 * derruba no boot.
 *
 * A primeira versão deste arquivo escrevia `import * as Clipboard from
 * 'expo-clipboard'` lá em cima. O `index` do pacote chama `requireNativeModule`
 * na hora em que é importado; quem importa este arquivo é a tela de
 * compartilhar, que é importada pela tela inicial — então o grafo de módulos
 * inteiro passa por aqui antes de a primeira tela aparecer. Num aparelho com
 * uma build anterior ao pacote, o app abria em tela vermelha:
 *
 *     [runtime not ready]: Error: Cannot find native module 'ExpoClipboard'
 *
 * Isto não é só um problema de desenvolvimento. É o mesmo formato de falha que
 * `compartilharFrase` conta por extenso: um módulo nativo pode estar no
 * `package.json`, no `.dex` e autolinkado, e ainda assim não ser encontrado em
 * execução. A diferença entre "um botão não funciona" e "o app não abre" é
 * inteiramente onde o `require` acontece.
 *
 * Então eles são carregados **dentro da função**, em `try`. O custo é uma
 * chamada de `require` por toque, que é nada; o ganho é que a pior coisa que
 * pode acontecer é o botão dizer que não dá.
 *
 * `confere-modulos-tardios.js` guarda a regra.
 */

/**
 * Um módulo nativo carregado na hora do uso, ou `null` se ele não existe aqui.
 *
 * `require` e não `import` de propósito: `import` é içado para o topo do
 * arquivo pelo empacotador, e içado para o topo ele volta a rodar no boot —
 * que é exatamente o que esta função existe para impedir.
 */
function moduloTardio<T>(carregar: () => T): T | null {
  try {
    return carregar();
  } catch {
    return null;
  }
}

export type ResultadoDeGuardar =
  | { tipo: 'ok' }
  /** A pessoa disse não ao sistema. */
  | { tipo: 'sem-permissao' }
  /** Não existe galeria nem área de transferência aqui — a web, por exemplo. */
  | { tipo: 'indisponivel' }
  | { tipo: 'falhou'; motivo: string };

/** O nome carrega o prefixo do app: é o que o `limparExportacoes` varre. */
const NOME = 'brotinho-frase-salva.png';

function motivoDe(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

/**
 * Copia a frase como texto.
 *
 * Sem permissão nenhuma, em nenhuma plataforma — a área de transferência é do
 * próprio toque. É a saída mais barata da tela e, para muita gente, a única
 * que importa: nem todo mundo quer postar uma imagem, e quase todo mundo
 * quer mandar a frase para alguém.
 */
export async function copiarFrase(texto: string): Promise<ResultadoDeGuardar> {
  const Clipboard = moduloTardio<typeof import('expo-clipboard')>(
    // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
    () => require('expo-clipboard'),
  );
  if (!Clipboard) return { tipo: 'indisponivel' };

  try {
    await Clipboard.setStringAsync(texto);
    return { tipo: 'ok' };
  } catch (e) {
    return { tipo: 'falhou', motivo: motivoDe(e) };
  }
}

/**
 * Salva o card como imagem na galeria.
 *
 * O PNG sai do mesmo lugar de onde sai o do compartilhar — o próprio `Svg`,
 * via `toDataURL`. Ver `compartilharFrase` para a história de por que não é
 * uma foto da tela.
 */
export async function salvarFrase(
  alvo: React.RefObject<Svg | null>,
): Promise<ResultadoDeGuardar> {
  if (Platform.OS === 'web') return { tipo: 'indisponivel' };
  if (!alvo.current) return { tipo: 'falhou', motivo: 'o card não estava montado' };

  const MediaLibrary = moduloTardio<typeof import('expo-media-library')>(
    // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
    () => require('expo-media-library'),
  );
  if (!MediaLibrary) return { tipo: 'indisponivel' };

  try {
    /*
      `writeOnly`, e é o ponto inteiro desta função. Ver a nota do alto: com
      `false` aqui, o sistema passa a pedir acesso de leitura à galeria toda.
    */
    const permissao = await MediaLibrary.requestPermissionsAsync(true);
    if (!permissao.granted) return { tipo: 'sem-permissao' };

    // Varre o que sobrou da vez anterior antes de criar mais um arquivo.
    limparExportacoes();

    const base64 = await pngDaFrase(alvo.current);

    const arquivo = new File(Paths.cache, NOME);
    arquivo.create({ overwrite: true });
    arquivo.write(base64, { encoding: 'base64' });

    /*
      `saveToLibraryAsync`, e não `createAssetAsync`.

      O segundo devolve o `Asset` e, para isso, **lê** a galeria depois de
      gravar — o que exige exatamente a permissão de leitura que este arquivo
      inteiro existe para não pedir. O primeiro grava e pronto, que é tudo o
      que o botão promete.
    */
    await MediaLibrary.saveToLibraryAsync(arquivo.uri);
    return { tipo: 'ok' };
  } catch (e) {
    return { tipo: 'falhou', motivo: motivoDe(e) };
  }
}
