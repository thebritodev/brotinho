import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  isNativeSpeechAvailable,
  requestSpeechPermissions,
  startNativeSpeech,
  stopNativeSpeech,
  subscribeSpeech,
} from '../../services/speech';
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

  // Guardado em ref para os listeners nativos não precisarem ser reassinados
  // toda vez que o callback do componente muda de identidade.
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const [useNative] = useState(() => isNativeSpeechAvailable());

  // --- Eventos do reconhecimento nativo ---------------------------------

  useEffect(() => {
    if (!useNative) return;

    const off = [
      subscribeSpeech('result', (event: { results?: { transcript?: string }[] }) => {
        const transcript = event.results?.[0]?.transcript ?? '';
        if (!transcript) return;
        partialRef.current = transcript;
        setPartial(transcript);
      }),

      subscribeSpeech('end', () => {
        const finalText = partialRef.current.trim();
        partialRef.current = '';
        setPartial('');
        setState('idle');
        if (finalText) {
          setWasSimulated(false);
          onTextRef.current(finalText);
        }
      }),

      subscribeSpeech('error', (event: { error?: string }) => {
        partialRef.current = '';
        setPartial('');
        setState('idle');
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
  }, [useNative]);

  // --- Caminho de nuvem (Expo Go) ---------------------------------------

  const startCloud = useCallback(async () => {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
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
      /**
       * A gravação já cumpriu o papel dela. Deixá-la no cache guardaria a voz da
       * pessoa desabafando, sem que nada no app fosse usar aquilo de novo.
       *
       * No `finally` de propósito: precisa sumir mesmo quando a transcrição
       * falha, que é justamente quando ninguém lembraria de limpar.
       */
      try {
        if (recorder.uri) new File(recorder.uri).delete();
      } catch {
        // sem drama: é cache
      }
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
        partialRef.current = '';
        setPartial('');
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
