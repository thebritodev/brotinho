import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, useTema } from '../../theme';
import { BrotinhoMark, MARK_DISCO } from '../brand/BrotinhoMark';
import { Icon, type IconName } from '../core/Icon';

export type TabKey = 'home' | 'diario' | 'perfil';

/** Quanto o botão do meio sobe acima da faixa. */
const RAISE = 22;

/**
 * A altura que o botão central ocupa **acima** da barra.
 *
 * Exportada porque uma tela com barra de ação no rodapé precisa saber que há
 * um disco de 64 pontos pairando ali — hoje só a Composta.
 */
export const ALTURA_ERGUIDA = RAISE;

/**
 * O arredondamento do topo da barra — 28, do documento.
 *
 * Ele só faz sentido agora. Enquanto a barra reservava espaço no layout, o
 * canto arredondado não tinha o que revelar: atrás dele havia a mesma faixa
 * lisa da cor do fundo, e curvar um retângulo contra outro retângulo da mesma
 * cor não desenha nada. Com a tela passando por trás, o canto passa a mostrar
 * o conteúdo — que é o que faz a barra ler como um painel apoiado sobre a
 * página em vez de uma tarja colada na base.
 *
 * O documento arredonda também os cantos de baixo, em 44. Aquilo é o canto do
 * aparelho no mockup, não da barra: no celular ela encosta na borda da tela, e
 * arredondar ali abriria dois buracos de fundo nos cantos inferiores.
 */
const RAIO_DO_TOPO = 28;

/** O fio do documento: recuado 40 de cada lado, e não uma borda de ponta a ponta. */
const RECUO_DO_FIO = 40;
const CENTER_SIZE = 64;

type SideTab = { key: Exclude<TabKey, 'home'>; label: string; icon: IconName };

const LEFT: SideTab = { key: 'diario', label: 'Diário', icon: 'book' };
const RIGHT: SideTab = { key: 'perfil', label: 'Perfil', icon: 'user' };

type Props = {
  active?: TabKey;
  onChange?: (tab: TabKey) => void;
};

/**
 * BottomNav — três destinos, só ícones.
 *
 * Sem rótulos, o único sinal de qual aba está aberta é a cor; por isso os
 * `accessibilityLabel` são obrigatórios, senão quem usa leitor de tela fica
 * sem nada para ouvir.
 */
export function BottomNav({ active = 'home', onChange }: Props) {
  const { colors, palette, shadows } = useTema();
  const insets = useSafeAreaInsets();

  const lateral = (t: SideTab) => {
    const ativa = active === t.key;
    return (
      <Pressable
        key={t.key}
        accessibilityRole="tab"
        accessibilityLabel={t.label}
        accessibilityState={{ selected: ativa }}
        onPress={() => onChange?.(t.key)}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48, gap: 3 }}
      >
        <Icon
          name={t.icon}
          size={26}
          color={ativa ? colors.primaryStrong : colors.textSecondary}
          strokeWidth={ativa ? 2.4 : 2}
        />
        {/*
          O rótulo é visível, e não só para o leitor de tela.

          Os três ícones viviam sozinhos, e o nome de cada aba existia apenas em
          `accessibilityLabel`. Ícone sem rótulo obriga a adivinhar, e adivinhar
          é caro justamente para quem abre o app mal — a literatura de design
          para pessoas em sofrimento lista isso entre os atritos que mais pesam.
          Catorze pixels de altura resolvem.
        */}
        <Text
          style={{
            fontFamily: ativa ? fonts.body.bold : fonts.body.regular,
            fontSize: 11,
            color: ativa ? colors.primaryStrong : colors.textSecondary,
          }}
        >
          {t.label}
        </Text>
      </Pressable>
    );
  };

  return (
    /*
      A barra paira sobre a tela; não empurra uma faixa na frente dela.

      O espaço de cima é transparente e existe para o botão central subir sem
      sair dos limites do pai — no Android o que vaza pode ser cortado. Só que
      ele também era **reservado no layout**: a tela terminava 22 pontos acima
      da barra, e esses 22 pontos viravam uma faixa lisa da cor do fundo,
      cobrindo o que a tela tinha ali e passando por trás da metade de cima do
      broto. Era o que se via na tela inicial: os chips de palavra cortados,
      uma tira bege, e só então a barra.

      A margem negativa devolve esse espaço à tela: a barra continua ocupando
      no layout só a altura dela mesma, e a parte erguida passa a ficar **por
      cima** do conteúdo, não na frente de um vazio. `box-none` é o que
      completa a ideia — sem ele a tira invisível continuaria engolindo o
      toque de quem mira no que está atrás dela.
    */
    <View
      /*
        `box-none` fica na prop, e é o único lugar do app onde ela continua.

        O React Native depreciou a prop em favor do estilo, e as outras doze
        camadas do app migraram. Estas duas não podem: o `react-native-web`
        **descarta** `box-none` quando ele vem pelo estilo — medido, o
        `pointer-events` computado volta a ser `auto`. E `auto` aqui é o defeito
        que a tira erguida tinha antes de existir: ela engole o toque de quem
        mira no conteúdo atrás dela.

        No aparelho o estilo funcionaria. Só que o app também roda na web, e
        trocar comportamento de toque por causa de um aviso de depreciação é
        pagar caro por arrumação.
      */
      pointerEvents="box-none"
      style={{ marginTop: -RAISE, paddingTop: RAISE, zIndex: 2 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 10,
          paddingBottom: 10 + insets.bottom,
          backgroundColor: colors.surface,
          borderTopLeftRadius: RAIO_DO_TOPO,
          borderTopRightRadius: RAIO_DO_TOPO,
          ...shadows.barra,
        }}
      >
        {/*
          O fio, no lugar da borda que ia de ponta a ponta.

          Uma borda de ponta a ponta num painel de canto arredondado acompanha a
          curva e morre na quina, apontando para o canto em vez de separar a
          barra do que está atrás. O documento troca por um fio de 1,5 recuado
          40 de cada lado: ele fica inteiro na parte reta do topo, e quem separa
          o painel da página é a sombra.
        */}
        <View
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            top: 0,
            left: RECUO_DO_FIO,
            right: RECUO_DO_FIO,
            height: 1.5,
            borderRadius: 1,
            backgroundColor: palette.brown100,
          }}
        />

        {lateral(LEFT)}
        {/*
          Lugar reservado para o botão central, que é posicionado por cima.

          O rótulo dele mora aqui, e não no botão: o botão sobe para fora da
          barra, e um texto preso nele subiria junto, descolado dos outros dois.
          O espaçador de 26 é a altura do ícone das laterais, para as três
          palavras ficarem na mesma linha.
        */}
        <View style={{ width: CENTER_SIZE, alignItems: 'center', gap: 3 }}>
          <View style={{ height: 26 }} />
          <Text
            style={{
              fontFamily: active === 'home' ? fonts.body.bold : fonts.body.regular,
              fontSize: 11,
              color: active === 'home' ? colors.primaryStrong : colors.textSecondary,
            }}
          >
            Início
          </Text>
        </View>
        {lateral(RIGHT)}
      </View>

      {/* `box-none` pela prop, pelo mesmo motivo da camada de cima. Esta faixa
          atravessa a largura toda: com `auto`, ela engoliria o toque nos
          rótulos das duas abas laterais. */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' }}
      >
        <Pressable
          accessibilityRole="tab"
          accessibilityLabel="Início"
          accessibilityState={{ selected: active === 'home' }}
          onPress={() => onChange?.('home')}
          style={({ pressed }) => ({
            width: CENTER_SIZE,
            height: CENTER_SIZE,
            borderRadius: CENTER_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
            // O disco do símbolo cobre o botão inteiro. A cor por baixo é a
            // mesma dele: o desenho é um pouco menor que o quadrado do SVG, e
            // sem isso sobraria um fio branco na borda.
            backgroundColor: MARK_DISCO,
            overflow: 'hidden',
            /*
              O disco não recua mais quando a aba está fechada.

              Ele recuava a 0,55, e o pêssego misturado com o creme do fundo
              dava #F4D0B2 — um disco quase invisível, com o broto lavado
              dentro. Não lia como "aba fechada", lia como botão desligado, e
              logo no controle maior e mais alto da tela.

              Quem diz qual aba está aberta é o rótulo embaixo, que muda de
              peso e de cor — foi para isso que os três ganharam rótulo. O
              disco fica sendo o que ele é: a marca, sempre inteira.
            */
            transform: [{ scale: pressed ? 0.94 : 1 }],
            ...shadows.md,
          })}
        >
          <BrotinhoMark size={CENTER_SIZE} />
        </Pressable>
      </View>
    </View>
  );
}
