/**
 * Confere que a caixa do broto ainda cabe o broto.
 *
 * O desenho e a `viewBox` são duas descrições da mesma coisa, e nada obriga as
 * duas a concordarem. Escondendo o vaso, a caixa de sempre deixava um terço de
 * vazio embaixo e o broto aparecia pequeno; o recorte que eu escrevi à mão
 * para resolver isso cortava as folhas, que caem bem abaixo da boca do vaso.
 * Os dois defeitos passaram pelo typecheck, pelos 247 testes e por mim, e
 * quem viu foi quem estava usando o app.
 *
 * Agora a caixa é calculada das tabelas que desenham (`geometriaDoBroto`).
 * Isso conserta a deriva entre a caixa e as tabelas, mas não a deriva entre as
 * tabelas e o traço — a folha é um `d` de Bézier, escrito à parte. É esse vão
 * que este arquivo cobre.
 *
 * As quatro perguntas:
 *
 *   A. O casco da folha ainda é o `d` que o desenho usa?
 *   B. A caixa cabe tudo — folhas, bulbo, haste — em todos os estágios?
 *   C. O enquadramento com vaso cabe a planta e o vaso?
 *   D. O desenho ocupa a caixa, ou voltou a boiar dentro dela?
 *
 * A é a que importa: é o único lugar onde o desenho e as tabelas podem se
 * separar em silêncio. B e D refazem a conta por fora, a partir do `d` lido do
 * arquivo, para que um erro na função não se confirme sozinho.
 *
 * Uso: node scripts/confere-broto.js
 */

const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');
const SPROUT = path.join(RAIZ, 'src', 'components', 'brand', 'Sprout.tsx');

/** A proporção da moldura: `width={size} height={size * 1.12}`. */
const PROPORCAO_DA_MOLDURA = 1.12;

/** Abaixo disto o desenho está boiando na caixa de novo. */
const OCUPACAO_MINIMA = 0.6;

const falhas = [];
const linhas = [];

function confere(nome, ok, detalhe) {
  linhas.push(`  ${ok ? 'ok  ' : 'FALHA'}  ${nome}${detalhe ? `   ${detalhe}` : ''}`);
  if (!ok) falhas.push(nome);
}

/** Todos os números de um trecho, na ordem. */
function numeros(texto) {
  return (texto.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
}

/** Compila um módulo TS solto e o importa. */
async function carrega(relativo, nome) {
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'brotinho-broto-'));
  execFileSync(
    process.execPath,
    [
      path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc'),
      // `--rootDir` fixa a raiz da emissão: sem ele o TypeScript escolhe a
      // pasta comum entre os arquivos do grafo, e o caminho de saída muda
      // sozinho quando o módulo ganha um import novo.
      '--outDir', saida, '--rootDir', path.join(RAIZ, 'src'),
      '--module', 'esnext', '--target', 'es2020',
      '--moduleResolution', 'bundler', '--strict', '--skipLibCheck',
      // `--jsx` e `--esModuleInterop` entraram quando o módulo passou a
      // importar o tipo `Mood` do tema: um `import type` é apagado na emissão,
      // mas o TypeScript confere o grafo inteiro antes, e ali há `.tsx`.
      '--esModuleInterop', '--jsx', 'react-native',
      path.join(RAIZ, relativo),
    ],
    { stdio: 'inherit', cwd: RAIZ },
  );
  const alvo = path.join(saida, nome);
  return import('file://' + alvo.split(path.sep).join('/'));
}

async function main() {
  const fonte = fs.readFileSync(SPROUT, 'utf8');
  const g = await carrega(
    path.join('src', 'components', 'brand', 'geometriaDoBroto.ts'),
    path.join('components', 'brand', 'geometriaDoBroto.js'),
  );

  // --- A. o casco da folha é o `d` do desenho ---------------------------
  const daFolha = fonte.match(/d="(M0 0 C[^"]+)"/);
  confere('o desenho da folha foi encontrado', !!daFolha);
  if (!daFolha) return;

  // O `d` é todo absoluto e em pares x/y, então os números saem na ordem dos
  // pontos. O último par repete o primeiro, para fechar a curva.
  const brutos = numeros(daFolha[1]);
  const pontos = [];
  for (let i = 0; i + 1 < brutos.length; i += 2) pontos.push([brutos[i], brutos[i + 1]]);
  const semFecho = pontos.slice(0, -1);
  const casco = g.CASCO_DA_FOLHA.map((p) => `${p[0]},${p[1]}`).join(' ');
  const doTraco = semFecho.map((p) => `${p[0]},${p[1]}`).join(' ');
  confere(
    'CASCO_DA_FOLHA descreve o traço da folha',
    casco === doTraco,
    casco === doTraco ? `${semFecho.length} pontos` : `tabela [${casco}] · traço [${doTraco}]`,
  );

  // --- B e D. a caixa cabe tudo, e o desenho a ocupa --------------------
  const estagios = [1, 2, 3];
  for (const stage of estagios) {
    for (const enfeite of [false, true]) {
      const caixa = g.caixaDaPlanta(stage, enfeite);
      const cy = g.STEM_TOP_Y[stage] - 4;

      // Refaz os extremos por fora, do `d` lido do arquivo.
      let esq = Infinity;
      let dir = -Infinity;
      let cima = Infinity;
      let baixo = -Infinity;
      const conta = (x, y, m = 0) => {
        esq = Math.min(esq, x - m);
        dir = Math.max(dir, x + m);
        cima = Math.min(cima, y - m);
        baixo = Math.max(baixo, y + m);
      };
      conta(g.CX, g.POT_TOP_Y, g.TRACO_DA_HASTE / 2);
      conta(g.CX, g.STEM_TOP_Y[stage], g.TRACO_DA_HASTE / 2);
      conta(g.CX, cy, g.BULB_R[stage] + g.TRACO_DO_BULBO / 2);
      for (const f of g.LEAVES_BY_STAGE[stage]) {
        const rad = (f.rotate * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sen = Math.sin(rad);
        for (const [px, py] of semFecho) {
          const ex = px * f.scale;
          const ey = py * f.scale;
          conta(f.x + ex * cos - ey * sen, f.y + ex * sen + ey * cos, (g.TRACO_DA_FOLHA * f.scale) / 2);
        }
      }
      if (enfeite) {
        conta(g.CX - g.ENFEITES_ALCANCAM.esquerda, cy - g.ENFEITES_ALCANCAM.cima);
        conta(g.CX + g.ENFEITES_ALCANCAM.direita, cy + g.ENFEITES_ALCANCAM.baixo);
      }

      const folga = 0.01;
      const cabe =
        caixa.x <= esq + folga &&
        caixa.x + caixa.largura >= dir - folga &&
        caixa.y <= cima + folga &&
        caixa.y + caixa.altura >= baixo - folga;
      const rotulo = `estágio ${stage}${enfeite ? ' com enfeite' : ''}`;
      confere(
        `a caixa cabe o desenho — ${rotulo}`,
        cabe,
        cabe
          ? ''
          : `desenho x ${esq.toFixed(1)}..${dir.toFixed(1)} y ${cima.toFixed(1)}..${baixo.toFixed(1)} · ` +
            `caixa x ${caixa.x.toFixed(1)}..${(caixa.x + caixa.largura).toFixed(1)} ` +
            `y ${caixa.y.toFixed(1)}..${(caixa.y + caixa.altura).toFixed(1)}`,
      );

      // Quanto da largura pedida o desenho realmente usa. A moldura é mais
      // alta que larga, então quando a caixa é ainda mais alta é a altura que
      // manda, e sobra faixa dos lados.
      const escala = Math.min(1 / caixa.largura, PROPORCAO_DA_MOLDURA / caixa.altura);
      const ocupacao = (dir - esq) * escala;
      confere(
        `o desenho ocupa a moldura — ${rotulo}`,
        ocupacao >= OCUPACAO_MINIMA,
        `${(ocupacao * 100).toFixed(0)}% da largura (mínimo ${OCUPACAO_MINIMA * 100}%)`,
      );
    }
  }

  // --- G. ninguem guarda uma segunda copia dos rostos --------------------
  /*
    Havia duas tabelas de rosto — uma no Sprout, outra no MoodFace — e elas
    divergiram na primeira vez que alguem mexeu num rosto: o broto grande
    passou a sorrir de um jeito e a carinha da fileira de outro, na mesma tela.
    Agora ha uma so, em geometriaDoBroto. Este teste existe para a segunda nao
    voltar a nascer.
  */
  for (const arquivo of ['Sprout.tsx', 'MoodFace.tsx']) {
    const texto = fs.readFileSync(
      path.join(RAIZ, 'src', 'components', 'brand', arquivo),
      'utf8',
    );
    const temTabela = /const\s+FACES\s*(:|=)/.test(texto);
    confere(`${arquivo} nao guarda uma tabela de rostos propria`, !temTabela);
  }
  const rostos = Object.keys(g.CARAS);
  confere('CARAS cobre os seis humores', rostos.length === 6, rostos.join(', '));
  confere(
    'o feliz tem olho redondo, como os outros',
    g.CARAS.feliz.eye === 'circle',
    `olho: ${g.CARAS.feliz.eye}`,
  );

  // --- C. o enquadramento com vaso cabe a planta e o vaso ---------------
  const doVaso = fonte.match(/d="(M 62 170[^"]+)"/);
  confere('o desenho do vaso foi encontrado', !!doVaso);
  if (doVaso) {
    const v = numeros(doVaso[1]);
    let vasoBaixo = -Infinity;
    let vasoEsq = Infinity;
    let vasoDir = -Infinity;
    for (let i = 0; i + 1 < v.length; i += 2) {
      vasoEsq = Math.min(vasoEsq, v[i]);
      vasoDir = Math.max(vasoDir, v[i]);
      vasoBaixo = Math.max(vasoBaixo, v[i + 1]);
    }
    const traco = 3.5 / 2;
    const caixaComVaso = { x: 0, y: 0, largura: 200, altura: 224 };
    const maisAlto = Math.min(...estagios.map((s) => g.caixaDaPlanta(s, true).y));
    const cabe =
      maisAlto >= caixaComVaso.y &&
      vasoBaixo + traco <= caixaComVaso.altura &&
      vasoEsq - traco >= 0 &&
      vasoDir + traco <= caixaComVaso.largura;
    confere(
      'o enquadramento com vaso cabe planta e vaso',
      cabe,
      `planta começa em ${maisAlto.toFixed(1)} · vaso termina em ${(vasoBaixo + traco).toFixed(1)} de 224`,
    );

    // --- E. a transcricao do alcance do vaso ainda bate com o desenho -----
    const decl = g.VASO_ALCANCA;
    const rectVaso = fonte.match(/<Rect\s+x=\{58\}\s+y=\{156\}\s+width=\{84\}\s+height=\{15\}/);
    confere('o Rect da borda do vaso foi encontrado', !!rectVaso);
    const esq = Math.min(vasoEsq, 58) - traco;
    const dir = Math.max(vasoDir, 58 + 84) + traco;
    const bai = vasoBaixo + traco;
    const bate =
      Math.abs(decl.esquerda - esq) < 0.01 &&
      Math.abs(decl.direita - dir) < 0.01 &&
      Math.abs(decl.baixo - bai) < 0.01;
    confere(
      'VASO_ALCANCA descreve o vaso desenhado',
      bate,
      bate
        ? `${esq} .. ${dir}, fundo ${bai}`
        : `tabela ${decl.esquerda}/${decl.direita}/${decl.baixo} · traço ${esq}/${dir}/${bai}`,
    );

    // --- F. a caixa sem halo cabe planta e vaso, e rende mais desenho -----
    for (const stage of estagios) {
      const semHalo = g.caixaDoMascote(stage, false);
      const cabeTudo =
        semHalo.x <= esq + 0.01 &&
        semHalo.x + semHalo.largura >= dir - 0.01 &&
        semHalo.y + semHalo.altura >= bai - 0.01;
      confere(`a caixa sem halo cabe planta e vaso — estágio ${stage}`, cabeTudo);

      /*
        O desenho tem o MESMO tamanho nos dois enquadramentos; o que encolhe é
        o quadro.

        Este teste ja pediu o contrario. A primeira versao do recorte amarrava
        a altura do quadro e deixava o desenho crescer 65% no tema escuro —
        some o vazio, sim, e trocar de tema virava trocar de app. Quem usa
        pediu para subir o broto, nao para aumenta-lo, e o teste passou a
        cobrar isso.
      */
      /*
        A escala do desenho e sempre `size / 200`, venha de qual caixa vier.

        E o que faz o broto ter o mesmo tamanho em qualquer tela e em qualquer
        tema. Ja se perdeu uma vez: uma versao amarrou a altura do quadro e
        deixou o desenho crescer 65% no escuro — sumia o vazio, e trocar de
        tema virava trocar de app.
      */
      const medida = g.medidasDoMascote(semHalo, 200);
      const escala = medida.largura / semHalo.largura;
      confere(
        `a escala do desenho e a de referencia — estágio ${stage}`,
        Math.abs(escala - 200 / g.LARGURA_DE_REFERENCIA) < 0.001,
        `${escala.toFixed(3)} px por unidade`,
      );
      confere(
        `o quadro abraca o desenho, sem faixa vazia — estágio ${stage}`,
        medida.altura < 224 * 0.95,
        `${(100 - (medida.altura / 224) * 100).toFixed(0)}% mais baixo que o enquadramento antigo`,
      );
    }
  }
}

main()
  .then(() => {
    for (const l of linhas) console.log(l);
    console.log('');
    if (falhas.length) {
      console.log(`${falhas.length} falha(s) na caixa do broto.`);
      process.exit(1);
    }
    console.log(`${linhas.length} conferências · o broto cabe na caixa.`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
