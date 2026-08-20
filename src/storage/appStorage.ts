import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppData } from '../state/types';

const KEY = '@brotinho/app-state-v1';

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
    await AsyncStorage.removeItem(KEY);
  } catch (error) {
    report('apagar os dados', error);
  }
}
