import React, { useId } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useToqueAnimado } from '../../hooks/useToqueAnimado';
import { fonts, radius, useTema } from '../../theme';

/**
 * O cartão grande do carrossel: a cena ocupa o cartão inteiro, e o convite vem
 * por cima dela.
 *
 * ## O que mudou, e por quê
 *
 * Antes o cartão era uma linha de lista com um desenho de 60 pontos no canto:
 * sete oitavos dele eram creme vazio, o desenho lia como ícone e o caminho para
 * dentro era uma setinha cinza de 20 pontos. Três ferramentas que são o app
 * inteiro anunciadas com a mesma ênfase de um item de menu.
 *
 * Agora a cena é o cartão. Ela cobre tudo, o título fica grande em cima dela e
 * o caminho para dentro é um botão da largura do cartão — dá para ver de longe
 * o que aquilo é e o que acontece ao tocar, que é o que a setinha nunca disse.
 *
 * ## O véu
 *
 * Texto sobre ilustração só funciona com alguma coisa entre os dois. Aqui esse
 * alguma coisa é um degradê que termina na cor de fundo do cartão, desenhado
 * **dentro do bloco de texto** — ver `Veu` logo abaixo, que é onde está a
 * história inteira.
 *
 * ## Um alvo de toque, não dois
 *
 * O botão é **desenho**, não `Pressable`: quem responde ao toque é o cartão
 * inteiro. Um botão de verdade dentro de um cartão tocável cria dois alvos
 * concêntricos que fazem a mesma coisa — e no leitor de tela viram dois
 * anúncios para uma ação só. O botão aqui diz o que vai acontecer; quem
 * executa é o cartão.
 */

type Props = {
  /**
   * A cena, desenhada para cobrir o cartão inteiro.
   *
   * Recebe o passo da animação de toque, de 0 a 1, e devolve o desenho naquele
   * instante. É função, e não um nó pronto, porque o cartão precisa redesenhar
   * a cena a cada quadro enquanto ela se mexe — ver `useToqueAnimado`.
   *
   * Cena que não anima simplesmente ignora o passo, e aí a função é chamada uma
   * vez só, como seria um nó.
   */
  cena: (p: number) => React.ReactNode;
  /** Cor de fundo do cartão — a mesma em que o véu da cena termina. */
  fundo: string;
  /** A etiqueta do alto, quando há um motivo verdadeiro para ela. */
  selo?: string | null;
  titulo: string;
  /** Uma linha, curta, sobre a ferramenta. */
  linha?: string;
  /** O texto do botão: o que acontece ao tocar. */
  acao: string;
  onPress: () => void;
  /** O que o leitor de tela anuncia. */
  label: string;
  /** Altura do cartão; o carrossel manda a mesma para todos. */
  altura: number;
};

/**
 * Onde o véu termina de subir, em pontos contados do alto do bloco de texto.
 *
 * `SUBIDA` é a distância inteira: do transparente até a cor cheia do cartão.
 * `QUASE` é onde ele já está em 86%, e existe para a subida não ser uma reta —
 * uma reta deixa uma borda visível justamente no meio do título.
 *
 * Os dois números vêm do véu antigo, convertidos: ele media 62% de um cartão
 * de 286, e as paradas ficavam em 26% e 42% desses 177 pontos.
 */
const SUBIDA = 74;
const QUASE = 46;

/**
 * O véu: o degradê que separa o texto da ilustração.
 *
 * ## Por que ele é duas camadas, e não uma
 *
 * A camada de baixo é a subida — 74 pontos de altura fixa, colada no alto do
 * bloco de texto. A de cima é a cor do cartão, cheia, do fim da subida até o
 * fim do bloco.
 *
 * Elas são duas porque o degradê precisa ter **comprimento fixo** e o bloco
 * não tem altura fixa. Uma camada só, esticada pelo bloco inteiro, tem a
 * subida esticada junto: num título de duas linhas o degradê fica mais longo e
 * mais fraco exatamente onde ele precisava estar mais forte.
 *
 * ## Por que ele mora dentro do bloco de texto
 *
 * Porque é assim que ele fica do tamanho certo sem ninguém calcular nada. O
 * véu é filho absoluto do bloco: `top`, `left`, `right` e `bottom` em zero, e
 * o layout o estica até a altura do bloco, seja ela qual for.
 *
 * Isso é a correção de um erro. O véu já foi desenhado dentro da cena, com
 * altura de 62% do cartão — um palpite da altura do bloco, feito para um
 * título de uma linha. "Aterramento 5-4-3-2-1" quebra em duas: o bloco vai de
 * 186 para 226 pontos num cartão de 286, e os 40 que sobram ficam acima do
 * véu. O desenho do lago do tema atravessava a primeira linha do título e as
 * duas ficavam ilegíveis.
 *
 * Medir o bloco com `onLayout` e passar o número para a cena **não** resolve:
 * `onLayout` não dispara no `react-native-web`, então o véu voltaria ao
 * palpite justamente no navegador, que é onde eu confiro e de onde saem as
 * capturas da loja. Esta casa já tropeçou nisso três vezes — ver
 * `LuzDeEstufa`, `geometriaDoBroto` e `FaixaDaComposta`. Aqui não há medida:
 * quem mede é o layout, que sabe fazer isso nas duas plataformas.
 *
 * ## Por que SVG
 *
 * Gradiente em `View` pediria uma dependência nova (`expo-linear-gradient`) só
 * para isto, e `react-native-svg` já é dependência do app. O
 * `preserveAspectRatio="none"` é de propósito: o desenho é um degradê
 * puramente vertical, então esticar na horizontal não deforma nada, e é o que
 * garante que ele cubra a largura inteira em qualquer aparelho.
 *
 * ## O id
 *
 * `url(#id)` não tem escopo por componente: dois cartões na mesma tela
 * disputariam o mesmo nome de gradiente e um deles apareceria sem
 * preenchimento. Por isso cada instância gera o seu com `useId`.
 */
function Veu({ fundo }: { fundo: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: SUBIDA }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={`veu-${id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={fundo} stopOpacity={0} />
              <Stop offset={QUASE / SUBIDA} stopColor={fundo} stopOpacity={0.86} />
              <Stop offset="1" stopColor={fundo} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={1} height={1} fill={`url(#veu-${id})`} />
        </Svg>
      </View>

      {/*
        O resto do bloco, na cor cheia. `bottom: 0` é o que faz a linha de
        apoio e o botão ficarem cobertos por mais que o título empurre.
      */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: SUBIDA,
          bottom: 0,
          backgroundColor: fundo,
        }}
      />
    </>
  );
}

export function CartaoHeroi({
  cena,
  fundo,
  selo,
  titulo,
  linha,
  acao,
  onPress,
  label,
  altura,
}: Props) {
  const { colors, palette, shadows } = useTema();
  /*
    A cena se mexe antes de a tela abrir — o mesmo gesto dos cartões de tema,
    pelo mesmo motivo e com a mesma duração. Ver `useToqueAnimado`.
  */
  const { p, tocar } = useToqueAnimado(onPress);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={tocar}
      style={({ pressed }) => ({
        height: altura,
        borderRadius: radius.lg,
        backgroundColor: fundo,
        overflow: 'hidden',
        justifyContent: 'flex-end',
        opacity: pressed ? 0.9 : 1,
        ...shadows.md,
      })}
    >
      {/* A cena, atrás de tudo e do tamanho do cartão. */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>{cena(p)}</View>

      {!!selo && (
        <View
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            backgroundColor: colors.surface,
            borderRadius: radius.pill,
            paddingVertical: 6,
            paddingHorizontal: 12,
            ...shadows.sm,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.body.extraBold,
              fontSize: 11,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              color: colors.primaryStrong,
            }}
          >
            {selo}
          </Text>
        </View>
      )}

      {/*
        O bloco de texto — e, atrás dele, o véu do tamanho dele. Cresce junto
        quando o título quebra em duas linhas, que é o ponto inteiro.
      */}
      <View style={{ padding: 16, gap: 10 }}>
        <Veu fundo={fundo} />

        <Text
          style={{
            fontFamily: fonts.display.extraBold,
            fontSize: 25,
            color: colors.textPrimary,
          }}
        >
          {titulo}
        </Text>

        {!!linha && (
          <Text
            numberOfLines={2}
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 14,
              lineHeight: 14 * 1.42,
              color: palette.brown700,
            }}
          >
            {linha}
          </Text>
        )}

        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            backgroundColor: colors.primary,
            borderRadius: radius.botao,
            paddingVertical: 15,
            alignItems: 'center',
            marginTop: 2,
          }}
        >
          <Text style={{ fontFamily: fonts.body.bold, fontSize: 16, color: colors.textInverse }}>
            {acao}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
