import React from 'react';
import Svg, { Path } from 'react-native-svg';

/**
 * A folhinha cheia — o carimbo de "isto aconteceu".
 *
 * Uma só, desenhada num lugar só, porque ela aparece em três sítios da tela
 * inicial que precisam dizer a **mesma** coisa: o dia em que praticou na faixa
 * da semana, a sequência ao lado do nome, e a data de cada cartão de prática
 * feita. Se fossem três desenhos, bastaria um deles mudar de curva para a tela
 * passar a ter duas folhas diferentes significando a mesma coisa — e aí o olho
 * procura a diferença que não existe.
 *
 * Ela é **cheia**, sem contorno, ao contrário das folhas do broto. O broto é
 * personagem e tem traço; isto é sinal, e sinal lê melhor como silhueta no
 * tamanho em que vive — de 12 a 18 pontos.
 */
const FOLHA = 'M12 21c0-6 1-11 7-15-6 0-9 3-9 8-1-3-4-4-6-4 0 5 3 8 8 11z';

export function FolhaDoSelo({ size = 18, cor }: { size?: number; cor: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={FOLHA} fill={cor} />
    </Svg>
  );
}
