import { Platform, TurboModuleRegistry } from 'react-native';
import type { View } from 'react-native';

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { janelaDoSistema } from './janelaDoSistema';
import { limparExportacoes } from './limparExportacoes';

/**
 * Vira a frase do dia em imagem e entrega para a folha de compartilhar.
 *
 * ## O que sai daqui, e o que nunca sai
 *
 * Só a frase. Ela é do app, não da pessoa — escrita antes de qualquer um
 * instalar. Nada do diário, da Composta ou do humor encosta nesta imagem, e
 * este arquivo não recebe `AppData` justamente para que isso continue verdade
 * mesmo se alguém mexer aqui distraído: o que não chega não pode vazar.
 *
 * ## Por que o `view-shot` só é pedido depois de perguntar se ele existe
 *
 * O spec dele termina em `TurboModuleRegistry.getEnforcing("RNViewShot")`, e
 * `getEnforcing` **lança** quando o módulo nativo não está no binário — no
 * instante em que o arquivo é lido. Importado no topo, ele era lido na abertura
 * do app, e o app inteiro não subia: não era o botão de compartilhar que
 * quebrava, era a Home.
 *
 * E "o binário não tem o módulo" não é hipótese remota, é o caso normal: todo
 * aparelho com um development build anterior a esta biblioteca cai nele, e todo
 * aparelho que ficar sem atualizar continua caindo. O app precisa **abrir** para
 * essa gente; o que ela perde é um botão, não o diário.
 *
 * Adiar para um `require` dentro da função salvou a abertura, mas não bastou —
 * e a razão é que **`try/catch` em volta de um `require` do Metro não pega
 * nada**. O `guardedLoadModule` faz assim:
 *
 * ```js
 * try   { returnValue = loadModuleImplementation(...); }
 * catch (e) { global.ErrorUtils.reportFatalError(e); }
 * return returnValue;   // undefined; o erro não é relançado
 * ```
 *
 * Ou seja: ele relata como **fatal** (a tela vermelha) e engole. Nada chega ao
 * chamador, o `catch` daqui nunca dispara, e a tela vermelha aparece de todo
 * jeito. Foi exatamente o que apareceu no aparelho.
 *
 * A saída é não deixar o `require` acontecer: `TurboModuleRegistry.get`
 * pergunta a mesma coisa que o `getEnforcing`, só que devolve `null` em vez de
 * lançar. Sem o módulo, a biblioteca nunca é carregada e não há o que explodir.
 *
 * ## Por que a imagem passa a se chamar `brotinho-frase.png`
 *
 * O `captureRef` grava com um nome aleatório no cache. O `limparExportacoes`
 * varre o cache na abertura seguinte do app, mas **só apaga o que tem o
 * prefixo do Brotinho** — de propósito, para não varrer o que é de outras
 * bibliotecas. Sem a renomeação, cada compartilhamento deixaria um PNG
 * esquecido no disco para sempre.
 *
 * ## Por que `janelaDoSistema`
 *
 * Porque a folha de compartilhar é uma janela do sistema por cima do app, e no
 * Android isso põe a atividade em pausa — que o React Native reporta como
 * `AppState = 'background'`, indistinguível de a pessoa ter saído. Sem marcar
 * isso, o bloqueio por biometria cai por cima da folha. É o mesmo motivo que
 * quebrou a Composta uma vez; ver `janelaDoSistema.ts`.
 */

/**
 * O que aconteceu, e **por quê** quando deu errado.
 *
 * O `motivo` existe porque a primeira versão disto devolvia só `'falhou'`, e
 * "não consegui preparar a imagem" é uma frase que não permite consertar nada:
 * some a diferença entre módulo ausente, view não encontrada, disco cheio e
 * permissão negada. Quem está com o aparelho na mão vira o único instrumento de
 * medida que existe, e ele estava vendado.
 *
 * O texto só aparece na tela em build de desenvolvimento — ver `AVISOS` no
 * `useCompartilharFrase`. Em produção o recado continua sendo em português de
 * gente.
 */
export type ResultadoDoCompartilhar =
  | { tipo: 'ok' }
  /** O aparelho não tem para onde compartilhar. */
  | { tipo: 'sem-compartilhamento' }
  /** O binário instalado é anterior à biblioteca de captura. */
  | { tipo: 'sem-modulo'; motivo: string }
  | { tipo: 'falhou'; motivo: string };

/** A mensagem de um erro, seja ele `Error` ou qualquer coisa que alguém jogou. */
function motivoDe(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

const NOME = 'brotinho-frase.png';

type Captura = (
  alvo: unknown,
  opcoes: { format: 'png'; quality: number; result: 'tmpfile' },
) => Promise<string>;

/** A função de captura, ou o motivo de ela não estar disponível. */
function carregarCaptura(): { captura: Captura } | { erro: string } {
  /*
    A pergunta que precede tudo, e que precisa vir **antes** do `require`.

    `get` faz a mesma consulta que o `getEnforcing` lá dentro da biblioteca, com
    uma diferença que é o ponto inteiro: devolve `null` em vez de lançar. Com o
    módulo ausente a gente sai daqui sem nunca tocar no pacote — e sem o
    `require`, não há erro de inicialização para o Metro relatar como fatal.
  */
  if (TurboModuleRegistry.get('RNViewShot') == null) {
    return { erro: 'o módulo nativo RNViewShot não está neste binário' };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-view-shot') as { captureRef?: Captura } | undefined;
    // `undefined` aqui quer dizer que o Metro engoliu um erro de inicialização
    // — ver o cabeçalho. Não dá para saber qual; dá para não quebrar.
    if (!mod) return { erro: 'a biblioteca de captura não pôde ser carregada' };
    if (!mod.captureRef) return { erro: 'o módulo carregou sem captureRef' };
    return { captura: mod.captureRef };
  } catch (e) {
    return { erro: motivoDe(e) };
  }
}

export async function compartilharFrase(
  alvo: React.RefObject<View | null>,
): Promise<ResultadoDoCompartilhar> {
  // A web não tem nem captura nativa nem cache de arquivos. O botão nem aparece
  // ali, mas a checagem fica: a tela não deve depender de quem a chama.
  if (Platform.OS === 'web') return { tipo: 'sem-compartilhamento' };
  if (!alvo.current) return { tipo: 'falhou', motivo: 'o card não estava montado' };

  const modulo = carregarCaptura();
  if ('erro' in modulo) return { tipo: 'sem-modulo', motivo: modulo.erro };

  if (!(await Sharing.isAvailableAsync())) return { tipo: 'sem-compartilhamento' };

  try {
    // Varre o que sobrou da vez anterior antes de criar mais um arquivo.
    limparExportacoes();

    const bruto = await modulo.captura(alvo, { format: 'png', quality: 1, result: 'tmpfile' });

    /*
      A renomeação é a única parte que pode falhar sem que o compartilhamento
      precise falhar junto: se der errado, entrega o arquivo com o nome que o
      `captureRef` deu. A pessoa não perde nada; o cache é que fica com um PNG
      a mais até a próxima limpeza geral do sistema.
    */
    let uri = bruto;
    try {
      const destino = new File(Paths.cache, NOME);
      if (destino.exists) destino.delete();
      const origem = new File(bruto);
      origem.move(destino);
      uri = destino.uri;
    } catch {
      // Fica com `bruto` mesmo.
    }

    await janelaDoSistema(() =>
      Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Compartilhar esta frase',
        UTI: 'public.png',
      }),
    );
    return { tipo: 'ok' };
  } catch (e) {
    return { tipo: 'falhou', motivo: motivoDe(e) };
  }
}
