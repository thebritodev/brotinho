# O tema escuro, e o que ele revelou

Feito em 29 de agosto de 2026. É a maior mudança já feita no projeto — 64
arquivos, 559 escritas de cor — e o mais útil dela não foi o tema em si: foi o
que só existia porque ninguém nunca tinha olhado o app com outra luz.

---

## Por que ele existia para ser feito

O app **sabe** que são três da manhã. Tem saudação de madrugada, pergunta "o que
está te mantendo acordado?", configuração de hora de dormir, e desde ontem uma
janela com céu noturno. E mostrava creme `#FBF6EC` assim mesmo.

Modo escuro é padrão na categoria — Daylio, MoodBox e Moody têm. Aqui a
incoerência era maior que a falta.

## A decisão que tornou tudo possível

**A paleta escura tem exatamente as mesmas chaves da clara.**

É o que permitiu não reescrever nenhuma das 559 escritas de cor: `palette.brown700`
continua sendo `palette.brown700`, e só muda de onde vem. Cada arquivo trocou a
linha de import por uma chamada de `useTema()`.

Os tipos são estruturais (`Palette`, `Cores`, `Sombras`) para garantir o que
importa: **cor esquecida na paleta escura não compila.**

## Não é a clara invertida

A identidade do Brotinho é papel creme. Papel à noite não vira carvão: vira
marrom quente sob um abajur. Todo fundo escuro tem a matiz do `brown900` — por
isso `#211E1A`, e não `#000000`. Preto puro deixaria o app parecendo outro
produto.

## O que a régua pegou, incluindo em mim

`scripts/confere-contraste.js` foi escrito **antes** das cores, para julgá-las.
As duas paletas passam nas 32 medições. Mas o caminho até lá ensinou mais que o
resultado:

- **A regra de cor de humor reprovava o tema claro nas seis.** O erro era da
  régua: aqueles tons se distinguem por **matiz**, e razão de contraste só
  enxerga luminosidade. Consertei o medidor, não a paleta — o contrário teria
  estragado um tema claro que funciona.
- **A da borda fina exigia 3,0** de um acabamento que não delimita controle
  nenhum. Ganhou piso próprio.

## O personagem não inverte

O primeiro resultado foi um broto **negativo de si mesmo**: cara escura com
contorno claro. A causa é que `brown900` quer dizer duas coisas opostas —
"a tinta mais escura que existe", que no escuro tem de virar quase branco, e
"o contorno do desenho", que não pode inverter sem descaracterizar o personagem.

→ `tracos`: as cores do desenho, iguais nos dois temas. E `paletteDoDesenho`,
que é o mesmo objeto que `palette` com outro nome — porque num arquivo migrado
`palette` muda com o tema, e numa ilustração ela precisa ficar parada. **Dois
significados no mesmo identificador foi exatamente a armadilha.**

O broto é o mesmo de dia e de noite. O que muda é a luz em volta: o halo, o
papel, o cartão embaixo da ilustração.

## As cores de humor: duas versões erradas antes desta

Foi o único ponto do tema que o usuário reprovou duas vezes, e as duas versões
erradas erraram no mesmo lugar — tratar **luminosidade** como a variável a
mexer.

1. **Escurecer o pastel.** Amarelo-claro escurecido vira oliva; verde-claro
   escurecido vira quase preto. A matiz é a única coisa que separa um humor do
   outro aqui, e é justamente ela que se perde no escurecer.
2. **Tom médio, saturação alta.** Resolveu a matiz e criou um problema maior.
   Ler cada cor sozinha dizia que estava tudo certo; o teste era olhar a tela
   inteira. Um mostarda saturado e três cinzas médios lado a lado não são os
   pastéis do Brotinho num tema diferente — são outra paleta, de outro
   aplicativo. **O tema escuro deixava de parecer o mesmo lugar.**

O que faltava é que **num fundo escuro o pastel não precisa mudar de faixa.**
Ele já contrasta: `bg` é `#211E1A`. Pastilha clara sobre marrom quase preto lê
alto, separa bem e continua sendo a mesma cor que a pessoa vê de dia. Cada
`moodColorsEscuros` é hoje o pastel claro com uns sete pontos a menos de
luminosidade e um pouco menos de saturação — o bastante para não acender a tela
de madrugada, longe de virar cor nova.

**A carinha volta à tinta escura nos dois temas.** Houve uma versão em que ela
seguia `textPrimary` porque as cores escuras eram escuras de verdade. Sobre
pastilha clara, tinta escura — como um rostinho desenhado a lápis.

### E aí veio a quarta versão, que era o problema de verdade

As três primeiras discutiam **qual tom**. A quarta descobriu que a pergunta
estava errada: a cor de humor faz **dois trabalhos opostos**, e nenhum tom
serve para os dois.

| como pastilha | como fundo |
|---|---|
| carinha, barra do gráfico, palavra escolhida | halo atrás do broto, disco do jardim, círculo da colheita |
| pequena, recebe tinta escura por cima | superfície grande, o desenho é que vai por cima |
| tem de ser **clara** | clara no escuro é **holofote** |

Enquanto os dois leram a mesma tabela, um dos dois ficou errado a cada ajuste —
com as cores escuras o jardim ficava sujo; com as claras, cada broto do jardim
ganhou um disco aceso atrás. **É o mesmo formato de armadilha do `brown900`:**
um nome, dois significados opostos. E a saída é a mesma de `tracos` — separar.

→ `moodColorsFundo`. No tema claro é literalmente `moodColors`, porque ali os
dois trabalhos coincidem: pastel sobre creme já é discreto. É no escuro que eles
se separam.

De quebra some o acoplamento: o halo era pintado com opacidade — 0,4, depois
0,18, depois 0,14 — perseguindo a cor de humor a cada mudança. Com cor de fundo
própria, ele volta a ser opacidade 1 nos dois temas, como qualquer superfície.

### A régua que faltava, e o piso que sobrou dela

Nenhuma das quatro versões falhava em `confere-contraste.js`, porque nenhuma era
pergunta de contraste de texto. A régua nova mede a cor de fundo contra a tela e
**só tem teto**: máximo 1,45.

O piso morreu no mesmo dia em que nasceu. Ele reprovava o amarelo e o creme do
tema claro — 1,06 e 1,07 — que se distinguem do fundo por **matiz**, e razão de
contraste só enxerga luminosidade. Terceira vez neste arquivo que uma régua de
luminância cobra demais de cor codificada por matiz; nas três, o consertado foi
o medidor.

O teto sobrevive porque a falha que ele pega é de luminosidade de verdade:
pastilha clara usada como superfície acende a tela escura, com qualquer matiz.
Medindo o defeito que o usuário reportou, ele dá **12,87** contra o teto de
1,45.

> Contraste mede se dá para ler. Não mede se parece o mesmo produto, nem se um
> nome está fazendo dois trabalhos.

## Três coisas ficam fora do tema, cada uma por um motivo

| O quê | Por quê |
|---|---|
| `ErrorBoundary` | É a tela de quando algo quebrou. Depender do tema para desenhá-la seria não conseguir desenhá-la justamente quando o tema for o que quebrou. |
| `WindowScene` | Já tem noite própria, pelo relógio de quem olha. Seguir o tema empilharia duas noites e tiraria o sentido de "o mundo lá fora agora". |
| O PDF da terapia | É feito para ser impresso e mostrado a outra pessoa. O tema dele é o de quem exportou, não o do leitor — e fundo preto gasta tinta. |

## Os 61 bugs que já existiam e ninguém via

Esta é a parte que vale mais que o tema.

**61 `<Text>` sem cor declarada.** O React Native não herda cor de `<View>`:
esses caem no preto padrão. No tema claro isso passa despercebido a vida
inteira — preto sobre creme é exatamente o que se queria, e ninguém nota que a
cor **nunca foi escolhida**. No escuro as mesmas frases somem no fundo.

Nem typecheck nem teste enxergam: o código está correto, o app compila, e a
frase simplesmente não está lá.

`scripts/confere-cor-do-texto.js` entrou na suíte para isso não voltar. Ele
também nasceu errado: a primeira versão exigia um caractere depois de `<Text`, e
deixou passar todas as tags de várias linhas — que são a maioria das grandes.
Achado medindo a cor computada **na tela**, não lendo o código.

**Nove brancos escritos à mão** (`'#fff'`). No claro estão certos, porque sempre
sobre verde escuro. No escuro o verde clareia e o branco em cima dele cai para
2,49 de contraste. Viraram `textInverse` e `surface`.

**A folha pautada do diário** era uma página branca acesa — a coisa mais clara
da tela, num app aberto de madrugada.

---

## O que ficou em aberto

**O gráfico de humor codifica emoção só por cor.** Quem não distingue matiz não
lê aquele gráfico, nos dois temas. Apareceu enquanto eu escrevia a régua de
contraste, e não é coisa que a régua resolva — precisaria de forma, rótulo ou
padrão além da cor.

**A passada em aparelho.** Tudo acima foi verificado no navegador, medindo cor
computada tela a tela. O celular ainda não viu.
