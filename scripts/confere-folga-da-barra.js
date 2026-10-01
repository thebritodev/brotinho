/**
 * Confere que nenhuma tela de dentro das abas termina atrás da barra.
 *
 * ## A regra
 *
 * A barra das abas não é uma faixa colada no fim da tela: ela **sobe por
 * cima** do conteúdo o tanto do próprio canto arredondado — `POR_TRAS_DA_BARRA`
 * —, para que o que estiver rente a ela apareça atrás das duas curvas em vez
 * de um retângulo de fundo liso recortado ali.
 *
 * A consequência é a parte que escorrega: **quem rola precisa devolver essa
 * folga no fim**. Sem ela, o último item de cada tela para escondido atrás da
 * curva. Numa tela de ajustes isso é um cartão cortado pela metade; no guia de
 * uma prática era o botão "Parar", que é a única saída que a tela oferece.
 *
 * ## Por que um script, e não a revisão
 *
 * Porque o defeito não aparece em tela nenhuma enquanto o conteúdo é curto, e
 * aparece em todas assim que alguém acrescenta um parágrafo. Foram seis telas
 * de uma vez quando eu fui medir: Sobre, Meus dados, Meus valores pessoais, a
 * política de privacidade e os dois modos da prática. Nenhuma delas quebrava
 * nada — todas simplesmente terminavam por baixo da barra.
 *
 * O que ele mede é grosseiro de propósito: a tela cita a constante, ou não
 * cita. Conferir o valor exato exigiria executar o layout, e o erro que
 * acontece de verdade não é somar errado — é esquecer.
 *
 * ## Quem fica de fora, e por quê
 *
 * As telas que o app mostra **sem** a barra: o onboarding, a tela de boas
 * vindas, a chamada do plano e o bloqueio. Elas vivem fora das três pastas
 * que este script lê, e é essa a linha: `screens/app`, `screens/practices` e
 * `screens/composta` são o que a `MainTabs` empilha por cima das abas.
 *
 * Uso: node scripts/confere-folga-da-barra.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

/** As pastas cujas telas aparecem com a barra embaixo. */
const PASTAS = [
  path.join('src', 'screens', 'app'),
  path.join('src', 'screens', 'practices'),
  path.join('src', 'screens', 'composta'),
];

function arquivos(dir) {
  const achados = [];
  const cheio = path.join(RAIZ, dir);
  if (!fs.existsSync(cheio)) return achados;
  for (const nome of fs.readdirSync(cheio)) {
    const p = path.join(cheio, nome);
    if (fs.statSync(p).isDirectory()) {
      achados.push(...arquivos(path.join(dir, nome)));
    } else if (nome.endsWith('.tsx')) {
      achados.push(path.join(dir, nome));
    }
  }
  return achados;
}

console.log('— a folga da barra das abas —\n');

let lidos = 0;
const faltando = [];

for (const pasta of PASTAS) {
  for (const rel of arquivos(pasta)) {
    const texto = fs.readFileSync(path.join(RAIZ, rel), 'utf8');
    /*
      Só quem rola. Uma tela que não rola termina onde o `flex` manda, e a
      folga dela é problema do próprio layout — `StepGuide` e `BreathingGuide`
      são assim, e resolvem no `paddingBottom` do `View` raiz.
    */
    const rola = /<ScrollView/.test(texto);
    const guiaDeTelaCheia = /paddingBottom: \d+ \+ POR_TRAS_DA_BARRA/.test(texto);
    if (!rola && !guiaDeTelaCheia) continue;
    lidos += 1;
    if (!texto.includes('POR_TRAS_DA_BARRA')) faltando.push(rel);
  }
}

console.log(`${lidos} tela(s) conferida(s), ${faltando.length} sem folga`);
if (faltando.length) {
  console.log('');
  for (const f of faltando) {
    console.log(`  FALHA ${f}: rola e não devolve \`POR_TRAS_DA_BARRA\` no fim`);
  }
  console.log('');
  console.log('A barra sobe por cima do conteúdo; ver `POR_TRAS_DA_BARRA` em BottomNav.');
  process.exit(1);
}
console.log('nenhuma tela termina atrás da curva da barra.');
process.exit(0);
