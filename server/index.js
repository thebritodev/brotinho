import express from 'express';
import multer from 'multer';

import { getProvider } from './providers.js';

const PORT = process.env.PORT || 8787;
/** Áudio de desabafo é curto; 25 MB cobre com folga e evita upload abusivo. */
const MAX_BYTES = 25 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
});

const app = express();

app.get('/saude', (_req, res) => {
  try {
    const { name } = getProvider();
    res.json({ ok: true, provedor: name });
  } catch (error) {
    res.status(500).json({ ok: false, erro: error.message });
  }
});

/**
 * Sem isto, uma falha do multer (campo errado, arquivo grande demais) volta como
 * página HTML com stack trace — o app espera JSON, e a stack expõe caminhos do servidor.
 */
function comUpload(req, res, next) {
  upload.single('audio')(req, res, (error) => {
    if (!error) return next();

    const grande = error.code === 'LIMIT_FILE_SIZE';
    res.status(400).json({
      erro: grande
        ? `Áudio maior que o limite de ${Math.round(MAX_BYTES / 1024 / 1024)} MB.`
        : 'Envie o áudio no campo "audio" de um multipart.',
    });
  });
}

app.post('/transcrever', comUpload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: 'Envie o áudio no campo "audio" de um multipart.' });
  }

  try {
    const { transcribe } = getProvider();
    const text = await transcribe(
      req.file.buffer,
      req.file.originalname || 'audio.m4a',
      req.file.mimetype || 'audio/m4a',
    );

    // O app espera exatamente { text }.
    res.json({ text });
  } catch (error) {
    console.error('[transcrever] falhou:', error.message);
    res.status(502).json({ erro: error.message });
  }
});

// Rede de segurança: nada de stack trace em HTML escapando para o app.
app.use((error, _req, res, _next) => {
  console.error('[erro nao tratado]', error);
  res.status(500).json({ erro: 'Erro interno no servidor de transcrição.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Transcrição do Brotinho ouvindo em http://0.0.0.0:${PORT}`);
  console.log(`Confira a configuração em http://localhost:${PORT}/saude`);
});
