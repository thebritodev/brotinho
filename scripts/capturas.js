/**
 * Gera as capturas de tela da App Store a partir do app rodando de verdade.
 *
 * A Apple exige 1242 × 2688 para o iPhone de 6,5 polegadas, e o aparelho de
 * teste aqui é Android — não existe iPhone nesta casa. A saída: abrir o app na
 * versão web, que é o mesmo código React Native, numa janela de 414 × 896 com
 * densidade 3. Isso dá exatamente 1242 × 2688, nítido, sem cursor e sem barra
 * de rolagem.
 *
 * O conteúdo semeado é neutro de propósito: frases plausíveis de diário, nunca
 * algo que possa ser lido como depoimento real de uma pessoa.
 *
 * Uso: node scripts/capturas.js   (com o Metro rodando em :8081)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ORIGEM = 'http://localhost:8081/';
const SAIDA = path.join(__dirname, '..', 'capturas');

/** 414 × 896 em pontos, densidade 3 → 1242 × 2688 em pixels. */
const LARGURA = 414;
const ALTURA = 896;
const DENSIDADE = 3;

/** Estado plausível: alguém que usa o app há umas três semanas. */
function estadoDeExemplo() {
  const dia = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(20, 30, 0, 0);
    return d;
  };
  const k = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const textos = [
    [1, 'Dia corrido, mas consegui parar dez minutos no fim da tarde. Ajudou mais do que eu esperava.'],
    [2, 'Fiquei remoendo a conversa de ontem. Escrever aqui tirou um peso das costas.'],
    [4, 'Dormi mal, acordei arrastado. Mesmo assim fui até o fim do dia.'],
    [6, 'Falei o que estava entalado e o mundo não acabou.'],
    [9, 'Hoje foi leve. Registrando para lembrar que dias assim existem.'],
    [12, 'Ansiedade forte de manhã. A respiração ajudou a passar.'],
    [15, 'Consegui pedir ajuda em vez de dar conta de tudo sozinho.'],
    [18, 'Primeiro dia aqui. Vamos ver no que dá.'],
  ];
  const humores = [
    [0, 'feliz'], [1, 'leve'], [2, 'ansioso'], [3, 'cansado'], [4, 'cansado'],
    [5, 'neutro'], [6, 'feliz'], [7, 'leve'], [9, 'feliz'], [10, 'leve'],
    [12, 'ansioso'], [13, 'neutro'], [15, 'leve'], [16, 'feliz'], [18, 'neutro'],
  ];

  return {
    profile: {
      name: 'Ana', checkin: 'Ansioso', tentou: ['Converso com alguém próximo'],
      valores: ['conexao', 'saude'], sleepTime: '23:00', reminder: '21:00',
      idade: null, genero: null, canal: null, plan: 'anual',
      subscribed: true, onboarded: true,
    },
    moodHistory: humores.map(([n, m]) => ({ date: k(dia(n)), mood: m })),
    journal: textos.map(([n, t], i) => ({ id: `j${i}`, createdAt: dia(n).getTime(), text: t })),
    composts: [
      { id: 'c1', createdAt: dia(2).getTime(), thought: 'não vou dar conta', reps: 12, secs: 34 },
      { id: 'c2', createdAt: dia(7).getTime(), thought: 'estou atrasado na vida', reps: 15, secs: 41 },
      { id: 'c3', createdAt: dia(13).getTime(), thought: 'não vou dar conta', reps: 11, secs: 31 },
    ],
    settings: { reminders: true, weeklySummary: true, appLock: false, analysis: true, vibracao: true, somDaRespiracao: true },
    startedAt: k(dia(18)),
    garden: [],
    practicesDone: [
      { topic: 'ansiedade', practice: 'respiracao-478', at: dia(1).getTime() },
      { topic: 'ansiedade', practice: 'respiracao-478', at: dia(4).getTime() },
      { topic: 'ansiedade', practice: 'respiracao-478', at: dia(12).getTime() },
      { topic: 'gratidao', practice: 'tres-coisas-boas', at: dia(6).getTime() },
      { topic: 'gratidao', practice: 'tres-coisas-boas', at: dia(9).getTime() },
      { topic: 'tristeza', practice: 'um-passo-pequeno', at: dia(15).getTime() },
    ],
    stageSeen: 3,
  };
}

/** Toca no primeiro elemento cujo rótulo de acessibilidade ou texto casar. */
/**
 * Toca no primeiro botão cujo rótulo case com **algum** dos alvos.
 *
 * Aceitar uma lista não é conveniência: metade dos rótulos deste app muda com
 * o estado de quem está usando. O resumo, por exemplo, se chama "Para minha
 * terapia" para quem marcou que faz terapia e "Um resumo do que você
 * registrou" para quem não marcou — e o estado semeado aqui é de alguém que
 * não marcou. O script pedia o primeiro rótulo, não achava, e a captura da
 * quinta tela parou de ser gerada sem ninguém reparar: os arquivos de agosto
 * seguiram no lugar, com cara de atuais.
 */
async function tocar(page, alvos) {
  const lista = Array.isArray(alvos) ? alvos : [alvos];
  const achou = await page.evaluate((ts) => {
    const bs = [...document.querySelectorAll('[role="button"], [role="tab"]')];
    const b = bs.find((x) => {
      const texto = x.getAttribute('aria-label') || x.innerText || '';
      return ts.some((t) => texto.includes(t));
    });
    if (!b) return false;
    b.click();
    return true;
  }, lista);
  if (!achou) throw new Error(`não encontrei nenhum de ${JSON.stringify(lista)} na tela`);
  await page.waitForTimeout(900);
}

async function capturar(page, nome) {
  fs.mkdirSync(SAIDA, { recursive: true });
  const arquivo = path.join(SAIDA, `${nome}.png`);
  await page.screenshot({ path: arquivo });
  console.log(`  ${nome}.png  ${LARGURA * DENSIDADE} × ${ALTURA * DENSIDADE}`);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: LARGURA, height: ALTURA },
    deviceScaleFactor: DENSIDADE,
  });

  console.log('abrindo o app…');
  await page.goto(ORIGEM, { waitUntil: 'networkidle', timeout: 180000 });

  // Semeia e recarrega, para o app hidratar já com o conteúdo.
  await page.evaluate((estado) => {
    localStorage.setItem('@brotinho/app-state-v1', JSON.stringify(estado));
  }, estadoDeExemplo());
  await page.reload({ waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(2500);

  console.log('capturando:');

  // 1. Home
  await capturar(page, '1-home');

  /*
    2. A Frase do dia, aberta.

    É a única captura tirada de um estado que exige interação: o cartão fechado
    não mostra a frase, de propósito, e um cartão fechado numa loja não vende
    nada. Aqui a flor já desabrochou — o tempo de espera é a animação inteira
    mais folga, senão a foto pega a cápsula no meio do caminho.
  */
  await tocar(page, 'Desenterrar a frase de hoje');
  await page.waitForTimeout(3400);
  await capturar(page, '2-frase-do-dia');
  await tocar(page, 'Fechar');
  await page.waitForTimeout(700);

  // 3. Composta, já em andamento não dá (precisa de microfone); a tela de
  //    entrada é a que explica a ideia, e é ela que vende o app.
  await tocar(page, 'Composta');
  await capturar(page, '3-composta');
  await tocar(page, 'Voltar');

  // 4. Diário
  await tocar(page, 'Diário');
  await capturar(page, '4-diario');

  // 5. Práticas
  await tocar(page, 'Início');
  await tocar(page, 'Práticas');
  await capturar(page, '5-praticas');
  await tocar(page, 'Voltar');

  // 6. Resumo para a terapia
  await tocar(page, 'Perfil');
  await tocar(page, ['Para minha terapia', 'Um resumo do que você registrou']);
  await capturar(page, '6-terapia');

  await browser.close();
  console.log(`\npronto — arquivos em ${SAIDA}`);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
