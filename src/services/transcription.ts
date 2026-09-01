import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';

import { MOCK_TRANSCRIPTION } from '../data/content';

/**
 * Endpoint do seu backend de transcrição.
 *
 * A chave de API do serviço (Whisper, Deepgram...) **não pode ficar no app** —
 * qualquer pessoa consegue extrair strings de um APK. O app envia o áudio para
 * um endpoint seu, e o backend é quem guarda a chave e fala com o provedor.
 *
 * Defina em um `.env` na raiz do projeto:
 *   EXPO_PUBLIC_TRANSCRIPTION_URL=http://192.168.0.91:8787/transcrever
 *
 * Só vale em desenvolvimento — ver `isTranscriptionConfigured` logo abaixo.
 */
export const TRANSCRIPTION_ENDPOINT = process.env.EXPO_PUBLIC_TRANSCRIPTION_URL ?? '';

/**
 * O envio para servidor vale **apenas em desenvolvimento**.
 *
 * `EXPO_PUBLIC_*` é embutido no pacote na hora do build. Se a variável estiver
 * definida na máquina que gera a build da loja, o envio de áudio vai junto — e
 * aí a política de privacidade, a descrição na loja e o questionário da Apple
 * passam todos a afirmar algo falso, sem ninguém perceber.
 *
 * Depender de lembrar de limpar o `.env` antes de cada build é frágil demais
 * para uma promessa desse tamanho. O `__DEV__` transforma isso em garantia:
 * numa build de produção o áudio não tem para onde sair, mesmo que a variável
 * esteja lá.
 */
export const isTranscriptionConfigured = () => __DEV__ && TRANSCRIPTION_ENDPOINT.length > 0;

/**
 * Dois relógios, porque são duas esperas diferentes.
 *
 * Não havia relógio nenhum: com o backend fora do ar — que é o estado normal
 * dele, já que só roda na máquina de desenvolvimento — o `fetch` ficava
 * pendurado esperando o TCP estourar sozinho, o que no Android leva minutos.
 *
 * O primeiro conserto foi um limite só, de quarenta segundos, e não resolveu a
 * queixa: quarenta segundos parados em "Transcrevendo..." são indistinguíveis
 * de travado. Quem esperou desistiu antes de o erro chegar, com razão.
 *
 * A separação é o que faz diferença. **Alcançar** um servidor na rede local é
 * questão de milissegundos — ou ele está lá, ou não está, e três segundos já é
 * generoso. **Transcrever** é outra coisa: o Whisper local mastiga o áudio e
 * pode levar dezenas de segundos legitimamente.
 *
 * Então a sonda vem primeiro, e é ela que responde ao caso comum — servidor
 * desligado — em três segundos, com o motivo. O orçamento grande só começa a
 * contar depois de o servidor ter dado sinal de vida.
 */
const TEMPO_DA_SONDA_MS = 3_000;
const TEMPO_LIMITE_MS = 40_000;

/** `fetch` com prazo. Diz se voltou, se estourou o tempo, ou o que falhou. */
async function comPrazo(
  url: string,
  init: Parameters<typeof expoFetch>[1],
  prazoMs: number,
): Promise<{ resposta: Response | null; expirou: boolean; erro: unknown }> {
  const cancelador = new AbortController();
  const relogio = setTimeout(() => cancelador.abort(), prazoMs);
  try {
    const resposta = (await expoFetch(url, {
      ...init,
      signal: cancelador.signal,
    })) as unknown as Response;
    return { resposta, expirou: false, erro: null };
  } catch (erro) {
    return { resposta: null, expirou: cancelador.signal.aborted, erro };
  } finally {
    /*
      O relógio precisa ser desarmado nos dois caminhos: um `setTimeout` que
      sobrevive à resposta bem-sucedida segura o temporizador vivo pelo prazo
      inteiro depois de a tela já ter seguido em frente.
    */
    clearTimeout(relogio);
  }
}

export type TranscriptionResult = {
  text: string;
  /** true quando veio do texto de exemplo, não de um serviço real. */
  simulated: boolean;
};

/**
 * O servidor está de pé? Responde em até três segundos, ou desiste.
 *
 * Esta sonda existia como **diagnóstico**, e rodava depois do fracasso: o áudio
 * era enviado, a requisição pendurava, e só então se perguntava por quê. Isso
 * punha a espera longa exatamente no caso mais comum e mais fácil de detectar.
 *
 * Agora vem antes. Qualquer resposta serve, inclusive 404: o que se quer saber
 * é se há alguém escutando naquele endereço, não o que ele acha da rota.
 */
async function servidorNoAr(): Promise<{ ok: boolean; motivo: string }> {
  let origem: string;
  try {
    origem = new URL(TRANSCRIPTION_ENDPOINT).origin;
  } catch {
    return { ok: false, motivo: `O endereço "${TRANSCRIPTION_ENDPOINT}" não é uma URL válida.` };
  }

  const { resposta } = await comPrazo(origem, { method: 'GET' }, TEMPO_DA_SONDA_MS);
  if (resposta) return { ok: true, motivo: '' };

  return {
    ok: false,
    motivo:
      `Não consegui alcançar ${origem}. Confira se o backend está rodando e se ` +
      'o celular está na mesma rede do computador. O que você falou não se ' +
      'perdeu — dá para escrever.',
  };
}

/**
 * Envia o áudio para o backend. Espera-se um multipart com o campo `audio`
 * e uma resposta `{ "text": "..." }`.
 */
export async function transcribeAudio(uri: string): Promise<TranscriptionResult> {
  if (!isTranscriptionConfigured()) {
    /**
     * Fora do desenvolvimento, devolver o texto de exemplo seria escrever uma
     * frase inventada no diário da pessoa como se ela tivesse falado aquilo —
     * inclusive um sentimento que não é dela. Num diário, isso é pior do que
     * falhar. Então aqui falha, e falha dizendo o que aconteceu.
     */
    if (!__DEV__) {
      throw new Error(
        'O ditado por voz não está disponível neste aparelho. Você pode escrever normalmente.',
      );
    }
    return { text: MOCK_TRANSCRIPTION, simulated: true };
  }

  // Servidor desligado é o caso comum, e agora custa três segundos em vez de
  // quarenta — dizendo o motivo, em vez de só desistir.
  const sonda = await servidorNoAr();
  if (!sonda.ok) throw new Error(sonda.motivo);

  const form = new FormData();
  // `expo/fetch` + `File` cuidam do multipart nativamente. Montar o FormData
  // à mão com `{ uri, name, type }` falha no Android com "Network request failed".
  form.append('audio', new File(uri) as unknown as Blob);

  const envio = await comPrazo(
    TRANSCRIPTION_ENDPOINT,
    { method: 'POST', body: form },
    TEMPO_LIMITE_MS,
  );

  if (envio.expirou) {
    throw new Error(
      `O servidor respondeu, mas não terminou a transcrição em ${TEMPO_LIMITE_MS / 1000} ` +
        'segundos. O que você falou não se perdeu — dá para escrever.',
    );
  }
  if (!envio.resposta) {
    const detalhe = envio.erro instanceof Error ? envio.erro.message : String(envio.erro);
    // A sonda acabou de passar, então há alguém naquele endereço: o que falhou
    // foi o envio do áudio, e dizer "não consegui alcançar" aqui seria mentira.
    throw new Error(`O servidor está no ar, mas recusou o áudio (${detalhe}).`);
  }
  const response = envio.resposta;

  if (!response.ok) {
    let detail = `status ${response.status}`;
    try {
      const body = (await response.json()) as { erro?: string };
      if (body.erro) detail = body.erro;
    } catch {
      // resposta sem JSON; fica só o status
    }
    throw new Error(`O serviço de transcrição falhou: ${detail}`);
  }

  const data = (await response.json()) as { text?: string };
  if (!data.text) {
    throw new Error('O serviço de transcrição não devolveu texto.');
  }

  return { text: data.text, simulated: false };
}
