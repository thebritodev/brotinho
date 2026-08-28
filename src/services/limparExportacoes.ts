import { Platform } from 'react-native';

import { Directory, File, Paths } from 'expo-file-system';

/**
 * Apaga do cache os arquivos que o app gerou para compartilhar.
 *
 * "Baixar meus dados" escreve o **diário inteiro em texto puro** num arquivo, e
 * o resumo para a terapia escreve um PDF. Os dois iam para o cache, eram
 * entregues à tela de compartilhar do sistema — e ficavam lá, para sempre.
 *
 * Num app cuja promessa é que o que a pessoa escreve não sai do aparelho, uma
 * cópia legível de tudo esquecida no disco é o oposto do que ele diz fazer. É o
 * mesmo erro da gravação da Composta, que já foi corrigido.
 *
 * ---
 *
 * **Por que limpar depois, e não logo após compartilhar.** No Android o
 * `shareAsync` devolve o controle assim que o outro app é chamado, não quando
 * ele terminou de ler o arquivo. Apagar ali entregaria um arquivo vazio para o
 * WhatsApp ou para o e-mail. Então a limpeza acontece **na abertura seguinte do
 * app** e **antes de exportar de novo**: a cópia dura até a pessoa voltar, e
 * não até ela desinstalar.
 *
 * Só apaga o que tem o prefixo do próprio app. O cache é do Brotinho, mas
 * bibliotecas também escrevem ali, e varrer o que não é nosso quebraria coisas
 * que não são nossas.
 */

const PREFIXO = 'brotinho-';

/** O último pedaço da URI, que é o nome do arquivo. */
function nomeDe(uri: string): string {
  const partes = uri.split('/');
  return decodeURIComponent(partes[partes.length - 1] ?? '');
}

export function limparExportacoes(): void {
  // Na web não existe cache de arquivos, e chamar isto ali só rende o aviso
  // "expo-file-system is not supported on web" a cada tentativa de exportar.
  if (Platform.OS === 'web') return;

  try {
    const cache = new Directory(Paths.cache);
    if (!cache.exists) return;

    for (const item of cache.list()) {
      if (item instanceof Directory) continue;
      if (!nomeDe(item.uri).startsWith(PREFIXO)) continue;
      try {
        item.delete();
      } catch {
        // Um arquivo travado não pode impedir a limpeza dos outros.
      }
    }
  } catch {
    // Sem acesso ao cache: nada a limpar, e nada que justifique derrubar a tela.
  }
}

/**
 * Move o arquivo recém-gerado para um nome que a limpeza reconheça.
 *
 * O `expo-print` escolhe o nome do PDF sozinho, e é um nome aleatório: sem
 * isto, a varredura não teria como distingui-lo de qualquer outro arquivo de
 * biblioteca no cache.
 */
export function comNomeDoBrotinho(uri: string, nome: string): string {
  if (Platform.OS === 'web') return uri;

  try {
    const arquivo = new File(uri);
    const destino = new File(Paths.cache, `${PREFIXO}${nome}`);
    if (destino.exists) destino.delete();
    arquivo.move(destino);
    return destino.uri;
  } catch {
    // Não deu para renomear: melhor compartilhar com o nome feio do que falhar.
    return uri;
  }
}
