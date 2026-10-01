import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AjudaAgora,
  Card,
  Icon,
  type IconName,
  SeletorDeTema,
  StatRow,
  Switch,
} from '../../components';
import { pedirAvaliacaoAPedido } from '../../services/pedirAvaliacao';
import { useAppState } from '../../state/AppStateProvider';
import {
  caringSince,
  fazTerapia,
  livedValues,
  moodWeek,
  nomeDoBroto as lerNomeDoBroto,
  stats,
} from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';
import type { SubScreen } from './types';
import { POR_TRAS_DA_BARRA } from '../../components/navigation/BottomNav';

type Props = {
  name: string;
  onNavigate: (screen: SubScreen) => void;
};

/**
 * O Perfil — quem a pessoa é aqui dentro, e o que é dela.
 *
 * ## O que o redesenho mudou
 *
 * A tela era uma pilha de cartões sem hierarquia: um atrás do outro, todos do
 * mesmo peso, e quem procurava o tema tinha de ler os três para achar. Agora
 * ela tem **seções com nome** — Aparência, Lembrete, Seu espaço —, e o nome é
 * o que deixa procurar em vez de ler.
 *
 * O resumo para a terapia ganhou a semana desenhada dentro dele. Era um cartão
 * de texto anunciando um relatório; com as sete barras de humor à mostra, ele
 * passa a **ser** um pedaço do relatório, e abrir deixa de ser um salto no
 * escuro.
 *
 * ## Por que os atalhos aparecem aqui e na aba do broto
 *
 * Jardim, frases guardadas e valores são as coisas que a pessoa acumulou. Na
 * aba do broto eles ficam junto do personagem que representa esse tempo; aqui
 * ficam junto do resto que é dela. É a mesma lógica do humor, que também
 * aparece nos dois lugares: quem abriu o app por um motivo não deve ter de
 * trocar de aba para chegar ao que veio buscar.
 */
export function ProfileScreen({ name, onNavigate }: Props) {
  const { colors, palette, shadows, moodColors } = useTema();
  const insets = useSafeAreaInsets();
  const { data, updateSettings } = useAppState();

  const growth = useMemo(() => stats(data), [data]);
  /** Ver `fazTerapia`: o resumo é o mesmo, o texto é que para de pressupor. */
  const emTerapia = fazTerapia(data);
  const since = caringSince(data);
  const semana = useMemo(() => moodWeek(data), [data]);
  const valores = useMemo(() => livedValues(data), [data]);
  /*
    "Brotinho" quando ela não deu nome — e aqui o padrão é obrigatório.

    `nomeDoBroto` devolve vazio de propósito, para quem chama decidir. No
    jardim a linha some inteira; aqui ela não pode sumir, porque é ela que diz
    desde quando a pessoa está no app. Sem o padrão saía "Com  desde outubro".
  */
  const nomeDoBroto = lerNomeDoBroto(data) || 'Brotinho';

  /**
   * O pedido de avaliação, que morava dentro de Configurações › Sobre.
   *
   * Três toques até um botão cujo trabalho é acontecer num impulso. Aqui, na
   * aba da pessoa, fica a um — e continua sendo pedido, não emboscada: o modal
   * da loja só abre em quem tocar. Ver `pedirAvaliacao`.
   */
  const [avisoAvaliacao, setAvisoAvaliacao] = useState<string | null>(null);
  const tocarAvaliar = async () => {
    setAvisoAvaliacao(null);
    if (!(await pedirAvaliacaoAPedido())) {
      setAvisoAvaliacao('Não consegui abrir a loja a partir daqui.');
    }
  };

  /** O rótulo de uma seção: o que deixa procurar em vez de ler. */
  const secao = (texto: string) => (
    <Text
      style={{
        fontFamily: fonts.body.extraBold,
        fontSize: 13,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: palette.brown400,
        marginBottom: -8,
      }}
    >
      {texto}
    </Text>
  );

  const row = (
    icon: IconName,
    label: string,
    aoTocar: () => void,
    hint?: string | null,
    meta?: string | null,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={aoTocar}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <Icon name={icon} color={colors.primaryStrong} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textPrimary, fontFamily: fonts.body.bold, fontSize: 15 }}>
          {label}
        </Text>
        {!!hint && (
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 12,
              color: palette.brown400,
              marginTop: 2,
            }}
          >
            {hint}
          </Text>
        )}
      </View>
      {!!meta && (
        <Text style={{ fontFamily: fonts.body.regular, fontSize: 13, color: palette.brown400 }}>
          {meta}
        </Text>
      )}
      <Icon name="chevronRight" color={palette.brown400} />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 32 + POR_TRAS_DA_BARRA,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/*
          O cabeçalho: a inicial, o nome, e desde quando.

          A inicial num disco, e não o desenho do broto, que era o que estava
          aqui. O broto aparece em todas as outras telas do app; nesta, que é
          a da **pessoa**, quem precisa de rosto é ela. "Com Brotinho desde
          agosto" é o que liga os dois sem precisar repetir o desenho.
        */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: palette.terracotta100,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: fonts.display.bold,
                fontSize: 26,
                color: palette.terracotta600,
              }}
            >
              {(name || 'V').trim().charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: colors.textPrimary, fontFamily: fonts.display.bold, fontSize: 24 }}
            >
              {name}
            </Text>
            {!!since && (
              <Text
                style={{ fontFamily: fonts.body.regular, fontSize: 14, color: palette.brown400 }}
              >
                Com {nomeDoBroto} desde {since}
              </Text>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Editar meus dados"
            onPress={() => onNavigate('dados')}
            style={{
              paddingVertical: 9,
              paddingHorizontal: 14,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
              ...shadows.sm,
            }}
          >
            <Text
              style={{ fontFamily: fonts.body.bold, fontSize: 14, color: colors.textPrimary }}
            >
              Editar
            </Text>
          </Pressable>
        </View>

        <StatRow stats={growth} />

        <Card
          onPress={() => onNavigate('terapia')}
          label={emTerapia ? 'Para minha terapia' : 'Um resumo do que você registrou'}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.md,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="book" size={22} color={colors.primaryStrong} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontFamily: fonts.display.bold,
                  fontSize: 19,
                }}
              >
                {emTerapia ? 'Para minha terapia' : 'Um resumo do que você registrou'}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 13.5,
                  color: palette.brown400,
                }}
              >
                {emTerapia
                  ? 'Pronto para levar na sessão'
                  : 'Para reler, ou levar a uma primeira consulta'}
              </Text>
            </View>
            <Icon name="chevronRight" color={palette.brown400} />
          </View>

          {/*
            A semana desenhada dentro do cartão.

            Sete barras, uma por dia, da cor do humor daquele dia. Dia sem
            registro fica no tom afundado, e dia que ainda não chegou fica mais
            fraco ainda — a mesma distinção de `moodWeek`: ausência dela e
            tempo que não passou são coisas diferentes, e marcar as duas igual
            seria cobrar o impossível.
          */}
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {semana.map((dia) => (
              <View key={dia.date} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: '100%',
                    height: 26,
                    borderRadius: 7,
                    backgroundColor: dia.mood ? moodColors[dia.mood] : colors.surfaceSunken,
                    opacity: dia.futuro ? 0.45 : 1,
                  }}
                />
                <Text
                  style={{
                    fontFamily: fonts.body.bold,
                    fontSize: 11,
                    color: palette.brown400,
                  }}
                >
                  {dia.day}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/*
          O tema aqui, e não em Configurações.

          É a coisa que a pessoa quer trocar **agora**, quando a tela está clara
          demais na cama, e estava a três toques: Perfil, Configurações, rolar
          até "Aparência". Nesta aba fica a um. O seletor é um componente só —
          ver `SeletorDeTema` — porque já morou em dois lugares e as duas cópias
          começaram a divergir no espaçamento.
        */}
        {secao('Aparência')}
        <Card>
          <SeletorDeTema />
        </Card>

        {secao('Lembrete')}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="bell" color={colors.primaryStrong} />
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: colors.textPrimary, fontFamily: fonts.body.bold, fontSize: 15 }}
              >
                Lembretes diários
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 13,
                  color: palette.brown400,
                  marginTop: 2,
                }}
              >
                {data.settings.reminders ? 'Ligados' : 'Desligados'}
              </Text>
            </View>
            <Switch
              label="Lembretes diários"
              checked={data.settings.reminders}
              onChange={(reminders) => updateSettings({ reminders })}
            />
          </View>
        </Card>

        {secao('Seu espaço')}
        <Card>
          <View style={{ gap: 16 }}>
            {row(
              'leaf',
              'Meu jardim',
              () => onNavigate('jardim'),
              null,
              valores.length
                ? `${valores.length} ${valores.length === 1 ? 'valor' : 'valores'}`
                : null,
            )}
            {row(
              'heart',
              'Frases guardadas',
              () => onNavigate('conselhos'),
              null,
              data.conselhosGuardados.length ? String(data.conselhosGuardados.length) : null,
            )}
            {row('star', 'Meus valores', () => onNavigate('valores'))}
            {row('lock', 'Privacidade e bloqueio', () => onNavigate('privacidade'))}
          </View>
        </Card>

        {secao('O app')}
        <Card>
          <View style={{ gap: 16 }}>
            {row(
              'sparkle',
              'Avaliar o Brotinho',
              () => void tocarAvaliar(),
              avisoAvaliacao ?? 'Ajuda outras pessoas a acharem o app',
            )}
            {row('settings', 'Configurações', () => onNavigate('config'))}
          </View>
        </Card>

        {/*
          A saída para quando nada disto serve.

          Ela já existia no diário e na Composta — as duas telas em que a
          pessoa está com a coisa na mão. Aqui ela fica no caminho de quem está
          só andando pelo app, que é a outra forma de chegar perto da hora de
          precisar.
        */}
        <AjudaAgora />
      </ScrollView>
    </View>
  );
}
