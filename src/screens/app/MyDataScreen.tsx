import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Icon, Input, Sprout, TopBar } from '../../components';
import { CANAL, CHECKIN, GENERO, IDADE, PLANS, TENTOU } from '../../data/onboarding';
import { useAppState } from '../../state/AppStateProvider';
import { daysCaredFor } from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';
import { useFotoDePerfil } from './useFotoDePerfil';
import { OptionList, TimeField } from '../onboarding/parts';
import { POR_TRAS_DA_BARRA } from '../../components/navigation/BottomNav';

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
  const { colors, palette, shadows } = useTema();
  const insets = useSafeAreaInsets();
  const { data, updateProfile } = useAppState();
  const p = data.profile;
  const retrato = useFotoDePerfil();

  const [campo, setCampo] = useState<Campo | null>(null);
  const [editandoNome, setEditandoNome] = useState(false);
  const [rascunhoNome, setRascunhoNome] = useState(p.name);
  const [rascunhoBroto, setRascunhoBroto] = useState(p.nomeDoBroto);

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
      <Pressable accessibilityRole="button" key={rotulo} onPress={aoTocar} style={estilo}>
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

  /** O diâmetro do retrato aqui — maior que o da Home, porque aqui é o assunto. */
  const RETRATO = 56;

  /**
   * O botãozinho de escolher e o de remover.
   *
   * Irmãos, e não um dentro de uma linha tocável. A linha inteira como alvo com
   * um "Remover" dentro dela seria alvo dentro de alvo: `<button>` dentro de
   * `<button>` no navegador, dois anúncios no leitor de tela, e o toque podendo
   * contar para os dois. Ver `confere-alvos-de-toque.js`.
   */
  const chip = (rotulo: string, aoTocar: () => void, forte = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={aoTocar}
      style={({ pressed }) => ({
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: radius.md,
        backgroundColor: forte ? colors.primarySoft : colors.bg,
        opacity: pressed ? 0.85 : 1,
        ...(forte ? {} : shadows.sm),
      })}
    >
      <Text
        style={{
          fontFamily: fonts.body.bold,
          fontSize: 14,
          color: forte ? colors.primaryStrong : colors.textPrimary,
        }}
      >
        {rotulo}
      </Text>
    </Pressable>
  );

  /**
   * A foto de perfil.
   *
   * Mora aqui, e não só no toque-e-segura do retrato da Home, porque atalho
   * escondido não é função: quem não sabe que existe nunca descobre. Este é o
   * lugar onde o nome dela também se troca.
   *
   * O texto diz o que acontece sem foto, em vez de deixar um disco vazio
   * perguntando. Ninguém precisa ser cobrado por uma selfie num app de saúde
   * mental — o padrão é o broto, e ele já é um rosto.
   */
  const aFoto = (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: RETRATO,
            height: RETRATO,
            borderRadius: RETRATO / 2,
            backgroundColor: colors.primarySoft,
            overflow: 'hidden',
            alignItems: 'center',
          }}
        >
          {retrato.foto ? (
            <Image
              source={{ uri: retrato.foto }}
              accessibilityIgnoresInvertColors
              style={{ width: RETRATO, height: RETRATO }}
              resizeMode="cover"
            />
          ) : (
            /* O mesmo enquadramento por recorte do cabeçalho — ver lá. */
            <View style={{ marginTop: -4 }}>
              <Sprout mood="feliz" stage={3} size={RETRATO * 1.35} showPot={false} />
            </View>
          )}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: fonts.body.bold, fontSize: 13, color: colors.textSecondary }}>
            Foto de perfil
          </Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 14,
              lineHeight: 14 * 1.45,
              color: retrato.temFoto ? colors.textPrimary : palette.brown400,
            }}
          >
            {retrato.temFoto
              ? 'Aparece na sua tela inicial.'
              : 'Sem foto, quem aparece é o broto. Fica como você preferir.'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {chip(retrato.temFoto ? 'Trocar foto' : 'Escolher foto', () => {
          void retrato.escolher();
        }, true)}
        {retrato.temFoto && chip('Remover', retrato.remover)}
      </View>

      {!!retrato.aviso && (
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 13,
            lineHeight: 13 * 1.45,
            color: palette.terracotta600,
          }}
        >
          {retrato.aviso}
        </Text>
      )}
    </View>
  );

  const lista = campo ? LISTAS[campo] : null;
  const plano = PLANS[p.plan];

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Meus dados" onBack={onBack} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 32 + POR_TRAS_DA_BARRA,
          gap: 20,
        }}
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
            {aFoto}
            {linha('Nome', p.name.trim() || VAZIO, () => {
              setRascunhoNome(p.name);
              setRascunhoBroto(p.nomeDoBroto);
              setEditandoNome(true);
            })}
            {/* Os dois nomes moram no mesmo lugar, como no onboarding: quem
                deixou o broto sem nome lá encontra aqui, e não numa tela nova. */}
            {linha('Nome do broto', p.nomeDoBroto.trim() || 'Brotinho', () => {
              setRascunhoNome(p.name);
              setRascunhoBroto(p.nomeDoBroto);
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

        {/* Ninguém sabia que isto existia. O backup do sistema já está ligado
            desde sempre, e é o que faz o diário voltar sozinho quando a pessoa
            reinstala o app — mas em lugar nenhum isso estava dito. Quem não
            sabe, acha que vai perder tudo, e quem acha que vai perder tudo
            escreve com menos verdade. */}
        {secao(
          'Se você trocar de celular',
          <>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 14,
                lineHeight: 14 * 1.55,
                color: colors.textSecondary,
              }}
            >
              Seus registros entram na cópia de segurança que o seu próprio celular já faz — no
              Google Drive, no Android, e no iCloud, no iPhone. Ao reinstalar o Brotinho com a
              mesma conta, seu diário volta sozinho.
            </Text>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 14,
                lineHeight: 14 * 1.55,
                color: colors.textSecondary,
              }}
            >
              Essa cópia é sua, guardada pela sua conta Google ou Apple. Ela não passa por nós e
              não temos como abrir. Para mudar de Android para iPhone, ou se preferir não depender
              disso, baixe seus dados em Privacidade e guarde o arquivo.
            </Text>
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
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={() => setEditandoNome(false)}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,54,48,0.4)' }]}
          />
          <View style={{ backgroundColor: colors.bg, borderRadius: radius.lg, padding: 20, gap: 16 }}>
            <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 19 }}>
              Como podemos te chamar?
            </Text>
            <Input value={rascunhoNome} onChangeText={setRascunhoNome} placeholder="Seu nome" />
            <Input
              label="E eu, como você quer me chamar?"
              placeholder="Brotinho"
              value={rascunhoBroto}
              onChangeText={setRascunhoBroto}
              maxLength={24}
            />
            <Button
              variant="primary"
              disabled={!rascunhoNome.trim()}
              onPress={() => {
                updateProfile({ name: rascunhoNome.trim(), nomeDoBroto: rascunhoBroto.trim() });
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
            accessibilityRole="button"
            accessibilityLabel="Fechar"
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
            <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 19 }}>{lista?.titulo}</Text>

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
                    /*
                      Tocar na opção que já está marcada tira a resposta.

                      Até a 1.0.1 a saída era a opção "Prefiro não responder",
                      que saiu das listas. Sem este gesto, idade ou gênero
                      respondidos uma vez ficariam gravados para sempre — e a
                      única forma de tirar seria "apagar meus dados", que leva o
                      diário junto. É o mesmo gesto da palavra do humor, na
                      Home, então não é coisa nova para aprender.

                      Vale só para `idade` e `genero`, que são dados sobre quem
                      a pessoa é. `checkin` e `canal` ficam de fora: nunca
                      tiveram opção de recusa, e nenhum dos dois diz nada sobre
                      ela que ela possa querer retirar.
                    */
                    const desmarcavel = campo === 'idade' || campo === 'genero';
                    const jaMarcada = p[campo] === opcao;
                    updateProfile({ [campo]: desmarcavel && jaMarcada ? null : opcao });
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
