import { Platform } from 'react-native';

import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { dayKey } from '../state/derived';
import { sanitizarDados } from '../state/sanitize';
import type { AppData } from '../state/types';

/**
 * A outra ponta da exportação: um arquivo do Brotinho voltando para dentro.
 *
 * `exportarDados.ts` diz, no próprio comentário, que sem conta e sem servidor
 * o arquivo baixado "é a única rede". Só que não existia nada que lesse esse
 * arquivo de volta — a rede tinha uma ponta só. O backup do sistema cobre a
 * troca de celular pelo iCloud, e não cobre apagar o app para liberar espaço,
 * iPhone indo para Android, nem restaurar de um backup não criptografado, que
 * é justamente o caso em que a Apple deixa o diário de fora.
 *
 * ---
 *
 * **Substitui, não junta.** Misturar dois diários exigiria decidir sozinho o
 * que fazer com registros do mesmo dia, ajustes conflitantes e dois jardins —
 * e cada uma dessas decisões seria invisível para a pessoa. Substituir é o que
 * ela consegue prever antes de tocar, e a tela mostra os dois lados em números
 * antes de perguntar.
 *
 * **`sanitizarDados` sozinho não bastava.** Ele devolve um `AppData` válido
 * para qualquer entrada, inclusive lixo: entregar a ele um arquivo qualquer
 * responderia "importado" e apagaria o diário com um estado vazio. Por isso o
 * envelope é conferido **antes** — `app`, `formato` e `dados` — e só o que
 * passa chega ao saneamento.
 *
 * **A cópia do seletor é apagada.** O seletor duplica o arquivo escolhido para
 * o cache, e ali dentro está o diário inteiro em texto puro. Ela não tem o
 * prefixo que `limparExportacoes` varre, então é apagada aqui mesmo, no
 * `finally` — inclusive quando a leitura falha.
 */

/** A versão de envelope que este app sabe ler. Ver `json()` em `exportarDados`. */
export const FORMATO_QUE_EU_LEIO = 1;

export type MotivoDaRecusa =
  | 'cancelado'
  | 'ilegivel'
  | 'nao-e-do-brotinho'
  | 'formato-mais-novo';

export type Trazido =
  | { ok: true; dados: AppData; exportadoEm: string | null }
  | { ok: false; motivo: MotivoDaRecusa };

/**
 * 20 MB. Um diário de anos não passa de alguns megabytes em texto; este teto
 * existe só para um vídeo escolhido por engano não ser lido como texto.
 */
const TAMANHO_MAXIMO = 20 * 1024 * 1024;

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * A conferência do envelope, separada do celular de propósito: é aqui que mora
 * a decisão de substituir o diário de alguém, e ela precisa ser testável sem
 * seletor de arquivo, sem disco e sem app.
 */
export function lerExportacao(conteudo: string, hoje: string): Trazido {
  let bruto: unknown;
  try {
    bruto = JSON.parse(conteudo);
  } catch {
    return { ok: false, motivo: 'ilegivel' };
  }

  if (!ehObjeto(bruto)) return { ok: false, motivo: 'nao-e-do-brotinho' };
  if (bruto.app !== 'Brotinho') return { ok: false, motivo: 'nao-e-do-brotinho' };
  if (!ehObjeto(bruto.dados)) return { ok: false, motivo: 'nao-e-do-brotinho' };

  const formato = bruto.formato;
  if (typeof formato !== 'number' || !Number.isFinite(formato))
    return { ok: false, motivo: 'nao-e-do-brotinho' };

  // Um arquivo de uma versão futura pode ter campos que este app não entende.
  // Ler pela metade e chamar de restauração seria pior do que recusar.
  if (formato > FORMATO_QUE_EU_LEIO) return { ok: false, motivo: 'formato-mais-novo' };

  return {
    ok: true,
    dados: sanitizarDados(bruto.dados, hoje),
    exportadoEm: typeof bruto.exportadoEm === 'string' ? bruto.exportadoEm : null,
  };
}

/**
 * Lê o arquivo escolhido.
 *
 * A web entra aqui de propósito. Ela não é a plataforma de produção, mas é
 * onde esta tela pode ser dirigida de ponta a ponta antes de existir num
 * celular — e esta é a única tela do app que **substitui** o diário de alguém.
 * Verificá-la só no aparelho seria estrear no diário de uma pessoa de verdade.
 */
async function conteudoDe(uri: string): Promise<string> {
  // Na web o `uri` é um blob e não há sistema de arquivos para abrir.
  if (Platform.OS === 'web') return (await fetch(uri)).text();
  return new File(uri).text();
}

/** Apaga a duplicata que o seletor deixou no cache, dê certo ou não a leitura. */
function apagarACopia(uri: string | null): void {
  // Na web não houve cópia: o blob morre com a aba.
  if (!uri || Platform.OS === 'web') return;
  try {
    const copia = new File(uri);
    if (copia.exists) copia.delete();
  } catch {
    // Nem todo provedor devolve um arquivo que dá para apagar. Não é motivo
    // para a restauração falhar.
  }
}

export async function trazerDeUmArquivo(hoje: string = dayKey()): Promise<Trazido> {
  let uri: string | null = null;
  try {
    // O filtro é aberto de propósito. O arquivo sai daqui como `application/json`,
    // mas volta pela nuvem, pelo e-mail ou pelo WhatsApp, e mais de um provedor
    // devolve `application/octet-stream` — um filtro estrito esconderia da
    // pessoa justamente o arquivo dela. Recusar depois, com o motivo na tela, é
    // melhor do que uma lista vazia sem explicação.
    const escolha = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (escolha.canceled) return { ok: false, motivo: 'cancelado' };

    const arquivo = escolha.assets?.[0];
    if (!arquivo?.uri) return { ok: false, motivo: 'ilegivel' };
    uri = arquivo.uri;

    if (typeof arquivo.size === 'number' && arquivo.size > TAMANHO_MAXIMO)
      return { ok: false, motivo: 'nao-e-do-brotinho' };

    return lerExportacao(await conteudoDe(uri), hoje);
  } catch {
    return { ok: false, motivo: 'ilegivel' };
  } finally {
    apagarACopia(uri);
  }
}
