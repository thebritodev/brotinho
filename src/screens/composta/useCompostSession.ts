import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  isNativeSpeechAvailable,
  requestSpeechPermissions,
  startPhraseSpeech,
  stopNativeSpeech,
  subscribeSpeech,
} from '../../services/speech';
import { criarConferidor, type Conferidor } from './casaFrase';

/**
 * Sessão de compostagem: escuta enquanto a pessoa repete a frase em voz alta,
 * conta as repetições e mede o tempo vocalizado.
 *
 * Nada de áudio é guardado nem enviado.
 *
 * ---
 *
 * **Há dois modos, e o app cai do melhor para o pior sem avisar a pessoa.**
 *
 * **1. Por frase** — o preferido. O reconhecimento de fala do próprio aparelho
 * transcreve, e `casaFrase` confere se o que foi dito é mesmo o pensamento que
 * a pessoa escreveu. Falar outra coisa não conta. Roda **dentro do aparelho**
 * (`requiresOnDeviceRecognition`), porque aqui a pessoa está dizendo em voz alta
 * exatamente o que mais a machuca, e esse áudio não vai para servidor nenhum.
 *
 * **2. Acústico** — a rede de segurança. Vale quando não há módulo nativo (Expo
 * Go), quando falta permissão, ou quando o aparelho não tem o modelo do
 * português instalado. Não sabe *o que* foi dito, só se houve som com jeito de
 * voz, e usa três testes para separar fala de barulho:
 *
 * - **alto** — acima do piso de ruído
 * - **sustentado** — dura pelo menos 120 ms, o que mata porta batendo e clique
 * - **oscilando** — varia 5 dB, o que mata ventilador, chuveiro e ar-condicionado
 *
 * Medido em simulação contra o portão que existia antes (só volume): a fala é
 * retida em 90% a 93% em voz normal, baixa e sussurrada; ruído constante e
 * estouro isolado caem a zero ou quase. O que ainda passa é o que tem a forma
 * da fala — televisão, conversa ao lado, música com batida.
 *
 * **3. Manual** — o botão pressionado faz as vezes da voz, quando não há
 * microfone nenhum. A prática não morre por falta de sensor.
 *
 * Preferimos errar contando a mais do que travar quem está fazendo a prática
 * direito: cobrar de alguém que está tentando é pior do que contar a mais.
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

/** De quanto em quanto tempo o reconhecimento reporta o volume, em ms. */
const INTERVALO_DO_VOLUME_MS = 150;

/** Na escala do reconhecimento (-2 a 10), abaixo de zero é inaudível. */
const VOLUME_AUDIVEL = 0.5;

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
  /**
   * true quando o aparelho está conferindo a **frase**, não só o som. Muda o
   * que a tela promete: com isto ligado, falar outra coisa não conta.
   */
  porFrase: boolean;
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
  /** O pensamento que a pessoa escreveu — o alvo da conferência. */
  frase: string;
  onFinish: (result: { reps: number; secs: number }) => void;
};

export function useCompostSession({ targetSeconds, frase, onFinish }: Options): CompostSession {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, TICK);

  const [running, setRunning] = useState(false);
  const [manual, setManual] = useState(false);
  const [porFrase, setPorFrase] = useState(false);
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

  /** Conferidor da frase e cancelamentos dos eventos nativos, no modo por frase. */
  const conferidor = useRef<Conferidor | null>(null);
  const cancelamentos = useRef<(() => void)[]>([]);

  const soltarEventos = useCallback(() => {
    cancelamentos.current.forEach((c) => c());
    cancelamentos.current = [];
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    holding.current = false;
    soltarEventos();
    stopNativeSpeech();
    void recorder.stop().catch(() => {});
  }, [recorder, soltarEventos]);

  /**
   * Fecha a sessão quando o tempo de voz chega ao alvo. Os dois modos passam
   * por aqui, para o encerramento ser um só.
   */
  const acumular = useCallback(
    (audivel: boolean, dt: number) => {
      const m = machine.current;
      if (m.finished) return;

      if (audivel) {
        m.secs += dt;
        m.silence = 0;
      } else {
        m.silence += dt;
      }

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

  /** Soma repetições confirmadas pela frase. */
  const somarReps = useCallback((quantas: number) => {
    if (quantas <= 0) return;
    const m = machine.current;
    if (m.finished) return;
    m.reps += quantas;
    setReps(m.reps);
    setRepTick((t) => t + quantas);
  }, []);

  /** Caminho acústico: o gravador mede o volume e o portão decide. */
  const iniciarAcustico = useCallback(async () => {
    setPorFrase(false);
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

  /**
   * Caminho por frase: o reconhecimento do aparelho escuta, e só conta quando o
   * que foi dito é mesmo a frase escrita.
   *
   * Devolve `false` quando não dá para seguir por aqui — módulo ausente (é o
   * caso do Expo Go), permissão negada, ou o reconhecimento morrer na largada
   * por não haver modelo do português instalado no aparelho. Nesses casos quem
   * chama cai no acústico.
   */
  const iniciarPorFrase = useCallback(async (): Promise<boolean> => {
    const alvo = frase.trim();
    if (!alvo || !isNativeSpeechAvailable()) return false;
    if (!(await requestSpeechPermissions())) return false;

    conferidor.current = criarConferidor(alvo);

    let vivo = true;
    const desistir = () => {
      if (!vivo) return;
      vivo = false;
      soltarEventos();
      stopNativeSpeech();
      void iniciarAcustico();
    };

    cancelamentos.current = [
      subscribeSpeech('result', (evento: { results?: { transcript?: string }[] }) => {
        const texto = evento?.results?.[0]?.transcript;
        if (!texto || !conferidor.current) return;
        somarReps(conferidor.current.conferir(texto));
      }),

      // O volume vem do próprio reconhecimento: dois donos para o mesmo
      // microfone dá conflito nas duas plataformas.
      subscribeSpeech('volumechange', (evento: { value?: number }) => {
        const v = evento?.value;
        if (v == null) return;
        // A escala do módulo vai de -2 a 10, e abaixo de 0 é inaudível.
        const audivel = v > VOLUME_AUDIVEL;
        setLevel(Math.max(0, Math.min(1, v / 10)));
        acumular(audivel, INTERVALO_DO_VOLUME_MS / 1000);
      }),

      subscribeSpeech('error', desistir),
      subscribeSpeech('end', () => {
        // Fim natural com a sessão ainda rodando significa que o reconhecedor
        // desistiu sozinho; o acústico assume para ninguém ficar travado.
        if (!machine.current.finished) desistir();
      }),
    ];

    try {
      startPhraseSpeech(alvo, INTERVALO_DO_VOLUME_MS);
    } catch {
      soltarEventos();
      return false;
    }

    setManual(false);
    setPorFrase(true);
    setRunning(true);
    return true;
  }, [frase, acumular, somarReps, soltarEventos, iniciarAcustico]);

  const start = useCallback(async () => {
    setError(null);
    machine.current = estadoInicial();
    conferidor.current = null;
    soltarEventos();
    setSecs(0);
    setReps(0);
    setLevel(0);
    setSilent(false);

    if (await iniciarPorFrase()) return;
    await iniciarAcustico();
  }, [iniciarPorFrase, iniciarAcustico, soltarEventos]);

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

  return {
    secs,
    reps,
    level,
    silent,
    manual,
    porFrase,
    repTick,
    error,
    start,
    stop,
    holdOn,
    holdOff,
  };
}
