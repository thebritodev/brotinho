# O que falta, e é seu — Play Console e App Store

Estado em **26/10/2026**. Tudo que dava para fazer sem a sua mão já está feito
no console; o que sobrou aqui é o que pede aceite de termos, dado bancário,
chave, arquivo grande demais para o navegador, ou decisão de publicar.

A ordem importa: cada passo destrava o seguinte.

---

## Já está feito no Play Console

Tudo salvo como **mudança pendente**: nada disso vai para revisão até você
enviar em **Visão geral da publicação**.

| Tarefa | Resposta |
|---|---|
| Política de privacidade | `https://thebritodev.github.io/brotinho/privacidade.html` |
| Anúncios | não tem |
| Apps governamentais | não |
| Recursos financeiros | nenhum |
| Apps de saúde | Controle de estresse, relaxamento e acuidade mental · Controle do sono — **nada** em Medicina |
| Detalhes do login | **Não** (ver o passo 8: vira "Sim" quando a build que cobra for ao teste fechado) |
| Público-alvo | 13 a 15, 16 a 17, maiores de 18 |
| Segurança dos dados | áudio (efêmero, opcional) e histórico de compras (obrigatório) — detalhe em `ficha-google-play.md`, seção 3 |
| Ficha da loja | nome, descrição curta e completa, ícone, destaque e as 7 capturas em 1080 × 1920, na ordem |
| Declaração de IA da ficha | **não rotular** — as capturas são telas reais montadas por script; os textos foram redigidos comigo e revisados. Se preferir rotular, é ali |
| Categoria | Saúde e fitness |
| Contato | `brotinho.suporte@gmail.com` · site `https://thebritodev.github.io/brotinho/` |
| Teste de licença | lista "Brotinho - testes de assinatura" com o seu e-mail |
| Teste interno | a mesma lista como testadores — falta só o `.aab` |
| ID de publicidade | **não usa** — conferido no manifesto do `.aab`: não tem `AD_ID` |

---

## 1. Autorizar a política nova no site — **uma palavra**

A política dizia que nada era compartilhado com terceiros e não falava da
RevenueCat, que recebe um código anônimo e o histórico de compras de quem
assina. Escrevi a seção 10, **"Assinatura"**, e o commit `3b04c24` está pronto,
mas **não enviei**: enviar publica no site.

- Leia a seção em `docs/privacidade.html` (ou peça que eu mostre)
- Responda **"pode publicar"** e eu envio e confiro o site no ar

O link de exclusão da Segurança dos dados já aponta para a seção 11 nova.
**Até publicar, ele cai na seção errada** — no site de hoje, a 11 é "Crianças e
adolescentes". Publique antes de mandar qualquer coisa para revisão.

## 2. Classificação de conteúdo (IARC) — **5 minutos**

Eu não preencho: a primeira tela traz *"Concordo com os Termos de Uso"* da
IARC, e aceitar termos em seu nome está fora do que eu faço.

**Conteúdo do app → Classificações de conteúdo → Iniciar questionário**

1. **E-mail:** `brotinho.suporte@gmail.com`
2. **Categoria:** *Todos os Outros Tipos de Aplicações*
3. Marque os Termos de Uso → **Avançar**
4. As perguntas, por tipo:

| Pergunta sobre | Resposta |
|---|---|
| Violência, sangue, medo/terror | **Não** |
| Sexo, nudez, conteúdo sexual | **Não** |
| Linguagem imprópria, humor grosseiro | **Não** |
| Drogas, álcool, tabaco | **Não** |
| Jogos de azar, apostas, loot box | **Não** |
| Usuários interagem ou trocam conteúdo entre si | **Não** — o diário não sai do aparelho |
| Compartilha a localização do usuário | **Não** |
| Compra de bens digitais | **Sim** — assinaturas e vitalício |
| É navegador ou mecanismo de busca | **Não** |
| É app de notícias | **Não** |
| Menciona suicídio ou automutilação (se a pergunta aparecer) | **Sim** — o app mostra o CVV 188 como encaminhamento |

5. **Salvar** → confira a classificação (esperada: Livre a 12) → **Enviar**

## 3. Perfil de pagamentos — **dados bancários, só você**

**Configurações (ícone de engrenagem à esquerda) → Perfil de pagamentos**

Sem ele o Google não deixa criar assinatura nenhuma. Nome, endereço e banco
iguais aos da verificação de identidade.

## 4. Enviar o primeiro `.aab` ao teste interno — **10 minutos**

A build do perfil `primeiro-envio-play` (commit `13cbee5`, sem cobrança) é a
que estou acompanhando; o link e o caminho do arquivo ficam no fim deste
documento quando ela terminar. O arquivo passa de 10 MB, e o navegador que eu
controlo não envia arquivo desse tamanho — por isso é seu.

1. **Testar e lançar → Teste interno → Criar versão**
2. Se pedir, aceite a **Assinatura de apps do Google Play** (termos — seu)
3. Arraste o `.aab`
4. Nome da versão: deixe o sugerido · Notas: `Primeira versão do Brotinho no Android.`
5. **Avançar → Salvar e publicar** (o teste interno não passa por revisão
   demorada; quem instala são só os testadores internos)
6. Em **Testadores**, crie uma lista com o seu e-mail e copie o link de
   participação para instalar no seu Android

## 5. Criar os produtos — **depois dos passos 3 e 4**

**Monetizar com o Google Play → Produtos → Assinaturas → Criar assinatura**

| ID do produto | Nome | Plano básico | Preço (Brasil) |
|---|---|---|---|
| `brotinho_mensal` | Brotinho Mensal | `mensal`, renovação automática, 1 mês | R$ 29,90 |
| `brotinho_anual` | Brotinho Anual | `anual`, renovação automática, 1 ano | R$ 179,90 |

**Produtos → Produtos únicos → Criar produto:** `brotinho_vitalicio`,
"Brotinho Vitalício", R$ 399,90.

Ative o plano básico de cada um (cada um tem o botão **Ativar**). `brotinho_semanal`
**não** entra.

**Os IDs dos planos básicos têm de ser exatamente `mensal` e `anual`**, e
cada um marcado como compatível com versões anteriores (o primeiro plano já
vem assim). A RevenueCat já está esperando por `brotinho_mensal:mensal` e
`brotinho_anual:anual` — um ID diferente e a compra não libera nada.

> Se preferir, me avise quando os passos 3 e 4 estiverem feitos e eu crio os
> três produtos pelo navegador — não tem termo nem dado sensível ali.

## 6. RevenueCat no Android — **a chave é sua**

**Já feito na RevenueCat (26/10/2026):** o app **Brotinho Android**
(`com.brotinho.app`), os três produtos (`brotinho_mensal:mensal`,
`brotinho_anual:anual`, `brotinho_vitalicio`), todos ligados ao `premium`, e
cada um no pacote certo da oferta `brotinho` — que também está confirmada
como a padrão. O semanal fica sem Android, de propósito.

Falta só a credencial e a chave:

1. **Google Cloud → IAM → Contas de serviço → Criar** · baixe a chave **JSON**
2. Play Console → **Usuários e permissões → Convidar** o e-mail da conta de
   serviço, com permissão de **ver dados financeiros e gerenciar pedidos**
3. RevenueCat → **Apps → Brotinho Android** → solte o JSON em *Service
   Account Credentials JSON* → **Save changes**
4. Ainda ali, siga *Google developer notifications* (a RevenueCat mostra o
   tópico do Pub/Sub para colar no Play Console) — sem isso, cancelamentos e
   renovações chegam com atraso
5. **API keys → Brotinho Android** → copie a chave pública `goog_…` e guarde
   no EAS **você mesmo**:

```bash
npx eas-cli env:create --environment production --name EXPO_PUBLIC_REVENUECAT_ANDROID --value goog_COLE_AQUI --visibility sensitive
```

6. Deixe o JSON na raiz do projeto como `chave-google-play.json` (o Git já o
   ignora) — é o que permite o `eas submit` dos envios seguintes

Quando a chave estiver no EAS, me avise: eu rodo `npm run confere-cobranca --
production android` e gero a build que cobra.

## 7. Os 12 testadores por 14 dias

O convite, a lista e como testar sem pagar estão em
[`teste-fechado-android.md`](teste-fechado-android.md). Eles precisam **aceitar
e instalar**; os 14 dias só começam a contar aí.

## 8. Detalhes do login — quando a build que cobra for ao teste fechado

Hoje está **"Não"**, e é verdade: o `.aab` do passo 4 sai sem a chave da
RevenueCat, e sem ela o app não tranca nada. A build que cobra muda isso — o
revisor do Google não paga assinatura e não usa conta pessoal.

Antes de mandar essa build para o teste fechado:

1. **Monetizar → Códigos promocionais** → crie um código para `brotinho_anual`
2. **Conteúdo do app → Detalhes do login → Sim → Adicionar informações**,
   em inglês:
   - Nome: `Subscription access`
   - Usuário e senha: deixe em branco
   - Outras informações: `No account or login. After the 10-step onboarding, a paywall asks for a subscription through Google Play Billing. Redeem this promo code in the Play Store (Menu > Payments & subscriptions > Redeem code) to unlock everything: <CÓDIGO>.`

---

## App Store — dois itens, e dois opcionais

### A etiqueta de privacidade — **falta uma finalidade**

A etiqueta publicada declara Compras e Identificadores, não vinculados, só
com "Funcionalidade do app". A RevenueCat manda marcar também **Análise** em
Compras (*"All RevenueCat users must select these two options"*).

**App Store Connect → Brotinho → Privacidade do app → Compras → Editar →
marque "Análise" → Salvar → Publicar.** Não precisa de build nova.

### Lançar a 1.3.3

Aprovada e parada em "Aguardando lançamento pelo desenvolvedor". Quando
quiser: **App Store Connect → Distribuição → 1.3.3 → Lançar esta versão**.
Depois disso eu abro a 1.3.4, e a build nova de iPhone sai a partir de
**01/11**, quando a cota do EAS volta.

### Opcional — a RevenueCat enxergar os produtos da Apple

Os quatro produtos do iOS aparecem como **"Could not check"** na RevenueCat.
Não é defeito de cobrança: a chave de compras (`XN4R2J2C47`) está válida, e é
ela que confirma as compras. O que falta é a **chave da API do App Store
Connect**, que só serve para a RevenueCat ler o estado e o preço dos produtos.
Eu não envio chave privada para outro serviço, então é sua:

**RevenueCat → Apps → Brotinho iOS → App Store Connect API → solte o
`AuthKey_….p8`** (o Key ID e o Issuer são pedidos ali) **→ Save changes.**

### Opcional — notificações do servidor da Apple

Na mesma página, *Apple Server Notification URL* diz "No notifications
received". Copie a URL que ela mostra e cole em **App Store Connect →
Brotinho → Informações do app → Notificações do servidor da App Store →
Produção** (versão 2). Assim cancelamentos e reembolsos chegam na hora, e não
só quando a pessoa abre o app.

---

## O `.aab`

| | |
|---|---|
| Arquivo | `loja/google-play/brotinho-1.3.3-2-primeiro-envio.aab` (70 MB) |
| Link | https://expo.dev/artifacts/eas/H1WDXo_62V1stCGceknCnXzgpZqWloTb96VJjE5W_QA.aab |
| Versão | 1.3.3, código 2 · perfil `primeiro-envio-play` · commit `13cbee5` |
| Cobrança | **não cobra** — sem a chave `goog_…`; é para o teste interno |

Conferido no manifesto: tem `com.android.vending.BILLING` (é o que destrava a
criação das assinaturas) e não tem `AD_ID` nem as permissões de leitura da
galeria.
