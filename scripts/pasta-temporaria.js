/**
 * A pasta onde um checador compila o TypeScript antes de ler o dado de verdade.
 *
 * Quase todo script de `npm run testa` faz a mesma coisa: cria uma pasta em
 * `%TEMP%`, manda o `tsc` emitir ali, importa o `.js` gerado e confere. O que
 * faltava era apagar a pasta.
 *
 * ## Por que `process.on('exit')` e não um `finally`
 *
 * Onze dos catorze já chamavam `fs.rmSync` — no meio do caminho feliz, depois
 * de conferir e antes de imprimir. Só que todo checador termina em
 * `process.exit(0)` ou `process.exit(1)`, e quem sai por baixo (um caso que
 * falhou, um `tsc` que não compilou, um `throw` no meio) pula a linha da
 * limpeza. Era exatamente esse o lixo que sobrava: uma pasta por execução que
 * deu errado.
 *
 * Os outros três não apagavam nada, e respondiam por 98 das 110 pastas que
 * havia em `%TEMP%` quando isto foi escrito.
 *
 * `exit` roda nos dois casos, inclusive depois de `process.exit`. Ele só aceita
 * trabalho síncrono — e `rmSync` é síncrono, então serve.
 *
 * ## A varredura do que ficou para trás
 *
 * Toda pasta nossa nasce com o prefixo `brotinho-`, e a varredura só olha para
 * esse prefixo e só para pastas mais velhas que um dia. Uma execução em
 * paralelo tem minutos de idade e nunca entra na conta; um `%TEMP%` de outra
 * pessoa não tem nada com esse nome. Assim o lixo antigo some sozinho, e se um
 * dia a limpeza voltar a falhar, ela falha por um dia só.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const PREFIXO = 'brotinho-';
const UM_DIA = 24 * 60 * 60 * 1000;

/** Apaga sem reclamar: limpeza que quebra a execução é pior que lixo. */
function apagar(pasta) {
  try {
    fs.rmSync(pasta, { recursive: true, force: true });
  } catch {
    // Arquivo travado por antivírus, permissão negada, pasta já removida por
    // outra execução. Nenhum destes é motivo para o checador falhar.
  }
}

function varrerAntigas() {
  const tmp = os.tmpdir();
  let entradas;
  try {
    entradas = fs.readdirSync(tmp, { withFileTypes: true });
  } catch {
    return;
  }
  const agora = Date.now();
  for (const e of entradas) {
    if (!e.isDirectory() || !e.name.startsWith(PREFIXO)) continue;
    const alvo = path.join(tmp, e.name);
    try {
      if (agora - fs.statSync(alvo).mtimeMs > UM_DIA) apagar(alvo);
    } catch {
      // Sumiu entre o `readdir` e o `stat`. Ótimo.
    }
  }
}

/**
 * Cria a pasta de trabalho do checador e garante que ela some no fim.
 *
 * @param {string} nome Sufixo curto que identifica o checador, sem o prefixo.
 * @returns {string} O caminho da pasta recém-criada.
 */
function pastaTemporaria(nome) {
  varrerAntigas();
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), `${PREFIXO}${nome}-`));
  process.on('exit', () => apagar(pasta));
  return pasta;
}

module.exports = { pastaTemporaria };
