import React from 'react';
import { View } from 'react-native';

import { Sprout } from './Sprout';

/**
 * O ícone do app, desenhado pelo próprio app.
 *
 * ## Por que isto é código e não um PNG solto
 *
 * O ícone antigo era um arquivo exportado de um editor: uma folha verde chapada
 * sobre um disco pêssego, sem relação com o mascote que a pessoa vê ao abrir o
 * app. Quando o mascote mudou — rosto, contorno, gradientes, bochechas — o
 * ícone ficou para trás e ninguém tinha como notar, porque não havia nada
 * ligando os dois.
 *
 * Aqui o ícone **é** o mascote: o mesmo `Sprout`, com os mesmos tokens de cor.
 * Mexer no broto muda o ícone junto, e `scripts/gera-icone.js` regenera os
 * arquivos a partir daqui.
 *
 * ## As escolhas do desenho
 *
 * **Sem vaso.** O ícone é o broto, não a planta na janela. `showPot={false}` é
 * o mesmo caminho que a prática da respiração usa.
 *
 * **Feliz, no estágio dois.** O estágio três tem dois pares de folhas e enche
 * demais o quadrado; o dois é a silhueta que se reconhece a 60 pixels na tela
 * do celular — uma cabeça e duas folhas. Feliz porque o ícone mostra o que o
 * app promete, não o estado em que a pessoa chega.
 *
 * **O fundo é o barro do próprio vaso** (`tracos.vaso`, `#C08363`), e não uma
 * cor nova. Ele resolve o problema que um fundo creme teria: contra o branco da
 * página da App Store, do Ajustes e do Spotlight, um ícone creme fica em 1,08:1
 * e perde a silhueta — vira um desenho solto em vez de um app. O barro fica em
 * 2,4:1 e mantém a borda, além de dar ao mascote, todo em verdes frios, o
 * complemento quente que o destaca.
 */
export const ICONE_FUNDO = '#C08363';

/**
 * Quanto o mascote ocupa do lado do ícone.
 *
 * `Sprout` trata `size` como escala sobre uma caixa de 200, e o desenho sem
 * vaso não preenche essa caixa: sobra ar em cima e embaixo. O valor foi medido
 * no desenho renderizado, não estimado — ver `scripts/gera-icone.js`, que
 * confere a folga antes de gravar o arquivo.
 */
export const ICONE_OCUPACAO = 0.78;

export function IconeDoApp({
  lado,
  comFundo = true,
  ocupacao = ICONE_OCUPACAO,
}: {
  lado: number;
  comFundo?: boolean;
  /** Quanto do lado o mascote ocupa. Menor no Android, que recorta as bordas. */
  ocupacao?: number;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: lado,
        height: lado,
        backgroundColor: comFundo ? ICONE_FUNDO : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        // Acima do grão do papel, que o `Moldura` desenha depois dos filhos: a
        // textura é do fundo do app, não do ícone.
        zIndex: 10,
      }}
    >
      <Sprout mood="feliz" stage={2} showPot={false} size={lado * ocupacao} />
    </View>
  );
}
