/**
 * Adaptadores de transcrição.
 *
 * Cada um recebe o áudio em memória e devolve o texto. Trocar de provedor é
 * mudar a variável TRANSCRIPTION_PROVIDER — o app não muda em nada.
 */

const LANGUAGE = 'pt';

/**
 * Groq e OpenAI expõem a mesma rota de transcrição, mudando só a base e o modelo.
 * O Groq tem camada gratuita e roda Whisper — é o caminho mais curto para testar.
 */
async function whisperCompativel({ buffer, filename, mimetype, base, key, keyName, model }) {
  if (!key) throw new Error(`Defina ${keyName} no .env do servidor.`);

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimetype }), filename);
  form.append('model', model);
  form.append('language', LANGUAGE);

  const response = await fetch(`${base}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`${base} respondeu ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.text;
}

/** Groq — camada gratuita, sem cartão. https://console.groq.com/keys */
async function groq(buffer, filename, mimetype) {
  return whisperCompativel({
    buffer,
    filename,
    mimetype,
    base: 'https://api.groq.com/openai/v1',
    key: process.env.GROQ_API_KEY,
    keyName: 'GROQ_API_KEY',
    model: process.env.GROQ_MODEL || 'whisper-large-v3-turbo',
  });
}

/** OpenAI — https://platform.openai.com/docs/api-reference/audio/createTranscription */
async function openai(buffer, filename, mimetype) {
  return whisperCompativel({
    buffer,
    filename,
    mimetype,
    base: 'https://api.openai.com/v1',
    key: process.env.OPENAI_API_KEY,
    keyName: 'OPENAI_API_KEY',
    model: process.env.OPENAI_MODEL || 'whisper-1',
  });
}

/** Deepgram — https://developers.deepgram.com/reference/listen-remote */
async function deepgram(buffer, _filename, mimetype) {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) throw new Error('Defina DEEPGRAM_API_KEY no .env do servidor.');

  const params = new URLSearchParams({
    model: process.env.DEEPGRAM_MODEL || 'nova-2',
    language: 'pt-BR',
    punctuate: 'true',
    smart_format: 'true',
  });

  const response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: 'POST',
    headers: { Authorization: `Token ${key}`, 'Content-Type': mimetype },
    body: buffer,
  });

  if (!response.ok) {
    throw new Error(`Deepgram respondeu ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';
}

/** Roda na própria máquina: sem chave, sem conta, sem o áudio sair daqui. */
async function local(buffer) {
  const { transcribeLocally } = await import('./localWhisper.js');
  return transcribeLocally(buffer);
}

const PROVIDERS = { local, groq, openai, deepgram };

export function getProvider() {
  const name = (process.env.TRANSCRIPTION_PROVIDER || 'local').toLowerCase();
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new Error(
      `Provedor "${name}" desconhecido. Use um destes: ${Object.keys(PROVIDERS).join(', ')}.`,
    );
  }
  return { name, transcribe: provider };
}
