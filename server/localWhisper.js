import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { pipeline } from '@huggingface/transformers';
import ffmpegPath from 'ffmpeg-static';

/**
 * Transcrição rodando na própria máquina, sem chave nem serviço externo.
 *
 * O áudio chega em m4a/aac, é convertido pelo ffmpeg para PCM 16 kHz mono
 * (o formato que o Whisper espera) e passa por um modelo ONNX local.
 * Nada sai da máquina — nem o áudio, nem o texto.
 */

/**
 * `small` é o padrão por medição, não por palpite: num teste com 4 frases de
 * diário em português, `base` errou 12,5% das palavras e `small` acertou tudo,
 * custando só ~0,8s a mais por frase. Ver `bench.mjs`.
 */
const MODEL = process.env.LOCAL_WHISPER_MODEL || 'onnx-community/whisper-small';

const SAMPLE_RATE = 16000;

/**
 * Converte qualquer formato de entrada em amostras float32 mono a 16 kHz.
 *
 * A entrada vai por arquivo temporário, não por pipe: o contêiner MP4/M4A que o
 * app grava guarda o índice no fim do arquivo e exige seek para ser demuxado.
 * Num pipe o ffmpeg sai com código 0 e não produz áudio nenhum.
 */
async function decodeToPcm(buffer) {
  const tmpFile = path.join(os.tmpdir(), `brotinho-${randomUUID()}.audio`);
  await writeFile(tmpFile, buffer);

  try {
    return await runFfmpeg(tmpFile);
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

function runFfmpeg(inputPath) {
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath, [
      '-hide_banner',
      '-loglevel', 'error',
      '-i', inputPath,
      '-f', 'f32le',
      '-ac', '1',
      '-ar', String(SAMPLE_RATE),
      'pipe:1',
    ]);

    const chunks = [];
    let stderr = '';

    ff.stdout.on('data', (c) => chunks.push(c));
    ff.stderr.on('data', (c) => (stderr += c));
    ff.on('error', reject);

    ff.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg não conseguiu ler o áudio: ${stderr.trim() || `código ${code}`}`));
        return;
      }
      const raw = Buffer.concat(chunks);
      if (raw.length < 4) {
        reject(new Error('O áudio decodificado saiu vazio.'));
        return;
      }
      // Cópia para um ArrayBuffer novo: Float32Array exige alinhamento de 4 bytes,
      // que o buffer devolvido pelo concat não garante.
      const aligned = new ArrayBuffer(raw.length - (raw.length % 4));
      new Uint8Array(aligned).set(raw.subarray(0, aligned.byteLength));
      resolve(new Float32Array(aligned));
    });
  });
}

let transcriberPromise = null;

/**
 * Carrega o modelo uma vez. A primeira chamada baixa os pesos (algumas centenas
 * de MB) e fica em cache no disco; as seguintes são imediatas.
 */
export function loadModel() {
  if (!transcriberPromise) {
    console.log(`[whisper local] carregando ${MODEL} (a primeira vez baixa o modelo)...`);
    transcriberPromise = pipeline('automatic-speech-recognition', MODEL, { dtype: 'q8' })
      .then((t) => {
        console.log('[whisper local] modelo pronto.');
        return t;
      })
      .catch((error) => {
        // Sem isto, uma falha de download deixaria a promessa rejeitada em cache
        // para sempre e o servidor nunca mais tentaria.
        transcriberPromise = null;
        throw error;
      });
  }
  return transcriberPromise;
}

export async function transcribeLocally(buffer) {
  const [pcm, transcriber] = await Promise.all([decodeToPcm(buffer), loadModel()]);

  const segundos = pcm.length / SAMPLE_RATE;
  console.log(`[whisper local] transcrevendo ${segundos.toFixed(1)}s de áudio...`);

  const output = await transcriber(pcm, {
    language: 'pt',
    task: 'transcribe',
    // Áudios maiores que 30s precisam ser fatiados; a sobreposição evita cortar palavras.
    chunk_length_s: 30,
    stride_length_s: 5,
  });

  return (output?.text ?? '').trim();
}
