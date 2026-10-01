import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import Svg, { Circle } from 'react-native-svg';

import { BalaoDoBroto, Button, Sprout } from '../../components';
import { NA_RESPIRACAO } from '../../data/falasDoBroto';
import type { BreathingPhase } from '../../data/practices';
import { toqueMedio } from '../../services/toque';
import { useAppState } from '../../state/AppStateProvider';
import { fonts, useTema } from '../../theme';

/**
 * Marcador de ritmo da respiração: um círculo que infla, mantém e esvazia
 * junto com a pessoa. O texto diz o que fazer; o tamanho diz por quanto tempo.
 */

const SMALL = 0.55;
const LARGE = 1;

/** O anel do progresso: raio, e a volta inteira dele. */
const RAIO_DO_ANEL = 116;
const VOLTA_DO_ANEL = 2 * Math.PI * RAIO_DO_ANEL;

/**
 * Um tom por fase, para o exercício funcionar de olhos fechados.
 *
 * São três notas descendo — inspirar mais agudo, segurar no meio, soltar mais
 * grave — para o ouvido saber em que fase está sem precisar contar.
 *
 * O som obedece ao botão de silencioso do aparelho (`playsInSilentMode: false`)
 * de propósito: num app usado na cama e no ônibus, quem silenciou o telefone
 * está dizendo algo, e o app não tem por que discordar.
 */
const TONS = {
  in: require('../../../assets/sons/respira-inspira.wav'),
  hold: require('../../../assets/sons/respira-segura.wav'),
  out: require('../../../assets/sons/respira-solta.wav'),
} as const;

type Props = {
  phases: BreathingPhase[];
  cycles: number;
  onDone: () => void;
  onCancel: () => void;
};

export function BreathingGuide({ phases, cycles, onDone, onCancel }: Props) {
  const { colors, palette } = useTema();
  const { data } = useAppState();
  const comSom = data.settings.somDaRespiracao;

  const tomInspira = useAudioPlayer(TONS.in);
  const tomSegura = useAudioPlayer(TONS.hold);
  const tomSolta = useAudioPlayer(TONS.out);

  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(1);
  /*
    Pausar, e nao so parar.

    "Parar" desiste do exercicio; quem precisa atender a porta no meio do
    terceiro ciclo nao esta desistindo. O documento poe os dois, e o de cima e
    a pausa justamente porque e o mais provavel.
  */
  const [pausado, setPausado] = useState(false);
  const [left, setLeft] = useState(phases[0].seconds);

  const scale = useRef(new Animated.Value(SMALL)).current;
  const phase = phases[index];

  // Anima o círculo para o tamanho que corresponde à fase atual.
  useEffect(() => {
    /**
     * A virada de fase vibra porque este exercício pede olhos fechados, e até
     * agora ele era só visual: para seguir o ritmo era preciso encarar a tela,
     * que é justamente o contrário do que a prática pede.
     */
    toqueMedio(data.settings.vibracao);

    if (comSom) {
      const tom =
        phase.motion === 'in' ? tomInspira : phase.motion === 'out' ? tomSolta : tomSegura;
      // Voltar ao início antes de tocar: fases curtas se atropelam, e sem isto
      // a segunda repetição sairia do ponto onde a primeira parou.
      void tom.seekTo(0).then(() => tom.play());
    }

    const target = phase.motion === 'in' ? LARGE : phase.motion === 'out' ? SMALL : null;
    if (target === null) return; // "segure" mantém o tamanho de propósito

    Animated.timing(scale, {
      toValue: target,
      duration: phase.seconds * 1000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [index]);

  useEffect(() => {
    if (!comSom) return;
    void setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});
  }, [comSom]);

  /*
    A fase volta ao começo quando a **fase** muda — e só então.

    Isto era a primeira linha do efeito do relógio. Com a pausa, aquele efeito
    passou a rodar também ao pausar e ao continuar, e a contagem voltava ao
    topo da fase cada vez: pausar no sétimo segundo do "segure" e continuar
    dava sete segundos novos. Separado, continuar retoma de onde parou, que é
    o que pausar quer dizer.
  */
  useEffect(() => {
    setLeft(phase.seconds);
  }, [index, cycle]);

  // Conta regressiva da fase e avanço para a próxima.
  useEffect(() => {
    /*
      Pausado, o relógio não é criado — e não só ignorado. Um `setInterval`
      que roda e não faz nada continua acordando o JavaScript a cada segundo
      durante a pausa inteira.
    */
    if (pausado) return;

    const id = setInterval(() => {
      setLeft((s) => {
        if (s > 1) return s - 1;

        const próximo = index + 1;
        if (próximo < phases.length) {
          setIndex(próximo);
        } else if (cycle < cycles) {
          setCycle((c) => c + 1);
          setIndex(0);
        } else {
          clearInterval(id);
          onDone();
        }
        return s;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [index, cycle, pausado]);

  /*
    O fundo muda de cor a cada fase.

    Azul para inspirar, lavanda para segurar, verde para soltar. É a parte do
    exercício que funciona com o olho desfocado — e um exercício de respiração
    é feito de olho desfocado. O som já dizia a fase para quem fecha os olhos;
    isto diz para quem só não está lendo.

    As cores vêm do gancho de tema, e não da paleta fixa: esta é uma tela
    inteira de interface, não uma paisagem. No escuro elas são os mesmos tons
    uma faixa abaixo, e o texto por cima continua sendo o do tema.
  */
  const CEU_DA_FASE: Record<string, string> = {
    in: palette.blue100,
    hold: palette.lavender100,
    out: palette.green100,
  };

  /* Quanto do exercício inteiro já passou — o anel em volta do círculo. */
  const totalDeSegundos = phases.reduce((n, f) => n + f.seconds, 0) * cycles;
  const jaPassou =
    (cycle - 1) * phases.reduce((n, f) => n + f.seconds, 0)
    + phases.slice(0, index).reduce((n, f) => n + f.seconds, 0)
    + (phase.seconds - left);
  const andado = Math.max(0, Math.min(1, jaPassou / Math.max(1, totalDeSegundos)));

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 24,
        backgroundColor: CEU_DA_FASE[phase.motion] ?? colors.bg,
      }}
    >
      <Text style={{ fontFamily: fonts.body.bold, fontSize: 13, color: palette.brown700 }}>
        Ciclo {cycle} de {cycles}
      </Text>

      {/*
        O que ele diz nesta fase.

        O rótulo grande embaixo diz **o que fazer**; o balão diz **como**, com a
        voz dele. Duas frases sobre a mesma coisa não se repetem porque uma é
        instrução e a outra é companhia: "Inspire" e "Enche a barriga de ar,
        devagar" ensinam coisas diferentes.
      */}
      <BalaoDoBroto lado="baixo" apareceEm={phase.motion} style={{ maxWidth: 280 }}>
        <Text
          style={{
            fontFamily: fonts.body.bold,
            fontSize: 14.5,
            lineHeight: 14.5 * 1.35,
            color: colors.textPrimary,
            textAlign: 'center',
          }}
        >
          {NA_RESPIRACAO[phase.motion === 'in' ? 'inspira' : phase.motion === 'out' ? 'solta' : 'segura']}
        </Text>
      </BalaoDoBroto>

      <View style={{ width: 240, height: 240, alignItems: 'center', justifyContent: 'center' }}>
        {/*
          O anel do exercício inteiro, em volta de tudo.

          Ele responde a pergunta que o contador de ciclos responde mal: "falta
          muito?". Quatro ciclos de 4-7-8 sao setenta e seis segundos, e saber
          que se esta no segundo nao diz onde isso cai no total.

          `strokeDashoffset` sai de um numero comum, recalculado a cada
          segundo junto com o contador — nao e animacao, e estado. Por isso
          funciona igual no aparelho e no navegador.
        */}
        <View style={{ position: 'absolute', width: 240, height: 240 }}>
          <Svg width={240} height={240}>
            <Circle
              cx={120}
              cy={120}
              r={RAIO_DO_ANEL}
              fill="none"
              stroke={colors.surface}
              strokeWidth={6}
              opacity={0.7}
            />
            <Circle
              cx={120}
              cy={120}
              r={RAIO_DO_ANEL}
              fill="none"
              stroke={colors.primary}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={VOLTA_DO_ANEL}
              strokeDashoffset={VOLTA_DO_ANEL * (1 - andado)}
              transform="rotate(-90 120 120)"
            />
          </Svg>
        </View>
        {/* Contorno fixo: mostra até onde o ar vai. */}
        <View
          style={{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 110,
            borderWidth: 2,
            borderColor: colors.surface,
            opacity: 0.6,
          }}
        />
        <Animated.View
          style={{
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            transform: [{ scale }],
          }}
        >
          {/*
            O broto dentro do círculo, respirando junto.

            O disco inflava e esvaziava sozinho, com um número no meio. Quem
            está no exercício olha para ele por dois minutos seguidos, e um
            número crescendo e encolhendo é um cronômetro — a pessoa fica
            contando em vez de respirando.

            Com o broto ali, é ele que infla: a mesma animação passa a ser
            alguém respirando junto, que é o que o exercício pede que ela faça.
            O número continua, menor e abaixo dele, para quem quiser conferir.

            Sem vaso e sem sombra de chão: ele não está pousado em nada aqui,
            está no meio do ar dentro de um disco. Uma sombra ali seria
            projetada por nada, e o vaso encheria o círculo de barro.
          */}
          <Sprout
            mood="leve"
            stage={2}
            size={92}
            showPot={false}
            /*
              Ele inspira de olho aberto e segura de olho fechado.

              Na inspiração ele acompanha olhando; no resto do ciclo fica na
              pose de quem respira. É a diferença entre um desenho que infla e
              alguém respirando junto.
            */
            pose={phase.motion === 'in' ? 'parado' : 'calmo'}
          />
          <Text
            style={{
              fontFamily: fonts.display.bold,
              fontSize: 30,
              color: colors.primaryStrong,
            }}
          >
            {left}
          </Text>
        </Animated.View>
      </View>

      <Text
        style={{
          fontFamily: fonts.display.bold,
          fontSize: 24,
          color: colors.textPrimary,
          textAlign: 'center',
        }}
      >
        {phase.label}
      </Text>

      <View style={{ width: '100%', gap: 6 }}>
        <Button
          variant="secondary"
          style={{ width: '100%' }}
          onPress={() => setPausado((x) => !x)}
        >
          {pausado ? 'Continuar' : 'Pausar'}
        </Button>
        <Button variant="ghost" style={{ width: '100%' }} onPress={onCancel}>
          Parar
        </Button>
      </View>
    </View>
  );
}
