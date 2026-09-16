import React from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';

import { useToqueAnimado } from '../../hooks/useToqueAnimado';
import { fonts, radius, useTema } from '../../theme';
import { Icon, type IconName } from '../core/Icon';
import { DesenhoDoTema, ehTemaDesenhado } from './desenhosDosTemas';

type Props = {
  title: string;
  /**
   * Uma linha sobre o tema.
   *
   * Sem ela o cartão era uma palavra sozinha dentro de oitenta pontos de
   * altura — treze retângulos quase vazios, e nada que ajudasse a escolher
   * entre "Estresse" e "Ansiedade" a não ser o palpite. A frase já existia:
   * é o `intro` de cada tema, que só aparecia depois de a pessoa entrar.
   */
  subtitle?: string;
  icon: IconName;
  /** A chave do tema, que escolhe a cena desenhada — ver `desenhosDosTemas`. */
  chave?: string;
  tint: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /**
   * Duas colunas, em vez de uma linha larga.
   *
   * É o formato da tela inicial, onde os treze temas aparecem juntos: em
   * fileira única eles empurrariam tudo o mais para longe, e a variedade —
   * que é o argumento das práticas — só apareceria para quem rolasse muito.
   * Na grade, o ícone cresce e vira o que se lê primeiro, e a frase de cada
   * tema sai: ela não cabe em meia largura sem virar três linhas de sete
   * palavras. Ela continua inteira dentro do tema.
   */
  grade?: boolean;
};

/**
 * Altura do cartão da grade: fixa, para as fileiras baterem.
 *
 * Eram 104, e 104 era a altura de uma palavra. Os cartões diziam "Ansiedade",
 * "Luto", "Foco" — um substantivo, uma linha. Hoje dizem o que o tema resolve,
 * e "Começar o que você adia" não cabe numa linha em meia largura.
 *
 * Com 104, a segunda linha do título terminava em 50 e o objeto do desenho
 * começava em 53,5: três pontos e meio de folga entre a letra e a ilustração,
 * o que na prática é encavalar. Os vinte pontos a mais empurram o desenho para
 * baixo junto — ele é ancorado no pé da caixa —, e a folga vira vinte e três.
 *
 * O desenho continua cruzando a borda do cartão no mesmo ponto: `SOBRA_DO_DESENHO`
 * e o tamanho não mudaram, e os dois estão presos ao pé. Subir a altura não
 * reenquadra a cena, só afasta o texto dela.
 */
const ALTURA_NA_GRADE = 124;

/**
 * Quanto o desenho passa da borda de baixo do cartão.
 *
 * ## Por que o desenho sai do cartão
 *
 * Dentro dele, cortado pela borda, o desenho era uma textura: participava do
 * retângulo em vez de estar em cima dele. Atravessando a borda, ele vira o
 * objeto na frente — e a grade deixa de ser treze retângulos coloridos para
 * virar treze cenas apoiadas na tela.
 *
 * ## Por que a sobra é espaço de layout, e não `overflow: 'visible'`
 *
 * Porque no Android as sombras do app são `elevation`, e view com elevation
 * recorta o que os filhos desenham fora dos limites dela. Um desenho preso a
 * `overflow: 'visible'` funcionaria no iOS e na web — onde estas capturas são
 * feitas — e sumiria pela metade justamente no aparelho de teste.
 *
 * Então o cartão não cresce: quem cresce é a caixa em volta dele. O desenho
 * fica **irmão** do cartão, não filho, e ocupa esta faixa embaixo. Nada é
 * desenhado fora de limite nenhum, e os dois lugares que usam esta regra —
 * aqui e em `OndeVoceParou` — fazem igual.
 */
export const SOBRA_DO_DESENHO = 40;

/**
 * O lado do desenho nos cartões pequenos.
 *
 * Ele e a sobra andam juntos: a borda do cartão corta o desenho na altura
 * `(TAMANHO - SOBRA) / TAMANHO` dele, e as cenas põem o objeto entre 14 e 48
 * de uma caixa de 60. Com 118 e 40 a borda cai em 40 — um terço do objeto para
 * fora, mais a sombra de chão. Com os 104 e 20 de antes ela caía em 48, que é
 * **embaixo** do objeto: só a sombra saía do cartão, e um desenho que põe para
 * fora apenas a própria sombra parece defeito, não composição.
 */
export const TAMANHO_DO_DESENHO = 118;

/** PracticeTopicCard — leva a um tema de prática (ansiedade, sono...). */
export function PracticeTopicCard({
  title,
  subtitle,
  icon,
  chave,
  tint,
  onPress,
  style,
  grade = false,
}: Props) {
  const { colors, palette, shadows } = useTema();
  /*
    A cena do tema se mexe antes de a tela abrir — ver `useToqueAnimado`.
    `passo` vai de 0 a 1 e quem o interpreta é cada desenho, em
    `desenhosDosTemas`. Aqui não se decide nada sobre o movimento.
  */
  const { p: passo, tocar } = useToqueAnimado(onPress);

  /*
    Na grade, o tom do tema deixa de ser um quadradinho e vira o cartão.

    Antes o cartão era creme com um selo colorido de 58 pontos no canto: metade
    da área era vazio, e a cor do tema — que é o que faz "Insônia" e "Luto"
    serem distinguíveis de relance — aparecia num pedaço pequeno demais para
    isso funcionar. Agora a cor é o fundo, e a cena cresce até ser cortada pela
    borda de baixo à direita: o desenho continua para fora do cartão em vez de
    acabar dentro dele, que é o que o faz parecer ilustração e não ícone.
  */
  if (grade) {
    return (
      <View style={[{ height: ALTURA_NA_GRADE + SOBRA_DO_DESENHO }, style]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={title}
          onPress={tocar}
          style={({ pressed }) => ({
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: ALTURA_NA_GRADE,
            backgroundColor: tint,
            borderRadius: radius.lg,
            padding: 13,
            opacity: pressed ? 0.85 : 1,
            ...shadows.sm,
          })}
        >
          <Text
            numberOfLines={2}
            style={{
              fontFamily: fonts.body.extraBold,
              fontSize: 15.5,
              lineHeight: 15.5 * 1.2,
              color: palette.brown900,
              /*
                O título usa quase toda a largura, e não a metade.

                O desenho começa vinte pontos abaixo do topo do cartão, então a
                primeira linha passa livre por cima dele — e a borda de cima
                das cenas é folga, não assunto. Com meia largura,
                "Procrastinação" quebrava em "Procrastina / ção", que é pior do
                que qualquer sobreposição.
              */
              width: '84%',
            }}
          >
            {title}
          </Text>
        </Pressable>

        {/*
          O desenho, por cima do cartão e passando da borda de baixo dele.

          Irmão e não filho — ver `SOBRA_DO_DESENHO`. Encostado na direita e no
          chão da caixa: é o canto que o título deixou livre, e é o que faz a
          cena parecer apoiada no cartão em vez de impressa nele.
        */}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={{ position: 'absolute', right: 0, bottom: 0 }}
        >
          {ehTemaDesenhado(chave ?? '') ? (
            <DesenhoDoTema tema={chave ?? ''} size={TAMANHO_DO_DESENHO} passo={passo} />
          ) : (
            /* Tema novo, ainda sem cena: o ícone de traço segura o lugar. */
            <View style={{ padding: 26 }}>
              <Icon name={icon} size={58} color={palette.brown900} />
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={tocar}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          width: '100%',
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: 14,
          opacity: pressed ? 0.85 : 1,
          ...shadows.sm,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: radius.md,
          backgroundColor: tint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/*
          A cena do tema, com o ícone de traço como recuo.

          O desenho é o que se lê primeiro, e ele existe para os treze temas —
          ver `desenhosDosTemas`. O `Icon` fica para um tema novo que ainda não
          tenha cena: melhor um ícone genérico do que um quadrado vazio.
        */}
        <DesenhoDoTema tema={chave ?? ''} size={40} passo={passo} />
        {!ehTemaDesenhado(chave ?? '') && <Icon name={icon} size={26} color={palette.brown900} />}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 16, color: palette.brown900 }}>
          {title}
        </Text>
        {!!subtitle && (
          <Text
            numberOfLines={2}
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 13,
              lineHeight: 13 * 1.4,
              color: colors.textSecondary,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* A seta diz que o cartão leva a algum lugar. Sem ela, treze retângulos
          iguais não se anunciam como caminho. Escondida do leitor de tela: o
          `Pressable` já se apresenta como botão, e a seta repetiria isso.

          Ela não existe na grade: lá o cartão é colorido por inteiro e a cena
          sangrando na borda já diz que tem coisa ali dentro. */}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Icon name="chevronRight" size={20} color={palette.brown400} />
      </View>
    </Pressable>
  );
}
