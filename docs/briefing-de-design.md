# Brotinho — briefing de design

Documento para redesenhar o app. Escrito em 31 de agosto de 2026, a partir do
código em produção.

Ele tem três partes: **o que o app é** (para o design servir a alguma coisa),
**o sistema atual** (para saber do que se está partindo) e **as restrições**
— que é a parte que mais importa, porque várias delas parecem detalhe e
custaram caro para serem descobertas.

---

## 1. O que é o app

**Brotinho** é um app brasileiro de autocuidado e saúde mental. A pessoa marca
como está, escreve no diário, fala em voz alta o pensamento que a incomoda
("Composta"), e faz exercícios guiados. Um broto desenhado cresce conforme ela
aparece, amadurece aos 21 dias e vira uma planta guardada no jardim.

**Público:** adultos brasileiros, em português. Muita gente usa **na cama, de
madrugada**, e uma parte usa em sofrimento agudo.

**Tom:** um amigo que repara nas coisas. Nunca professor, nunca terapeuta,
nunca técnico. O app fala **com** a pessoa, nunca **por** ela.

**Modelo de negócio:** assinatura com paywall duro no fim do onboarding.
Semanal, mensal e anual. Sem teste grátis, sem conta, sem login.

**A promessa central, que aparece em três lugares visíveis:** nada sai do
aparelho. Não existe servidor, não existe conta, e nem nós conseguimos ler o
que ela escreve. Isso está na política de privacidade, na ficha da loja e
**dentro do paywall, quatro linhas antes do preço**. É o principal diferencial
contra os concorrentes (Daylio, Finch, Rosebud, Cíngulo).

---

## 2. Navegação e telas

Não há biblioteca de navegação: as telas são estado. A barra de baixo tem três
destinos e um botão central.

```
┌─────────────────────────────────────────────┐
│  Diário          ( broto )          Perfil  │
│                  ↑ Composta                 │
└─────────────────────────────────────────────┘
```

O botão do meio é o próprio broto, em um círculo terracota, e abre a Composta.

### Fluxo de entrada

1. **Abertura** — ilustração de uma janela com o broto no parapeito, título,
   "Começar" e "Já usei o Brotinho antes".
2. **Onboarding**, 14 passos: apresentação → nome dela e nome do broto →
   como está → *espelho* → o que já tentou → *espelho* → experimento da
   Composta → o método → valores → sono → lembrete → áreas da vida → plano →
   **paywall**. Os passos de "espelho" devolvem o que ela acabou de dizer.
3. **Paywall** — três planos, privacidade em destaque acima do preço.

### Telas principais

| tela | o que tem |
|---|---|
| **Início** | saudação · o broto grande, respirando · "Como você está se sentindo hoje?" com 5 carinhas · linha de palavras mais exatas · sugestão de exercício · cartão da Composta · cartões Práticas e Meus valores · "Seu crescimento" com 3 números · "Seu broto percebeu" |
| **Diário** | pergunta de partida · folha pautada onde se escreve · "Falar em vez de escrever" · "Salvar no diário" · resposta do broto ao que foi escrito · convite ao CVV · registros anteriores com busca e filtro por humor |
| **Composta** | a pessoa fala em voz alta o pensamento; as palavras caem e viram adubo |
| **Perfil** | números · "Seu humor ao longo do tempo" (7/30/90 dias) · resumo para terapia · configurações |
| **Jardim** | o broto de agora com barra de ciclo · lista das plantas já colhidas, cada uma com mês, dias, humor predominante e valor vivido |
| **Práticas** | 13 temas, 41 práticas · guia passo a passo · guia de respiração animado |

### Momentos especiais

- **Crescimento do broto** — o broto muda de estágio (1, 2, 3).
- **Colheita** — aos 21 dias a planta amadurece; é o único momento de boa
  notícia inequívoca do app, e o único lugar que pede avaliação na loja.
- **Volta** — quem sumiu por dias vê um acolhimento, nunca uma cobrança.
- **Lembrança** — o app devolve algo que ela escreveu há um mês, seis meses.

---

## 3. O sistema visual atual

### Identidade

Papel creme, tinta marrom, verde de planta, terracota de vaso. A referência é
**caderno de papel**, não interface de produtividade.

### Tipografia

- **Baloo 2** — títulos, números grandes, a voz da marca. Arredondada e quente.
- **Nunito** — corpo, rótulos, botões.

Escala em uso: 32 / 24 / 19 (títulos, Baloo) · 17 / 15 / 13 (corpo, Nunito).
Entrelinha de 1,2 nos títulos e 1,5 no corpo.

### Paleta clara

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

Papéis: fundo `#FBF6EC` · cartão `#FFFFFF` · cartão fundo `#F5EFDE` · texto
`#3A3630` · texto de apoio `#716B60` · borda `#D9D1BF` · verde de preencher
`#4C7B62` · verde de escrever `#3E6B54` · verde suave `#E3EDE6` · perigo
`#AD512B`.

### Paleta escura

**Não é a clara invertida.** Papel à noite não vira carvão: vira marrom quente
sob um abajur. Todo fundo tem a matiz do marrom mais escuro — por isso
`#211E1A` e nunca preto puro.

Fundo `#211E1A` · cartão `#2C2823` · cartão fundo `#1A1714` · texto `#F1EBDD` ·
texto de apoio `#ADA595` · borda `#453F37` · verde de preencher `#7FAF92` ·
verde de escrever `#9CC9AE`.

Os claros e os escuros trocam de papel: o marrom mais escuro era o texto e
passa a ser quase-fundo; o creme era fundo e vira texto. Quem escreve "a cor
mais contrastante que existe" continua recebendo isso nos dois temas.

### Cores de humor

Cinco humores escolhíveis, mais um neutro para "ainda não disse nada".

| humor | claro | escuro |
|---|---|---|
| Feliz | `#FCEFC7` | `#F2E2B0` |
| Leve | `#E3EDE6` | `#CFE0D4` |
| Ansioso | `#DCE8F0` | `#C8DCE8` |
| Cansado | `#E4DEE8` | `#D3C9DC` |
| Triste | `#D8DEE6` | `#C4CDD8` |
| (neutro) | `#F5EFDE` | `#E6DCC4` |

Essas são as **pastilhas**: a carinha, a barra do gráfico, a palavra escolhida.
Elas são claras nos dois temas porque recebem tinta escura por cima.

Existe uma segunda tabela, só para quando a cor é **superfície** — o disco
pequeno atrás do broto no jardim e na colheita. No claro é a mesma; no escuro é
tom fechado: `#383124` `#27342C` `#253039` `#2A2E36` `#302A3A` `#363028`.

### Forma

Espaçamento 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64.
Raio 6 · 8 · 12 · 16 · pílula. Borda de 1,5. Sombras baixíssimas — o app quase
não usa elevação; o que separa um cartão do fundo é a cor.

### O personagem

O broto é um SVG desenhado à mão, com estágios 1, 2 e 3. Vaso de terracota,
caule, folhas, um bulbo redondo com carinha. A carinha tem seis expressões, as
mesmas dos humores.

**As cores do desenho são idênticas nos dois temas**, e isso é regra: contorno
`#3A3630`, contorno da folha `#2E4A3B`, folha `#5B8A72`, folha clara `#9EBBAA`,
vaso `#D98866`. Ver a restrição 5 abaixo.

---

## 4. As restrições — leia antes de desenhar

Estas não são preferências. Cada uma tem uma razão, e várias custaram caro.

### 1. Nada de gamificação

**Sem ofensiva, sem placar, sem ranking, sem competição, sem nada a bater.**

A literatura clínica mostra que elementos gamificados **não melhoram, e podem
enfraquecer**, a retenção em apps de saúde mental. Há relatos de gente que
perdeu a sequência por estar internada, e de ansiedade que piorou por
notificação cobrando sessão. O público deste app é exatamente o grupo mais
vulnerável à culpa de sequência.

Confirmado por dado de produto: o Daylio retém ~40% no dia 30, o Finch ~22%, e
a análise credita a diferença à simplicidade — não à gamificação, que é o que o
Finch tem de sobra.

**Consequências para o desenho:** o broto nunca regride e nunca morre de
abandono. Os três números da Home ("dias cuidados", "compostagens", "padrões")
são memória, não pontuação. A barra do ciclo do jardim não é meta. Quem
desaparece por semanas volta sem levar bronca.

### 2. Nada de cobrar ausência

Nenhuma tela, nenhum lembrete e nenhuma frase pode marcar falta, dizer o que
foi perdido ou pedir volta. O componente de reencontro existe para **acolher**
quem voltou.

### 3. Humor nunca por cor sozinha

Quem não distingue matiz precisa ler o humor de outro jeito. Hoje: as carinhas
têm expressões distintas, e o gráfico de 30/90 dias tem contagem em texto
embaixo. Se o redesenho mexer no gráfico, esse segundo canal tem de continuar
existindo.

**E não use altura de barra para ordenar humor.** Altura cria um eixo de melhor
para pior, ou seja, a pontuação que o app decidiu não ter.

### 4. Contraste e tamanho de fonte

- WCAG AA: **4,5** para texto, **3,0** para elemento de interface. Um script
  mede as duas paletas em 32 pontos e reprova a build.
- **`allowFontScaling` nunca é desligado.** Quem usa a fonte do sistema a 200%
  vê o texto crescer, e os layouts precisam sobreviver a isso. Já houve um bug
  aqui: as linhas do papel do diário eram desenhadas em dp e o texto em sp, e a
  escrita descolava mais a cada linha para quem tinha a fonte fora do padrão.

### 5. O personagem não inverte

As cores do desenho são as mesmas de dia e de noite. Já houve uma versão em que
o broto virou um **negativo de si mesmo** — cara escura, contorno claro —
porque o marrom do contorno seguiu o tema. O que muda em volta do broto é a
luz, nunca ele.

### 6. Não há cor de humor atrás do broto

Passou por seis versões e saiu. Numa tela onde o humor já é dito pela carinha
do broto, pela carinha marcada e pela palavra escolhida, o fundo era o quarto a
dizer a mesma coisa. **Se o redesenho quiser trazer cor ambiente de volta,
saiba que esse caminho já foi andado inteiro** — inclusive gradiente radial e
luz de trás — e cada versão foi reprovada por quem usa.

### 7. A saída para o CVV fica sempre alcançável

O convite ao Centro de Valorização da Vida (188) fica no Diário e na Composta,
que são os pontos em que a pessoa está mais perto do que dói. Sempre visível,
sempre igual, nunca condicionado ao que ela escreveu.

**E o app não lê o texto para decidir mostrar ajuda.** Alarme falso invade quem
estava só desabafando — e num app cuja promessa é que ninguém lê, o app se
denunciar lendo é pior que o alarme.

### 8. Nenhuma afirmação médica

A diretriz 1.4.1 da Apple reprova apps que **pareçam** dar orientação médica, e
o aviso de "não é tratamento" sozinho não salva. Os textos descrevem a
**experiência**, nunca o mecanismo fisiológico. Nomear técnica e autor é
permitido; afirmar efeito clínico não.

### 9. A privacidade é conteúdo visual, não letra miúda

A frase "nada sai deste aparelho" precisa continuar aparecendo com destaque no
paywall e na abertura. É argumento de venda, não obrigação legal.

---

## 5. O que eu mudaria, se fosse você

Problemas conhecidos, oferecidos como pauta e não como pedido.

**A tela inicial ficou densa.** Ela acumula: saudação, broto grande, cinco
carinhas, linha de palavras, linha de sugestão, cartão da Composta, dois
cartões, três números e um cartão de observação. Cada um entrou por um bom
motivo e nenhum foi reavaliado em conjunto.

**O onboarding tem 14 passos**, seis deles com pergunta. A referência de 2026
fala em duas ou três perguntas e 60 a 120 segundos. Contra isso: a ordem conta
uma história, e paywall duro converte melhor com investimento antes. Não há
analytics para decidir com dado — e não vai haver, pela restrição 9.

**O gráfico de 30 e 90 dias é textura.** Faixas de cinco pixels lado a lado; o
que se lê é o desenho do período, não os dias. Pode ter forma melhor.

**Falta um sinal visual próprio.** Tirando o mascote, o app se parece com
qualquer app de bem-estar de 2026: creme, verde, cantos arredondados. A
pesquisa mostra que essa combinação virou o padrão da categoria.

**A folha pautada do diário é o melhor achado visual do app** e vive numa tela
só. Talvez a metáfora de papel possa ir mais longe.

---

## 6. Aviso sobre o que não muda por decisão de produto

- Sem teste grátis (decisão comercial de 28/08).
- O plano mensal é caro de propósito, para empurrar ao anual (decisão de
  29/08). Não é descuido de precificação.
- Sem contas, sem login, sem sincronização entre aparelhos.
- Português do Brasil, sem previsão de outros idiomas.
