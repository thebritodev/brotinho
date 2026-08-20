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
  });
}

export function stopNativeSpeech(): void {
  speechModule?.stop();
}

/** Assina um evento nativo. Devolve a função de cancelamento. */
export function subscribeSpeech(
  event: 'result' | 'end' | 'error',
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
