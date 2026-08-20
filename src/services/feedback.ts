import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { CONTATO } from '../data/privacyPolicy';

/**
 * Abre o app de e-mail com destinatario, assunto e contexto ja preenchidos.
 *
 * A versao e a plataforma vao no corpo de proposito: sem isso, todo relato
 * vira uma ida e volta perguntando "qual versao voce usa?".
 */
export async function enviarFeedback(): Promise<'ok' | 'sem-email' | 'sem-destinatario'> {
  // Enquanto o contato for o marcador de exemplo, nao ha para onde mandar.
  if (!CONTATO || CONTATO.startsWith('[')) return 'sem-destinatario';

  const versao = Constants.expoConfig?.version ?? '?';
  const corpo = [
    '',
    '',
    '---',
    'Escreva acima. As linhas abaixo ajudam a entender o que aconteceu:',
    `Versao do app: ${versao}`,
    `Sistema: ${Platform.OS} ${Platform.Version}`,
  ].join('\n');

  const url =
    `mailto:${CONTATO}` +
    `?subject=${encodeURIComponent('Feedback sobre o Brotinho')}` +
    `&body=${encodeURIComponent(corpo)}`;

  const podeAbrir = await Linking.canOpenURL(url).catch(() => false);
  if (!podeAbrir) return 'sem-email';

  await Linking.openURL(url);
  return 'ok';
}
