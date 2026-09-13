import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAppState } from '../../state/AppStateProvider';
import { fonts, radius, useTema } from '../../theme';
import { Icon } from '../core/Icon';

/**
 * A escolha do tema: automático, claro ou escuro.
 *
 * ## Por que saiu das Configurações
 *
 * Porque quase ninguém chegava lá. Tema é a coisa que a pessoa quer trocar
 * **agora**, quando a tela está clara demais na cama — e estava a três toques:
 * Perfil, Configurações, rolar até "Aparência". No Perfil, que é a aba dela,
 * fica a um.
 *
 * ## Três estados, e não uma chave
 *
 * "Automático" é o padrão porque a pessoa já escolheu isso uma vez, no aparelho.
 * Os fixos existem porque aqui o caso inverso é comum: telefone no claro e
 * diário no escuro — este app é lido de madrugada mais do que a média.
 *
 * ## Por que é componente, e não um bloco copiado
 *
 * Ele já morou em dois lugares uma vez, e as duas cópias começaram a divergir
 * no espaçamento. Um seletor de tema com dois desenhos diferentes no mesmo app
 * é o tipo de coisa que ninguém nota e todo mundo sente.
 */

const OPCOES = [
  ['sistema', 'Automático'],
  ['claro', 'Claro'],
  ['escuro', 'Escuro'],
] as const;

export function SeletorDeTema() {
  const { colors, palette } = useTema();
  const { data, updateSettings } = useAppState();

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name="moon" color={palette.brown700} />
        <Text
          style={{
            flex: 1,
            color: colors.textPrimary,
            fontFamily: fonts.body.bold,
            fontSize: 15,
          }}
        >
          Tema
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {OPCOES.map(([valor, rotulo]) => {
          const ativo = data.settings.tema === valor;
          return (
            <Pressable
              key={valor}
              accessibilityRole="button"
              accessibilityLabel={`Tema ${rotulo}`}
              accessibilityState={{ selected: ativo }}
              onPress={() => updateSettings({ tema: valor })}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: radius.pill,
                borderWidth: 1.5,
                alignItems: 'center',
                borderColor: ativo ? colors.primaryStrong : colors.border,
                backgroundColor: ativo ? colors.primarySoft : colors.surface,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.body.bold,
                  fontSize: 13,
                  color: ativo ? colors.primaryStrong : palette.brown700,
                }}
              >
                {rotulo}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
