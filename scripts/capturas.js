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
    /*
      Alguém de três semanas já viu as boas-vindas e já abriu o jardim. Sem os
      dois, a Home da loja sairia com a dica "Toque em mim para ver seu
      jardim" — que é para quem acabou de chegar, não para a vitrine.
    */
    boasVindasVistas: true,
    jardimAberto: true,
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
/**
 * Toca numa **aba** da barra de baixo, pelo nome exato.
 *
 * `tocar` casa por `includes` em qualquer botão, e na tela inicial isso é uma
 * armadilha: "Brotinho" aparece em "Mexer com Brotinho" (o broto do cartão da
 * Composta, que só faz ele falar), em "Falar com Brotinho" e em "Avaliar o
 * Brotinho". O primeiro que casava era o errado, a aba não trocava, e a
 * captura "6-brotinho" saía sendo a grade de práticas — a mesma da captura
 * anterior. Ficou assim na ficha da App Store sem ninguém notar.
 *
 * Aqui só entram `role="tab"`, e o nome tem de bater inteiro.
 */
async function tocarNaAba(page, nome) {
  const achou = await page.evaluate((n) => {
    const abas = [...document.querySelectorAll('[role="tab"]')];
    const aba = abas.find((x) => (x.getAttribute('aria-label') || x.innerText || '').trim() === n);
    if (!aba) return false;
    aba.click();
    return true;
  }, nome);
  if (!achou) throw new Error(`não encontrei a aba "${nome}" na barra de baixo`);
  await page.waitForTimeout(1200);
}

/**
 * Espera um alvo de toque existir na tela, e devolve o rotulo dele.
 *
 * Existe por causa de uma captura que mentiu: a tela da frase do dia saiu
 * mostrando a tela inicial, porque o toque pegou outro botao e ninguem
 * conferiu. `tocar` so garante que **algum** elemento foi clicado — nao que a
 * tela esperada chegou.
 *
 * Aqui a regra e outra: se a prova nao aparecer no tempo, o script para. Uma
 * captura errada na loja e pior do que nenhuma, porque ela promete uma tela
 * que o app nao tem.
 */
async function esperarAlvo(page, rotulos, segundos = 8) {
  const lista = Array.isArray(rotulos) ? rotulos : [rotulos];
  for (let i = 0; i < segundos * 10; i += 1) {
    const achado = await page.evaluate((ts) => {
      const bs = [...document.querySelectorAll('[role="button"], [role="tab"]')];
      const b = bs.find((x) => {
        const t = (x.getAttribute('aria-label') || x.innerText || '').trim();
        return ts.some((alvo) => t.startsWith(alvo));
      });
      return b ? (b.getAttribute('aria-label') || b.innerText || '').trim() : null;
    }, lista);
    if (achado) return achado;
    await page.waitForTimeout(100);
  }
  throw new Error(`esperei ${segundos}s e ${JSON.stringify(lista)} não apareceu na tela`);
}

/** Toca num alvo cujo rotulo **comeca** com um dos textos dados. */
async function tocarExato(page, rotulos) {
  const lista = Array.isArray(rotulos) ? rotulos : [rotulos];
  const achou = await page.evaluate((ts) => {
    const bs = [...document.querySelectorAll('[role="button"], [role="tab"]')];
    const b = bs.find((x) => {
      const t = (x.getAttribute('aria-label') || x.innerText || '').trim();
      return ts.some((alvo) => t.startsWith(alvo));
    });
    if (!b) return false;
    b.click();
    return true;
  }, lista);
  if (!achou) throw new Error(`não encontrei nenhum de ${JSON.stringify(lista)}`);
  await page.waitForTimeout(600);
}

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

/**
 * Espera o instante em que só as duas primeiras palavras da frase estão no ar.
 *
 * As palavras são os textos do céu que se mexem: um `div` sem filhos, com
 * uma palavra só e uma transformação. A ordem delas no documento é a ordem da
 * frase, porque a faixa as desenha assim.
 */
async function esperarAsDuasPrimeiras(page) {
  const inicio = Date.now();
  while (Date.now() - inicio < 12000) {
    const pronto = await page.evaluate(() => {
      const palavras = [...document.querySelectorAll('div')].filter((d) => {
        if (d.children.length || !d.textContent || /\s/.test(d.textContent.trim())) return false;
        const estilo = getComputedStyle(d);
        return estilo.transform !== 'none' && parseFloat(estilo.fontSize) >= 20;
      });
      if (palavras.length < 3) return false;
      const op = palavras.map((p) => parseFloat(getComputedStyle(p).opacity));
      return op[0] > 0.9 && op[1] > 0.9 && op.slice(2).every((o) => o < 0.05);
    });
    if (pronto) return;
    await page.waitForTimeout(40);
  }
  throw new Error('a frase da Composta não chegou ao instante das duas primeiras palavras');
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

  /*
    Esconde o atalho de desenvolvimento antes de fotografar qualquer coisa.

    A versão web roda com `__DEV__` verdadeiro, então o botão "DEV · colher
    agora" — que existe para testar a escolha de espécie sem esperar vinte e um
    dias — desenha no meio da tela inicial. Ele saiu numa captura e foi parar a
    um passo da ficha da App Store.

    Esconder, e não remover: tirar um nó do documento por fora faz o React
    reclamar na próxima renderização. O identificador vem de `HomeScreen`, para
    os dois lados usarem o mesmo nome.
  */
  const ATALHO_DE_DEV = 'atalho-de-dev';
  await page.addStyleTag({ content: `#${ATALHO_DE_DEV} { display: none !important; }` });

  console.log('capturando:');

  /*
    1. Home, no instante em que a frase começa a se ler.

    A faixa da Composta derruba a frase do dia uma palavra por vez, em colunas
    diferentes. Fotografada num instante qualquer, ela mostrava "em" e
    "confia" soltos no céu — a terceira e a quarta palavras, que sozinhas não
    querem dizer nada. Numa loja isso lê como texto quebrado.

    Aqui a foto espera a hora em que só as **duas primeiras** estão no ar, e
    as duas já inteiras: é o começo da frase, na ordem, e o resto ainda por
    cair. Se esse instante não vier, o script para em vez de fotografar
    qualquer coisa — foi assim que a captura das práticas passou uma semana
    sendo a tela inicial repetida.
  */
  await esperarAsDuasPrimeiras(page);
  await capturar(page, '1-home');

  /*
    2. A Frase do dia, aberta.

    É a única captura tirada de um estado que exige interação: o cartão fechado
    não mostra a frase, de propósito, e um cartão fechado numa loja não vende
    nada. Aqui a flor já desabrochou — o tempo de espera é a animação inteira
    mais folga, senão a foto pega a cápsula no meio do caminho.
  */
  /*
    O rótulo muda conforme ela já leu a frase hoje ou não — "Desenterrar" na
    primeira vez, "Ler de novo" depois. Os dois abrem o mesmo cartão, e tentar
    só um dos dois é como a captura saiu errada da última vez.
  */
  await esperarAlvo(page, ['Desenterrar a frase', 'Ler a frase de hoje']);
  await tocarExato(page, ['Desenterrar a frase', 'Ler a frase de hoje']);
  /*
    A prova de que a frase apareceu.

    O cartão aberto traz "Guardar esta frase" e "Compartilhar", que não
    existem em lugar nenhum da tela fechada. Enquanto um deles não estiver na
    tela, a frase não está à mostra — e sem esta espera a foto saía da tela
    inicial com o canteiro ainda fechado, que foi o que o Pedro viu.

    Doze segundos porque a abertura leva mais de quatro e meio, medidos: a
    terra se abre, o papel sobe e a flor desabrocha, em sequência.
  */
  await esperarAlvo(page, ['Guardar esta frase', 'Tirar das guardadas'], 15);
  await page.waitForTimeout(1800);

  /*
    E a frase precisa estar **enquadrada**.

    O cartão abre dentro da tela inicial, que é longa: aberto, ele pode ficar
    abaixo da dobra, e a foto pegaria o topo da home de novo. Aqui a rolagem
    vai até ele antes do clique do obturador.
  */
  await page.evaluate(() => {
    const alvo = [...document.querySelectorAll('[role="button"]')].find((x) =>
      /Guardar esta frase|Tirar das guardadas/.test(x.getAttribute('aria-label') || ''),
    );
    if (!alvo) return;
    let rolador = alvo.parentElement;
    while (
      rolador &&
      !(rolador.scrollHeight > rolador.clientHeight + 40 && rolador.clientHeight > 300)
    ) {
      rolador = rolador.parentElement;
    }
    if (!rolador) return;
    /*
      O alvo da mira e o **cabecalho** da frase, nao o botao de guardar.

      Mirando no botao, o cartao acabava no pe da foto e o alto pegava o
      cartao de cima cortado no meio de uma palavra — "vou / demitido", que
      fora de contexto e so uma palavra ruim no topo de uma imagem de loja.
      Mirando no titulo e deixando um oitavo de tela acima dele, a frase fica
      no meio do quadro, que e onde o olho cai.
    */
    const titulo = [...rolador.querySelectorAll("div")].find(
      (d) => (d.innerText || "").trim().startsWith("A frase de hoje") && d.children.length <= 3,
    );
    const r = (titulo || alvo).getBoundingClientRect();
    const lim = rolador.getBoundingClientRect();
    rolador.scrollTop += r.top - lim.top - lim.height * 0.12;
  });
  await page.waitForTimeout(1200);
  await capturar(page, '2-frase-do-dia');
  /*
    E ela não fecha — a frase desenterrada fica aberta até o dia seguinte.

    Havia um `tocar(page, 'Fechar')` aqui, de quando o cartão tinha um botão de
    fechar. Ele saiu com a decisão de que desenterrar é por dia: `lendo` só é
    posto como verdadeiro, nunca como falso, e o rodapé passou a dizer
    "Desenterrada hoje. Amanhã vem outra.". O script seguiu pedindo o botão e
    **parava aqui** — por isso as capturas da terceira em diante eram as de
    agosto, com cara de atuais. É o mesmo tropeço que o comentário das práticas,
    logo abaixo, já contava uma vez.

    Não precisa fechar: o resto da tela inicial continua alcançável com ela
    aberta, e é de lá que sai o próximo toque.
  */
  await page.waitForTimeout(700);

  // 3. Composta, já em andamento não dá (precisa de microfone); a tela de
  //    entrada é a que explica a ideia, e é ela que vende o app.
  await tocar(page, 'Composta');
  await capturar(page, '3-composta');
  await tocar(page, 'Voltar');

  /*
    4. As práticas, que agora são a metade de baixo da tela inicial.

    Antes isto era a tela de Práticas, alcançada por um atalho. Com a lista dos
    treze temas na própria Home, a captura que mostra o tamanho do acervo é a
    Home rolada até ela — e de quebra mostra onde ela mora.
  */
  /*
    O título já foi "Práticas", depois "Práticas guiadas", e hoje é "Todas as
    práticas". Como a busca não achava nada e seguia em frente, a captura saía
    igual à da tela inicial, sem erro — por isso ela passa a parar quando não
    acha. Parou mesmo, três vezes seguidas, e é assim que se descobre que o
    rótulo mudou de novo.

    A lista aceita os três nomes: o script é para gerar capturas, não para
    exigir que o produto pare de evoluir. O que ele não pode é fotografar a
    tela errada em silêncio.
  */
  const TITULOS_DAS_PRATICAS = ['Todas as práticas', 'Práticas guiadas', 'Práticas'];
  const rolou = await page.evaluate((titulos) => {
    const alvo = [...document.querySelectorAll('div')].find(
      (d) => titulos.includes(d.innerText?.trim()),
    );
    alvo?.scrollIntoView({ block: 'start' });
    return Boolean(alvo);
  }, TITULOS_DAS_PRATICAS);
  if (!rolou) {
    throw new Error(`não achei nenhum de ${JSON.stringify(TITULOS_DAS_PRATICAS)} na tela inicial`);
  }
  await page.waitForTimeout(900);
  await capturar(page, '5-praticas');

  // 5. A aba do broto: o personagem, o humor e a régua do ciclo.
  await tocarNaAba(page, 'Brotinho');
  await capturar(page, '6-brotinho');

  /*
    6. O Diário, que mudou de lugar.

    Ele era o primeiro cartão do carrossel da tela inicial e virou o cartão de
    logo depois do humor, na aba do broto — por isso esta captura vem agora, e
    não lá em cima: o caminho até ele passa por esta aba.
  */
  await tocar(page, 'Diário');
  await capturar(page, '4-diario');
  await tocar(page, 'Voltar');

  // 7. Resumo para a terapia
  await tocarNaAba(page, 'Perfil');
  await tocar(page, ['Para minha terapia', 'Um resumo do que você registrou']);
  await capturar(page, '7-terapia');

  await browser.close();
  console.log(`\npronto — arquivos em ${SAIDA}`);
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});
