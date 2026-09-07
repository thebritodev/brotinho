import { Platform } from 'react-native';

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type Svg from 'react-native-svg';

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
 * ## Por que a imagem sai do próprio SVG, e não de uma foto da tela
 *
 * A primeira versão fotografava componentes de verdade com o
 * `react-native-view-shot`. Ganhava a quebra de linha automática e perdia no
 * que acabou decidindo: **dependia de um módulo nativo novo**, e módulo nativo
 * novo só chega no aparelho por build nova. Duas builds depois o módulo estava
 * dentro do APK — conferido no `.dex` —, autolinkado, com `packageInstance`
 * correto na configuração do autolinking, e ainda assim o
 * `TurboModuleRegistry` não o encontrava em execução.
 *
 * O `react-native-svg` já está em todos os binários do app desde o começo e
 * exporta PNG sozinho. Trocar para ele tirou o compartilhar da fila de "só
 * funciona depois de instalar alguma coisa" — que é o único jeito de um recurso
 * novo funcionar no aparelho que a pessoa já tem na mão.
 *
 * ## Por que o arquivo se chama `brotinho-frase.png`
 *
 * O `limparExportacoes` varre o cache na abertura seguinte do app, mas **só
 * apaga o que tem o prefixo do Brotinho** — de propósito, para não varrer o que
 * é de outras bibliotecas. Com outro nome, cada compartilhamento deixaria um
 * PNG esquecido no disco para sempre.
 *
 * ## Por que `janelaDoSistema`
 *
 * Porque a folha de compartilhar é uma janela do sistema por cima do app, e no
 * Android isso põe a atividade em pausa — que o React Native reporta como
 * `AppState = 'background'`, indistinguível de a pessoa ter saído. Sem marcar
 * isso, o bloqueio por biometria cai por cima da folha. É o mesmo motivo que
 * quebrou a Composta uma vez; ver `janelaDoSistema.ts`.
 */

export type ResultadoDoCompartilhar =
  | { tipo: 'ok' }
  /** O aparelho não tem para onde compartilhar. */
  | { tipo: 'sem-compartilhamento' }
  | { tipo: 'falhou'; motivo: string };

const NOME = 'brotinho-frase.png';

/** Quanto tempo esperar o SVG virar PNG antes de desistir. */
const PRAZO_MS = 15000;

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

/**
 * O `toDataURL` do `react-native-svg` responde por callback e **não avisa
 * quando falha**: se o desenho não estiver pronto, ele simplesmente nunca chama
 * de volta. Sem o prazo, o botão ficaria em "Preparando…" para sempre, que é
 * exatamente o tipo de espera silenciosa que já custou caro neste recurso.
 */
function paraBase64(svg: Svg): Promise<string> {
  return new Promise((resolve, reject) => {
    const relogio = setTimeout(
      () => reject(new Error(`o desenho não respondeu em ${PRAZO_MS / 1000}s`)),
      PRAZO_MS,
    );
    try {
      svg.toDataURL((base64: string) => {
        clearTimeout(relogio);
        if (base64) resolve(base64);
        else reject(new Error('o desenho voltou vazio'));
      });
    } catch (e) {
      clearTimeout(relogio);
      reject(e instanceof Error ? e : new Error(motivoDe(e)));
    }
  });
}

export async function compartilharFrase(
  alvo: React.RefObject<Svg | null>,
): Promise<ResultadoDoCompartilhar> {
  // A web não tem cache de arquivos nem folha de compartilhar do sistema.
  if (Platform.OS === 'web') return { tipo: 'sem-compartilhamento' };
  if (!alvo.current) return { tipo: 'falhou', motivo: 'o card não estava montado' };
  if (!(await Sharing.isAvailableAsync())) return { tipo: 'sem-compartilhamento' };

  try {
    // Varre o que sobrou da vez anterior antes de criar mais um arquivo.
    limparExportacoes();

    const base64 = await paraBase64(alvo.current);

    const arquivo = new File(Paths.cache, NOME);
    // Compartilhar de novo cai no mesmo nome, e `create` reclama de arquivo
    // existente — sobrescrever é o comportamento certo aqui.
    arquivo.create({ overwrite: true });
    arquivo.write(base64, { encoding: 'base64' });

    await janelaDoSistema(() =>
      Sharing.shareAsync(arquivo.uri, {
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
