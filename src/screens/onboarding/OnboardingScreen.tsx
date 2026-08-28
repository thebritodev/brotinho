import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedSprout,
  AskingSprout,
  Button,
  Card,
  GrowingSprout,
  Icon,
  Input,
  ProgressStem,
  ScreenTransition,
} from '../../components';
import {
  AREAS,
  CHECKIN,
  ESPELHO_CHECKIN,
  METODO,
  MAX_VALUES,
  PLANS,
  PRODUTO_DO_PLANO,
  STEPS,
  TENTOU,
  TOTAL,
  VALORES,
  espelhoDoTentou,
  planoDe,
  type PlanKey,
} from '../../data/onboarding';
import { useAppState } from '../../state/AppStateProvider';
import { descartarRascunho, loadRascunho, saveRascunho } from '../../storage/appStorage';
import { useAssinatura } from '../../state/SubscriptionProvider';
import { colors, palette, fonts } from '../../theme';
import { ExperimentoComposta, REPETICOES_DO_EXPERIMENTO } from './ExperimentoComposta';
import { Paywall } from './Paywall';
import { Centered, OptionList, TimeField } from './parts';
import { TimeWheel } from './TimeWheel';

/** Estado local do fluxo — só é gravado no perfil ao concluir. */
type Draft = {
  name: string;
  checkin: string | null;
  valores: string[];
  sleepTime: string;
  tentou: string[];
  reminder: string;
  plan: PlanKey;
};

/**
 * Os passos por nome. Antes eram números soltos espalhados pelo arquivo, e
 * mover uma tela obrigava a caçar cada `step === 6` para conferir.
 *
 * A ordem conta uma história: a pessoa diz como está, ouve o que aquilo
 * costuma significar, diz o que já tentou, ouve de novo — e só então o app
 * pede as coisas práticas.
 */
const PASSO = {
  INTRO: 0,
  NOME: 1,
  CHECKIN: 2,
  ESPELHO_MOMENTO: 3,
  TENTOU: 4,
  ESPELHO_TENTATIVA: 5,
  EXPERIMENTO: 6,
  METODO: 7,
  VALORES: 8,
  SONO: 9,
  LEMBRETE: 10,
  AREAS: 11,
  PLANO: 12,
  PAYWALL: 13,
} as const;

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width: largura, height: altura } = useWindowDimensions();
  const { data, updateProfile } = useAppState();

  /**
   * O onboarding em andamento, atravessando uma interrupção.
   *
   * `null` enquanto o rascunho não foi lido do disco: desenhar o passo zero e
   * depois pular para o passo nove seria pior do que esperar um instante.
   */
  const [restaurado, setRestaurado] = useState(false);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    name: data.profile.name,
    checkin: data.profile.checkin,
    valores: data.profile.valores,
    sleepTime: data.profile.sleepTime,
    tentou: data.profile.tentou,
    reminder: data.profile.reminder,
    plan: data.profile.plan,
  });

  const { planos, podeCobrar, comprar, restaurar } = useAssinatura();
  const [ocupado, setOcupado] = useState<'comprando' | 'restaurando' | null>(null);
  const [avisoDaCompra, setAvisoDaCompra] = useState<string | null>(null);

  /** O experimento vive fora do rascunho: não é resposta, é uma vivência. */
  const [pensamento, setPensamento] = useState('');
  const [repeticoes, setRepeticoes] = useState(0);

  /**
   * Lê o que ficou de uma sessão interrompida.
   *
   * Roda uma vez, antes de a tela virar interativa. O passo é limitado ao
   * intervalo válido porque um rascunho de uma versão antiga do app pode
   * apontar para um passo que não existe mais.
   */
  useEffect(() => {
    let vivo = true;
    void loadRascunho<{
      step: number;
      draft: Draft;
      pensamento: string;
      repeticoes: number;
    }>()
      .then((r) => {
        if (!vivo) return;
        if (r?.draft) {
          setDraft((prev) => ({ ...prev, ...r.draft }));
          setStep(Math.max(0, Math.min(TOTAL - 1, r.step ?? 0)));
          setPensamento(typeof r.pensamento === 'string' ? r.pensamento : '');
          setRepeticoes(Number.isFinite(r.repeticoes) ? r.repeticoes : 0);
        }
        setRestaurado(true);
      })
      .catch(() => vivo && setRestaurado(true));
    return () => {
      vivo = false;
    };
  }, []);

  /**
   * Grava a cada mudança, e só depois de ter lido — senão a primeira gravação
   * (com o estado vazio) apagaria o rascunho que estava no disco.
   */
  useEffect(() => {
    if (!restaurado) return;
    void saveRascunho({ step, draft, pensamento, repeticoes });
  }, [restaurado, step, draft, pensamento, repeticoes]);

  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  // O broto é o personagem: a largura manda, a altura é só teto.
  const brotoGrande = Math.min(largura * 0.54, altura * 0.26);
  const brotoMedio = Math.min(largura * 0.44, altura * 0.21);
  /**
   * O broto do plano é menor que os outros: aquela tela pode ter até quatro
   * compromissos abaixo dele, e num aparelho de 690px de altura os quatro só
   * cabem se ele ceder espaço.
   */
  const brotoDoPlano = Math.min(largura * 0.38, altura * 0.16);

  const espelhoMomento = draft.checkin ? ESPELHO_CHECKIN[draft.checkin] : undefined;
  const espelhoTentativa = espelhoDoTentou(draft.tentou);

  /** Guarda o sentido do último movimento, para a transição vir do lado certo. */
  const sentido = useRef<'forward' | 'back'>('forward');

  /**
   * Um espelho sem conteúdo seria uma tela em branco com um botão embaixo.
   * Isso só acontece se a resposta guardada não existir mais na lista — por
   * exemplo, em quem instalou antes de a lista mudar. Nesse caso o passo é
   * pulado no sentido em que a pessoa estava indo.
   */
  const espelhoVazio = (n: number) =>
    (n === PASSO.ESPELHO_MOMENTO && !espelhoMomento) ||
    (n === PASSO.ESPELHO_TENTATIVA && !espelhoTentativa);

  const go = (n: number) => {
    const paraFrente = n >= step;
    let destino = Math.max(0, Math.min(TOTAL - 1, n));
    while (espelhoVazio(destino)) destino += paraFrente ? 1 : -1;
    sentido.current = paraFrente ? 'forward' : 'back';
    setStep(Math.max(0, Math.min(TOTAL - 1, destino)));
  };

  const toggle = (key: 'valores' | 'tentou', value: string, max?: number) => {
    const current = draft[key];
    if (current.includes(value)) {
      set({ [key]: current.filter((x) => x !== value) } as Partial<Draft>);
      return;
    }
    if (max && current.length >= max) return;
    set({ [key]: current.concat([value]) } as Partial<Draft>);
  };

  const isPaywall = step === PASSO.PAYWALL;
  const isReminder = step === PASSO.LEMBRETE;
  const plan = PLANS[draft.plan];

  /** Só os passos que exigem resposta aparecem aqui. */
  const obrigatorios: Partial<Record<number, string | number>> = {
    [PASSO.NOME]: draft.name.trim(),
    [PASSO.CHECKIN]: draft.checkin ?? '',
    [PASSO.TENTOU]: draft.tentou.length,
    [PASSO.VALORES]: draft.valores.length,
  };
  /**
   * Durante o experimento o rodapé fica sem botão principal.
   *
   * Ele existia desabilitado, já rotulado "Por que isso funciona", enquanto a
   * pessoa ainda ia escrever a frase. Ela lia a promessa, tocava e nada
   * acontecia — e a ação de verdade daquele instante ("Estou pronto", depois
   * "Li") mora no meio do conteúdo. Eram dois botões disputando, e o que mais
   * parecia "avançar" era o morto. Sumir com ele deixa um único caminho
   * visível a cada momento.
   */
  const experimentoIncompleto =
    step === PASSO.EXPERIMENTO && repeticoes < REPETICOES_DO_EXPERIMENTO;
  const ctaDisabled = step in obrigatorios && !obrigatorios[step];

  const ctaLabel =
    step === PASSO.INTRO
      ? 'Começar'
      : isPaywall
        ? plan.cta
        : step === PASSO.PLANO
          ? 'Ver meu plano'
          : isReminder
            ? 'Sim, quero'
            : step === PASSO.EXPERIMENTO
              ? 'Por que isso funciona'
              : 'Continuar';

  const showFootNote = isPaywall || step === PASSO.PLANO;
  // O app não tem versão gratuita: do paywall só se sai assinando.
  const showSecondary = isReminder || step === PASSO.NOME || step === PASSO.EXPERIMENTO;


  /** Sai do onboarding e entra no app. */
  const finish = (assinou: boolean) => {
    // O rascunho existe para atravessar uma interrupção, não para virar uma
    // segunda cópia do que a pessoa escreveu. Terminou, some.
    void descartarRascunho();
    updateProfile({ ...draft, subscribed: assinou, onboarded: true });
  };

  /**
   * O botão do paywall.
   *
   * Onde dá para cobrar, ele abre a loja de verdade e só entra no app se a
   * compra completar. No Expo Go não existe compra, então ele entra direto —
   * senão não haveria como testar o app durante o desenvolvimento.
   */
  const tocarNoPaywall = async () => {
    if (!podeCobrar) return finish(false);

    const daLoja = planos.find((p) => p.id === PRODUTO_DO_PLANO[draft.plan]);
    if (!daLoja) {
      setAvisoDaCompra('Não consegui falar com a loja. Tente de novo em instantes.');
      return;
    }

    setAvisoDaCompra(null);
    setOcupado('comprando');
    const r = await comprar(daLoja.pacote);
    setOcupado(null);

    if (r === 'assinou') return finish(true);
    // Desistir no meio foi uma escolha, não um erro: não merece aviso.
    if (r === 'erro') setAvisoDaCompra('A compra não foi concluída. Nada foi cobrado.');
  };

  const tocarEmRestaurar = async () => {
    if (!podeCobrar) return;
    setAvisoDaCompra(null);
    setOcupado('restaurando');
    const ok = await restaurar();
    setOcupado(null);
    if (ok) return finish(true);
    setAvisoDaCompra('Não encontrei uma assinatura ativa nesta conta da loja.');
  };

  const screens: Record<number, React.ReactNode> = {
    [PASSO.INTRO]: (
      <View style={{ alignItems: 'center', gap: 26, paddingVertical: 20 }}>
        <AnimatedSprout mood="feliz" stage={3} size={brotoGrande} swayOnMount />
        <View style={{ gap: 12 }}>
          <Text
            style={{
              fontFamily: fonts.display.bold,
              fontSize: 30,
              lineHeight: 30 * 1.2,
              textAlign: 'center',
            }}
          >
            Oi, eu sou o brotinho
          </Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 16,
              lineHeight: 16 * 1.55,
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            Vou te fazer poucas perguntas, e nenhuma delas tem resposta certa. É só
            para eu entender onde você está agora.
          </Text>
        </View>
      </View>
    ),

    [PASSO.NOME]: (
      <View style={{ gap: 20 }}>
        <AskingSprout
          title="Como posso te chamar?"
          sub="Só para eu não falar com você como se fosse um formulário."
        />
        <Input placeholder="Seu nome" value={draft.name} onChangeText={(name) => set({ name })} />
      </View>
    ),

    [PASSO.CHECKIN]: (
      <View style={{ gap: 20 }}>
        <AskingSprout
          title={`Como você tem estado${draft.name.trim() ? `, ${draft.name.trim()}` : ''}?`}
          sub="Pense nas últimas semanas, não só em hoje."
          reageA={draft.checkin}
          compacto
        />
        <OptionList items={CHECKIN} value={draft.checkin} onPick={(l) => set({ checkin: l })} />
      </View>
    ),

    [PASSO.ESPELHO_MOMENTO]: espelhoMomento ? (
      <AskingSprout
        kicker={espelhoMomento.kicker}
        title={espelhoMomento.title}
        sub={espelhoMomento.body}
      />
    ) : null,

    [PASSO.TENTOU]: (
      <View style={{ gap: 20 }}>
        <AskingSprout
          title="E o que você tem feito com isso?"
          sub="Pode marcar mais de um."
          reageA={draft.tentou.join('|')}
          compacto
        />
        <OptionList items={TENTOU} value={draft.tentou} multi onPick={(l) => toggle('tentou', l)} />
      </View>
    ),

    [PASSO.ESPELHO_TENTATIVA]: espelhoTentativa ? (
      <AskingSprout
        kicker={espelhoTentativa.kicker}
        title={espelhoTentativa.title}
        sub={espelhoTentativa.body}
      />
    ) : null,

    [PASSO.VALORES]: (
      <View style={{ gap: 20 }}>
        <AskingSprout
          title="O que você queria ter mais no seu dia?"
          sub={`Escolha até ${MAX_VALUES} — ${draft.valores.length} escolhido${draft.valores.length === 1 ? '' : 's'}. Isso vira o que eu procuro no que você escrever.`}
          reageA={draft.valores.join('|')}
        />
        <OptionList
          items={VALORES}
          value={draft.valores}
          multi
          wrap
          onPick={(l) => toggle('valores', l, MAX_VALUES)}
        />
      </View>
    ),

    [PASSO.SONO]: (
      <View style={{ gap: 20 }}>
        <AskingSprout
          title="Que horas você costuma ir dormir?"
          sub="Noite mal dormida e dia difícil andam juntos com mais frequência do que parece."
        />
        <TimeWheel value={draft.sleepTime} onChange={(sleepTime) => set({ sleepTime })} />
      </View>
    ),

    [PASSO.LEMBRETE]: (
      <Centered>
        <AnimatedSprout mood="feliz" stage={3} size={brotoMedio} breathe showBg={false} />
        <View style={{ gap: 10 }}>
          <Text
            style={{
              fontFamily: fonts.display.bold,
              fontSize: 24,
              lineHeight: 24 * 1.25,
              textAlign: 'center',
            }}
          >
            Posso te chamar uma vez por dia?
          </Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 15,
              lineHeight: 15 * 1.55,
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            Um toque só, no horário que você escolher. Se você não abrir, não acontece
            nada — eu não cobro e não conto os dias que você faltou.
          </Text>
        </View>
        <TimeField
          label="Lembrete diário"
          value={draft.reminder}
          onChange={(reminder) => set({ reminder })}
        />
      </Centered>
    ),

    [PASSO.EXPERIMENTO]: (
      <ExperimentoComposta
        thought={pensamento}
        onChangeThought={setPensamento}
        reps={repeticoes}
        onRep={() => setRepeticoes((n) => n + 1)}
      />
    ),

    [PASSO.METODO]: (
      <View style={{ gap: 16 }}>
        <Text
          style={{
            fontFamily: fonts.display.bold,
            fontSize: 23,
            lineHeight: 23 * 1.24,
            textAlign: 'center',
          }}
        >
          {repeticoes > 0 ? METODO.title : METODO.titleSemExperimento}
        </Text>
        {METODO.passos.map((p) => (
          <Card key={p.title} padding={16} style={{ flexDirection: 'row', gap: 14 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={p.icon} size={20} color={colors.primaryStrong} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 15 }}>{p.title}</Text>
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 13,
                  lineHeight: 13 * 1.5,
                  color: palette.brown700,
                }}
              >
                {p.text}
              </Text>
            </View>
          </Card>
        ))}
      </View>
    ),

    [PASSO.AREAS]: (
      <View style={{ gap: 14 }}>
        <Text
          style={{
            fontFamily: fonts.display.bold,
            fontSize: 23,
            lineHeight: 23 * 1.24,
            textAlign: 'center',
          }}
        >
          O que tem aqui dentro
        </Text>
        {AREAS.map((a) => (
          <Card key={a.title} padding={14} style={{ flexDirection: 'row', gap: 14 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={a.icon} size={19} color={colors.primaryStrong} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 15 }}>{a.title}</Text>
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 13,
                  lineHeight: 13 * 1.45,
                  color: palette.brown700,
                }}
              >
                {a.text}
              </Text>
            </View>
          </Card>
        ))}
      </View>
    ),

    [PASSO.PLANO]: (
      <View style={{ alignItems: 'center', gap: 8 }}>
        {/* O broto cresce do 1 ao 3 aqui: a promessa acontecendo ao vivo. */}
        <GrowingSprout size={brotoDoPlano} />
        <Text
          style={{
            fontFamily: fonts.display.bold,
            fontSize: 22,
            lineHeight: 22 * 1.2,
            textAlign: 'center',
          }}
        >
          Combinado, {draft.name.trim() || 'que bom te ver'}
        </Text>
        <View style={{ width: '100%', gap: 8 }}>
          {planoDe(draft).map((item, i) => (
            <Card key={i} padding={11} style={{ flexDirection: 'row', gap: 12 }}>
              <Icon name={item.icon} size={19} color={colors.primaryStrong} />
              <Text
                style={{
                  flex: 1,
                  fontFamily: fonts.body.regular,
                  fontSize: 14,
                  lineHeight: 14 * 1.5,
                  color: palette.brown700,
                }}
              >
                {item.text}
              </Text>
            </Card>
          ))}
        </View>
      </View>
    ),

    [PASSO.PAYWALL]: <Paywall plan={draft.plan} onSelectPlan={(p) => set({ plan: p })} />,
  };

  /*
    Enquanto o rascunho não foi lido do disco, a tela não desenha.

    Sem isto ela apareceria no passo zero e pularia para o passo nove um quadro
    depois — para quem está voltando de uma interrupção, o app pareceria ter
    perdido tudo e depois se corrigido. A leitura é local e leva um instante.
  */
  if (!restaurado) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      {/* Cabeçalho: voltar · progresso · contador (ou "Restaurar" no paywall) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingTop: insets.top + 12,
          paddingBottom: 4,
          paddingHorizontal: 20,
          minHeight: 44,
        }}
      >
        {step > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => go(step - 1)}
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="back" size={22} color={palette.brown700} />
          </Pressable>
        ) : (
          <View style={{ width: 36, height: 36 }} />
        )}

        {!isPaywall && (
          <View style={{ flex: 1, alignItems: 'center' }}>
            {/* O progresso é um caule ganhando folhas: a mesma metáfora do app. */}
            <ProgressStem step={step} total={STEPS} width={Math.max(120, Math.min(largura - 130, 230))} />
          </View>
        )}

        {isPaywall ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Restaurar compra"
            onPress={() => void tocarEmRestaurar()}
            disabled={!!ocupado}
            style={{ flex: 1, alignItems: 'flex-end', paddingVertical: 6 }}
          >
            <Text
              style={{ fontFamily: fonts.body.bold, fontSize: 13, color: palette.brown400 }}
            >
              {ocupado === 'restaurando' ? 'Restaurando…' : 'Restaurar'}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={{
              width: 36,
              fontFamily: fonts.body.bold,
              fontSize: 13,
              color: colors.textSecondary,
              textAlign: 'right',
            }}
          >
            {step + 1}/{STEPS}
          </Text>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingVertical: 6,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenTransition
          transitionKey={step}
          mode={sentido.current}
          style={{ flexGrow: 1, justifyContent: 'center' }}
        >
          {screens[step]}
        </ScreenTransition>
      </ScrollView>

      {/* Rodapé fixo com a ação principal */}
      <View
        style={{
          paddingTop: 10,
          paddingBottom: 18 + insets.bottom,
          paddingHorizontal: 20,
          alignItems: 'center',
          gap: 12,
          backgroundColor: isPaywall ? '#fff' : colors.bg,
        }}
      >
        {!experimentoIncompleto && (
          <Button
            variant="primary"
            size="lg"
            disabled={ctaDisabled || !!ocupado}
            style={{ width: '100%' }}
            onPress={() => (isPaywall ? void tocarNoPaywall() : go(step + 1))}
          >
            {ocupado === 'comprando' ? 'Abrindo a loja…' : ctaLabel}
          </Button>
        )}

        {!!avisoDaCompra && (
          <Text
            style={{
              fontFamily: fonts.body.bold,
              fontSize: 13,
              color: colors.danger,
              textAlign: 'center',
            }}
          >
            {avisoDaCompra}
          </Text>
        )}

        {showFootNote && (
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 12,
              lineHeight: 12 * 1.45,
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            {isPaywall ? plan.fine : 'Próximo passo: escolher seu plano'}
          </Text>
        )}

        {showSecondary && (
          <Pressable
            accessibilityRole="button"
            onPress={() => go(step + 1)}
            style={{ padding: 6 }}
          >
            <Text
              style={{ fontFamily: fonts.body.bold, fontSize: 15, color: colors.textSecondary }}
            >
              {isReminder
                ? 'Agora não'
                : step === PASSO.EXPERIMENTO
                  ? 'Agora não é hora'
                  : 'Prefiro não dizer'}
            </Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
