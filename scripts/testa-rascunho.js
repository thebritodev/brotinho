/**
 * Confere o rascunho do onboarding.
 *
 * O rascunho existe para atravessar uma interrupção — ligação, falta de
 * memória, "só vou responder essa mensagem" — nos catorze passos em que a
 * pessoa escreve o pensamento que mais dói e faz o experimento da Composta.
 *
 * Duas coisas precisam ser verdade ao mesmo tempo, e só a primeira é óbvia:
 *
 * 1. **Guarda e devolve.** Senão não serviu para nada.
 * 2. **Some quando o onboarding termina.** Ele é uma cópia do texto mais
 *    sensível que a pessoa escreveu no app. Existir depois do fim seria uma
 *    segunda cópia esquecida no aparelho, fora de "apagar meus dados" — e
 *    "apagar meus dados" que deixa sobra não apagou.
 *
 * Uso: node scripts/testa-rascunho.js
 */

const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');

(async () => {
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'rascunho-'));
  const tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');

  try {
    execFileSync(
    process.execPath,
    [tsc, '--outDir', saida, '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck', '--jsx', 'react-jsx',
      // `__DEV__` é uma global que o Metro injeta; aqui o tsc não a conhece.
      // Compilar mesmo com o erro, que o próprio arquivo já trata em runtime.
      '--noEmitOnError', 'false',
      path.join(RAIZ, 'src', 'storage', 'appStorage.ts')],
    { stdio: 'pipe', cwd: RAIZ },
  );
  } catch {
    // Só o erro de `__DEV__`; o JavaScript foi gerado assim mesmo.
  }

  const arquivos = [];
  const pilha = [saida];
  while (pilha.length) {
    const dir = pilha.pop();
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) pilha.push(p);
      else if (e.name.endsWith('.js')) arquivos.push(p);
    }
  }
  for (const a of arquivos) {
    let corpo = fs.readFileSync(a, 'utf8');
    corpo = corpo.replace(/from ['"](\.[^'"]*?)['"]/g, (_, r) => {
      const destino = path.resolve(path.dirname(a), r);
      const ehPasta = fs.existsSync(destino) && fs.statSync(destino).isDirectory();
      return `from '${r}${ehPasta ? '/index.js' : '.js'}'`;
    });
    // O módulo de armazenamento é nativo; aqui ele vira um Map em memória.
    corpo = corpo.replace(
      /import AsyncStorage from '@react-native-async-storage\/async-storage';/,
      `const __m = new Map();
const AsyncStorage = {
  getItem: async (k) => (__m.has(k) ? __m.get(k) : null),
  setItem: async (k, v) => void __m.set(k, v),
  removeItem: async (k) => void __m.delete(k),
  multiRemove: async (ks) => ks.forEach((k) => __m.delete(k)),
  __dump: () => Array.from(__m.keys()),
};
globalThis.__asyncStorage = AsyncStorage;
globalThis.__DEV__ = false;`,
    );
    fs.writeFileSync(a, corpo);
  }

  const alvo = arquivos.find((a) => a.endsWith('appStorage.js'));
  const mod = await import('file://' + alvo.split(path.sep).join('/'));
  const { loadRascunho, saveRascunho, descartarRascunho, clearAppData, saveAppData } = mod;
  const store = globalThis.__asyncStorage;

  let falhas = 0;
  const checa = async (nome, fn) => {
    let veredito;
    try {
      veredito = (await fn()) || 'ok';
    } catch (e) {
      veredito = `LANÇOU  ${e.message}`;
    }
    if (veredito !== 'ok') falhas += 1;
    console.log(`  ${veredito === 'ok' ? 'ok   ' : 'FALHA'} ${nome.padEnd(46)} ${veredito}`);
  };

  const rascunho = {
    step: 9,
    draft: { name: 'Ana', checkin: 'ansioso', valores: ['conexao'], sleepTime: '23:00', tentou: ['terapia'], reminder: '21:00', plan: 'anual' },
    pensamento: 'não vou dar conta',
    repeticoes: 4,
  };

  await checa('sem rascunho gravado, devolve null', async () => {
    const r = await loadRascunho('onboarding');
    return r === null ? 'ok' : `devolveu ${JSON.stringify(r)}`;
  });

  await checa('guarda e devolve igual', async () => {
    await saveRascunho('onboarding', rascunho);
    const r = await loadRascunho('onboarding');
    return JSON.stringify(r) === JSON.stringify(rascunho) ? 'ok' : `veio ${JSON.stringify(r)}`;
  });

  await checa('o passo e o pensamento sobrevivem', async () => {
    const r = await loadRascunho('onboarding');
    if (r.step !== 9) return `passo ${r.step}`;
    if (r.pensamento !== 'não vou dar conta') return `pensamento "${r.pensamento}"`;
    return 'ok';
  });

  await checa('descartar apaga de verdade', async () => {
    await descartarRascunho('onboarding');
    const r = await loadRascunho('onboarding');
    return r === null ? 'ok' : 'sobrou rascunho';
  });

  await checa('não é a mesma chave do estado do app', async () => {
    await saveRascunho('onboarding', rascunho);
    await saveAppData({ journal: [], composts: [], garden: [], practicesDone: [], moodHistory: [] });
    const chaves = store.__dump();
    return chaves.length === 2 ? 'ok' : `chaves: ${chaves.join(', ')}`;
  });

  await checa('"apagar meus dados" leva o rascunho junto', async () => {
    await saveRascunho('onboarding', rascunho);
    await clearAppData();
    const r = await loadRascunho('onboarding');
    const chaves = store.__dump();
    if (r !== null) return 'o rascunho sobreviveu ao apagar tudo';
    return chaves.length === 0 ? 'ok' : `sobraram chaves: ${chaves.join(', ')}`;
  });

  await checa('rascunho corrompido não derruba a leitura', async () => {
    store.setItem('@brotinho/onboarding-rascunho-v1', '{isso não é json');
    const r = await loadRascunho('onboarding');
    return r === null ? 'ok' : `devolveu ${JSON.stringify(r)}`;
  });

  await checa('o rascunho do diário é independente do onboarding', async () => {
    await descartarRascunho('onboarding');
    await descartarRascunho('diario');
    await saveRascunho('diario', { text: 'hoje foi pesado' });
    const d = await loadRascunho('diario');
    const o = await loadRascunho('onboarding');
    if (o !== null) return 'o do onboarding apareceu';
    return d && d.text === 'hoje foi pesado' ? 'ok' : `veio ${JSON.stringify(d)}`;
  });

  await checa('salvar o registro descarta só o rascunho do diário', async () => {
    await saveRascunho('onboarding', rascunho);
    await saveRascunho('diario', { text: 'meio escrito' });
    await descartarRascunho('diario');
    const d = await loadRascunho('diario');
    const o = await loadRascunho('onboarding');
    if (d !== null) return 'o do diário sobreviveu';
    return o !== null ? 'ok' : 'levou o do onboarding junto';
  });

  await checa('"apagar meus dados" leva os dois rascunhos', async () => {
    await saveRascunho('onboarding', rascunho);
    await saveRascunho('diario', { text: 'meio escrito' });
    await clearAppData();
    const chaves = store.__dump();
    return chaves.length === 0 ? 'ok' : `sobraram: ${chaves.join(', ')}`;
  });

  fs.rmSync(saida, { recursive: true, force: true });
  console.log(`\n10 casos · ${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
