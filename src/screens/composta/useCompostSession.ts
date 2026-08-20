import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Sessão de compostagem: ouve a voz para confirmar que a pessoa está mesmo
 * repetindo a frase em voz alta, conta as repetições e mede o tempo vocalizado.
 *
 * O microfone só serve de sensor. O arquivo que o gravador cria é apagado ao
 * fim — nada de áudio é guardado nem enviado.
 */

/** Frequência de leitura do medidor, em ms. */
const TICK = 100;

/** Abaixo disto (dBFS) é considerado silêncio, mesmo em ambiente silencioso. */
const ABSOLUTE_FLOOR_DB = -45;

/** Quanto a voz precisa se destacar do ruído de fundo, em dB. */
const MARGIN_DB = 10;

/** Intervalo mínimo entre repetições, para não contar sílabas soltas. */
const MIN_REP_GAP = 0.35;

/** Fala contínua sem pausa também conta uma repetição a cada tanto. */
const MAX_REP_GAP = 2.1;

/** Silêncio a partir do qual o broto avisa que parou de ouvir. */
const SILENCE_HINT = 1.1;

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
  const machine = useRef({
    wasVoiced: false,
    sinceRep: 0,
    silence: 0,
    floorDb: ABSOLUTE_FLOOR_DB,
    secs: 0,
    reps: 0,
    finished: false,
  });

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
    machine.current = {
      wasVoiced: false,
      sinceRep: 0,
      silence: 0,
      floorDb: ABSOLUTE_FLOOR_DB,
      secs: 0,
      reps: 0,
      finished: false,
    };
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

    const voiced = db > ABSOLUTE_FLOOR_DB && db > m.floorDb + MARGIN_DB;
    setLevel(Math.max(0, Math.min(1, (db + 60) / 50)));

    // O tempo real entre leituras é mais confiável que o intervalo nominal.
    const dt = Math.min(
      0.4,
      Math.max(0.02, (recorderState.durationMillis - lastDuration.current) / 1000),
    );
    lastDuration.current = recorderState.durationMillis;

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
