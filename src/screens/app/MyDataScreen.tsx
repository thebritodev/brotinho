import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Icon, Input, TopBar } from '../../components';
import { CANAL, CHECKIN, GENERO, IDADE, PLANS, TENTOU } from '../../data/onboarding';
import { useAppState } from '../../state/AppStateProvider';
import { daysCaredFor } from '../../state/derived';
import { colors, palette, radius, fonts } from '../../theme';
import { OptionList, TimeField } from '../onboarding/parts';

/** Campos que se editam escolhendo de uma lista. */
type Campo = 'checkin' | 'tentou' | 'idade' | 'genero' | 'canal';

const LISTAS: Record<Campo, { titulo: string; opcoes: string[]; multi: boolean }> = {
  checkin: { titulo: 'Como você tem estado?', opcoes: CHECKIN, multi: false },
  tentou: { titulo: 'O que você já tentou?', opcoes: TENTOU, multi: true },
  idade: { titulo: 'Qual sua faixa etária?', opcoes: IDADE, multi: false },
  genero: { titulo: 'Como você se identifica?', opcoes: GENERO, multi: false },
  canal: { titulo: 'Como você chegou até aqui?', opcoes: CANAL, multi: false },
};

const VAZIO = 'Não informado';

export function MyDataScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { data, updateProfile } = useAppState();
  const p = data.profile;

  const [campo, setCampo] = useState<Campo | null>(null);
  const [editandoNome, setEditandoNome] = useState(false);
  const [rascunhoNome, setRascunhoNome] = useState(p.name);

  const linha = (rotulo: string, valor: string, aoTocar?: () => void) => {
    const conteudo = (
      <>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: fonts.body.bold, fontSize: 13, color: colors.textSecondary }}>
            {rotulo}
          </Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 15,
              lineHeight: 15 * 1.4,
              color: valor === VAZIO ? palette.brown400 : colors.textPrimary,
            }}
          >
            {valor}
          </Text>
        </View>
        {!!aoTocar && <Icon name="chevronRight" color={palette.brown400} />}
      </>
    );

    const estilo = {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
    };

    return aoTocar ? (
      <Pressable key={rotulo} onPress={aoTocar} style={estilo}>
        {conteudo}
      </Pressable>
    ) : (
      <View key={rotulo} style={estilo}>
        {conteudo}
      </View>
    );
  };

  const secao = (titulo: string, filhos: React.ReactNode) => (
    <View>
      <Text
        style={{
          fontFamily: fonts.display.semiBold,
          fontSize: 15,
          color: palette.brown400,
          marginBottom: 8,
        }}
      >
        {titulo}
      </Text>
      <Card>
        <View style={{ gap: 18 }}>{filhos}</View>
      </Card>
    </View>
  );

  const lista = campo ? LISTAS[campo] : null;
  const plano = PLANS[p.plan];

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Meus dados" onBack={onBack} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 15,
            lineHeight: 15 * 1.5,
            color: colors.textSecondary,
          }}
        >
          O que você contou no começo. Dá para corrigir qualquer coisa aqui, e nada disso sai do
          aparelho.
        </Text>

        {secao(
          'Sobre você',
          <>
            {linha('Nome', p.name.trim() || VAZIO, () => {
              setRascunhoNome(p.name);
              setEditandoNome(true);
            })}
            {linha('Faixa etária', p.idade ?? VAZIO, () => setCampo('idade'))}
            {linha('Como se identifica', p.genero ?? VAZIO, () => setCampo('genero'))}
          </>,
        )}

        {secao(
          'Seu momento',
          <>
            {linha('Como você tem estado', p.checkin ?? VAZIO, () => setCampo('checkin'))}
            {linha('O que já tentou', p.tentou.length ? p.tentou.join(', ') : VAZIO, () =>
              setCampo('tentou'),
            )}
          </>,
        )}

        {secao(
          'Rotina',
          <>
            <View style={{ gap: 8 }}>
              <Text
                style={{ fontFamily: fonts.body.bold, fontSize: 13, color: colors.textSecondary }}
              >
                Costuma dormir às
              </Text>
              <TimeField
                label="Hora de dormir"
                value={p.sleepTime}
                onChange={(sleepTime) => updateProfile({ sleepTime })}
              />
            </View>

            <View style={{ gap: 8 }}>
              <Text
                style={{ fontFamily: fonts.body.bold, fontSize: 13, color: colors.textSecondary }}
              >
                Lembrete diário
              </Text>
              <TimeField
                label="Me lembrar às"
                value={p.reminder}
                onChange={(reminder) => updateProfile({ reminder })}
              />
            </View>
          </>,
        )}

        {secao(
          'Assinatura',
          <>
            {linha('Plano', p.subscribed ? `${plano.name} · ${plano.price}` : 'Versão gratuita')}
            {linha('Como você chegou', p.canal ?? VAZIO, () => setCampo('canal'))}
          </>,
        )}

        {secao(
          'O que você registrou',
          <>
            {linha('Dias cuidados', String(daysCaredFor(data)))}
            {linha('Registros no diário', String(data.journal.length))}
            {linha('Compostagens', String(data.composts.length))}
            {linha('Humores registrados', String(data.moodHistory.length))}
          </>,
        )}

        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 13,
            lineHeight: 13 * 1.5,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          Para baixar ou apagar tudo, vá em Privacidade.
        </Text>
      </ScrollView>

      {/* Edição do nome */}
      <Modal
        visible={editandoNome}
        transparent
        animationType="fade"
        onRequestClose={() => setEditandoNome(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <Pressable
            onPress={() => setEditandoNome(false)}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,54,48,0.4)' }]}
          />
          <View style={{ backgroundColor: colors.bg, borderRadius: radius.lg, padding: 20, gap: 16 }}>
            <Text style={{ fontFamily: fonts.display.semiBold, fontSize: 19 }}>
              Como podemos te chamar?
            </Text>
            <Input value={rascunhoNome} onChangeText={setRascunhoNome} placeholder="Seu nome" />
            <Button
              variant="primary"
              disabled={!rascunhoNome.trim()}
              onPress={() => {
                updateProfile({ name: rascunhoNome.trim() });
                setEditandoNome(false);
              }}
            >
              Salvar
            </Button>
          </View>
        </View>
      </Modal>

      {/* Edição por lista de opções */}
      <Modal
        visible={!!campo}
        transparent
        animationType="slide"
        onRequestClose={() => setCampo(null)}
      >
        {/* Fundo como irmão da folha: um Pressable em volta do ScrollView
            disputaria o gesto e travaria a rolagem. */}
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            onPress={() => setCampo(null)}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,54,48,0.4)' }]}
          />
          <View
            style={{
              backgroundColor: colors.bg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: 20 + insets.bottom,
              maxHeight: '80%',
              gap: 16,
            }}
          >
            <Text style={{ fontFamily: fonts.display.semiBold, fontSize: 19 }}>{lista?.titulo}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {!!lista && !!campo && (
                <OptionList
                  items={lista.opcoes}
                  multi={lista.multi}
                  value={campo === 'tentou' ? p.tentou : (p[campo] as string | null)}
                  onPick={(opcao) => {
                    if (campo === 'tentou') {
                      const atual = p.tentou;
                      updateProfile({
                        tentou: atual.includes(opcao)
                          ? atual.filter((x) => x !== opcao)
                          : atual.concat([opcao]),
                      });
                      return;
                    }
                    updateProfile({ [campo]: opcao });
                    setCampo(null);
                  }}
                />
              )}
            </ScrollView>

            {/* Escolha múltipla não fecha sozinha: a pessoa marca vários e confirma. */}
            {lista?.multi && (
              <Button variant="primary" onPress={() => setCampo(null)}>
                Pronto
              </Button>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
