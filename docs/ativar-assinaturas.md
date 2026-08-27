# Ativar as assinaturas do Brotinho

Passo a passo para sair do paywall de mentira (o de hoje) para cobrança de verdade.

Marque os itens conforme for fazendo. **Faça na ordem** — vários passos dependem do anterior.

> **O que é meu e o que é seu.** Criar contas, informar dados bancários e fiscais e
> assinar contratos com Apple e Google só você pode fazer. O resto da configuração
> e o código são comigo.

**Atualizado em 23 de agosto de 2026.** O que está marcado abaixo foi conferido
na tela, não é lembrança.

---

> ## ⚠️ A build que está com a Apple não cobra de ninguém
>
> Falta a chave do RevenueCat, então o botão "Assinar" entra no app de graça —
> e o revisor da Apple não consegue chegar em compra nenhuma. As quatro compras
> foram enviadas junto com esta versão, e é provável que sejam reprovadas por
> isso.
>
> **O que resolve está em `docs/a-build-3-nao-cobra.md`.**

## Onde estamos hoje, em uma frase

**As duas builds saíram e o iOS já foi entregue à Apple.** O que falta agora não é
configuração: é **testar**. Nada do que foi feito nos últimos dias — a Composta
conferindo a frase, o ditado local, o apagar das gravações — jamais rodou em
aparelho.

O `.apk` de Android existe e instala direto. Para o iOS falta um iPhone.

O contrato de apps pagos, a conta bancária e os três formulários fiscais estão
todos **ativos** — o lado do dinheiro não depende mais de nada. O Google ainda não
foi começado.

> O caminho detalhado do que testar e do que fazer depois está em
> `docs/da-build-ate-a-loja.md`.

---

## Antes de começar: quanto custa e quanto demora

| Item | Custo | Prazo típico |
|---|---|---|
| Conta Apple Developer | US$ 99 por ano | 1 a 3 dias para aprovar |
| Conta Google Play Console | US$ 25, uma vez só | 1 a 2 dias, às vezes mais |
| RevenueCat | Grátis no começo | imediato |
| Revisão da Apple na primeira publicação | — | 1 a 7 dias |

O que costuma travar não é o dinheiro, é a **verificação de identidade** das duas
lojas e os **dados bancários**. Comece por isso, porque roda em segundo plano
enquanto você faz o resto.

---

## FASE 1 — Nomes e preços dos produtos ✅ FEITO

Identificadores definidos e criados na Apple. **Na Apple, um identificador nunca
pode ser reaproveitado, nem se você apagar o produto.** Estes já estão gravados:

| Plano | Identificador | Preço |
|---|---|---|
| Semanal | `brotinho_semanal` | R$ 9,90 |
| Mensal | `brotinho_mensal` | R$ 29,90 |
| Anual | `brotinho_anual` | R$ 179,90 |
| Vitalício | `brotinho_vitalicio` | R$ 399,90 |

> O anual era R$ 179,40 no plano original. Esse valor **não existe** como faixa de
> preço da Apple; o mais próximo é R$ 179,90. O app foi ajustado para anunciar
> exatamente o que a loja cobra.

---

## FASE 2 — Apple (iPhone)

### 2.1 Criar a conta ✅ FEITO

Conta ativa. Time `4PKPYM4M6J`.

### 2.2 Contrato, banco e impostos ✅ FEITO

- [x] **Acordo de apps gratuitos** — **Ativo**
- [x] **Acordo de apps pagos** — **Ativo**
- [x] **Conta bancária** — Banco Topazio SA (9001), Brasil, USD — **Ativa**
- [x] **Formulário fiscal do Brasil** — **Ativo**
- [x] **U.S. Certificate of Foreign Status of Beneficial Owner** — **Ativo**
- [x] **U.S. Form W-8BEN** — **Ativo**

Tudo enviado em 21 de agosto de 2026 e processado pela Apple no mesmo dia. A página
de Negócios não mostra mais nenhum aviso. **O lado do dinheiro está de pé:** quando
houver uma versão no ar, os produtos carregam e a venda acontece.

Em <https://appstoreconnect.apple.com/business> → **Formulários fiscais**.

> **Sobre o W-8BEN.** Ele declara que você não é contribuinte dos EUA, para a Apple
> não reter imposto americano na fonte. A pergunta "você exerce alguma atividade
> empresarial nos EUA?" é **Não** no seu caso — você não tem funcionários,
> equipamentos nem ativos lá.
>
> **Não marque a Part II.** Ela pede para certificar que existe um acordo de imposto
> de renda entre Brasil e Estados Unidos. Esse acordo **não existe** — os dois países
> nunca assinaram tratado de bitributação sobre renda. Marcar ali seria declaração
> falsa sob pena de perjúrio. Caixa 9 desmarcada, campo 10 vazio.
>
> **O campo 8 usa `MM-DD-YYYY`**, mês antes do dia. É onde mais se erra.
>
> **A consequência:** sem tratado, a Apple retém **30% na fonte** sobre o que vier de
> vendas nos Estados Unidos, além da comissão dela. Os EUA estão entre os 133 países
> onde o app vai vender, então isso é real. As vendas brasileiras não sofrem essa
> retenção. Não dá para escapar disso pelo formulário; o que um contador resolve é a
> parte de cá — se compensa PF ou CNPJ, e como declarar o que foi retido lá fora.

### 2.2.1 Uma pendência pequena: o CEP do cadastro

O endereço em `developer.apple.com/account` → **Informações da assinatura** está com o
CEP de **7 dígitos** (`14808-26` em vez de `14808-264`).

Esse endereço é a origem do **campo 3 do W-8BEN**, que por isso não tem "Editar" — a
Receita americana exige que o endereço de residência venha do cadastro, não digitado
na hora. O campo 4 (Mailing Address) é o único que dá para sobrescrever.

- [ ] Corrigir em **Informações da assinatura → Atualizar suas informações → Alterar
      dados de contato**

> **Não bloqueia o W-8BEN.** Um dígito de CEP não invalida o formulário: a rua, o
> número, a cidade, o estado e o país identificam o endereço. Mas vale corrigir com
> calma depois, porque **o mesmo endereço está no contrato e no cadastro de
> pagamento** — e a Apple avisa que mudanças ali "precisam ser comprovadas e
> verificadas", ou seja, é um pedido com verificação, não um campo que se salva.

> Enquanto o acordo de apps pagos não estiver **Ativo**, seus produtos não carregam
> nem no teste. O app mostra a tela de preços vazia e parece quebrado. Se isso
> acontecer com você, é quase sempre aqui.

### 2.3 Registrar o app ✅ FEITO

Brotinho · `com.brotinho.app` · ID Apple **6803963494** · SKU `BROTINHO-IOS-001`

### 2.4 As 3 assinaturas ✅ FEITO

Grupo **Brotinho Premium** (`22326032`), os três dentro dele, cada um com duração,
preço, nome e descrição em português, e a captura do paywall anexada para a revisão.
Todos em *Preparar para envio*.

Ordem dos níveis: anual (1), mensal (2), semanal (3). É essa ordem que faz trocar
de semanal para anual valer como **upgrade** — troca na hora, sem pagar duas vezes.

### 2.5 O vitalício ✅ FEITO

`brotinho_vitalicio`, não consumível, R$ 399,90, em *Preparar para envio*.

### 2.6 Período de tolerância ✅ FEITO

Conferido na tela em 25/08/2026: **16 dias**, **todas as renovações**, **ambiente
de produção e Sandbox**. Ativo.

> O que isso faz: se o cartão da pessoa falhar na renovação, ela continua com acesso
> por 16 dias enquanto a Apple tenta cobrar de novo. Quando a cobrança entra, a
> assinatura segue como se nada tivesse acontecido. Sem isso, um cartão vencido
> vira cancelamento — e quem cancelou sem querer raramente volta.

### 2.7 Ficha da App Store ✅ FEITO

Nome, subtítulo, descrição, palavras-chave, texto promocional, copyright, categoria,
classificação etária (+12), direitos de conteúdo, contato da revisão, notas para a
equipe de revisão, 5 capturas de tela em 1242 × 2688, lançamento **manual**.

O app **não pede login**, e isso está dito em letras maiúsculas na primeira linha das
notas de revisão — é o motivo nº 1 de reprovação boba.

### 2.8 Privacidade e acessibilidade ✅ FEITO

- Privacidade publicada: 3 tipos de dados, nenhum vinculado à identidade da pessoa
- Acessibilidade: **Contraste suficiente** e **Movimento reduzido** (rascunho — só
  publica depois que houver uma versão no ar)
- Declarado **não** ser dispositivo médico regulamentado
- Declarado não usar criptografia não isenta
- Distribuição só para **iPhone**: iPad, Mac com chip Apple e Apple Vision Pro
  desmarcados, porque o layout foi desenhado para uma tela de celular e não há
  como testar as outras aqui

> "Contraste suficiente" só pôde ser declarado depois que as cores foram
> corrigidas — três combinações estavam abaixo de 4,5. Se um dia alguém mexer na
> paleta, essa declaração precisa ser reconferida junto.

**Dois itens de acessibilidade ficaram de fora de propósito:** "Texto maior" e
"Diferenciação sem usar apenas cor". Os dois provavelmente valem, mas exigem
testar no iPhone com os ajustes do sistema ligados, e declarar sem testar é pior
do que não declarar.

### 2.9 TestFlight ✅ FEITO, esperando a compilação

- Descrição da versão beta, e-mail para comentários, URL de marketing e de
  privacidade preenchidos
- Contato e notas para a revisão dos apps beta preenchidos
- Grupo interno **Time do Brotinho** criado, com **distribuição automática**
  ligada e você já dentro como tester

Quando a build subir, ela cai no seu iPhone sozinha, sem mais nenhum clique aqui.

### 2.10 Indicação para destaque ✅ RASCUNHO PRONTO — falta você enviar

Distribuição → **Indicações** → *Lançamento do Brotinho*.

Escrevi o texto para a equipe editorial da Apple: o que o app é, o que ele
deliberadamente não faz, e por que isso importa. Plataforma iPhone, país Brasil,
idioma português do Brasil, período de publicação **outubro de 2026**.

Duas coisas suas:

- [ ] **Confirmar o período.** Outubro é um chute meu, calculado de trás para a
      frente: formulários fiscais + build + revisão da Apple dão umas 4 a 6
      semanas, e a Apple pede que a indicação chegue com pelo menos 4 semanas de
      antecedência. Ajuste se você tem outra data em mente.
- [ ] **Clicar em "Enviar indicação".** É a sua voz falando com a Apple; quem
      manda é você.

> Não custa nada e não atrapalha nada. Na pior hipótese ninguém responde.

### 2.11 Conta de teste (sandbox) — ⚠️ **sua**

- [ ] **Usuários e acesso** → **Sandbox** → criar um testador
- [ ] Use um e-mail que **não seja** seu Apple ID normal
      (`pedrohbpferreira+sandbox@gmail.com` serve e cai na sua caixa de sempre)

Precisa definir uma senha, e senha eu não digito.

---

## FASE 3 — Google (Android) — não começado

### 3.1 Criar a conta

- [ ] <https://play.google.com/console/signup> — US$ 25, uma vez só
- [ ] Faça a verificação de identidade que eles pedem

### 3.2 Perfil de pagamentos

- [ ] Play Console → **Configurações** → **Perfil de pagamentos**
- [ ] Preencha dados bancários e fiscais

### 3.3 Criar o app

- [ ] Play Console → **Criar app**
- [ ] Nome: Brotinho · Tipo: App · **Pago ou gratuito: Gratuito**

> Sim, **gratuito**. "Pago" é quando se cobra para baixar. O Brotinho é baixado
> de graça e cobra dentro do app — para o Google, isso é um app gratuito com
> compras.

### 3.4 Subir uma primeira versão — **obrigatório antes dos produtos**

- [ ] Precisa de um `.aab`, que sai do `eas build`
- [ ] Suba na trilha **Teste interno**

> No Google, os produtos só ficam ativos depois que existe uma versão enviada.
> É o contrário da Apple, e trava muita gente.

### 3.5 Criar os produtos

- [ ] **Monetizar** → **Assinaturas** → as três, com um **plano base** cada
- [ ] **Monetizar** → **Produtos avulsos** → `brotinho_vitalicio`

Use os **mesmos identificadores** da Apple.

### 3.6 Testadores

- [ ] **Configurações** → **Teste de licença** → adicione seu e-mail do Google
- [ ] Adicione o mesmo e-mail na lista da trilha de Teste interno

---

## FASE 4 — RevenueCat — conta criada, falta configurar

O RevenueCat conversa com as duas lojas por nós: recibo, renovação, cancelamento,
restauração. Sem ele, tudo isso é escrito e mantido duas vezes.

**A conta existe desde 23 de agosto.** O que falta é a configuração — e ela é o
único item entre o estado de hoje e uma versão que pode ser revisada, porque a
build que está com a Apple entrega o app de graça (`a-build-3-nao-cobra.md`).

### 4.1 O projeto e o app iOS

- [ ] Criar um projeto chamado **Brotinho**
- [ ] Adicionar o app **iOS**, bundle `com.brotinho.app`

O RevenueCat vai pedir uma **In-App Purchase Key** da Apple: um trio de
*Issuer ID*, *Key ID* e um arquivo `.p8`. Ele é obrigatório aqui — o app usa
`react-native-purchases` **10.7.1**, que valida por StoreKit 2, e o antigo
*app-specific shared secret* só serve para StoreKit 1, hoje descontinuado.

> **Não é a mesma chave que o EAS já usa.** O EAS guardou uma chave de API do App
> Store Connect para *enviar* builds. Esta é outra, de outra seção, e serve para
> *validar compras*. Gere uma nova em vez de tentar reaproveitar.
>
> Ela fica em App Store Connect → **Usuários e acesso** → **Integrações** →
> **Chave de compra no app**. O `.p8` só pode ser baixado **uma vez**.

### 4.2 Os produtos, o direito e a oferta

Nesta ordem — cada camada depende da anterior:

- [ ] **Products** — importar da Apple. Os quatro identificadores, exatamente
      assim, porque o app procura por igualdade:

      brotinho_semanal · brotinho_mensal · brotinho_anual · brotinho_vitalicio

- [ ] **Entitlements** — criar **um só**, chamado `premium`, com os quatro
      produtos dentro. Esse nome está escrito em `src/services/subscription.ts`;
      se divergir, todo mundo vira "não assinante"
- [ ] **Offerings** — uma oferta marcada como **current**, com os quatro planos.
      O app pede `getOfferings().current`; sem oferta atual a lista chega vazia e
      o botão responde "não consegui falar com a loja"

### 4.3 As duas chaves públicas

- [ ] Copiar a chave de iOS (`appl_…`) e a de Android (`goog_…`) em
      **Project settings → API keys**

São as chaves **públicas** do SDK, não a secreta.

> **Não me mande as chaves por aqui.** Elas vão direto para o EAS, no passo
> abaixo — e é aí que mora o erro que já custou uma build.

### 4.4 Android — pode ficar para depois

O app Android exige o Google Play Console configurado (FASE 3), que ainda não
está. **Não é bloqueio para o iOS:** faça o projeto e o app iOS agora, e volte
aqui quando o Play estiver de pé.

---

## FASE 5 — Código ✅ FEITO

- [x] SDK do RevenueCat instalado, carregado com proteção para não quebrar o Expo Go
- [x] Preços vindos da loja, com o texto fixo só como reserva
- [x] Compra de verdade no botão de assinar
- [x] **"Restaurar" funcionando** — era um botão morto
- [x] Tela para quem perdeu a assinatura, com restaurar
- [x] Verificação a cada abertura do app e ao voltar para ele

**O que falta aqui: guardar as duas chaves no EAS.**

```
npx eas-cli env:create --environment production --name EXPO_PUBLIC_REVENUECAT_IOS --value appl_xxx --visibility sensitive
npx eas-cli env:create --environment production --name EXPO_PUBLIC_REVENUECAT_ANDROID --value goog_xxx --visibility sensitive
```

> **No EAS, não no `.env`** — e esta é a lição mais cara deste projeto. O `.env`
> vale na sua máquina; ele não sobe para a nuvem que compila. Foi exatamente por
> isso que a build 3 saiu sem chave nenhuma e se deu de presente.
>
> `--visibility sensitive` impede que o valor apareça nos registros da compilação.

Para conferir antes de gastar uma build:

```
npm run confere-cobranca
```

Ele checa as três coisas que precisam ser verdade juntas: o perfil de build lê o
ambiente certo, as duas chaves existem lá, e os identificadores do código não
mudaram. Se qualquer uma falhar, ele diz qual e o que fazer.

Enquanto não houver chave, o app se comporta como hoje: entra sem cobrar. É isso
que permite continuar testando no Expo Go — e é por isso que o perfil `preview`
aponta para o ambiente `preview`, que **não** tem as chaves. O `.apk` de teste
segue aberto de propósito.

---

## FASE 6 — Compilar, testar e publicar

- [x] **Projeto validado para build.** `npx expo-doctor` passa nas 18 checagens.
      Ele tinha achado um defeito que só apareceria depois de publicado — ver
      abaixo.
- [x] **Build de Android** — perfil `preview`, `.apk`, pronta.
- [x] **Build de iOS** — perfil `production`, build 3, pronta.
- [x] **Envio ao App Store Connect** — concluído.

> **O defeito que o expo-doctor pegou.** O `expo-audio` declara o `expo-asset`
> como dependência com curinga `*`, e o npm instalou a versão **57.0.12**, de um
> SDK muito mais novo, enquanto o SDK 54 quer a **12.0.13**. Ficaram duas versões
> do mesmo módulo nativo na árvore.
>
> No Expo Go isso não aparece, porque o cliente já embute o `expo-asset` e o som
> da respiração funciona. Numa build de verdade só uma versão é compilada — seria
> descoberto com o app no ar, no exercício de respiração.
>
> **Rode `npx expo-doctor` antes de cada build.** É o tipo de coisa que uma
> atualização de dependência traz de volta sem avisar.
- [ ] Testar no iPhone com a conta sandbox
- [ ] Testar no Android com o e-mail de teste de licença
- [ ] Testar: assinar, cancelar, **restaurar em outro aparelho**
- [ ] Enviar para revisão nas duas lojas

> Na Apple, a primeira assinatura e a primeira compra dentro do app têm de ser
> enviadas **junto com a versão**. Não dá para mandar antes.

> A Apple reprova com frequência por dois motivos bobos: o botão **Restaurar**
> não funcionar, e a tela não deixar claro **preço, duração e renovação
> automática**. Os dois já estão previstos aqui.

---

## Ainda em aberto, fora da cobrança

- [x] ~~Tirar as páginas de suporte e privacidade do endereço provisório.~~ ✅ FEITO

      Estão no ar em <https://thebritodev.github.io/brotinho/>, servidas do
      `/docs` do repositório na branch `main`. Editar o HTML e dar push republica.

      | | endereço |
      |---|---|
      | Entrada | `thebritodev.github.io/brotinho/` |
      | Suporte | `.../suporte.html` |
      | Privacidade | `.../privacidade.html` |

      Os cinco campos na Apple foram trocados e conferidos com recarga completa:
      Privacidade do app, URL de suporte e de marketing da versão 1.0, e as duas
      do TestFlight. Não sobrou nenhuma referência a artefato do Claude.

      > Um ganho que só aparece agora: o telefone do **CVV (188)** e o
      > **cvv.org.br** viraram links de verdade. No visualizador de artefato eles
      > não navegavam — numa página de saúde mental, isso era o pior lugar
      > possível para um link morto.
- [x] ~~Criar o `brotinho.suporte@gmail.com`.~~ A conta existe.
- [ ] **Ligar a resposta automática** nessa conta — o texto está pronto em
      `docs/resposta-automatica.md`.

      > Não é firula. Esse endereço está publicado em quatro lugares, e num app de
      > saúde mental chegam mensagens pesadas e fora de hora. A resposta precisa
      > dizer duas coisas na hora: que ali **não** é atendimento de emergência, e
      > que existe o CVV no 188.

---

> **Depois que a build terminar**, o passo a passo até a loja está em
> `docs/da-build-ate-a-loja.md`: o que testar no `.apk`, como enviar, o que só dá
> para conferir num iPhone de verdade, e o que fazer se a Apple reprovar.

## Se você só tem 10 minutos hoje

1. **Instalar o `.apk` e testar a Composta** — falar outra coisa e conferir que o
   contador não anda. É o defeito que motivou o trabalho todo, e continua sem
   nenhum teste em aparelho.
2. O **período de tolerância** (Assinaturas → um clique, é só o aceite).
3. O **Programa para Pequenas Empresas** — 15% de comissão em vez de 30%.

Depois disso, o que separa o app da loja é um iPhone e a fila da revisão.
