import { Alert, Platform } from 'react-native';

import { isNativeSpeechAvailable, reconheceSemInternet } from './speech';

/**
 * A licença para a Composta conferir a frase pela internet.
 *
 * ## Por que existe
 *
 * A Composta conta uma repetição quando a pessoa diz a frase que escreveu. Para
 * saber o que foi dito, precisa de reconhecimento de fala — e o app sempre fez
 * isso **só dentro do aparelho**. No iPhone, isso existe do XS em diante; no
 * iPhone X para trás a Composta caía no modo de contar pelo som, que não sabe o
 * que foi dito e conta qualquer fala. O Pedro escolheu oferecer, nesses
 * aparelhos, o reconhecimento do sistema pela internet.
 *
 * ## O que a pergunta precisa deixar claro
 *
 * A promessa do app é que o que a pessoa conta não sai do aparelho. Aqui sai —
 * o áudio da prática vai para a Apple (ou o Google) ser transcrito. Então a
 * pergunta diz exatamente isso, diz para quem vai, diz que o Brotinho não
 * recebe nem guarda nada, diz que o diário continua de fora, e diz onde mudar
 * depois. Ela é feita uma vez só, antes da primeira Composta em voz alta, e
 * nunca em aparelho que reconhece sozinho.
 */

/** De quem é o serviço que recebe o áudio, nas palavras da pessoa. */
export const SERVICO_DE_VOZ = Platform.OS === 'ios' ? 'da Apple' : 'do Google';

/** Este aparelho precisa da licença para conferir a frase? */
export function precisaDaLicencaDeVoz(): boolean {
  return isNativeSpeechAvailable() && !reconheceSemInternet();
}

/**
 * Pergunta, e devolve a resposta. Nunca lança.
 *
 * Fechar a janela sem escolher (no Android, tocando fora dela) vale como "não":
 * licença para mandar a voz para fora só existe dita com todas as letras.
 */
export function perguntarSobreAInternet(): Promise<boolean> {
  const aparelho = Platform.OS === 'ios' ? 'Este iPhone' : 'Este celular';
  return new Promise((resolver) => {
    Alert.alert(
      'Conferir a frase pela internet?',
      `${aparelho} não reconhece fala sem internet. Sem isso, a Composta não sabe o que foi dito, e você conta as repetições segurando um botão.\n\n`
        + `Se você deixar, ela usa o reconhecimento de fala ${SERVICO_DE_VOZ}, só durante a prática. O áudio vai para lá para virar texto; o Brotinho não recebe nem guarda nada. O diário continua só no seu aparelho.\n\n`
        + 'Dá para mudar depois em Perfil › Privacidade.',
      [
        { text: 'Usar o botão', style: 'cancel', onPress: () => resolver(false) },
        { text: 'Pode usar', onPress: () => resolver(true) },
      ],
      { cancelable: true, onDismiss: () => resolver(false) },
    );
  });
}
