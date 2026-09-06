/**
 * Confere a distinção entre "a pessoa saiu do app" e "o app abriu uma janela
 * do sistema por cima de si mesmo".
 *
 * ## Por que este checador existe
 *
 * No Android as duas coisas chegam ao JavaScript como o mesmo evento:
 * `AppState` vira `background`. O `AppLockGate` tranca o diário nesse evento —
 * o que é certo quando a pessoa larga o celular, e errado quando o app acabou
 * de pedir o microfone.
 *
 * Errado a ponto de trancar a porta: tocar em "Começar a compostar" pedia a
 * permissão, a caixa do sistema pausava a atividade, o bloqueio caía por cima
 * da caixa, e a permissão nunca chegava a ser respondida. Desbloquear
 * remontava o app na tela inicial. Da segunda vez, a mesma coisa — a prática
 * não conseguia começar nenhuma vez.
 *
 * `janelaDoSistema` é o que separa os dois casos, e são três regras que
 * precisam valer ao mesmo tempo. As duas primeiras são o conserto; a terceira
 * é o buraco que o conserto poderia abrir e não abre.
 *
 * Uso: node scripts/testa-janela-do-sistema.js
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pastaTemporaria } = require('./pasta-temporaria');

const RAIZ = path.join(__dirname, '..');
const saida = pastaTemporaria('janela-do-sistema');

// O módulo só toca no `AppState` para saber se o app está na frente. Aqui isso
// vira um objeto que o teste controla, e nada mais do react-native é preciso.
const fonte = fs
  .readFileSync(path.join(RAIZ, 'src', 'services', 'janelaDoSistema.ts'), 'utf8')
  .replace("from 'react-native'", "from './react-native'");

fs.writeFileSync(path.join(saida, 'janelaDoSistema.ts'), fonte);
fs.writeFileSync(
  path.join(saida, 'react-native.ts'),
  'export const AppState: { currentState: string } = { currentState: "active" };\n',
);

execFileSync(
  process.execPath,
  [
    path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc'),
    '--module', 'commonjs',
    '--target', 'es2020',
    '--strict',
    '--skipLibCheck',
    path.join(saida, 'janelaDoSistema.ts'),
  ],
  { stdio: 'pipe', cwd: RAIZ },
);

const { AppState } = require(path.join(saida, 'react-native.js'));
const {
  janelaDoSistema,
  temJanelaDoSistema,
  aoFecharJanelaDoSistema,
} = require(path.join(saida, 'janelaDoSistema.js'));

const falhas = [];
const confere = (nome, condicao, detalhe) => {
  if (condicao) console.log(`  ok    ${nome}`);
  else {
    console.log(`  FALHA ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
    falhas.push(nome);
  }
};

/**
 * Espera o intervalo em que o módulo deixa o `AppState` assentar antes de
 * decidir se a pessoa saiu. Um pouco mais do que ele, para não medir a corrida.
 */
const assentar = () => new Promise((r) => setTimeout(r, 700));

/** Uma janela do sistema que fica aberta até o teste mandar fechar. */
function janelaAberta() {
  let fechar;
  const promessa = new Promise((resolve) => {
    fechar = resolve;
  });
  return { esperar: janelaDoSistema(() => promessa), fechar };
}

(async () => {
  // --- 1. Em repouso não há janela nenhuma --------------------------------
  confere('sem janela aberta, o background é a pessoa saindo', !temJanelaDoSistema());

  // --- 2. Enquanto a caixa está aberta, o background não é saída ----------
  {
    const janela = janelaAberta();
    confere('com a caixa aberta, o bloqueio não deve cair', temJanelaDoSistema());
    janela.fechar();
    await janela.esperar;
    confere('fechada a caixa, tudo volta ao normal', !temJanelaDoSistema());
  }

  // --- 3. Duas caixas encavaladas contam como um intervalo só -------------
  {
    // A Composta pede o microfone e a fala em seguida: a segunda abre antes de
    // a primeira terminar de fechar. Se cada uma contasse sozinha, o intervalo
    // "sem janela" entre elas deixaria o bloqueio cair no meio.
    const a = janelaAberta();
    const b = janelaAberta();
    a.fechar();
    await a.esperar;
    confere('com a segunda caixa ainda aberta, o intervalo continua', temJanelaDoSistema());
    b.fechar();
    await b.esperar;
    confere('só a última fechar encerra o intervalo', !temJanelaDoSistema());
  }

  // --- 4. Voltando para o app, o bloqueio NÃO cai ------------------------
  {
    let trancou = false;
    const soltar = aoFecharJanelaDoSistema(() => {
      trancou = true;
    });
    AppState.currentState = 'active';
    const janela = janelaAberta();
    janela.fechar();
    await janela.esperar;
    await assentar();
    soltar();
    confere('responder a permissão e continuar no app não tranca o diário', !trancou);
  }

  // --- 5. Saindo do app com a caixa aberta, o bloqueio CAI ---------------
  {
    // O buraco que a regra 2 abriria: sair do app de verdade enquanto a caixa
    // do sistema está na tela deixaria o diário destrancado para quem pegar o
    // celular depois.
    let trancou = false;
    const soltar = aoFecharJanelaDoSistema(() => {
      trancou = true;
    });
    AppState.currentState = 'background';
    const janela = janelaAberta();
    janela.fechar();
    await janela.esperar;
    await assentar();
    soltar();
    confere('sair do app com a caixa aberta tranca o diário', trancou);
    AppState.currentState = 'active';
  }

  // --- 6. Uma caixa que falha não deixa o intervalo aberto para sempre ---
  {
    // Sem o `finally`, um erro no meio do pedido de permissão deixaria o
    // contador preso acima de zero — e aí o bloqueio nunca mais cairia.
    await janelaDoSistema(async () => {
      throw new Error('a caixa quebrou');
    }).catch(() => {});
    confere('caixa que quebra não desliga o bloqueio para sempre', !temJanelaDoSistema());
  }

  // --- 7. Quem se desinscreve para de ser avisado ------------------------
  {
    let chamou = false;
    const soltar = aoFecharJanelaDoSistema(() => {
      chamou = true;
    });
    soltar();
    AppState.currentState = 'background';
    const janela = janelaAberta();
    janela.fechar();
    await janela.esperar;
    await assentar();
    confere('desinscrito não recebe mais aviso', !chamou);
    AppState.currentState = 'active';
  }

  // --- 8. A corrida do Android: o retorno chega antes do "ativo" ---------
  {
    /*
      O caso que quase passou despercebido. O Android resolve a promessa da
      permissão antes de marcar o app como ativo — então, no instante em que a
      caixa fecha, `currentState` ainda diz `background` para alguém que nunca
      saiu do app. Decidir ali retrancaria o diário a cada permissão
      concedida, que é exatamente o bug original de volta.
    */
    let trancou = false;
    const soltar = aoFecharJanelaDoSistema(() => {
      trancou = true;
    });
    AppState.currentState = 'background';
    const janela = janelaAberta();
    janela.fechar();
    await janela.esperar;
    /*
      O app volta para a frente **um pouco depois**, e é esse atraso que é a
      corrida. Marcá-lo aqui de forma síncrona não testaria nada: o módulo já
      leria `active` mesmo decidindo na hora.
    */
    setTimeout(() => {
      AppState.currentState = 'active';
    }, 150);
    await assentar();
    soltar();
    confere('o app voltando logo depois não conta como saída', !trancou);
  }

  // --- 9. O prompt do próprio bloqueio não dispara a rede ---------------
  {
    /*
      Quando o prompt de biometria abre, o diário já está trancado: não há o
      que a rede proteja. Avisar ali só criaria a chance de retrancar no
      instante seguinte a um desbloqueio bem-sucedido, num aparelho lento.
    */
    let trancou = false;
    const soltar = aoFecharJanelaDoSistema(() => {
      trancou = true;
    });
    AppState.currentState = 'background';
    await janelaDoSistema(async () => 'desbloqueado', { avisaAoFechar: false });
    await assentar();
    soltar();
    confere('o prompt do próprio bloqueio não retranca o diário', !trancou);
    AppState.currentState = 'active';
  }

  console.log(
    falhas.length ? `\n${falhas.length} falha(s)` : '\nO bloqueio distingue sair do app de responder o sistema.',
  );
  process.exit(falhas.length ? 1 : 0);
})();
