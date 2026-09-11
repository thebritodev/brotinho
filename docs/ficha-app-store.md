# Ficha da App Store — Brotinho

Textos prontos para colar no App Store Connect, mais as respostas dos
questionários. Revise antes de enviar: são suas palavras publicadas no seu nome.

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

Este é o único campo que dá para mudar **sem passar por revisão de novo**. Use
para novidades e datas.

```
Fale em voz alta o que te incomoda e veja a frase perder o peso. Diário, práticas guiadas e um broto que cresce conforme você aparece.
```

### Descrição

```
Cuidar da própria cabeça se parece mais com jardinagem do que com conserto. Não
existe um botão que resolve: existe rega, luz, tempo e alguma paciência com os
dias em que nada parece acontecer.

O Brotinho é um lugar para deixar o que pesa. Você escreve ou fala, e um broto
cresce conforme você aparece. Ele não cobra, não pontua e não fica bravo quando
você some por uma semana.


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
• Frase do dia — uma por dia, desenterrada do canteiro, para guardar e compartilhar.
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

### O que há de novo — 1.0.2

```
• Frase do dia: uma frase por dia, desenterrada do canteiro. Guarde as que tocarem você e compartilhe nos stories.
• A palavra exata do seu humor agora aparece no Perfil, no Diário e no resumo para a terapia.
• Boas-vindas novas e um onboarding mais leve.
• Vibração nos botões e vários ajustes de acabamento.
```

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

- [x] **URL da política de privacidade** — publicada e pública:
      `https://claude.ai/code/artifact/233e5a2a-0e5b-4ef9-b870-3789a54de19b`
- [x] **URL de suporte** — publicada e pública:
      `https://claude.ai/code/artifact/97423828-4a27-4ef8-ab40-e32bc1ceb7df`

> As duas foram conferidas sem login, que é como a Apple acessa. O código-fonte
> das páginas está em `docs/privacidade.html` e `docs/suporte.html`: se um dia
> houver domínio próprio, é só subir e trocar os links na ficha.

---

## Resumo do que falta de você

1. Ligar a resposta automática do `brotinho.suporte@gmail.com` — a conta já
   existe, e o texto está pronto em `docs/resposta-automatica.md`
2. Revisar os textos acima
3. Tirar as capturas de tela
4. Confirmar a declaração de criptografia

## O que já está pronto do lado técnico

- `eas.json` criado, com os perfis `development`, `preview` e `production`.
  Sem esse arquivo não existia build nenhuma para a loja.
- Número de build automatizado (`autoIncrement`), para não esbarrar no erro
  de reenviar com o mesmo número.
- Manifesto de privacidade declarado.
- Envio de áudio impedido em produção pelo próprio código.
