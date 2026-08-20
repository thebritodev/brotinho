# Ficha da App Store — Brotinho

Textos prontos para colar no App Store Connect, mais as respostas dos
questionários. Revise antes de enviar: são suas palavras publicadas no seu nome.

---

## 1. Textos da ficha

### Nome do app (máx. 30 caracteres)

```
Brotinho
```

### Subtítulo (máx. 30 caracteres)

```
Um lugar só seu para desabafar
```
*30 de 30.*

### Palavras-chave (máx. 100 caracteres, separadas por vírgula)

```
ansiedade,diário,saúde mental,autocuidado,meditação,calma,insônia,autoestima,terapia,humor,bem-estar
```
*100 de 100. Não repita aqui palavras que já estão no nome ou no subtítulo — a
Apple indexa os três campos juntos, e repetir desperdiça espaço.*

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
• Práticas guiadas — 31 exercícios para ansiedade, tristeza, insônia, raiva,
  solidão, procrastinação, estresse, autoestima, foco e gratidão.
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

**Isso você precisa tirar do celular — eu não consigo gerar.**

A Apple exige pelo menos um conjunto, para o maior iPhone. Os tamanhos exatos
aparecem na própria tela de upload do App Store Connect, e mudam a cada geração
de iPhone — confirme lá em vez de confiar nesta lista.

Sugestão de quais telas mostrar, nesta ordem:

1. Home com o broto grande e as carinhas de humor
2. A Composta em andamento, com as palavras se desfazendo
3. O diário, com a folha pautada
4. A lista de práticas
5. O resumo para a terapia

> Não use capturas com dados falsos que pareçam depoimentos reais. Escreva
> textos plausíveis e neutros nos registros que aparecerem na imagem.

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

### ⚠️ Uma coisa que precisa ser conferida ANTES de gerar a build

O app tem dois caminhos para transcrever voz:

1. **Reconhecimento do próprio aparelho** — o áudio não sai dali. É o caminho
   normal no iPhone.
2. **Servidor de transcrição** — reserva, usada em desenvolvimento.

O segundo só liga se a variável `EXPO_PUBLIC_TRANSCRIPTION_URL` existir na
build. Se ela for junto para a loja, **o áudio passa a sair do aparelho** — e
aí a descrição acima fica falsa, a política de privacidade fica falsa, e o
questionário fica errado.

- [ ] Conferir que a build de produção **não** tem `EXPO_PUBLIC_TRANSCRIPTION_URL`

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

- [ ] **URL da política de privacidade** — obrigatória. Ainda não existe; a
      política só está dentro do app. Me passe o nome do responsável e o e-mail
      de contato que eu publico como página.
- [ ] **URL de suporte** — pode ser uma página simples com o mesmo e-mail.

---

## Resumo do que falta de você

1. Nome do responsável e e-mail de contato *(destrava a política e o suporte)*
2. Revisar os textos acima
3. Tirar as capturas de tela
4. Confirmar a declaração de criptografia
