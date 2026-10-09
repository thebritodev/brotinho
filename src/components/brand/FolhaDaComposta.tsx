import React from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '../core/Icon';
import { fonts, radius, useTema } from '../../theme';
import {
  PASTILHA_ESCURA,
  TEXTO_NA_PAISAGEM,
  TEXTO_NA_PASTILHA,
  VIDRO_FRACO,
  VIDRO_NA_PAISAGEM,
} from './planoDaPaisagem';

/**
 * A mobília das telas da Composta: a folha de conteúdo e o que fica sobre o
 * céu.
 *
 * As cinco telas têm a mesma construção — paisagem em cima, folha de papel
 * subindo por cima dela, e o cabeçalho flutuando dentro do céu. Escrito uma
 * vez aqui, isso é uma forma; copiado cinco vezes, seriam cinco telas que
 * divergem na primeira vez que alguém ajustar um raio de canto.
 */

/**
 * Onde a folha morde a paisagem, em pontos.
 *
 * Trinta e quatro, e o número tem função: é mais que o raio do canto (30), e é
 * isso que garante que o arredondado da folha apareça **inteiro** sobre o céu.
 * Com uma mordida menor que o raio, a curva sai cortada pela borda da cena e a
 * folha lê como um retângulo com os cantos lascados.
 */
export const MORDIDA_DA_FOLHA = 34;

/**
 * A folha de papel que sobe por cima da paisagem.
 *
 * Ela **segue o tema**, ao contrário do céu. É a divisão que vale em toda a
 * ferramenta: paisagem tem luz própria, conteúdo tem tema. É onde se lê, e
 * texto longo em creme às duas da manhã é o que o tema escuro existe para
 * resolver.
 */
export function FolhaDaComposta({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { colors, shadows } = useTema();
  return (
    <View
      style={[
        {
          marginTop: -MORDIDA_DA_FOLHA,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          backgroundColor: colors.bg,
          paddingHorizontal: 24,
          paddingTop: 26,
          /*
            A sombra para cima é a `shadows.barra`, que já existe para a barra
            de abas: `0 -18px 36px -24px`, do mesmo documento. A folha pede
            `0 -14px 30px -20px` — quatro pontos de desfoque de diferença, que
            a nenhuma distância se vê. Uma sombra para cima no app é melhor que
            duas quase iguais.
          */
          ...shadows.barra,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * O botão redondo que fica sobre o céu — voltar, fechar.
 *
 * Quarenta e quatro pontos de vidro creme. Não é o `TopBar` do app de
 * propósito: o `TopBar` é uma barra, com fundo e uma linha embaixo, e aqui não
 * há barra nenhuma — há um botão pousado numa paisagem. A diferença é o que
 * faz a cena começar no alto da tela em vez de abaixo de uma faixa.
 */
export function BotaoNoCeu({
  icone = 'back',
  rotulo,
  aoTocar,
}: {
  icone?: IconName;
  rotulo: string;
  aoTocar: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={aoTocar}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: VIDRO_NA_PAISAGEM,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: pressed ? 0.96 : 1 }],
        /*
          A sombra é escrita à mão, e curta: `shadows.sm` recolhe a forma em 14
          pontos antes de desfocá-la, e num disco de 44 isso sobra um borrão
          deslocado em vez de uma sombra. É o mesmo defeito que a pastilha do
          `CartaoHeroi` teve, e está contado lá.
        */
        boxShadow: '0 6px 14px -6px rgba(58,54,48,0.35), inset 0 1px 0 rgba(255,255,255,0.9)',
      })}
    >
      <Icon name={icone} size={20} color={TEXTO_NA_PAISAGEM} />
    </Pressable>
  );
}

/** O título ao lado do botão, escrito direto no céu. */
export function TituloNoCeu({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: fonts.display.bold,
        fontSize: 20,
        color: TEXTO_NA_PAISAGEM,
        flex: 1,
      }}
    >
      {children}
    </Text>
  );
}

/**
 * Onde o documento põe o cabeçalho, contado do alto da cena.
 *
 * Os 56 pontos já **são** o espaço da barra de status: o protótipo é uma
 * página de 390 por 844 vista no navegador, sem barra nenhuma, e o desenhista
 * deixou essa folga de propósito. Por isso o cabeçalho não soma `insets.top` —
 * somar daria o recuo duas vezes, e foi o que pôs a frase acima da nuvem em
 * vez de dentro dela.
 *
 * O que soma é `recuoDaCena`: só o que **passa** dos 56.
 */
export const CABECALHO_NO_DOCUMENTO = 56;

/**
 * Quanto a cena desce num aparelho cuja barra de status é maior que a folga
 * que o documento reservou.
 *
 * Zero no navegador e em quase todo Android; quinze num iPhone com ilha. É o
 * mesmo número para a altura da cena, a crista, o céu e tudo que é posicionado
 * em coordenadas do documento — uma régua só, e nada sai do lugar em relação
 * a nada.
 */
export function recuoDaCena(insetDoTopo: number): number {
  return Math.max(0, insetDoTopo - CABECALHO_NO_DOCUMENTO + 12);
}

/** O cabeçalho das telas da Composta: botão, título, e o que mais vier. */
export function CabecalhoNoCeu({
  recuo,
  children,
}: {
  /** O que `recuoDaCena` devolveu — ver acima. */
  recuo: number;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        top: recuo + CABECALHO_NO_DOCUMENTO,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {children}
    </View>
  );
}

/** A pastilha de vidro do contador e do relógio, sobre o céu. */
export function PastilhaNoCeu({
  children,
  fraca = false,
}: {
  children: React.ReactNode;
  fraca?: boolean;
}) {
  return (
    <View
      style={{
        paddingVertical: 10,
        paddingHorizontal: fraca ? 12 : 14,
        borderRadius: radius.md,
        backgroundColor: fraca ? VIDRO_FRACO : VIDRO_NA_PAISAGEM,
        boxShadow: fraca
          ? undefined
          : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 6px 14px -8px rgba(58,54,48,0.35)',
      }}
    >
      {children}
    </View>
  );
}

/**
 * A pastilha escura: o rótulo do microfone e o selo do jardim.
 *
 * Escura porque o que ela diz tem de ser legível sobre **qualquer** ponto do
 * céu — o rótulo do microfone fica no rodapé, onde o degradê é claro, e o selo
 * do jardim fica no alto, onde ele é de chumbo. Uma pastilha de vidro creme
 * resolveria o alto e desapareceria embaixo.
 *
 * O creme de dentro é fixo, como todo texto que mora na paisagem.
 */
export function PastilhaEscura({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: PASTILHA_ESCURA,
      }}
    >
      {children}
    </View>
  );
}

/** O texto creme de dentro da pastilha escura. */
export function TextoNaPastilha({ children }: { children: string }) {
  return (
    <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 13.5, color: TEXTO_NA_PASTILHA }}>
      {children}
    </Text>
  );
}
