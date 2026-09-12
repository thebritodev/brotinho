# Brotinho — identidade visual para peças de redes sociais

Este arquivo é auto-suficiente: ele existe para ser colado numa conversa nova,
onde o trabalho é **refazer, com a identidade do Brotinho, artes de posts que
os concorrentes publicam**. Todos os valores aqui saíram do código do app em
12/09/2026 (`src/theme/tokens.ts`, `src/components/brand/*`), não de memória.

---

## 0. Instruções para quem vai desenhar

**O que fazer:** olhar a peça do concorrente como *estrutura* — o que ela
informa, em que ordem, com que hierarquia — e refazer aquela estrutura com a
paleta, a tipografia, o personagem e a voz descritos abaixo.

**O que nunca fazer:**

- Copiar texto, ilustração, ícone, mascote, paleta ou fonte do concorrente. A
  peça de referência é de outra empresa; o que se reaproveita é a ideia de
  comunicação, nunca o material.
- Prometer o que o Brotinho não faz. Se a peça original diz "reduza a
  ansiedade em 7 dias", isso não vira peça nossa — vira outra ideia, ou não
  vira nada.
- Reproduzir gamificação (ofensiva de dias, pontos, níveis, ranking), cobrança
  de ausência ("você faltou 3 dias"), afirmação médica ("trata", "cura",
  "diagnostica") ou promessa de resultado com número.

**Entregáveis:** SVG ou HTML nas medidas exatas da seção 9. Fontes pela Google
Fonts (link na seção 4). Tudo em português do Brasil.

---

## 1. O app, em cinco linhas

**Brotinho** é um app brasileiro de autocuidado e saúde mental. A pessoa marca
como está, escreve ou fala no diário, repete em voz alta o pensamento que a
incomoda ("Composta"), faz exercícios guiados e recebe uma frase por dia. Um
broto desenhado cresce conforme ela aparece e, aos 21 dias, vira uma planta
guardada no jardim.

**Quem usa:** adultos brasileiros. Muita gente **na cama, de madrugada**, e
uma parte em sofrimento agudo.

**A promessa central:** nada sai do aparelho. Não há conta, não há servidor, e
nem quem fez o app consegue ler o que ela escreve. É o principal diferencial
contra Daylio, Finch, Rosebud e Cíngulo — e é material de peça, não letra
miúda.

**O que ele não é:** tratamento, terapia, diagnóstico, nem produtividade.

---

## 2. A voz

- **Um amigo que repara nas coisas.** Nunca professor, nunca terapeuta, nunca
  técnico. O app fala **com** a pessoa, nunca **por** ela.
- Segunda pessoa ("você"), frases curtas, verbo no presente. Sem jargão de
  psicologia e sem palavra em inglês.
- **Nunca cobra ausência, nunca premia constância.** Fora "todos os dias",
  "não perca", "mantenha a sequência".
- **Toda frase de conselho entre aspas curvas:** “assim”, nunca "assim".
- Palavras que o app usa: desabafar, cuidar, ansiedade, insônia, autocuidado,
  respirar, registrar, compostar. Palavras proibidas: cura, tratamento,
  diagnóstico, garantido, comprovado, transforme sua vida.
- **Tema pesado:** se a peça encostar em suicídio ou automutilação, ou o tema
  sai, ou a peça leva a linha do CVV: *"CVV: 188, de graça, 24 horas."*
- O convite final de uma peça é sereno: "Se quiser começar, o Brotinho está
  ali." Nunca "baixe agora", nunca contagem regressiva, nunca medo.

---

## 3. Cores

### Papéis (o que usar para quê)

| papel | cor | observação |
|---|---|---|
| fundo claro (o "papel") | `#FBF6EC` | o fundo de quase toda peça clara |
| fundo escuro (o "papel à noite") | `#211E1A` | marrom quente, **nunca preto** |
| fundo verde profundo | `#2E4A3B` | o fundo dos cards de frase |
| cartão | `#FFFFFF` | sobre o papel creme |
| cartão fundo | `#F5EFDE` | segundo nível de superfície |
| texto principal | `#3A3630` | marrom quase preto, **nunca `#000`** |
| texto de apoio | `#716B60` | 4,9 de contraste no creme |
| tinta sobre verde | `#FBF6EC` | o creme virando tinta |
| verde de preencher | `#4C7B62` | fundo de botão, chave ligada |
| verde de escrever | `#3E6B54` | texto verde, ícone, número |
| verde suave | `#E3EDE6` | fundo de pastilha e de ícone |
| borda | `#D9D1BF` | 1,5 de espessura |
| luz / destaque quente | `#E8B65A` | o âmbar; texto âmbar legível é `#8A6318` |
| terracota | `#D98866` | **só o vaso e o telhado**; texto é `#AD512B` |

### A paleta inteira

```
verde     #2E4A3B  #3E6B54  #4C7B62  #5B8A72  #9EBBAA  #E3EDE6  #F1F6F2
creme     #FBF6EC  #F5EFDE  #EFE6CF
marrom    #3A3630  #5B5548  #716B60  #D9D1BF  #E9E2D2
âmbar     #E8B65A  #8A6318  #FBEFD4
terracota #D98866  #AD512B  #F7E2D8
azul      #A9C4D6  #DCE8F0        noite  #3E4A5C
lavanda   #B9AEC7  #E4DEE8
amarelo   #F2D680  #FCEFC7
ardósia   #AEB6BE  #D8DEE6
```

### Proporção

Numa peça, o creme (ou o verde profundo) ocupa quase tudo; o verde de escrever
é a tinta de ênfase; o âmbar aparece em um só lugar, como luz; o terracota só
existe se houver vaso. **Duas cores de destaque numa mesma peça já é uma
demais.**

### Cores de humor (as seis pastilhas)

| humor | cor |
|---|---|
| Feliz | `#FCEFC7` |
| Leve | `#E3EDE6` |
| Ansioso | `#DCE8F0` |
| Cansado | `#E4DEE8` |
| Triste | `#D8DEE6` |
| (ainda não disse) | `#F5EFDE` |

São claras de propósito: recebem tinta escura por cima. **Regra dura: humor
nunca é dito só pela cor** — vem sempre com a carinha ou com a palavra ao
lado, porque cor sozinha não existe para quem não distingue matiz.

### Para colar

```css
:root {
  --papel: #FBF6EC;  --papel-2: #F5EFDE;  --cartao: #FFFFFF;
  --tinta: #3A3630;  --tinta-2: #716B60;  --tinta-clara: #FBF6EC;
  --verde-fundo: #2E4A3B; --verde-escrever: #3E6B54; --verde-preencher: #4C7B62;
  --verde-folha: #5B8A72; --verde-suave: #E3EDE6;
  --borda: #D9D1BF;  --ambar: #E8B65A;  --terracota: #D98866;
  --noite: #211E1A;
}
```

---

## 4. Tipografia

- **Baloo 2** — títulos, números grandes, frases de efeito. É a voz da marca:
  arredondada e quente. Pesos em uso: 600, 700, 800.
- **Nunito** — corpo, rótulos, botões. Pesos 400, 600, 700, 800.

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&display=swap">
```

Escala do app (em pontos de tela), útil como proporção:

| uso | fonte | corpo | entrelinha |
|---|---|---|---|
| título grande | Baloo 2 Bold | 32 | 1,20 |
| título | Baloo 2 Bold | 24 | 1,25 |
| subtítulo | Baloo 2 SemiBold | 19 | 1,30 |
| corpo grande | Nunito Regular | 17 | 1,50 |
| corpo | Nunito Regular | 15 | 1,50 |
| legenda | Nunito Regular | 13 | 1,40 |
| rótulo | Nunito Bold | 13 | 1,20 |

Em peça de 1080 de largura, multiplique por cerca de 3: frase de story em
58–74, entrelinha 1,42 — é o número que o card do app usa.

**Regras:** a Baloo 2 ocupa bem mais que o corpo da fonte (a caixa natural
dela é 1,6 do corpo), então entrelinha abaixo de 1,2 corta o topo dos acentos
e o pé do "g". Caixa alta só em rótulo curto, com `letter-spacing: 0.08em`.
Frase de efeito pode ser centrada; parágrafo é alinhado à esquerda, com no
máximo 65 caracteres por linha.

---

## 5. Forma, luz e textura

- **Raios:** 10 (pastilha pequena), 14 (chip), **18 (cartão — o mais
  frequente)**, 28 (folha grande), 999 (pílula). O botão tem raio próprio: 16.
- **Borda:** 1,5 em `#D9D1BF`.
- **Cartão sobre papel:** branco, com **anel de luz por dentro** da borda
  (`inset 0 0 0 1px rgba(255,255,255,0.9)`) e sombra **longa e recolhida**
  (`0 16px 32px -20px rgba(58,54,48,0.6)`). O anel é o que dá o aspecto de
  vidro; a sombra cai longe do cartão sem virar mancha em volta dele.
- **Grão de papel:** uma textura de ruído por cima de tudo, a **5,5% de
  opacidade em `multiply`** no claro (3% em `screen` no escuro). É o que
  impede o creme de parecer plástico.
- **Luz de estufa:** um halo radial atrás do broto, do centro para fora:
  `#FFFCF0` 0,95 → `#FCEFC7` 0,72 → `#FCEFC7` 0,2 → transparente. O diâmetro é
  igual à altura do desenho, não uma fração inventada dela.
- **Manchas de tinta** (no fundo verde): três círculos de creme quase
  invisíveis, em (22%, 24%) raio 52%, (84%, 62%) raio 46% e (50%, 95%) raio
  55%, com opacidade 0,05 / 0,04 / 0,035.

---

## 6. O personagem: o broto

### Anatomia

Vaso de terracota com borda, caule, folhas e um **bulbo redondo com carinha**.
Três estágios de crescimento. Desenho em `viewBox="0 0 200 224"`, centro em
x = 100, boca do vaso em y = 168.

| estágio | topo do caule (y) | raio do bulbo | folhas |
|---|---|---|---|
| 1 | 142 | 20 | 2 pequenas |
| 2 | 124 | 27 | 3 |
| 3 | 106 | 33 | 4 |

### Cores do desenho (as mesmas no tema claro e no escuro — é regra)

```
contorno geral   #3A3630   espessura 2,2 (folha e bulbo)
contorno folha   #2E4A3B
caule            #3E6B54   espessura 3,6
folha            gradiente vertical  #7E9E87 → #5F7F69
bulbo            radial em (34%, 28%)  #C6DACB → #A9C0B0 → #87A493
vaso             linear diagonal  #D0906E → #C08363 → #A26B4F
luz da borda     #FFFFFF a 30%
terra            #4A3323 a 28%
bochecha         #D98866
```

### Formas exatas

```
vaso    M 62 170 C 62 166 66 164 70 164 L 130 164 C 134 164 138 166 138 170
        L 128 210 C 127 216 121 220 113 220 L 87 220 C 79 220 73 216 72 210 Z
borda   retângulo x 58, y 156, largura 84, altura 15, raio 7,5
folha   M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z
nervura M -2 -2 C -12 -9 -22 -15 -31 -18
sombra  elipse cx 100, cy 206,6, rx 46,9, ry 5,8 — radial do contorno a 20% → 0
```

As folhas ficam em `translate(100, y) rotate(g) scale(s)`. No estágio 3:
(y 154, −40°, 1,0), (y 154, 220°, 0,95), (y 128, −10°, 0,8) e
(y 128, 190°, 0,75).

### As seis carinhas (dentro do bulbo, origem no centro dele)

```
feliz    olhos círculo r 2,6   boca M -10 5 Q 0 14 10 5
leve     olhos círculo r 2,6   boca M -8 6 Q 0 11 8 6
ansioso  olhos círculo r 3,2   boca M -6 8 Q -3 5 0 8 Q 3 11 6 8
triste   olhos círculo r 2,6   boca M -9 9 Q 0 2 9 9
cansado  olhos M -9 -1 L -2 -1 (traço)   boca M -7 7 L 7 7
neutro   olhos círculo r 2,4   boca M -7 7 L 7 7
```

### Regras do personagem

1. **Não inverte com o tema** e não muda de cor por humor.
2. **Nada de disco colorido atrás dele.** O fundo do broto é o papel, com o
   halo de luz. Seis versões de disco colorido foram testadas e nenhuma parou
   de pé.
3. A **expressão acompanha a mensagem**: peça sobre noite mal dormida usa a
   carinha cansada, não a feliz. Carinha alegre em peça sobre ansiedade é
   desonesta.
4. Ele **não ganha**: não sobe de nível, não recebe medalha nem confete.
5. Sem braços, sem pernas, sem óculos, sem chapéu. Os únicos adereços que
   existem são cinco enfeites do jardim (criatividade, curiosidade,
   autocuidado, conexão, coragem).
6. O traço é fino de propósito (2,2). Traço grosso faz o desenho parecer
   brinquedo, e o app é sóbrio, não fofo.

---

## 7. A marca

São **duas** marcas, e elas não se substituem:

1. **O ícone da loja** — quadrado de 1024, fundo terracota `#D98866` com o
   broto inteiro desenhado (bulbo com carinha e folhas, seção 6). É o que a
   pessoa reconhece da App Store, então **é ele que aparece quando a peça
   precisa dizer "este app"** — no convite final de um carrossel, por exemplo.
2. **O símbolo de interface** — o disco verde abaixo, usado dentro do app.
   Serve como selo pequeno numa peça, no canto ou ao lado do nome.

### Símbolo

Disco verde `#5B8A72` com traço creme `#FBF6EC`: um anel (a cabeça), duas
elipses inclinadas (as folhas) e um caule.

```svg
<svg viewBox="0 0 100 100" width="96" height="96" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="49" fill="#5B8A72"/>
  <g transform="translate(50 50) scale(0.76) translate(-50 -52.4)">
    <ellipse cx="30.5" cy="63.5" rx="18" ry="10.8" transform="rotate(-38 30.5 63.5)"
             fill="none" stroke="#FBF6EC" stroke-width="8.8"/>
    <ellipse cx="69.5" cy="63.5" rx="18" ry="10.8" transform="rotate(38 69.5 63.5)"
             fill="none" stroke="#FBF6EC" stroke-width="8.8"/>
    <circle cx="50" cy="28.3" r="16.5" fill="none" stroke="#FBF6EC" stroke-width="8.8"/>
    <path d="M 50 32 L 50 93" fill="none" stroke="#FBF6EC" stroke-width="5.1"
          stroke-linecap="round"/>
  </g>
</svg>
```

### Nome

"Brotinho" em **Baloo 2 Bold**. Sobre fundo claro, `#3A3630` — ou `#3E6B54`
quando precisa de cor. Sobre fundo verde ou escuro, `#FBF6EC`.

### Assinatura da peça

No pé, centralizada: **só o nome "Brotinho"**. É assim que o card de frase do
app assina, e em peça pequena funciona melhor que marca + nome. Quando houver
marca, deixe um espaço livre em volta de meio diâmetro do disco.

**Nunca:** distorcer, trocar a cor do disco, aplicar brilho ou gradiente,
contornar o nome, colocar sobre foto movimentada.

---

## 8. O formato que já existe: card de frase 1080 × 1920

É o card que o app gera para os stories. Serve de gabarito para qualquer peça
de frase.

```
fundo            #2E4A3B
tinta            #FBF6EC
área segura      260 no topo, 270 no pé
frase            centrada no meio da área segura, Baloo 2 Bold
                 74 (curta) / 66 (média) / 58 (longa), entrelinha 1,42
                 caixa de 820 de largura, sempre entre aspas curvas
aspa decorativa  um “ gigante em creme a cerca de 8% de opacidade, a 10% da altura
grão             180 pontos de creme a 2–5% de opacidade, distribuição fixa
manchas          os três círculos da seção 5
folhas           a folha da seção 6 em creme, translate(-40 380) rotate(-24) scale(13),
                 e uma espelhada no canto oposto, ambas a cerca de 6% de opacidade
vinheta          gradiente do creme a zero nas bordas, para fechar o quadro
assinatura       "Brotinho", Baloo 2 Bold 58, centrada, em (540, altura − 270)
```

Regra do texto: **no máximo 22 palavras**. Frase que não cabe em 820 de
largura com corpo 58 é frase para outro formato.

---

## 9. Tamanhos e o que cabe em cada um

| peça | medida | área segura | conteúdo |
|---|---|---|---|
| story | 1080 × 1920 | 260 topo / 270 pé | uma frase e a assinatura |
| feed retrato | 1080 × 1350 | 80 em volta | título + 2 linhas, ou 3 cartões |
| quadrado | 1080 × 1080 | 72 em volta | título + 1 linha |
| carrossel | 1080 × 1350 por slide | 80 em volta | uma ideia por slide |

**Hierarquia padrão de uma peça:** rótulo curto em caixa alta (Nunito Bold 39,
`letter-spacing .08em`, `#716B60`) → afirmação em Baloo 2 Bold → uma ou duas
linhas de apoio em Nunito → assinatura no pé.

**Carrossel:** a capa diz a ideia inteira; cada slide do meio carrega **uma**
frase; o último é um convite sereno, sem promessa e sem urgência.

---

## 10. Quatro receitas prontas

**A. Frase sobre verde** — a seção 8, sem alteração.

**B. Frase sobre papel** — fundo `#FBF6EC` com grão, frase em `#3A3630`
(Baloo 2 Bold), aspas curvas, uma folha em `#E3EDE6` no canto (opaca, não é
textura) e a assinatura "Brotinho" em `#3E6B54` no pé.

**C. Três passos** — fundo `#FBF6EC`; três cartões brancos, raio 18, com anel
de luz e sombra longa (seção 5); em cada um, um círculo de 38 em `#E3EDE6` com
ícone `#3E6B54`, título em Nunito ExtraBold 45 e uma linha em Nunito Regular
39 em `#5B5548`. É o layout da tela "O método" do app.

**D. O broto falando** — o broto (estágio 2 ou 3) com o halo de luz e, acima
dele, um cartão branco de raio 18 com um bico apontando para ele, texto
centrado em Nunito Regular. Serve para peça em primeira pessoa do personagem.
A carinha tem de combinar com a frase.

---

## 11. Ícones

Traço de 1,5 a 2, pontas arredondadas, sem preenchimento. O conjunto do app:
sino, lápis, coração, lua, gota, ampulheta, alvo, brilho, estrela, check,
casa, livro, folha, pessoa, cadeado, lixeira, microfone, busca, engrenagem,
compartilhar. Em peça, o ícone vive dentro de um círculo `#E3EDE6`, com o
glifo em `#3E6B54`.

---

## 12. Antes de publicar

- [ ] Texto com contraste de 4,5 ou mais sobre o fundo.
- [ ] Nenhum humor dito só por cor.
- [ ] Nenhuma ofensiva de dias, ponto, nível, medalha ou confete.
- [ ] Nenhuma afirmação de tratamento, cura ou diagnóstico; nenhum número de
      resultado.
- [ ] Nenhuma cobrança de ausência.
- [ ] Aspas curvas em toda frase de conselho.
- [ ] Baloo 2 nos títulos, Nunito no corpo; entrelinha 1,2 ou mais na Baloo.
- [ ] Grão de papel presente; nenhum preto puro, nenhum branco de fundo.
- [ ] Assinatura "Brotinho" no pé.
- [ ] Áreas seguras respeitadas — nada de texto atrás da interface do
      Instagram.
- [ ] Nada copiado da arte ou do texto do concorrente.
- [ ] Se o tema encostou em suicídio: a linha do CVV 188 está na peça.

---

## 13. Arquivos de referência

No repositório do app:

```
assets/icon.png                      o ícone, com o símbolo aplicado
capturas/1-home.png                  o broto grande, a luz e as carinhas
capturas/2-frase-do-dia.png          o card de frase dentro do app
capturas/5-praticas.png              lista de temas, para o layout C
src/theme/tokens.ts                  as cores, raios e sombras de verdade
src/components/brand/Sprout.tsx      o desenho do broto
src/components/brand/CardDoStory.tsx o card de story
docs/briefing-de-design.md           o briefing completo, com as restrições
```

**Se a outra conversa não tiver o repositório**, mande junto com este arquivo:
`assets/icon.png`, `capturas/1-home.png` e `capturas/2-frase-do-dia.png`. Com
os três, dá para conferir cor, luz e proporção sem depender de descrição.
