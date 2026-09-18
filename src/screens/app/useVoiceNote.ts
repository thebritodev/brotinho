import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { janelaDoSistema } from '../../services/janelaDoSistema';
import { FALA_VAZIA, somarFala, textoDaFala } from '../../services/juntaFala';
import {
  isNativeSpeechAvailable,
  requestSpeechPermissions,
  startNativeSpeech,
  stopNativeSpeech,
  subscribeSpeech,
} from '../../services/speech';
import { pararEApagar } from '../../services/apagarGravacao';
import { transcribeAudio } from '../../services/transcription';

export type VoiceState = 'idle' | 'recording' | 'transcribing';

type Options = {
  /** Recebe o texto final para anexar ao registro. */
  onText: (text: string) => void;
};

/**
 * Transforma fala em texto.
 *
 * Caminho preferido: reconhecimento nativo do aparelho — instantâneo, gratuito
 * e o áudio não sai do celular. Onde o módulo nativo não existe (Expo Go), grava
 * com expo-audio e envia para o backend de transcrição.
 */
export function useVoiceNote({ onText }: Options) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [wasSimulated, setWasSimulated] = useState(false);
  /** Texto sendo reconhecido ao vivo, mostrado enquanto a pessoa fala. */
  const [partial, setPartial] = useState('');

  const partialRef = useRef('');

  /**
   * O ditado vem em pedaços, e eles precisam ser somados.
   *
   * Antes havia uma ref só, e cada evento **substituía** o texto. Em modo
   * contínuo o Android fecha um trecho a cada pausa e recomeça do zero no
   * seguinte — então falar, pausar e voltar a falar apagava tudo o que já
   * tinha sido dito.
   *
   * A regra de somar mora em `somarFala`, fora daqui, porque é ela que
   * estava errada e é ela que o `testa-junta-fala` percorre com a sequência
   * real de uma fala com pausa no meio.
   */
  const falaRef = useRef(FALA_VAZIA);

  /** Zera os dois de uma vez; esquecer um deixa fala velha na próxima gravação. */
  const limparFala = useCallback(() => {
    falaRef.current = FALA_VAZIA;
    partialRef.current = '';
    setPartial('');
  }, []);

  // Guardado em ref para os listeners nativos não precisarem ser reassinados
  // toda vez que o callback do componente muda de identidade.
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const [useNative] = useState(() => isNativeSpeechAvailable());

  // --- Eventos do reconhecimento nativo ---------------------------------

  useEffect(() => {
    if (!useNative) return;

    const off = [
      subscribeSpeech(
        'result',
        (event: { isFinal?: boolean; results?: { transcript?: string }[] }) => {
          const trecho = event.results?.[0]?.transcript ?? '';
          if (!trecho) return;

          falaRef.current = somarFala(falaRef.current, {
            isFinal: event.isFinal,
            trecho,
          });

          const tudo = textoDaFala(falaRef.current);
          partialRef.current = tudo;
          setPartial(tudo);
        },
      ),

      subscribeSpeech('end', () => {
        const finalText = partialRef.current.trim();
        limparFala();
        setState('idle');
        if (finalText) {
          setWasSimulated(false);
          onTextRef.current(finalText);
        }
      }),

      subscribeSpeech('error', (event: { error?: string }) => {
        /*
          O que já foi reconhecido é entregue mesmo quando o reconhecimento cai.

          Antes o parcial era jogado fora aqui: quem falava trinta segundos e
          via o reconhecedor morrer no meio — sem modelo do português, rede
          trocando, o sistema encerrando o serviço — perdia tudo, e a tela
          voltava vazia com um recado de erro. Perder o que a pessoa acabou de
          dizer num app de desabafo é o pior jeito de falhar.

          Vai para o texto pelo mesmo caminho do fim normal, então emenda no que
          já estava escrito. O aviso continua aparecendo: ela precisa saber que
          o resto não foi ouvido.
        */
        const atePonto = partialRef.current.trim();
        limparFala();
        setState('idle');
        if (atePonto) {
          setWasSimulated(false);
          onTextRef.current(atePonto);
        }
        // "no-speech" só significa que ninguém falou; não é falha digna de alarme.
        if (event.error === 'no-speech') return;

        /**
         * O ditado roda só dentro do aparelho, para o áudio não sair dele. Em
         * celular sem o pacote de voz do português instalado, isso falha com um
         * destes dois códigos — e é a falha mais provável de todas.
         *
         * Um código cru na tela não ajuda ninguém: a pessoa precisa saber que
         * não é defeito do app, que pode continuar escrevendo, e onde resolver
         * se quiser ditar.
         */
        if (event.error === 'service-not-allowed' || event.error === 'language-not-supported') {
          setError(
            'Este aparelho não tem o reconhecimento de voz em português para funcionar sem internet. ' +
              'Você pode escrever normalmente. Para ditar, instale o idioma nas configurações de voz do seu celular.',
          );
          return;
        }

        setError(`Não consegui entender o áudio (${event.error}).`);
      }),
    ];

    return () => off.forEach((cancel) => cancel());
  }, [useNative, limparFala]);

  // --- Caminho de nuvem (Expo Go) ---------------------------------------

  const startCloud = useCallback(async () => {
    const permission = await janelaDoSistema(() =>
      AudioModule.requestRecordingPermissionsAsync(),
    );
    if (!permission.granted) {
      setError('Preciso da sua permissão para usar o microfone.');
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setState('recording');
  }, [recorder]);

  const stopCloud = useCallback(async () => {
    setState('transcribing');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('A gravação saiu vazia.');

      const result = await transcribeAudio(uri);
      setWasSimulated(result.simulated);
      onText(result.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não consegui transcrever o áudio.');
    } finally {
      // No `finally` de propósito: a gravação precisa sumir mesmo quando a
      // transcrição falha, que é justamente quando ninguém lembraria de limpar.
      await pararEApagar(recorder);
      setState('idle');
    }
  }, [recorder, onText]);

  // --- Controle ---------------------------------------------------------

  const start = useCallback(async () => {
    setError(null);
    try {
      if (useNative) {
        const granted = await requestSpeechPermissions();
        if (!granted) {
          setError('Preciso da sua permissão para usar o microfone.');
          return;
        }
        limparFala();
        startNativeSpeech();
        setState('recording');
        return;
      }
      await startCloud();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não consegui iniciar a gravação.');
      setState('idle');
    }
  }, [useNative, startCloud]);

  const stop = useCallback(() => {
    if (useNative) {
      // O texto final chega pelo evento `end`.
      stopNativeSpeech();
      return;
    }
    void stopCloud();
  }, [useNative, stopCloud]);

  const toggle = useCallback(() => {
    if (state === 'transcribing') return;
    if (state === 'recording') stop();
    else void start();
  }, [state, start, stop]);

  return {
    state,
    error,
    wasSimulated,
    /** Texto parcial durante a fala; vazio no caminho de nuvem. */
    partial,
    /** null enquanto ainda descobrindo qual caminho usar. */
    usingNative: useNative,
    toggle,
    dismissError: () => setError(null),
  };
}
