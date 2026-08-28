import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppData } from '../state/types';

const KEY = '@brotinho/app-state-v1';
/**
 * Rascunhos: trabalho em andamento que ainda não virou registro.
 *
 * São dois, e existem pelo mesmo motivo. O onboarding tem catorze passos; o
 * diário é uma tela que o `MainTabs` **desmonta** ao trocar de aba, e o texto
 * em andamento vivia só na memória do componente.
 */
const RASCUNHOS = {
  onboarding: '@brotinho/onboarding-rascunho-v1',
  diario: '@brotinho/diario-rascunho-v1',
} as const;

export type QualRascunho = keyof typeof RASCUNHOS;

/**
 * Falha de persistência não pode ser silenciosa: o usuário perde registros do
 * diário sem nenhum sinal. Em desenvolvimento o erro vai para o console (e daí
 * para o terminal do Metro, inclusive quando roda no aparelho).
 */
function report(operation: string, error: unknown) {
  if (__DEV__) {
    console.warn(`[brotinho/storage] falha ao ${operation}:`, error);
  }
}

export async function loadAppData(): Promise<Partial<AppData> | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (__DEV__) console.log('[brotinho/storage] leu', raw ? `${raw.length} bytes` : 'vazio');
    return raw ? (JSON.parse(raw) as Partial<AppData>) : null;
  } catch (error) {
    report('ler os dados salvos', error);
    // Storage corrompido ou indisponível: começa do zero em vez de travar o app.
    return null;
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  try {
    const raw = JSON.stringify(data);
    await AsyncStorage.setItem(KEY, raw);
    if (__DEV__) {
      console.log(`[brotinho/storage] gravou ${raw.length} bytes · ${data.journal.length} registro(s)`);
    }
  } catch (error) {
    report('gravar os dados', error);
  }
}

export async function clearAppData(): Promise<void> {
  try {
    // Os rascunhos vão junto: "apagar meus dados" que deixa sobra não apagou.
    await AsyncStorage.multiRemove([KEY, ...Object.values(RASCUNHOS)]);
  } catch (error) {
    report('apagar os dados', error);
  }
}

// --- Rascunho do onboarding ----------------------------------------------

/**
 * Lê, grava e descarta um rascunho.
 *
 * **O onboarding em andamento, guardado a cada passo.**
 *
 * São catorze passos, e no meio deles a pessoa escreve o pensamento que mais a
 * machuca e faz o experimento da Composta. Nada disso era gravado até o fim:
 * uma ligação, um pico de memória ou um "só vou responder essa mensagem" e o
 * sistema matava o app — voltava tudo ao passo zero, inclusive a parte
 * emocionalmente mais pesada.
 *
 * Fica numa chave separada de propósito. O estado do app é um JSON só, e
 * misturar um rascunho de meia resposta ali obrigaria o `sanitizarDados` a
 * distinguir "perfil de verdade" de "perfil pela metade" em toda abertura.
 *
 * **É apagado quando o onboarding termina** — ver `descartarRascunho`. O
 * rascunho existe para atravessar uma interrupção, não para virar uma segunda
 * cópia do que a pessoa escreveu.
 */
export async function loadRascunho<T>(qual: QualRascunho): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(RASCUNHOS[qual]);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    report('ler o rascunho do onboarding', error);
    return null;
  }
}

export async function saveRascunho(qual: QualRascunho, rascunho: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(RASCUNHOS[qual], JSON.stringify(rascunho));
  } catch (error) {
    report('gravar o rascunho do onboarding', error);
  }
}

export async function descartarRascunho(qual: QualRascunho): Promise<void> {
  try {
    await AsyncStorage.removeItem(RASCUNHOS[qual]);
  } catch (error) {
    report('apagar o rascunho do onboarding', error);
  }
}
