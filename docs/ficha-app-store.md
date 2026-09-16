# Ficha da App Store — Brotinho

Textos prontos para colar no App Store Connect, mais as respostas dos
questionários. Revise antes de enviar: são suas palavras publicadas no seu nome.

---

## Estado: 1.1.0 **aprovada**, esperando você soltar

Enviada em 14/09/2026, aprovada pela Apple e conferida aqui em **15/09/2026**.
Compilação **14**, versão 1.1.0, estado `Pronto para distribuição`.

| | |
|---|---|
| Revisão | **passou** |
| Lançamento | **manual** — ela fica parada até alguém apertar o botão |
| Capturas | 8, refeitas com o redesenho |
| Novidades | 742 de 4.000, cobrindo a 1.0.2 e a 1.1.0 |
| Declaração de exportação | não foi pedida — `ITSAppUsesNonExemptEncryption: false` está no binário desde 21/08 |

> **O botão de soltar é seu.** Ela nunca rodou num iPhone de verdade: todo o
> redesenho foi conferido na versão web e num APK de Android. A revisão da
> Apple passar não é a mesma coisa que ter visto a tela. Se a 1.1.0 tiver um
> problema de comportamento nativo, é aqui que se deve olhar primeiro.

### O que ainda dá para mudar, e o que não dá

Com a versão aprovada, o formulário dela fica **travado inteiro** — descrição,
novidades, palavras-chave, URLs, tudo cinza. Sobram dois campos, e os dois
ficam fora da versão:

| Campo | Precisa de revisão? |
|---|---|
| **Texto promocional** | não — é o único texto da ficha que se troca a qualquer hora |
| **Acessibilidade do app** | não — vive fora da versão e publica sozinho |

Tudo o mais espera a próxima versão. A lista do que está preparado e esperando
está em [O que já está escrito para a próxima versão](#o-que-ja-esta-escrito-para-a-proxima-versao).

---


## 1. Textos da ficha

### Os três campos de busca são um só

A Apple indexa **nome + subtítulo + palavras-chave** como um saco único de
termos, e o **nome pesa mais** que os outros dois. Três consequências:

1. Palavra repetida entre os campos é espaço jogado fora.
2. O que estiver no nome trabalha mais do que se estivesse nas palavras-chave.
3. Conectivo não é buscado por ninguém. "Um lugar só seu para desabafar"
   ocupava os 30 caracteres do subtítulo e só uma palavra ali era procurada.

Até 09/09/2026 o nome era só `Brotinho`: **8 de 30 caracteres**, e nenhum deles
uma palavra que alguém digita na busca. Vinte e dois em branco, no campo de
maior peso da ficha.

### Nome do app (máx. 30 caracteres)

```
Brotinho: Diário e Bem-estar
```
*28 de 30. "Diário" é a palavra que define a categoria; é ela que faz o app
aparecer para quem procura o que ele é.*

### Subtítulo (máx. 30 caracteres)

```
Desabafe e cuide da ansiedade
```
*29 de 30. Continua sendo uma frase de gente, e não uma lista de palavras — a
Apple pode recusar subtítulo que seja só empilhamento de termos. E ainda assim
carrega "desabafe" e "ansiedade".*

### Palavras-chave (máx. 100 caracteres, separadas por vírgula)

```
saúde mental,autocuidado,meditação,calma,insônia,autoestima,terapia,humor,sono,estresse,luto,raiva
```
*98 de 100. Saíram `ansiedade`, `diário` e `bem-estar`, que passaram a viver no
nome e no subtítulo — mantê-las aqui seria pagar duas vezes pela mesma palavra.
Entraram `sono`, `estresse`, `luto` e `raiva`.*

*Todas as quatro novas são **temas de prática que o app realmente tem**. Chegou
a entrar `pânico` numa versão desta lista e saiu: o app trata ansiedade, mas não
tem nada específico para pânico, e palavra-chave que promete o que o app não faz
traz instalação errada, avaliação ruim e risco de recusa.*

### A segunda ficha: Inglês (Reino Unido), com palavras em português

Na loja do Brasil a Apple indexa **duas** fichas: Português (Brasil) e Inglês
(Reino Unido) — é a tabela oficial de localizações por país da Apple. Criar a
ficha inglesa com termos em português dá mais 160 caracteres de busca no
Brasil, sem tirar nada da ficha principal.

Criada em 10/09/2026, na versão 1.0.2:

```
Nome:           Brotinho: Humor e Respiração
Subtítulo:      Tristeza, foco e gratidão
Palavras-chave: solidão,procrastinação,culpa,vergonha,comparação,emoções,mindfulness,desabafo,respirar,journaling
```

Nenhuma palavra repete as da ficha principal (repetir é espaço jogado fora), e
todas são temas ou recursos que o app tem. Descrição, novidades, texto
promocional e URLs são cópia da ficha em português; as capturas também — a
ficha inglesa usa as da portuguesa.

**Quem vê essa ficha** é quem usa o iPhone em inglês britânico. Como o app é
em português, ver o texto em português ali é honesto sobre o que vai
encontrar. **O risco** é a revisão pedir o texto em inglês; se pedir, apagar a
ficha inglesa resolve e não mexe em mais nada.

A política de privacidade também precisa do link na ficha inglesa (Privacidade
do app → idioma → Editar), e já está preenchida.

### Categorias

Principal **Saúde e fitness**; secundária **Estilo de vida** desde a 1.0.2 —
onde ficam os apps de diário e autocuidado. *Medicina* foi descartada: passa a
ideia de tratamento clínico, o que o app diz com todas as letras que não é.

### Texto promocional (máx. 170 caracteres)

Este é o único campo que dá para mudar **sem passar por revisão de novo**, e é
por isso que ele é o mais importante da ficha enquanto a descrição está presa.

```
Desabafe por texto ou voz e veja o pensamento que te persegue perder o peso. Práticas guiadas, sem cadastro: nada do que você escreve sai do seu aparelho.
```

*155 de 170. Aplicado nas **duas** fichas (Português e Inglês do Reino Unido)
em 15/09/2026.*

> **O que ele era, e por que mudou.** Era *"Fale em voz alta o que te incomoda
> e veja a frase perder o peso. Diário, práticas guiadas e um broto que cresce
> conforme você aparece."* — 134 caracteres, e nada de errado com ele: abria
> pelo mecanismo, que é o certo.
>
> O que faltava era a **privacidade**, que é a única coisa da ficha que os
> concorrentes não podem copiar sem refazer o produto. Ela estava na descrição,
> no penúltimo bloco, depois de dois mil caracteres — e a descrição não pode ser
> tocada até a próxima versão.
>
> O texto promocional aparece **acima** da descrição na página do produto. Com
> a descrição travada na versão antiga (a que abre pela jardinagem), ele é o
> único lugar da ficha onde cabe a frase que responde *"o que eu ganho se
> instalar?"*. Por isso ele carrega os três: o que você faz, o que acontece com
> o pensamento, e que nada disso sai do aparelho.

### Descrição

```
Desabafe por texto ou voz, faça uma prática guiada a partir de dois minutos e
repita em voz alta o pensamento que te persegue até ele perder o peso. Nada do
que você escreve sai do seu aparelho.

O Brotinho é um lugar para deixar o que pesa. Você escreve ou fala, e um broto
cresce conforme você aparece. Ele não cobra, não pontua e não fica bravo quando
você some por uma semana.

Cuidar da própria cabeça se parece mais com jardinagem do que com conserto: não
existe um botão que resolve. Existe rega, luz, tempo e alguma paciência com os
dias em que nada parece acontecer.


COMPOSTAR UM PENSAMENTO

Pensamentos difíceis não somem porque alguém mandou parar de pensar neles.
Tentar empurrá-los para longe costuma dar mais força a eles.

Compostar é fazer o contrário: pegar a frase que te incomoda, repetir em voz
alta até ela virar só som, e deixar que isso alimente o crescimento. É uma
técnica real, chamada defusão cognitiva, usada na terapia ACT.


O QUE TEM AQUI DENTRO

• Diário — escreva ou fale. A transcrição acontece no próprio aparelho.
• Composta — repita em voz alta o pensamento que te persegue.
• Práticas guiadas — 41 exercícios para ansiedade, tristeza, luto, insônia,
  estresse, solidão, raiva, procrastinação, autoestima, culpa e vergonha,
  comparação, foco e gratidão.
• Uma prática para o seu dia — escolhida pelo humor que você marcou, na abertura
  do app.
• Frase do dia — uma por dia, desenterrada do canteiro, para guardar e compartilhar.
• Registro de humor — uma carinha por dia, e o desenho do mês inteiro depois.
• Resumo para a terapia — suas semanas em PDF, para levar à sessão sem depender
  da memória.


SEUS REGISTROS SÃO SEUS

Não há cadastro, não há servidor, e o que você escreve não sai do seu aparelho.
Até a análise que sugere seus valores e temas roda aqui dentro.

Isso tem um custo que preferimos assumir: sem conta, não dá para acessar de
outro celular. Em troca, ninguém além de você lê o seu diário — nem nós.


ISTO NÃO É TRATAMENTO

As práticas daqui são de autocuidado, baseadas em técnicas conhecidas. Elas
ajudam, mas não substituem acompanhamento psicológico ou médico.

Se você estiver em sofrimento intenso ou pensando em se machucar, procure
ajuda. O CVV atende de graça, 24 horas por dia, pelo telefone 188 e em
cvv.org.br.
```

> **Duas linhas acrescentadas em 14/09/2026, na revisão antes do envio.** A lista
> tinha cinco itens e descrevia um app anterior a esta versão:
>
> - **O registro de humor** não aparecia em lugar nenhum do texto, embora as
>   capturas 1 e 6 sejam dominadas pelas carinhas. Quem lia a descrição e olhava
>   a imagem via dois apps diferentes.
> - **A prática escolhida para o dia** só existia em "O que há de novo" — e esse
>   campo é substituído na versão seguinte. O coração da tela inicial nova
>   sumiria da ficha na 1.2.
>
> São 2.083 de 4.000 caracteres. Já aplicado no App Store Connect.

> **A abertura foi trocada em 15/09/2026.** O texto começava com a frase da
> jardinagem — bonita, e filosofia. Só que as três primeiras linhas são as
> únicas que aparecem antes do "mais", e são elas que respondem (ou não) a
> pergunta que decide a instalação: **o que eu ganho se instalar?**
>
> A jardinagem não respondia. Agora as três primeiras linhas dizem as três
> coisas concretas que o app faz — desabafar por texto ou voz, uma prática
> guiada curta, repetir o pensamento em voz alta até ele perder o peso — e
> terminam na privacidade, que é o que separa o Brotinho dos concorrentes.
> A mesma estrutura da descrição curta da Play, que já era melhor que esta.
>
> A frase da jardinagem não foi jogada fora: virou o terceiro parágrafo, onde
> quem tocou em "mais" já quer saber por que o app é assim.
>
> "A partir de dois minutos" é conferido: das 41 práticas, quatro são de dois
> minutos e 35 têm dez ou menos. Prometer "três minutos" seria mais bonito e
> seria mentira para a metade delas.
>
> São 2.287 de 4.000. Feito com a 1.1.0 na fila de revisão — descrição é dos
> campos que a Apple deixa editar sem tirar a versão da fila.

---

## 2. Capturas de tela

**São geradas por script, e não tiradas do celular.**

```
node scripts/capturas.js         (com o Metro rodando)
node scripts/captura-paywall.js
```

Saem em `capturas/`, sete arquivos de 1242 × 2688 — o tamanho que a Apple pede
para o iPhone de 6,5 polegadas. O caminho é o app web, que é o mesmo código
React Native, numa janela de 414 × 896 com densidade 3: dá o tamanho exato, sem
cursor e sem barra de rolagem. Não existe iPhone nesta casa, e o aparelho de
teste é Android.

A ordem, que é a ordem dos arquivos (a da 1.0.2, enviada em 10/09/2026):

1. `1-home` — o broto grande e as carinhas de humor
2. `2-frase-do-dia` — a frase desenterrada, aberta
3. `3-composta` — a tela que explica a prática
4. `4-diario` — a folha pautada
5. `5-praticas` — a lista de temas
6. `6-terapia` — o resumo para levar à sessão
7. `paywall` — a tela de planos, que a Apple exige para revisar assinaturas

**Só as três primeiras aparecem no resultado de busca.** Por isso a Frase do
dia vem em segundo: é a novidade da 1.0.2 e a tela que mais diz, sem legenda,
o que o app faz por alguém num dia difícil.

### O que há de novo — 1.1.0

```
• Tela inicial nova: cada ferramenta ganhou um cartão grande, com ilustração e um botão que diz o que acontece ao tocar.
• Frase do dia: uma frase por dia, desenterrada do canteiro. Guarde as que tocarem você e compartilhe nos stories.
• Uma prática escolhida para o seu dia, logo na abertura — e a fileira de práticas recentes, para voltar de onde você parou num toque.
• O diário mudou para a aba do Brotinho, logo depois de você dizer como está.
• As 41 práticas agora aparecem inteiras na tela inicial, com uma ilustração para cada tema.
• A palavra exata do seu humor agora aparece no Perfil, no Diário e no resumo para a terapia.
• Tema claro/escuro direto no seu perfil.
• Boas-vindas novas, onboarding mais leve e vibração nos botões.
```

> **Oito linhas, e não cinco.** A primeira versão desta lista tinha só as cinco
> mudanças da 1.1.0, e estava errada: a **1.0.2 nunca virou build**. O último
> binário publicado é a 1.0.1, então quem atualiza recebe a 1.0.2 e a 1.1.0 de
> uma vez — e as quatro novidades da 1.0.2 ficariam sem anúncio nenhum. Uma
> delas é a Frase do dia, que é a **captura número 2** da própria ficha.
>
> Corrigido no App Store Connect e aqui em 14/09/2026. As três primeiras linhas
> continuam sendo as que aparecem antes do "mais", então a ordem foi escolhida
> por isso: tela inicial, Frase do dia, prática de hoje.

Vindas da 1.0.2, que nunca foi publicada: Frase do dia, a palavra do humor no
Perfil/Diário/resumo, o onboarding mais leve e a vibração nos botões. As outras
quatro são da 1.1.0.

Os tamanhos exatos aparecem na tela de upload do App Store Connect e mudam a
cada geração de iPhone — confirme lá em vez de confiar nesta lista.

> O estado semeado é neutro de propósito: frases plausíveis de diário, nunca
> algo que possa ser lido como depoimento real de uma pessoa.

**Refaça as capturas sempre que a interface mudar.** As que estavam aqui eram de
agosto, de antes do redesenho, e descreviam outro app.

---

## 3. Questionário de privacidade ("App Privacy")

> **Regra que a Apple usa:** só conta como "coletado" o que **sai do aparelho**.
> O que fica salvo localmente não entra.

### O que o Brotinho NÃO coleta

Diário, humores, compostagens, respostas do onboarding, valores: **tudo fica no
aparelho**. Responda **não** para Saúde e Fitness, Conteúdo do Usuário,
Localização, Contatos, Histórico de Busca e Informações Sensíveis.

### O que o Brotinho coleta

Só o que vem junto com a assinatura, através do RevenueCat:

| Categoria | Uso | Ligado à identidade? | Rastreamento? |
|---|---|---|---|
| Compras | Funcionalidade do app | Não | Não |
| Identificadores | Funcionalidade do app | Não | Não |

> O RevenueCat publica um guia de como preencher esse questionário. **Siga o
> deles**, porque muda conforme as versões do SDK — e é a fonte oficial.

### O envio de áudio: resolvido no código, não mais no checklist

O app tem dois caminhos para transcrever voz:

1. **Reconhecimento do próprio aparelho** — o áudio não sai dali. É o caminho
   normal no iPhone.
2. **Servidor de transcrição** — reserva, usada só em desenvolvimento.

Antes, o segundo ligava sozinho se a variável `EXPO_PUBLIC_TRANSCRIPTION_URL`
estivesse na máquina que gerou a build — e aí o áudio passaria a sair do
aparelho, tornando falsas a descrição acima, a política de privacidade e este
questionário, sem ninguém perceber.

**Isso agora é impossível.** O envio para servidor só existe em
desenvolvimento (`__DEV__`): numa build de produção o áudio não tem para onde
sair, mesmo que a variável esteja definida. Uma promessa desse tamanho não pode
depender de alguém lembrar de limpar um arquivo antes de cada build.

> Junto veio outra correção: fora do desenvolvimento o app não inventa mais um
> texto de exemplo quando não consegue transcrever. Ele avisa que o ditado não
> está disponível. Escrever uma frase inventada no diário de alguém, como se a
> pessoa tivesse falado aquilo, é pior do que falhar.

### Manifesto de privacidade (`PrivacyInfo.xcprivacy`)

Já configurado no `app.json`, em `ios.privacyManifests`. A Apple **recusa o
upload** sem ele, com um e-mail automático, para apps que usam certas APIs — e
o Brotinho usa quatro delas através das bibliotecas: armazenamento local
(AsyncStorage), data de arquivo e espaço em disco (gravação do áudio e do PDF)
e tempo de sistema (React Native).

Cada uma vai declarada com seu motivo oficial, e `NSPrivacyTracking` vai como
`false`.

---

## 3.1 Acessibilidade do app — publicada em 15/09/2026

A Apple mostra na página do produto quais recursos de acessibilidade o app
atende. **Não passa por revisão e não pertence a nenhuma versão**: publica na
hora, e é um dos dois campos que dá para mexer com a 1.1.0 travada.

Estava preenchido e **nunca publicado** — dois recursos parados num rascunho,
com o aviso amarelo na tela. Rascunho não aparece para ninguém.

Publicado, para iPhone:

| Recurso | Por que é verdade |
|---|---|
| **Interface escura** | tema escuro completo, com opção no Perfil e `sistema` como padrão — ver `TemaProvider.tsx` |
| **Contraste suficiente** | os doze pares de texto dos dois temas medidos, o pior em 4,74 contra o mínimo de 4,5 da WCAG AA |
| **Movimento reduzido** | `useMenosMovimento` escuta `isReduceMotionEnabled` e o evento `reduceMotionChanged`; com ele ligado as animações não rodam |

**Interface escura** foi a que entrou hoje; as outras duas já estavam no
rascunho.

### Os quatro que ficaram de fora, e o motivo de cada um

Caixa marcada a mais aqui não é otimismo: é alguém com deficiência visual
instalando o app por causa da promessa e descobrindo que ela não vale.

| Recurso | Por que não |
|---|---|
| **VoiceOver** | os rótulos existem, mas ninguém nunca navegou o app inteiro com VoiceOver ligado — não há iPhone nesta casa. A caixa promete percorrer o app todo |
| **Texto maior** | `allowFontScaling` nunca foi desligado, mas a caixa pede **200%** e ninguém olhou o que a tela faz nesse tamanho |
| **Diferenciação sem usar apenas cor** | quatro dos seis humores se distinguem pela expressão da carinha; "Feliz" e "Leve" têm a mesma boca. Quatro de seis não é o que a caixa promete — ver a nota no topo de `HumorNoTempo.tsx` |
| **Legendas** e **Descrições de áudio** | não há vídeo no app |

> As três primeiras são trabalho de verdade que dá para fazer — e as duas de
> cima precisam de um iPhone na mão antes de virarem caixa marcada.

---

## 4. Classificação etária

Responda com honestidade — errar aqui dá rejeição, e não adianta tentar baixar
a faixa.

| Pergunta | Resposta |
|---|---|
| Violência, sexo, drogas, jogos de azar, terror | Nenhum |
| Informação médica ou de tratamento | **Sim, com pouca frequência** |
| Conteúdo gerado por usuários | Não *(o que a pessoa escreve não é publicado nem compartilhado)* |

> A pergunta sobre informação médica é a que importa. O app fala de saúde mental
> e cita o CVV. Dizer que não fala seria mentira, e a Apple lê a descrição. A
> classificação provável é 12+ ou 17+ — aceite a que sair.

---

## 5. Declaração de criptografia

Toda submissão pergunta sobre criptografia, e sem a resposta a build fica presa
na fila. Dá para responder de uma vez no `app.json`:

```json
"ios": {
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false
  }
}
```

`false` vale para apps que usam **apenas HTTPS padrão**, que é o caso do
Brotinho. **Não coloquei isso por conta própria: é uma declaração legal sua, não
uma configuração técnica minha.** Confirme e me avise que eu adiciono, ou
adicione você mesmo.

---

## 6. Links obrigatórios na ficha

Conferidos na própria ficha e na rede em 15/09/2026, os três respondendo 200
sem login — que é como a Apple e qualquer pessoa acessam:

- [x] **Política de privacidade** — `https://thebritodev.github.io/brotinho/privacidade.html`
- [x] **Suporte** — `https://thebritodev.github.io/brotinho/suporte.html`
- [x] **Marketing** — `https://thebritodev.github.io/brotinho/`

> **Este trecho estava errado até hoje.** Ele ainda apontava para dois
> artefatos do `claude.ai`, que era onde as páginas moravam antes de existir o
> GitHub Pages. A ficha já usava o domínio novo; só a documentação não sabia.
>
> O código-fonte das páginas continua em `docs/privacidade.html`,
> `docs/suporte.html` e `docs/index.html` — é de lá que o Pages publica.

---

## 6.1 A página de marketing — refeita em 16/09/2026

`https://thebritodev.github.io/brotinho/` é o **URL de marketing** da ficha, e
é onde cai quem procura "Brotinho app" fora da loja. Até hoje ela era um
índice: logo, a frase "Um lugar só seu para desabafar" e dois links, Suporte e
Privacidade. Nenhuma linha dizia o que o app faz, e **não havia link para
instalar** — uma página de marketing sem botão de baixar.

Vale a pena mexer aqui porque é a única superfície do produto que não passa
pela Apple: não tem revisão, não tem versão, não tem campo travado. Publica no
push.

### O que ela tem agora

1. **O mecanismo como título**: "O pensamento que não sai da sua cabeça vira só
   som." Não é categoria, é o que o app faz de diferente.
2. **A Composta jogável na própria página.** A frase é do app, o toque conta as
   repetições e as palavras desbotam da esquerda para a direita — a mesma conta
   do `ExperimentoComposta` do onboarding. A pessoa faz a técnica **antes de
   instalar**.
3. O método em três blocos, o que mais há dentro, a privacidade com o custo
   dela dito em voz alta, o botão da App Store e o preço.
4. O aviso de que isto não é tratamento, com o CVV.
5. `description` e Open Graph, que não existiam: link colado no WhatsApp ou no
   Instagram agora abre um cartão em vez de uma URL crua.

### O cartão do link (`docs/og.png`)

Sai de `node scripts/gera-og.js`, em 1200 × 630 — o formato que o WhatsApp, o
Facebook e o Instagram desenham grande. O ícone sozinho não servia: é quadrado
de 1024, e essas plataformas cortam quadrado em círculo pequeno.

O cartão mostra a **frase no meio do caminho de se desmanchar**, congelada em
62% da dissolução. É o único lugar onde o mecanismo aparece antes de alguém
tocar em qualquer coisa — é a primeira impressão do link, e ela é o truque, e
não o logo.

É script, e não um PNG feito à mão, pelo mesmo motivo das capturas da loja: a
manchete e as cores vêm do mesmo lugar que a página, então o cartão não vence
o prazo sozinho quando a manchete mudar.

### As duas regras deste arquivo

**A demonstração tem de ser tão privada quanto o app.** Não há campo de texto,
não há armazenamento e não há envio — a frase é do app, nunca de quem visita.
Anunciar privacidade numa página que coleta seria a pior propaganda possível.

**Nada afirma que a pessoa falou em voz alta.** A página não tem como saber,
exatamente como o app não tem. O convite é o mesmo do onboarding, com as
mesmas palavras: *"Se estiver num lugar onde dá, diga em voz alta — funciona
bem melhor. Se não der, leia devagar."*

Os doze pares de cor da página foram medidos nos dois temas; o pior é 4,91
contra o mínimo de 4,5 da WCAG AA.

---

## O que já está escrito para a próxima versão

<a id="o-que-ja-esta-escrito-para-a-proxima-versao"></a>

Três coisas prontas que **não cabem na 1.1.0** porque o formulário dela está
travado desde a aprovação. Quando a 1.1.1 (ou 1.2) abrir, é colar.

### 1. A abertura nova da descrição

O texto da seção [Descrição](#descrição) acima já é o novo. O que muda são as
três primeiras linhas — que são as únicas que aparecem antes do "mais", e as
únicas que a maioria lê.

### 2. A ficha inglesa está dois lançamentos atrasada

Conferido em 15/09/2026, campo por campo. A ficha **Inglês (Reino Unido)** —
que é a que a Apple mostra para quem usa o iPhone em inglês aqui no Brasil —
ficou para trás nas duas últimas correções da portuguesa:

| Campo | Português | Inglês (Reino Unido) |
|---|---|---|
| Descrição | 2.083 caracteres | **1.916** — sem as duas linhas de 14/09 (registro de humor e prática do dia) |
| O que há de novo | 8 linhas, cobrindo 1.0.2 e 1.1.0 | **4 linhas, só as da 1.0.2** |
| Texto promocional | novo | novo *(aplicado hoje nas duas)* |

A segunda linha é a que dói: quem abre o app em inglês e toca em "O que há de
novo" na 1.1.0 lê as novidades da **1.0.2** — uma versão que nunca virou
binário. A tela inicial nova, que é a mudança inteira desta versão, não é
mencionada.

Aconteceu porque as duas correções de 14/09 foram feitas com a ficha
portuguesa aberta, e trocar de idioma é um menu que não avisa nada. **Toda
correção de texto vale para as duas fichas** — vale a pena reler esta linha
antes de fechar o App Store Connect da próxima vez.

### 3. O que sai de venda quando a 1.1.0 estiver no ar

`brotinho_semanal` e `brotinho_vitalicio`, em Assinaturas → remover da venda.
Quem já assinou continua assinando; some só da tela de planos.

---

## Resumo do que falta de você

Atualizado em 15/09/2026. Capturas, criptografia e revisão saíram daqui porque
estão feitas — a versão passou pela revisão da Apple com elas.

1. **Soltar a 1.1.0.** Ela está aprovada e parada. É um botão, e é seu — ver
   o aviso no topo sobre ela nunca ter rodado num iPhone.
2. **Ligar a resposta automática** do `brotinho.suporte@gmail.com` — a conta
   já existe, e o texto está pronto em `docs/resposta-automatica.md`.
3. **Criar a conta do Google Play.** Todo o resto do Android está pronto em
   [`ficha-google-play.md`](ficha-google-play.md); falta a conta, e ela abre
   um relógio de 14 dias que não tem atalho.
4. **Instalar uma build posterior a 07/09** no celular. O redesenho, a tela de
   carregamento nova e as animações de toque só aparecem num binário novo — o
   Metro não atualiza splash nem ícone, que são nativos. O APK baixa inteiro e
   o Android não instala; a suspeita é o Auto Blocker da Samsung.

## O que já está pronto do lado técnico

- `eas.json` criado, com os perfis `development`, `preview` e `production`.
  Sem esse arquivo não existia build nenhuma para a loja.
- Número de build automatizado (`autoIncrement`), para não esbarrar no erro
  de reenviar com o mesmo número.
- Manifesto de privacidade declarado.
- Envio de áudio impedido em produção pelo próprio código.
