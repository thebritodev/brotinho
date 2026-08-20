# Ativar as assinaturas do Brotinho

Passo a passo para sair do paywall de mentira (o de hoje) para cobrança de verdade.

Marque os itens conforme for fazendo. **Faça na ordem** — vários passos dependem do anterior.

> **O que é meu e o que é seu.** Criar contas, informar dados bancários e assinar
> contratos com Apple e Google só você pode fazer. O código é comigo: quando você
> terminar a FASE 4, me avise que eu faço a FASE 5.

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

## FASE 1 — Decidir os nomes dos produtos

Antes de mexer em qualquer site, decida os **identificadores** dos 4 planos. São
códigos internos que aparecem nas duas lojas e no código. Precisam ser **iguais
nas duas lojas**.

Sugestão (pode manter):

- [ ] `brotinho_semanal`
- [ ] `brotinho_mensal`
- [ ] `brotinho_anual`
- [ ] `brotinho_vitalicio`

**Cuidado:** na Apple, um identificador nunca pode ser reaproveitado, nem se você
apagar o produto. Escolha e não mude.

Confirme também os preços que já estão no app:

| Plano | Preço |
|---|---|
| Semanal | R$ 9,90 |
| Mensal | R$ 29,90 |
| Anual | R$ 179,40 |
| Vitalício | R$ 399,90 |

---

## FASE 2 — Apple (iPhone)

### 2.1 Criar a conta
- [ ] Entre em <https://developer.apple.com/programs/enroll/>
- [ ] Escolha entre **pessoa física** ou **empresa**. Empresa exige um número
      D-U-N-S e demora mais. Pessoa física é bem mais rápido.
- [ ] Pague os US$ 99 e aguarde a aprovação por e-mail.

### 2.2 Contrato e dados bancários — **este é o passo que todo mundo esquece**
- [ ] Em <https://appstoreconnect.apple.com> → **Business** (ou "Acordos").
- [ ] Aceite o **Paid Applications Agreement**.
- [ ] Preencha os dados **bancários** e os **fiscais**.

> Enquanto esse contrato não estiver com o status **Ativo**, seus produtos não
> carregam nem no teste. O app mostra a tela de preços vazia e parece quebrado.
> Se isso acontecer com você, é quase sempre aqui.

### 2.3 Registrar o app
- [ ] App Store Connect → **Meus Apps** → **+** → **Novo App**
- [ ] Plataforma: iOS
- [ ] Nome: Brotinho
- [ ] Bundle ID: `com.brotinho.app` *(já é o que está no projeto)*

### 2.4 Criar as 3 assinaturas
- [ ] Dentro do app → **Assinaturas** → crie um **Grupo de Assinaturas**
      (pode chamar de "Brotinho Premium")
- [ ] Dentro do grupo, crie os três: `brotinho_semanal`, `brotinho_mensal`,
      `brotinho_anual`
- [ ] Em cada um: duração, preço em Reais, nome de exibição e descrição

> Os três precisam ficar **no mesmo grupo**. É isso que permite a pessoa trocar
> de mensal para anual sem pagar duas vezes.

### 2.5 Criar o vitalício
- [ ] Ainda no app → **Compras no App** → **+**
- [ ] Tipo: **Não consumível** (não é assinatura — é compra única, para sempre)
- [ ] Identificador: `brotinho_vitalicio`, preço R$ 399,90

### 2.6 Conta de teste
- [ ] App Store Connect → **Usuários e Acesso** → **Sandbox** → criar um testador
- [ ] Use um e-mail que **não seja** seu Apple ID normal

---

## FASE 3 — Google (Android)

### 3.1 Criar a conta
- [ ] <https://play.google.com/console/signup> — US$ 25, uma vez só
- [ ] Faça a verificação de identidade que eles pedem

### 3.2 Perfil de pagamentos
- [ ] Play Console → **Configurações** → **Perfil de pagamentos**
- [ ] Preencha dados bancários e fiscais

> **Converse com seu contador** sobre receber de Apple e Google no Brasil — se
> vale pessoa física ou CNPJ, e como declarar. Isso eu não sei responder por
> você, e é melhor acertar antes de o dinheiro começar a entrar.

### 3.3 Criar o app
- [ ] Play Console → **Criar app**
- [ ] Nome: Brotinho · Tipo: App · **Pago ou gratuito: Gratuito**

> Sim, **gratuito**. "Pago" é quando se cobra para baixar. O Brotinho é baixado
> de graça e cobra dentro do app — para o Google, isso é um app gratuito com
> compras.

### 3.4 Subir uma primeira versão — **obrigatório antes dos produtos**
- [ ] Você vai precisar de um arquivo `.aab` do app. **Esse arquivo sou eu que
      gero** com `eas build`. Me avise quando chegar aqui.
- [ ] Suba na trilha **Teste interno**

> No Google, os produtos só ficam ativos depois que existe uma versão enviada.
> É o contrário da Apple, e trava muita gente.

### 3.5 Criar os produtos
- [ ] **Monetizar** → **Assinaturas** → criar as três (`brotinho_semanal`,
      `brotinho_mensal`, `brotinho_anual`)
- [ ] Em cada uma, crie um **plano base** com a duração e o preço
- [ ] **Monetizar** → **Produtos avulsos** → criar `brotinho_vitalicio`

### 3.6 Testadores
- [ ] **Configurações** → **Teste de licença** → adicione seu e-mail do Google
- [ ] Adicione o mesmo e-mail na lista da trilha de Teste interno

---

## FASE 4 — RevenueCat

O RevenueCat conversa com as duas lojas por nós: recibo, renovação,
cancelamento, restauração. Sem ele, tudo isso é escrito e mantido duas vezes.

- [ ] Criar conta em <https://app.revenuecat.com>
- [ ] Criar um projeto chamado **Brotinho**
- [ ] Adicionar o app **iOS** (bundle `com.brotinho.app`) e conectar à Apple
      seguindo o passo a passo que eles mostram
- [ ] Adicionar o app **Android** (pacote `com.brotinho.app`) e conectar ao Google
- [ ] Em **Products**, cadastrar os 4 identificadores
- [ ] Em **Entitlements**, criar **um** chamado `premium` e marcar os 4 produtos
      dentro dele
- [ ] Em **Offerings**, criar uma oferta com os 4 planos
- [ ] Copiar as duas **chaves públicas** (uma de iOS, uma de Android)

> **Não me mande as chaves por aqui.** Quando chegarmos na fase de código, eu te
> digo em qual arquivo colar. São chaves públicas, mas o hábito certo é esse.

Confira o plano gratuito atual do RevenueCat no site deles — era grátis até um
certo volume de receita mensal, mas isso muda com o tempo.

---

## FASE 5 — Código ✅ FEITO

Já está no projeto, esperando só as chaves:

- [x] SDK do RevenueCat instalado, carregado com proteção para não quebrar o Expo Go
- [x] Preços vindos da loja, com o texto fixo só como reserva
- [x] Compra de verdade no botão de assinar
- [x] **"Restaurar" funcionando** — era um botão morto
- [x] Tela para quem perdeu a assinatura, com restaurar
- [x] Verificação a cada abertura do app e ao voltar para ele

**O que falta aqui:** criar um arquivo `.env` na raiz do projeto com as duas
chaves públicas do RevenueCat:

```
EXPO_PUBLIC_REVENUECAT_IOS=appl_xxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID=goog_xxxxxxxx
```

O `.env` já está no `.gitignore`, então não vai parar em lugar nenhum.
**Não me mande as chaves por aqui** — cole direto no arquivo.

Enquanto não houver chave, o app se comporta como hoje: entra sem cobrar. É
isso que permite continuar testando no Expo Go.

## FASE 6 — Testar e publicar

- [ ] Testar no iPhone com a conta sandbox
- [ ] Testar no Android com o e-mail de teste de licença
- [ ] Testar: assinar, cancelar, restaurar em outro aparelho
- [ ] Enviar para revisão nas duas lojas

> A Apple reprova com frequência por dois motivos bobos: o botão **Restaurar**
> não funcionar, e a tela não deixar claro **preço, duração e renovação
> automática**. Os dois já estão previstos aqui.

---

## Duas coisas que ainda ficam pendentes

Independentes da cobrança, mas necessárias para publicar:

- [ ] **Preencher `OPERADOR` e `CONTATO`** em `src/data/privacyPolicy.ts`. Hoje
      aparecem literalmente como `[nome da pessoa ou empresa responsável]` na
      política de privacidade e na tela Sobre, e o e-mail de suporte não tem
      destinatário. As duas lojas exigem política de privacidade e um contato.
- [ ] **Revisão das práticas por um psicólogo.** São 31 textos sobre saúde
      mental. Estão escritos como autocuidado e nunca como tratamento, mas vale
      alguém da área ler antes de ir ao público.

---

## Resumindo, se você só tem 5 minutos hoje

1. Criar a conta Apple Developer (demora para aprovar — comece já)
2. Criar a conta Google Play Console
3. Preencher dados bancários e fiscais nas duas

O resto só anda depois disso.
