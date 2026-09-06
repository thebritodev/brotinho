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
import { pararEApagar } from '../../services/apagarGravacao';
import { relatar } from '../../services/diagnostico';
import { janelaDoSistema } from '../../services/janelaDoSistema';
import {
  criarConferidor,
  mesmaPalavra,
  palavraChave,
  palavras,
  palavrasDoAlvo,
  type Conferidor,
} from './casaFrase';

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

/**
 * Por quanto tempo um sinal de fala continua valendo, no modo por frase.
 *
 * ## Por que o tempo deixou de vir do volume
 *
 * O contador de segundos vinha inteiro do evento `volumechange`, e no aparelho
 * ele **nunca chega**. O motivo é o reconhecimento dentro do aparelho: a partir
 * do Android 13 o módulo usa `createOnDeviceSpeechRecognizer`, e esse
 * reconhecedor não reporta `onRmsChanged` — que é de onde o `volumechange`
 * nasce. Sem uma leitura sequer, `secs` ficava em zero para sempre: o relógio
 * não andava, a prática não tinha como terminar, e a tela dizia "Estou aqui,
 * ouvindo" enquanto a pessoa repetia a frase em voz alta sem nada acontecer.
 *
 * Medido no aparelho: numa sessão de 40 segundos falando, zero `volumechange`
 * e sete transcrições. O sinal existia; era só o outro.
 *
 * ## O que conta como fala agora
 *
 * Qualquer prova de que o reconhecedor está ouvindo alguém: uma transcrição
 * chegando, um `speechstart`, ou — onde ele existe — um `volumechange` audível.
 * O relógio anda enquanto houver prova recente, e para quando ela envelhece.
 *
 * Um segundo e meio é maior que a pausa entre duas palavras e menor que a
 * pausa entre duas repetições, então frase falada devagar continua contando e
 * silêncio de verdade para de contar.
 */
const MEMORIA_DA_VOZ_MS = 1500;

/**
 * Quantas vezes religar o reconhecimento antes de cair para o acústico.
 *
 * Uma sessão dura 30 a 40 segundos e o reconhecedor encerra depois de alguns
 * segundos de silêncio. Seis religadas cobrem uma prática inteira feita com
 * pausas longas, e ainda param rápido se o problema for outro.
 */
const MAX_REINICIOS = 6;

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
  /**
   * true depois que a sessão escolheu por onde vai escutar.
   *
   * Existe porque `porFrase` e `manual` são os dois falsos **antes** dessa
   * escolha — enquanto a permissão está sendo pedida, por exemplo. Sem isto,
   * quem olhasse só os dois concluiria "acústico" durante a espera.
   */
  running: boolean;
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
  /** Quantas leituras de volume chegaram — só para o diagnóstico. */
  const contouVolume = useRef(0);
  /** Quando chegou a última prova de que alguém está falando. */
  const ultimaVoz = useRef(0);
  /** Se este aparelho reporta volume. Onde reporta, o anel segue o volume. */
  const temVolume = useRef(false);
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

    // Para o gravador e apaga o arquivo que ele deixou no cache — ver o porquê
    // em `pararEApagar`.
    void pararEApagar(recorder);
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
      const permission = await janelaDoSistema(() =>
        AudioModule.requestRecordingPermissionsAsync(),
      );
      relatar('acustico-permissao', String(permission.granted));
      if (!permission.granted) {
        // Sem microfone a prática não precisa morrer: o botão manual assume.
        setManual(true);
        setRunning(true);
        return;
      }

      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      relatar('acustico-gravando');
      setManual(false);
      setRunning(true);
    } catch (erro) {
      relatar('acustico-quebrou', String(erro).slice(0, 80));
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
    relatar('frase-modulo', String(isNativeSpeechAvailable()));
    if (!alvo || !isNativeSpeechAvailable()) return false;
    const permitido = await requestSpeechPermissions();
    relatar('frase-permissao', String(permitido));
    if (!permitido) return false;

    conferidor.current = criarConferidor(alvo);

    // TEMPORARIO: para saber se a transcrição traz as palavras do alvo. São
    // contagens, nunca as palavras — nem as do alvo, nem as ditas.
    const alvoEmPalavras = palavrasDoAlvo(alvo);
    const chaveDoAlvo = palavraChave(alvoEmPalavras);
    let relatados = 0;

    let vivo = true;
    let reinicios = 0;
    const desistir = () => {
      if (!vivo) return;
      vivo = false;
      relatar('frase-desistiu');
      soltarEventos();
      stopNativeSpeech();
      void iniciarAcustico();
    };

    cancelamentos.current = [
      subscribeSpeech('result', (evento: { results?: { transcript?: string }[] }) => {
        const texto = evento?.results?.[0]?.transcript;
        // Transcrição chegando é a prova mais direta de que alguém está
        // falando — e é a única que este aparelho dá.
        if (texto) ultimaVoz.current = Date.now();
        if (!texto || !conferidor.current) return;
        const casou = conferidor.current.conferir(texto);

        if (relatados < 12) {
          relatados += 1;
          const ditas = palavras(texto);
          const acertadas = alvoEmPalavras.filter((alvoP) =>
            ditas.some((d) => mesmaPalavra(alvoP, d)),
          );
          relatar(
            'frase-acertos',
            `${acertadas.length}de${alvoEmPalavras.length}` +
              ` chave=${acertadas.includes(chaveDoAlvo) ? 1 : 0}` +
              ` minimo=${conferidor.current.minimo}` +
              ` ditas=${ditas.length} letras=${texto.length} rep=${casou}`,
          );
        }

        somarReps(casou);
      }),

      // O volume vem do próprio reconhecimento: dois donos para o mesmo
      // microfone dá conflito nas duas plataformas.
      subscribeSpeech('volumechange', (evento: { value?: number }) => {
        const v = evento?.value;
        contouVolume.current += 1;
        // Só as primeiras: uma a cada 150 ms encheria o registro do túnel.
        if (contouVolume.current <= 4) relatar('frase-volume', v == null ? 'nulo' : v.toFixed(2));
        if (v == null) return;
        temVolume.current = true;
        // A escala do módulo vai de -2 a 10, e abaixo de 0 é inaudível.
        const audivel = v > VOLUME_AUDIVEL;
        setLevel(Math.max(0, Math.min(1, v / 10)));
        // O relógio não anda mais daqui: onde este evento não existe, ele
        // ficava parado para sempre. Ver `MEMORIA_DA_VOZ_MS`.
        if (audivel) ultimaVoz.current = Date.now();
      }),

      // O reconhecedor avisa quando ouve alguém começar a falar. Nem todo
      // aparelho manda, então isto soma prova, não substitui as outras.
      subscribeSpeech('speechstart', () => {
        relatar('frase-fala-comecou');
        ultimaVoz.current = Date.now();
      }),
      subscribeSpeech('speechend', () => {
        relatar('frase-fala-terminou');
      }),

      subscribeSpeech('error', (evento: { error?: string }) => {
        /**
         * Nem todo erro significa que o reconhecimento não serve.
         *
         * `no-speech` é só silêncio — a pessoa pausou para respirar, ou parou
         * de falar antes de terminar. `aborted` é o próprio app encerrando.
         * Cair para o acústico nesses dois desligaria a conferência da frase
         * pelo motivo mais banal que existe numa prática que **tem** pausas.
         *
         * O resto — sem modelo offline, microfone ocupado, falha de captura —
         * é motivo real para desistir.
         */
        relatar('frase-erro', evento?.error ?? 'sem-codigo');
        if (evento?.error === 'no-speech' || evento?.error === 'aborted') return;
        desistir();
      }),
      subscribeSpeech('end', () => {
        if (machine.current.finished || !vivo) return;

        /**
         * O reconhecedor encerra sozinho depois de um tanto de silêncio, mesmo
         * com `continuous`. Numa prática que **tem** pausas — a pessoa respira,
         * pensa, se emociona — isso é rotina, não falha.
         *
         * Então religa em vez de desistir. Só depois de insistir algumas vezes
         * sem sucesso é que o acústico assume, para ninguém ficar preso num
         * ciclo de religar que nunca funciona.
         */
        reinicios += 1;
        relatar('frase-religou', reinicios);
        if (reinicios > MAX_REINICIOS) {
          desistir();
          return;
        }
        try {
          // A transcrição recomeça vazia, então o conferidor precisa recomeçar
          // junto: ele guarda até onde já contou, e esse índice não vale mais.
          conferidor.current = criarConferidor(alvo);
          startPhraseSpeech(alvo, INTERVALO_DO_VOLUME_MS);
        } catch {
          desistir();
        }
      }),
    ];

    try {
      startPhraseSpeech(alvo, INTERVALO_DO_VOLUME_MS);
      relatar('frase-comecou');
    } catch (erro) {
      relatar('frase-nao-comecou', String(erro).slice(0, 80));
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
    contouVolume.current = 0;
    temVolume.current = false;
    ultimaVoz.current = 0;
    relatar('sessao-comecou');

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
  /** Quantas leituras do medidor chegaram — só para o diagnóstico. */
  const contouMedidor = useRef(0);
  useEffect(() => {
    if (!running || manual || porFrase) return;

    const db = recorderState.metering;
    contouMedidor.current += 1;
    if (contouMedidor.current <= 4) relatar('medidor', db == null ? 'nulo' : db.toFixed(1));
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
  }, [running, manual, porFrase, recorderState.metering, recorderState.durationMillis, step]);

  /**
   * Modo por frase: o relógio anda enquanto houver prova recente de fala.
   *
   * Antes ele era movido pelo `volumechange`, que não existe no reconhecimento
   * dentro do aparelho — ver `MEMORIA_DA_VOZ_MS`. Aqui a batida é do app, e o
   * que ela pergunta a cada 100 ms é "houve prova de fala há pouco?".
   */
  useEffect(() => {
    if (!running || !porFrase) return;
    const id = setInterval(() => {
      const falando = Date.now() - ultimaVoz.current < MEMORIA_DA_VOZ_MS;
      // Onde o volume existe, o anel já segue o volume e não deve piscar por
      // cima disso. Onde não existe, ele ao menos reage à fala.
      if (!temVolume.current) setLevel(falando ? 0.55 : 0);
      acumular(falando, TICK / 1000);
    }, TICK);
    return () => clearInterval(id);
  }, [running, porFrase, acumular]);

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
    running,
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
