import { requireOptionalNativeModule } from 'expo';

/**
 * Reconhecimento de fala do próprio aparelho.
 *
 * É o caminho preferido: não precisa de chave, servidor nem serviço pago, e o
 * áudio nunca sai do celular — o que sustenta a promessa da tela de Privacidade.
 *
 * O módulo nativo é pedido **direto pelo nome**, com `requireOptionalNativeModule`,
 * que devolve `null` quando ele não existe. Importar `expo-speech-recognition`
 * não serve: o pacote chama `requireNativeModule` no corpo do módulo, que lança
 * — e no Expo Go isso derruba o app inteiro na abertura.
 */

type SpeechSubscription = { remove: () => void };

type SpeechModule = {
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  addListener: (event: string, listener: (payload: never) => void) => SpeechSubscription;
};

const speechModule = requireOptionalNativeModule<SpeechModule>('ExpoSpeechRecognition');

export function isNativeSpeechAvailable(): boolean {
  return speechModule !== null;
}

export async function requestSpeechPermissions(): Promise<boolean> {
  if (!speechModule) return false;
  try {
    const result = await speechModule.requestPermissionsAsync();
    return result.granted;
  } catch {
    return false;
  }
}

export function startNativeSpeech(): void {
  speechModule?.start({
    lang: 'pt-BR',
    // Parciais deixam o texto aparecer enquanto a pessoa fala.
    interimResults: true,
    // Desabafo tem pausas; sem isto o reconhecimento encerra no primeiro silêncio.
    continuous: true,
    addsPunctuation: true,
    /**
     * **O ditado não sai do aparelho.**
     *
     * Sem esta linha, o padrão do pacote é `false`, e aí o reconhecedor do
     * sistema manda o áudio para os servidores do Google ou da Apple. A tela de
     * Privacidade afirmava que "o áudio não sai dele" — e não era verdade.
     *
     * O preço é real: em aparelho sem o modelo do português instalado, o
     * reconhecimento falha com `service-not-allowed` ou `language-not-supported`.
     * A escolha foi deliberada. Num diário de saúde mental, mandar a voz da
     * pessoa para um servidor sem ela saber é pior do que ela ter de escrever
     * em vez de ditar — e quem chama trata esses erros dizendo o que aconteceu
     * e como resolver.
     */
    requiresOnDeviceRecognition: true,
  });
}

/**
 * Escuta voltada para conferir a repetição de **uma frase conhecida**, na
 * Composta. É diferente do ditado do diário em três pontos, e cada um tem um
 * motivo:
 *
 * - **`requiresOnDeviceRecognition`** obriga o reconhecimento a acontecer dentro
 *   do aparelho. A Composta é a pessoa dizendo em voz alta o pensamento que mais
 *   a machuca; esse áudio não vai para servidor de ninguém. Se o aparelho não
 *   tiver o modelo do português instalado, o reconhecimento falha — e quem chama
 *   cai no portão acústico, que é pior mas não expõe nada.
 *
 * - **`contextualStrings`** entrega a própria frase ao reconhecedor como pista.
 *   É o que mais aumenta a chance de ele escrever exatamente aquelas palavras,
 *   e a conferência depende disso.
 *
 * - **`volumeChangeEventOptions`** devolve o nível do som. Sem isso seria preciso
 *   rodar o gravador do `expo-audio` em paralelo, e dois donos para o mesmo
 *   microfone dá conflito nas duas plataformas.
 *
 * Sem pontuação de propósito: aqui o texto não é lido por ninguém, só comparado.
 */
export function startPhraseSpeech(frase: string, intervaloDoVolumeMs: number): void {
  speechModule?.start({
    lang: 'pt-BR',
    interimResults: true,
    continuous: true,
    addsPunctuation: false,
    requiresOnDeviceRecognition: true,
    contextualStrings: [frase],
    volumeChangeEventOptions: { enabled: true, intervalMillis: intervaloDoVolumeMs },
  });
}

export function stopNativeSpeech(): void {
  speechModule?.stop();
}

/** Assina um evento nativo. Devolve a função de cancelamento. */
export function subscribeSpeech(
  event: 'result' | 'end' | 'error' | 'volumechange',
  listener: (payload: never) => void,
): () => void {
  if (!speechModule) return () => {};
  try {
    const sub = speechModule.addListener(event, listener);
    return () => sub.remove();
  } catch {
    return () => {};
  }
}
