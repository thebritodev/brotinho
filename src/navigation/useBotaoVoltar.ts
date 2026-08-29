import { useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';

/**
 * O botão (ou o gesto) de voltar do Android, tratado tela a tela.
 *
 * O app não tem biblioteca de navegação — as telas são estado dentro de outras
 * telas. Sem isso aqui, o Android não tinha para onde voltar e fazia a única
 * coisa que sabe: **fechar o aplicativo**. Alguém quatro telas adentro,
 * lendo uma prática, tocava a barrinha de baixo e o app sumia.
 *
 * Cada tela com estado próprio diz o que fazer: devolve `true` quando tratou o
 * voltar, e `false` quando não tem para onde ir — aí quem responde é a tela de
 * cima, e no fim o próprio sistema, que fecha o app.
 *
 * ---
 *
 * **Por que a função vai num `ref`.** O Android chama os inscritos na ordem
 * inversa da inscrição: o último a se inscrever responde primeiro. Como as
 * telas mais fundas montam depois, isso já dá a ordem certa de graça — a
 * prática responde antes da lista, que responde antes das abas.
 *
 * Reinscrever a cada render quebraria justamente isso: a tela de cima mudaria
 * de estado, se reinscreveria, e passaria na frente da tela de baixo. O `ref`
 * mantém a inscrição única, feita na montagem, enquanto a função enxerga
 * sempre o estado mais recente.
 *
 * No iOS não faz nada: lá não existe botão de voltar do sistema, e o gesto de
 * arrastar da borda pertence à navegação nativa, que este app não usa.
 */
export function useBotaoVoltar(aoVoltar: () => boolean): void {
  const atual = useRef(aoVoltar);
  atual.current = aoVoltar;

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const inscricao = BackHandler.addEventListener('hardwareBackPress', () => atual.current());
    return () => inscricao.remove();
  }, []);
}
