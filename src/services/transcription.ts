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
 * Quanto tempo esperar o servidor antes de desistir, em ms.
 *
 * Não havia limite nenhum. Com o backend fora do ar — que é o estado normal
 * dele, já que só roda na máquina de desenvolvimento — o `fetch` ficava
 * pendurado esperando o TCP estourar sozinho, o que no Android leva minutos.
 * A tela ficava em "Transcrevendo..." o tempo todo, sem erro e sem saída, e o
 * que a pessoa gravou não virava nada.
 *
 * Quarenta segundos é folgado para o que o app manda: o ditado do diário é de
 * segundos, e mesmo o Whisper local devolve bem antes disso. O que este número
 * corta não é transcrição lenta, é servidor que não vai responder.
 */
const TEMPO_LIMITE_MS = 40_000;

export type TranscriptionResult = {
  text: string;
  /** true quando veio do texto de exemplo, não de um serviço real. */
  simulated: boolean;
};

/**
 * "Network request failed" não diz nada sobre a causa. Esta sonda separa os dois
 * casos: servidor inalcançável (rede, IP errado, firewall) de servidor no ar
 * mas envio do áudio recusado.
 */
async function diagnoseFailure(original: unknown): Promise<string> {
  const detail = original instanceof Error ? original.message : String(original);

  let origin: string;
  try {
    origin = new URL(TRANSCRIPTION_ENDPOINT).origin;
  } catch {
    return `O endereço "${TRANSCRIPTION_ENDPOINT}" não é uma URL válida.`;
  }

  try {
    // Qualquer resposta, mesmo 404, prova que o servidor está acessível.
    await expoFetch(origin, { method: 'GET' });
    return `O servidor respondeu, mas o envio do áudio falhou (${detail}).`;
  } catch {
    return (
      `Não consegui alcançar ${origin}. Confira se o backend está rodando ` +
      `e se o celular está na mesma rede do computador.`
    );
  }
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

  let response: Response;
  /*
    O relógio precisa ser desarmado nos dois caminhos.

    Um `setTimeout` que sobrevive à resposta bem-sucedida aborta um controlador
    que já não interessa — inofensivo aqui — mas segura o temporizador vivo por
    quarenta segundos depois de a tela já ter seguido em frente. Daí o
    `finally`.
  */
  const cancelador = new AbortController();
  const relogio = setTimeout(() => cancelador.abort(), TEMPO_LIMITE_MS);
  try {
    const form = new FormData();
    // `expo/fetch` + `File` cuidam do multipart nativamente. Montar o FormData
    // à mão com `{ uri, name, type }` falha no Android com "Network request failed".
    form.append('audio', new File(uri) as unknown as Blob);

    response = (await expoFetch(TRANSCRIPTION_ENDPOINT, {
      method: 'POST',
      body: form,
      signal: cancelador.signal,
    })) as unknown as Response;
  } catch (error) {
    /*
      Desistir por tempo não é "a rede falhou": é o servidor não ter respondido.
      A sonda do `diagnoseFailure` faria mais uma requisição para descobrir algo
      que já se sabe, e ainda demoraria mais.
    */
    if (cancelador.signal.aborted) {
      throw new Error(
        `O servidor de transcrição não respondeu em ${TEMPO_LIMITE_MS / 1000} segundos. ` +
          'Confira se o backend está rodando. O que você falou não se perdeu — dá para escrever.',
      );
    }
    throw new Error(await diagnoseFailure(error));
  } finally {
    clearTimeout(relogio);
  }

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
