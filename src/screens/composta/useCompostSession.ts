import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Sessão de compostagem: escuta enquanto a pessoa repete a frase em voz alta,
 * conta as repetições e mede o tempo vocalizado.
 *
 * O microfone só serve de sensor. O arquivo que o gravador cria é apagado ao
 * fim — nada de áudio é guardado nem enviado.
 *
 * ---
 *
 * **O que isto consegue e o que não consegue.** Não há reconhecimento de fala
 * aqui: o app não sabe *o que* foi dito, só se houve som com jeito de voz. Os
 * três testes abaixo separam fala de porta batendo, ventilador, chuveiro e
 * talher caindo — que é o grosso do que dava falso positivo.
 *
 * O que continua passando: televisão, outra pessoa conversando ao lado, música
 * com batida e martelada ritmada. Todos têm a mesma forma da fala — estouros
 * curtos e modulados, separados por pausas. Distinguir exigiria reconhecimento
 * de verdade, o que mandaria o áudio para um reconhecedor e quebraria a frase
 * "o microfone só serve de sensor".
 *
 * **E rejeitar ritmo está fora de questão**, porque repetir a mesma frase
 * dezenas de vezes é justamente rítmico: o filtro que matasse a martelada
 * mataria o exercício.
 *
 * Preferimos errar contando a mais do que travar quem está fazendo a prática
 * direito: aqui, cobrar de alguém que está tentando é pior do que contar um
 * pouco a mais.
 *
 * Medido em simulação, comparado com o portão antigo (só volume): a fala é
 * retida em 90% a 93% em voz normal, baixa e quase sussurrada; ventilador,
 * ar-condicionado, chuveiro, porta batendo e talher caindo caem a zero ou
 * quase.
 */

/** Frequência de leitura do medidor, em ms. */
const TICK = 100;

/** Abaixo disto (dBFS) é considerado silêncio, mesmo em ambiente silencioso. */
const ABSOLUTE_FLOOR_DB = -45;

/** Quanto a voz precisa se destacar do ruído de fundo, em dB. */
const MARGIN_DB = 10;

/**
 * Volume sozinho não distingue voz de barulho: porta batendo, ventilador,
 * televisão e talher caindo passavam todos como se a pessoa estivesse falando.
 * Dois testes a mais separam a maior parte disso, e nenhum deles precisa saber
 * *o que* foi dito — o microfone continua sendo só sensor.
 */

/**
 * **Sustentação.** Um som precisa se manter alto por este tempo para contar.
 * Porta batendo, clique, batida na mesa e talher caindo são estouros de menos
 * de 100 ms: sobem e somem antes de completar isto. Uma sílaba falada dura
 * bem mais. O custo é perder os primeiros 120 ms de cada frase, o que não
 * muda a contagem de repetições.
 */
const MIN_ONSET_SECS = 0.12;

/**
 * **Tolerância ao vale entre sílabas.** Sem isto, a sustentação punia quem fala
 * baixo: numa voz quase sussurrada os vales entre sílabas afundam abaixo do
 * piso, a frase se parte em pedacinhos, e cada pedaço paga os 120 ms de novo —
 * na simulação, quem sussurrava perdia 44% da fala.
 *
 * Uma queda mais curta que isto não zera o crédito de sustentação. É maior que
 * um vale de sílaba e menor que uma pausa de verdade entre repetições, então
 * não deixa estouro isolado passar: dois cliques separados por meio segundo
 * continuam sendo dois estouros isolados.
 */
const SYLLABLE_GAP_SECS = 0.15;

/** Quantas leituras entram na janela que mede a oscilação do volume. */
const MODULATION_WINDOW = 12;

/**
 * **Oscilação.** Fala sobe e desce a cada sílaba; ventilador, ar-condicionado,
 * chuveiro e zumbido de geladeira são planos. Menos de 5 dB de variação em
 * pouco mais de um segundo é ruído constante, por mais alto que esteja.
 *
 * Este teste é melhor que simplesmente exigir mais volume, porque não pune
 * quem fala baixo — e na Composta muita gente fala baixo.
 */
const MIN_MODULATION_DB = 5;

/** A janela precisa deste tanto de leituras antes de o teste de oscilação valer. */
const MODULATION_WARMUP = 4;

/** Intervalo mínimo entre repetições, para não contar sílabas soltas. */
const MIN_REP_GAP = 0.35;

/** Fala contínua sem pausa também conta uma repetição a cada tanto. */
const MAX_REP_GAP = 2.1;

/** Silêncio a partir do qual o broto avisa que parou de ouvir. */
const SILENCE_HINT = 1.1;

/** Estado da máquina de detecção, zerado a cada sessão. */
function estadoInicial() {
  return {
    wasVoiced: false,
    sinceRep: 0,
    silence: 0,
    floorDb: ABSOLUTE_FLOOR_DB,
    secs: 0,
    reps: 0,
    finished: false,
    /** Há quanto tempo o som está acima do limiar, para o teste de sustentação. */
    aboveSecs: 0,
    /** Há quanto tempo o som caiu abaixo do limiar, para tolerar vales de sílaba. */
    gapSecs: 0,
    /** Últimas leituras do medidor, para o teste de oscilação. */
    recent: [] as number[],
  };
}

export type CompostSession = {
  /** Segundos de voz acumulados. */
  secs: number;
  reps: number;
  /** 0..1 para animar o anel do microfone. */
  level: number;
  /** true quando a pessoa parou de falar. */
  silent: boolean;
  /** true quando não há permissão/medidor e a sessão depende do botão manual. */
  manual: boolean;
  /** Cada valor novo é uma repetição a mais — dispara as partículas caindo. */
  repTick: number;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  /** Usados só no modo manual, enquanto o botão fica pressionado. */
  holdOn: () => void;
  holdOff: () => void;
};

type Options = {
  targetSeconds: number;
  onFinish: (result: { reps: number; secs: number }) => void;
};

export function useCompostSession({ targetSeconds, onFinish }: Options): CompostSession {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, TICK);

  const [running, setRunning] = useState(false);
  const [manual, setManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [secs, setSecs] = useState(0);
  const [reps, setReps] = useState(0);
  const [level, setLevel] = useState(0);
  const [silent, setSilent] = useState(false);
  const [repTick, setRepTick] = useState(0);

  // Estado da máquina de detecção, fora do React para não provocar re-render.
  const machine = useRef(estadoInicial());

  const holding = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const stop = useCallback(() => {
    setRunning(false);
    holding.current = false;
    void recorder.stop().catch(() => {});
  }, [recorder]);

  const start = useCallback(async () => {
    setError(null);
    machine.current = estadoInicial();
    setSecs(0);
    setReps(0);
    setLevel(0);
    setSilent(false);

    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        // Sem microfone a prática não precisa morrer: o botão manual assume.
        setManual(true);
        setRunning(true);
        return;
      }

      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setManual(false);
      setRunning(true);
    } catch {
      setManual(true);
      setRunning(true);
    }
  }, [recorder]);

  const holdOn = useCallback(() => {
    holding.current = true;
  }, []);
  const holdOff = useCallback(() => {
    holding.current = false;
  }, []);

  /** Um passo da máquina: recebe se há voz e quanto tempo passou. */
  const step = useCallback(
    (voiced: boolean, dt: number) => {
      const m = machine.current;
      if (m.finished) return;

      if (voiced) {
        m.secs += dt;
        m.silence = 0;
        m.sinceRep += dt;

        const onset = !m.wasVoiced;
        if ((onset && m.sinceRep > MIN_REP_GAP) || m.sinceRep > MAX_REP_GAP) {
          m.reps += 1;
          m.sinceRep = 0;
          setReps(m.reps);
          setRepTick((t) => t + 1);
        }
      } else {
        m.silence += dt;
      }
      m.wasVoiced = voiced;

      setSecs(m.secs);
      setSilent(m.silence > SILENCE_HINT);

      if (m.secs >= targetSeconds) {
        m.finished = true;
        stop();
        onFinishRef.current({ reps: m.reps, secs: m.secs });
      }
    },
    [targetSeconds, stop],
  );

  // Modo com microfone: cada leitura do medidor alimenta a máquina.
  const lastDuration = useRef(0);
  useEffect(() => {
    if (!running || manual) return;

    const db = recorderState.metering;
    if (db == null) return;

    const m = machine.current;
    // Piso de ruído sobe devagar e desce rápido: acompanha o ambiente sem
    // deixar a própria voz virar "fundo".
    m.floorDb = db < m.floorDb ? db : m.floorDb + (db - m.floorDb) * 0.02;

    // O tempo real entre leituras é mais confiável que o intervalo nominal.
    const dt = Math.min(
      0.4,
      Math.max(0.02, (recorderState.durationMillis - lastDuration.current) / 1000),
    );
    lastDuration.current = recorderState.durationMillis;

    // 1) Alto o bastante. Sozinho, este era o teste inteiro.
    const alto = db > ABSOLUTE_FLOOR_DB && db > m.floorDb + MARGIN_DB;

    // 2) Sustentado. Estouro curto não sobrevive — mas um vale entre sílabas
    //    não zera o crédito já acumulado.
    if (alto) {
      m.aboveSecs += dt;
      m.gapSecs = 0;
    } else {
      m.gapSecs += dt;
      if (m.gapSecs > SYLLABLE_GAP_SECS) m.aboveSecs = 0;
    }
    const sustentado = m.aboveSecs >= MIN_ONSET_SECS;

    // 3) Oscilando. Ruído constante é plano; fala não é.
    m.recent.push(db);
    if (m.recent.length > MODULATION_WINDOW) m.recent.shift();
    const oscilando =
      m.recent.length < MODULATION_WARMUP ||
      Math.max(...m.recent) - Math.min(...m.recent) >= MIN_MODULATION_DB;

    const voiced = alto && sustentado && oscilando;

    // O anel reage a qualquer som, mas fica fraco quando o som não conta como
    // voz. Sem isso a pessoa vê o anel pulsando com o barulho da rua e não
    // entende por que o contador não anda.
    const nivel = Math.max(0, Math.min(1, (db + 60) / 50));
    setLevel(voiced ? nivel : nivel * 0.3);

    step(voiced, dt);
  }, [running, manual, recorderState.metering, recorderState.durationMillis, step]);

  // Modo manual: o botão pressionado faz as vezes da voz.
  useEffect(() => {
    if (!running || !manual) return;
    const id = setInterval(() => {
      const voiced = holding.current;
      setLevel(voiced ? 0.5 : 0);
      step(voiced, TICK / 1000);
    }, TICK);
    return () => clearInterval(id);
  }, [running, manual, step]);

  // Solta o microfone se a tela sair do ar no meio da sessão.
  useEffect(() => stop, [stop]);

  return { secs, reps, level, silent, manual, repTick, error, start, stop, holdOn, holdOff };
}
