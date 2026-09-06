import React from 'react';
import { Image, View } from 'react-native';

import { useTema } from '../../theme';

/**
 * O grão do papel — a textura que atravessa o app inteiro.
 *
 * ## Por que existe
 *
 * O Brotinho é papel creme, e papel tem grão. Sem ele, o fundo é uma chapada de
 * cor lisa, e chapada de cor lisa é o que separa uma tela de um material. É o
 * detalhe mais barato do redesenho e o que menos se nota conscientemente — que
 * é exatamente o efeito pretendido: ninguém deve reparar no grão, só sentir que
 * o fundo não é uma superfície de plástico.
 *
 * Aparece 39 vezes no documento, sempre igual: a mesma textura, a 5,5% de
 * opacidade, em mistura *multiply*, cobrindo a tela inteira.
 *
 * ## Por que é imagem, e não filtro
 *
 * No documento é `feTurbulence` — ruído fractal calculado pelo navegador. No
 * React Native isso **não existe**: `react-native-svg` traz o componente
 * `FeTurbulence`, mas ele chama `warnUnimplementedFilter()` e devolve `null`.
 * A pasta de código nativo confirma: há `FeGaussianBlur`, `FeColorMatrix`,
 * `FeComposite` e mais cinco, e nenhuma turbulência.
 *
 * Então o ruído é gerado uma vez, em tempo de construção, e vira um PNG de 140
 * por 140 que ladrilha. É ruído de valor em três oitavas, cíclico nos dois
 * eixos — cíclico é o que importa: uma textura que não fecha nas bordas mostra
 * a emenda em linhas retas a cada 140 pixels, e aí o grão vira grade.
 *
 * Não é o mesmo padrão do Perlin do documento, e não precisa ser. O que se
 * pede de um grão é alta frequência, média neutra e nenhuma estrutura visível.
 *
 * ## Por que a opacidade muda entre os temas
 *
 * *Multiply* escurece. Sobre papel creme isso é o que se quer: o grão são as
 * fibras, e fibra faz sombra. Sobre o fundo quase preto do tema escuro, um
 * multiply a 5,5% não tem o que escurecer — some, e o custo de desenhar
 * continua. Ali o grão entra **claro**, em `screen`, com metade da força: no
 * escuro o que dá textura ao papel é a luz que bate nas fibras, não a sombra
 * que elas fazem.
 */
export function GraoDePapel() {
  const { tema } = useTema();
  const claro = tema === 'claro';

  return (
    <View
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: claro ? 0.055 : 0.03,
        mixBlendMode: claro ? 'multiply' : 'screen',
      }}
    >
      <Image
        source={require('../../../assets/grao.png')}
        resizeMode="repeat"
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}
