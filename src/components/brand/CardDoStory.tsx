import React, { useId } from 'react';
import { Image, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { entreAspas } from '../../data/conselhos';
import { fonts } from '../../theme';
import { ABERTO, EIXO, MIOLO, PETALA } from './geometriaDaFlor';

/**
 * A frase virada em imagem, para o story.
 *
 * ## Por que este é o único conteúdo do app que pode sair do aparelho
 *
 * Porque **não é da pessoa**. O diário não sai, a Composta não sai, o humor não
 * sai — está na política de privacidade e na ficha da loja, e vale. A frase é
 * do app, escrita antes de qualquer pessoa instalar. É o único material que dá
 * para compartilhar sem furar a promessa central.
 *
 * O que ela revela é outra coisa, e é escolha de quem posta: quem publica "não
 * acredite em tudo que a sua ansiedade te conta" está contando algo sobre o
 * próprio dia. Por isso compartilhar nunca é o botão mais gritante da tela, e
 * nunca é sugerido — é oferecido.
 *
 * ## O tamanho e as cores
 *
 * 1080 × 1920 é o story do Instagram, e a imagem é montada **nesse tamanho de
 * verdade**, fora da tela, e não numa miniatura esticada depois. Texto esticado
 * fica borrado, e uma frase borrada não convence ninguém a procurar o app.
 *
 * O fundo é o verde da marca, não o terracota do ícone, por contraste: creme
 * sobre terracota dá 2,5:1 — ilegível em miniatura, que é como a maioria das
 * pessoas vai ver isto. Sobre o verde escuro dá 9:1. O terracota entra do mesmo
 * jeito, no ícone lá embaixo, onde é um detalhe e não o fundo do texto.
 *
 * ## Por que o ícone do app, e não só o nome
 *
 * Story não tem link clicável. Quem gostou da frase precisa saber **o que
 * procurar** — e "Brotinho" sozinho pode ser qualquer coisa. Um quadrado
 * arredondado com um ícone dentro diz "isto é um aplicativo" sem gastar uma
 * palavra, e o nome ao lado diz qual.
 */

export const STORY = { largura: 1080, altura: 1920 };

/* Cores fixas: isto vira arquivo e sai do aparelho, então não segue o tema de
   quem exportou. Uma frase postada de noite não pode sair diferente da mesma
   frase postada de dia. */
const FUNDO = '#2E4A3B';
const TINTA = '#FBF6EC';
const PETALA_FILL = '#A9C0B0';
const BRILHO = '#FCEFC7';
const ARO = '#E8B65A';

/**
 * O corpo da frase encolhe quando ela é longa.
 *
 * A quebra de linha é do próprio React Native — foi por isso que a captura de
 * tela venceu o SVG, onde eu teria de quebrar no chute. O que sobra para
 * resolver aqui é só o tamanho: uma frase de 60 caracteres pede corpo grande
 * para não boiar, e uma de 150 pede corpo menor para não virar um paredão.
 */
function corpoDaFrase(texto: string): number {
  // Medido sobre o texto **com** as aspas, que é o que de fato vai na imagem.
  const n = texto.length + 2;
  if (n <= 80) return 74;
  if (n <= 120) return 66;
  return 58;
}

/**
 * A flor aberta, parada — o mesmo desenho que abre na tela, com luz.
 *
 * O `viewBox` é mais largo que o desenho (140 contra 120) porque o halo do
 * miolo transborda: num quadrado justo ele seria cortado num círculo duro, que
 * é o contrário de brilho.
 */
function Flor({ size }: { size: number }) {
  /* Id por instância: `url(#...)` não tem escopo em SVG. */
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg viewBox="-10 -10 140 140" width={size} height={size}>
      <Defs>
        <LinearGradient id={`petala-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C6D8CB" />
          <Stop offset="1" stopColor={PETALA_FILL} />
        </LinearGradient>
        <RadialGradient id={`halo-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={BRILHO} stopOpacity={0.5} />
          <Stop offset="0.5" stopColor={BRILHO} stopOpacity={0.14} />
          <Stop offset="1" stopColor={BRILHO} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <G>
        <Circle cx={MIOLO.cx} cy={MIOLO.cy} r={58} fill={`url(#halo-${id})`} />
        {ABERTO.map((a) => (
          <G key={a} transform={`rotate(${a} ${EIXO.x} ${EIXO.y})`}>
            <Path
              d={PETALA}
              fill={`url(#petala-${id})`}
              stroke={TINTA}
              strokeWidth={3.4}
              strokeLinejoin="round"
            />
            <Path
              d="M59 64 C 52 56, 51 45, 58 33"
              stroke={TINTA}
              strokeWidth={2.4}
              strokeLinecap="round"
              fill="none"
              opacity={0.5}
            />
          </G>
        ))}
        <Circle cx={MIOLO.cx} cy={MIOLO.cy} r={13} fill={BRILHO} stroke={ARO} strokeWidth={2.4} />
        <Circle cx={MIOLO.cx} cy={MIOLO.cy - 1.2} r={7.5} fill={TINTA} />
      </G>
    </Svg>
  );
}

/**
 * O card em si.
 *
 * `collapsable={false}` não é enfeite: no Android o React Native funde `View`s
 * que só servem de agrupamento, e uma `View` fundida não existe mais como
 * elemento nativo — a captura devolveria erro de "view não encontrada".
 */
export const CardDoStory = React.forwardRef<View, { texto: string }>(function CardDoStory(
  { texto },
  ref,
) {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        width: STORY.largura,
        height: STORY.altura,
        backgroundColor: FUNDO,
        alignItems: 'center',
        /*
          Flor e frase são **um** bloco, centrado; a marca é fixada embaixo.

          Com `space-between` e três filhos, os dois primeiros se afastavam até
          o limite e sobrava um vão morto de quase quatrocentos pixels entre a
          flor e o texto — a flor parecia de outro cartaz. Juntos e centrados,
          a flor lê como o que ela é: a assinatura visual da frase.
        */
        justifyContent: 'center',
        gap: 92,
      }}
    >
      <Flor size={330} />

      <Text
        style={{
          fontFamily: fonts.display.semiBold,
          fontSize: corpoDaFrase(texto),
          lineHeight: corpoDaFrase(texto) * 1.42,
          color: TINTA,
          textAlign: 'center',
          paddingHorizontal: 130,
        }}
      >
        {entreAspas(texto)}
      </Text>

      <View
        style={{
          position: 'absolute',
          /*
            270, e não o rodapé.

            O Instagram desenha a própria interface por cima do story: a barra
            do perfil come uns 250px em cima e a de responder come outro tanto
            embaixo. A marca a 168 do fundo ficava **debaixo** da caixa de
            resposta — ou seja, a única parte do card que diz de onde a frase
            veio era a única que ninguém veria.
          */
          bottom: 270,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 26,
        }}
      >
        <Image
          source={require('../../../assets/icon.png')}
          style={{ width: 104, height: 104, borderRadius: 24 }}
        />
        <Text style={{ fontFamily: fonts.display.bold, fontSize: 50, color: TINTA }}>
          Brotinho
        </Text>
      </View>
    </View>
  );
});
