import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { fonts, radius, useTema } from '../../theme';
import { Sprout, type SproutStage } from './Sprout';
import { FolhaDoSelo } from './folhaDoSelo';

type Props = {
  nome: string;
  /** A linha de baixo: a pergunta do dia, ou o título do humor já marcado. */
  linha: string;
  estagio: SproutStage;
  /**
   * A foto de perfil que a pessoa escolheu, já como caminho pronto. `null`
   * para quem não escolheu nenhuma — e aí o retrato é o broto.
   */
  foto?: string | null;
  /** Dias seguidos aparecendo. Zero esconde o selo. */
  sequencia: number;
  /** Abre a galeria para escolher, ou trocar, a foto de perfil. */
  aoTocarNoRetrato: () => void;
};

/** O diâmetro do retrato, do documento. */
const RETRATO = 52;

/**
 * O cabeçalho da tela inicial: quem é, como está, e há quanto tempo vem vindo.
 *
 * ## O que ele substitui
 *
 * Uma saudação dentro do céu da Composta, com um botão de engrenagem do outro
 * lado. Aquilo funcionava enquanto a Composta era a tela inteira; com ela de
 * volta a cartão, a saudação ficaria boiando sobre o creme sem nada que a
 * ancorasse.
 *
 * Agora ela tem as duas coisas que faltavam: um **rosto** à esquerda e um
 * **número** à direita.
 *
 * ## O retrato
 *
 * É a foto da pessoa, se ela escolheu uma, e o broto dela se não. Tocar nele
 * abre a galeria para escolher — ou trocar — a foto.
 *
 * O broto do retrato **sorri sempre**. Antes ele espelhava o humor marcado, no
 * mesmo instante que o do cartão logo abaixo — a ideia de "se ela marcou
 * ansioso, os dois ficam ansiosos" é boa, e o lugar estava errado. No cartão o
 * espelho funciona, porque ali ele é o personagem com quem ela está falando.
 * Aqui ele é um retrato do tamanho de um avatar, na primeira linha da tela, e
 * ali um rosto triste é o app devolvendo a tristeza dela em miniatura, sem nada
 * em volta que a acolha. O estágio continua sendo o de verdade, porque crescer
 * é o que ela quer ver no próprio retrato.
 *
 * ## A foto, e por que ela ficou no toque simples
 *
 * Opcional, e nunca pedida. Ninguém é recebido por um espaço vazio esperando
 * uma selfie: o padrão é o broto, que já é um rosto.
 *
 * O toque levava à aba do broto, e a foto estava no toque-e-segura. Eu tinha
 * escrito aqui que um rosto que não responde ao toque é a parte mais
 * frustrante de qualquer tela inicial — e usei isso para justificar manter o
 * atalho. O Pedro tocou esperando a foto e foi parar na aba do broto.
 *
 * Ele está certo, e o argumento era fraco por um motivo simples: **a aba do
 * broto é uma das três da barra de baixo**. O atalho não encurtava nada; só
 * ocupava o único gesto óbvio deste disco. O rosto continua respondendo ao
 * toque — responde fazendo a coisa que só ele pode fazer.
 *
 * Remover a foto continua em Perfil › Editar › Foto de perfil. Um toque que
 * às vezes abre a galeria e às vezes apaga o retrato seria um toque que não
 * dá para prever.
 *
 * A galeria não é lida pelo app em momento nenhum; o sistema entrega uma cópia
 * da foto escolhida, e ela fica na pasta do Brotinho. Ver
 * `services/fotoDePerfil`, que conta isso por extenso, e a tela de
 * Privacidade, que conta para a pessoa.
 *
 * ## O selo da sequência
 *
 * O número é `sequenciaAtual`: dias **seguidos**, e não o total cuidado. A
 * diferença importa e está anotada lá. Aqui importa a consequência de desenho:
 * este número pode cair, então ele não pode ter ar de troféu. Por isso é um
 * chip de superfície com uma folha, do tamanho de um rótulo — e não uma medalha
 * com número grande.
 *
 * Em zero ele **some**. Um "0" ao lado de uma folha, na primeira linha da tela,
 * é o app abrindo com um boletim. Quem ainda não tem sequência não precisa ser
 * informado disso; precisa é da linha de baixo, que convida.
 */
export function CabecalhoDaHome({
  nome,
  linha,
  estagio,
  sequencia,
  aoTocarNoRetrato,
  foto = null,
}: Props) {
  const { colors, palette, shadows } = useTema();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={foto ? 'Trocar a sua foto de perfil' : 'Escolher uma foto de perfil'}
        onPress={aoTocarNoRetrato}
        style={({ pressed }) => ({
          width: RETRATO,
          height: RETRATO,
          borderRadius: RETRATO / 2,
          backgroundColor: colors.primarySoft,
          overflow: 'hidden',
          alignItems: 'center',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        {/*
          O enquadramento é por recorte, e não por `viewBox`.

          O `Sprout` fecha a caixa dele em volta da planta inteira — caule,
          folhas e cabeça —, e dentro de um disco de 52 isso deixaria o rosto do
          tamanho de uma ervilha com um talo embaixo. Desenhando grande e
          cortando no disco, o que sobra é a cabeça e o alto das folhas, que é o
          retrato. O deslocamento negativo é o que escolhe a altura do corte.
        */}
        {foto ? (
          <Image
            source={{ uri: foto }}
            accessibilityIgnoresInvertColors
            style={{ width: RETRATO, height: RETRATO }}
            resizeMode="cover"
          />
        ) : (
          /*
            Sem foto, o broto do retrato sorri — sempre.

            Ele espelhava o humor marcado: quem tocava em "triste" abria o app e
            encontrava um broto triste do lado do "Oi, Pedro". A ideia era boa e
            o lugar errado. No cartão logo abaixo o espelho funciona, porque ali
            ele é o personagem com quem a pessoa está falando; aqui ele é um
            **retrato**, do tamanho de um avatar, e retrato triste na primeira
            linha da tela é o app devolvendo a tristeza dela em miniatura, sem
            nada em volta que a acolha.

            O estágio continua sendo o de verdade: o retrato acompanha o
            crescimento, que é a parte que ela quer ver.
          */
          <View style={{ marginTop: -4 }}>
            <Sprout mood="feliz" stage={estagio} size={RETRATO * 1.35} showPot={false} />
          </View>
        )}
      </Pressable>

      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.display.bold,
            fontSize: 24,
            lineHeight: 24 * 1.15,
            color: colors.textPrimary,
          }}
        >
          Oi, {nome}
        </Text>
        <Text
          numberOfLines={2}
          style={{ fontFamily: fonts.body.bold, fontSize: 14, color: palette.brown700 }}
        >
          {linha}
        </Text>
      </View>

      {sequencia > 0 && (
        <View
          accessible
          accessibilityLabel={
            sequencia === 1 ? 'Primeiro dia seguido' : `${sequencia} dias seguidos`
          }
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
            ...shadows.sm,
          }}
        >
          <FolhaDoSelo size={18} cor={palette.green500} />
          <Text
            style={{
              fontFamily: fonts.body.extraBold,
              fontSize: 15,
              color: colors.primaryStrong,
            }}
          >
            {sequencia}
          </Text>
        </View>
      )}
    </View>
  );
}
