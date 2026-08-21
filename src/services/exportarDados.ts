import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { dayKey } from '../state/derived';
import type { AppData } from '../state/types';

/**
 * Uma cópia de tudo o que o app guarda, para a pessoa levar embora.
 *
 * Existiam três afirmações que não se sustentavam juntas: a tela "Meus dados"
 * mandava ir em Privacidade para *baixar*, Privacidade só sabia apagar, e a
 * política de privacidade — a do app e a publicada — dizia que o direito de
 * portabilidade da LGPD "se exerce pelas próprias telas do app". Não havia
 * tela nenhuma.
 *
 * Aqui pesa mais do que em outros apps: sem conta e sem servidor, se o celular
 * se perder e o backup do sistema estiver desligado, o diário acabou — não
 * existe cópia nossa para devolver. Este arquivo é a única rede.
 *
 * O formato é JSON de propósito. Portabilidade, na lei, é poder levar os dados
 * para outro lugar, o que pede um formato estruturado e legível por máquina —
 * não um PDF bonito. Vai tudo, inclusive o texto do diário: é dela.
 */

export type ResultadoDaExportacao = 'ok' | 'sem-compartilhamento';

/** Nome com a data, para não virar um monte de arquivo igual na pasta. */
const nomeDoArquivo = () => `brotinho-${dayKey()}.json`;

/**
 * O que vai no arquivo.
 *
 * Uma versão e uma data acompanham os dados: quem abrir isto daqui a dois anos
 * precisa saber de quando é e de que formato veio.
 */
function conteudo(data: AppData): string {
  return JSON.stringify(
    {
      app: 'Brotinho',
      formato: 1,
      exportadoEm: new Date().toISOString(),
      dados: data,
    },
    null,
    2,
  );
}

/**
 * Grava o arquivo e abre a folha de compartilhamento do sistema, que é por
 * onde a pessoa escolhe onde guardar — e-mail, nuvem, o que for.
 */
export async function exportarDados(data: AppData): Promise<ResultadoDaExportacao> {
  if (!(await Sharing.isAvailableAsync())) return 'sem-compartilhamento';

  const arquivo = new File(Paths.cache, nomeDoArquivo());
  // Reexportar no mesmo dia cai no mesmo nome, e `create` reclama de arquivo
  // existente — sobrescrever é o comportamento certo aqui.
  arquivo.create({ overwrite: true });
  arquivo.write(conteudo(data));

  await Sharing.shareAsync(arquivo.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Meus dados do Brotinho',
    UTI: 'public.json',
  });

  return 'ok';
}
