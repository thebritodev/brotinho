import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Card,
  Icon,
  type IconName,
  SeletorDeTema,
  Sprout,
  StatRow,
  Switch,
  TopBar,
} from '../../components';
import { pedirAvaliacaoAPedido } from '../../services/pedirAvaliacao';
import { useAppState } from '../../state/AppStateProvider';
import { caringSince, fazTerapia, sproutStage, stats } from '../../state/derived';
import { fonts, useTema } from '../../theme';
import type { SubScreen } from './types';
import { POR_TRAS_DA_BARRA } from '../../components/navigation/BottomNav';

type Props = {
  name: string;
  onNavigate: (screen: SubScreen) => void;
};

export function ProfileScreen({ name, onNavigate }: Props) {
  const { colors, palette } = useTema();
  const insets = useSafeAreaInsets();
  const { data, updateSettings } = useAppState();

  const growth = useMemo(() => stats(data), [data]);
  /** Ver `fazTerapia`: o resumo é o mesmo, o texto é que para de pressupor. */
  const emTerapia = fazTerapia(data);
  const since = caringSince(data);

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

  const row = (
    icon: IconName,
    label: string,
    aoTocar: () => void,
    hint?: string | null,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={aoTocar}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <Icon name={icon} color={palette.brown700} />
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
      <Icon name="chevronRight" color={palette.brown400} />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Meu espaço" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 + POR_TRAS_DA_BARRA, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Sprout mood="leve" stage={sproutStage(data)} size={84} />
          <View>
            <Text style={{ color: colors.textPrimary, fontFamily: fonts.body.extraBold, fontSize: 17 }}>{name}</Text>
            {!!since && (
              <Text
                style={{ fontFamily: fonts.body.regular, fontSize: 13, color: colors.textSecondary }}
              >
                Cuidando de si desde {since}
              </Text>
            )}
          </View>
        </View>

        <StatRow stats={growth} />

        <Card
          onPress={() => onNavigate('terapia')}
          label={emTerapia ? 'Para minha terapia' : 'Um resumo do que você registrou'}
        >
          <Text style={{ color: colors.textPrimary, fontFamily: fonts.body.extraBold, fontSize: 15, marginBottom: 4 }}>
            {emTerapia ? 'Para minha terapia' : 'Um resumo do que você registrou'}
          </Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 14,
              lineHeight: 14 * 1.5,
              color: palette.brown700,
              marginBottom: 12,
            }}
          >
            {emTerapia
              ? 'Seus padrões e desabafos organizados para levar e compartilhar com seu terapeuta.'
              : 'Seus padrões e desabafos organizados num arquivo só — para você reler, ou levar a uma primeira consulta, se um dia quiser.'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="book" size={18} color={colors.primaryStrong} />
            <Text
              style={{ fontFamily: fonts.body.bold, fontSize: 15, color: colors.primaryStrong }}
            >
              Ver resumo
            </Text>
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
        <Card>
          <SeletorDeTema />
        </Card>

        <Card>
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="bell" color={palette.brown700} />
              <Text style={{ color: colors.textPrimary, flex: 1, fontFamily: fonts.body.bold, fontSize: 15 }}>
                Lembretes diários
              </Text>
              <Switch
                label="Lembretes diários"
                checked={data.settings.reminders}
                onChange={(reminders) => updateSettings({ reminders })}
              />
            </View>
            {row(
              'star',
              'Avaliar o Brotinho',
              () => void tocarAvaliar(),
              avisoAvaliacao ?? 'Ajuda outras pessoas a acharem o app',
            )}
            {row('settings', 'Configurações', () => onNavigate('config'))}
            {row('lock', 'Privacidade', () => onNavigate('privacidade'))}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
