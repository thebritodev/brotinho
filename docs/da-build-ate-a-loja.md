# Da build até a loja

**Atualizado em 23 de agosto de 2026, depois que as duas builds saíram.**

---

## O que já aconteceu

| | |
|---|---|
| Projeto ligado ao EAS | `92636786-e023-4e58-bcfb-38aaa061c374`, conta `pedrodevtheone` |
| Build Android | `preview`, `.apk`, **finished** |
| Build iOS | `production`, build **5**, no TestFlight |
| Envio ao App Store Connect | aceito em 25/08/2026 |

O `.ipa` está com a Apple. Depois de processado, ele aparece em **TestFlight** e o
grupo **Time do Brotinho** distribui sozinho.

> **"Enviado" não quer dizer "aceito".** As builds **3 e 4 falharam** no
> processamento da Apple, as duas com o mesmo erro, e ninguém percebeu por um dia
> inteiro: o `eas submit` responde *"Submitted your app to App Store Connect!"*
> assim que o arquivo **sobe**. A validação da Apple vem depois, e o resultado só
> aparece em **TestFlight → Uploads de compilações**.
>
> ```
> 90683: Missing purpose string in Info.plist
> ... should contain a NSPhotoLibraryUsageDescription key
> ```
>
> A Apple exige o texto **mesmo que o app nunca abra a galeria** — basta alguma
> biblioteca referenciar a API. Aqui é a tela de compartilhar, que permite salvar
> o resumo da terapia nas fotos. Está no `app.json`, em `ios.infoPlist`.
>
> **Confira o status no TestFlight depois de cada envio.** Enquanto as duas
> estiveram em "Falha", a versão 1.0.0 não tinha compilação nenhuma anexada — ela
> não poderia ter ido para revisão nem se alguém tentasse.

A **build 5** é a primeira que existe de verdade no TestFlight, e a primeira com
tudo dentro: o apagar da gravação, a pausa que não derruba mais a conferência da
frase, o aviso quando o aparelho não consegue conferir, e o plano que o Android
não achava.
>
> As duas continuam sem cobrar — falta a chave do RevenueCat, ver
> `a-build-3-nao-cobra.md`. No TestFlight isso não atrapalha o teste: você entra
> com tudo liberado.

**O `.apk` para testar** — build de 23/08 às 23h, commit `b1808cf`:

```
https://expo.dev/artifacts/eas/B1qBlOgvIA9zxi6ok1fbLhSDxFOdUucnhhB0QGjJMaU.apk
```

Abra esse link **pelo celular**. O Android vai avisar que é um app de fora da
Play Store; é preciso permitir a instalação uma vez.

> **Não use o `.apk` anterior**
> (`gJLR3H3p4JV_lbfqIm7bcNrdwxPG3KRMjUKgbI6GVGo`). Ele foi compilado por volta
> das 20h, e dois consertos entraram depois: às 20h22 o apagar da gravação, e às
> 20h25 o que impede que **uma pausa desligue a conferência da frase**.
>
> O segundo é justamente o que se quer testar. Naquele `.apk`, ficar dois
> segundos calado no meio da prática derruba a conferência para o modo acústico —
> e aí qualquer barulho volta a contar. Testar nele levaria à conclusão errada
> sobre o trabalho todo.
>
> Esta build nova carrega os dois consertos, mais o aviso "Este aparelho não
> confere a frase" para quando o reconhecimento não estiver disponível.

Para gerar outra, quando precisar:

```
npx eas-cli build --platform android --profile preview
```

> **Da próxima vez é mais curto.** O EAS guardou o certificado de distribuição, o
> perfil de provisionamento, a chave do Android e a chave de API do App Store
> Connect. Uma build nova não pergunta mais nada — nem senha da Apple, nem código
> de dois fatores.
>
> ```
> npx eas build --platform ios --profile production
> npx eas submit --platform ios --profile production
> ```
>
> O `autoIncrement` sobe o número da build sozinho, e quem manda é o servidor do
> EAS, não o `app.json`. Não mexa em versão na mão.

---

## O que testar no `.apk` — e ainda não foi testado

O perfil `preview` entrega um `.apk` com link para baixar. Instala direto no
aparelho, sem loja.

**É o único jeito de exercitar hoje o que foi feito nos últimos dias.** Vale
percorrer esta lista, porque nada disso funciona no Expo Go:

- [ ] **Composta:** escreva uma frase, grave, e repita **ela**. O contador anda.
- [ ] **Composta, o teste que importa:** fale **outra coisa** qualquer. O contador
      **não pode andar**. Depois de uns seis segundos falando errado, a tela passa a
      dizer "Repita a frase que você escreveu".
- [ ] **Composta com barulho:** deixe um ventilador ligado, bata na mesa, feche uma
      porta. Nada disso pode contar.
- [ ] **Se aparecer "Este aparelho não confere a frase"**, a conferência não está
      disponível nesse celular e a contagem voltou a ser pelo som — aí o teste de
      cima vai falhar de propósito, e não é defeito.

      No Android, isso quase sempre é a falta do português offline:
      **Configurações → Google → Configurações de apps do Google → Pesquisa e
      Assistente → Voz → Reconhecimento de fala offline → Português (Brasil)**.
      Instale e refaça o teste.
- [ ] **Ditado do diário:** o texto aparece enquanto você fala. Se o aparelho não
      tiver o português offline, aparece a mensagem explicando — e isso é o
      comportamento certo, não um defeito.
- [ ] **Respiração:** som suave nas três fases, e vibração na virada de cada uma.
- [ ] **Vibração:** ao escolher um humor e a cada repetição da Composta.
- [ ] **Baixar meus dados:** em Privacidade. Conferir que o `.txt` abre legível.
- [ ] **Resumo para a terapia:** gera o PDF.
- [ ] **Bloqueio por digital**, se você usar.

---

## Se precisar enviar de novo

```
npx eas submit --platform ios --profile production
```

O `eas.json` já tem o Apple ID, o `ascAppId` **6803963494** e o time
**4PKPYM4M6J**. Não pergunta nada disso.

Depois de uns minutos a compilação aparece em **App Store Connect → TestFlight**, e
o grupo **Time do Brotinho** distribui sozinho — a distribuição automática já está
ligada.

> A Apple manda um e-mail chamado "processing complete" antes de a build ficar
> utilizável. Se o TestFlight disser "processando", é só esperar.

---

## Testar no iPhone

Precisa de um **iPhone de verdade**. Um MacBook não serve para isto: o simulador não
tem microfone, não vibra, e o reconhecimento de fala nele é irregular — justamente
o que precisa de teste.

No iPhone: baixe o **TestFlight** na App Store, aceite o convite, instale.

Refaça a lista de cima, e mais estas, que só existem no iOS:

- [ ] O **Taptic Engine** é diferente do vibrador do Android. A vibração ficou
      discreta demais ou forte demais?
- [ ] O reconhecimento de fala da Apple erra diferente do Google. A Composta ainda
      conta direito?
- [ ] A tela de compra, com um **testador Sandbox** (Usuários e acesso → Sandbox).
- [ ] **Restaurar compras** — é o motivo nº 1 de reprovação boba da Apple.

---

## Antes de mandar para revisão, leia isto

**A build 3 não cobra de ninguém** — falta a chave do RevenueCat, e o botão
"Assinar" entra no app de graça. O revisor não chega em compra nenhuma, e as
quatro compras foram enviadas junto com esta versão.

Detalhes e a saída em `docs/a-build-3-nao-cobra.md`.

## Mandar para revisão

**Antes do botão, falta anexar a compilação.** A versão 1.0 está sem nenhuma:
na seção **Compilação** aparece "Adicionar compilação", e sem isso não há o que
revisar. Conferido na tela em 25/08/2026 — a build 5 processou e ficou no
TestFlight, mas processar não anexa.

> **Não anexe a build 5.** Ela não cobra (ver `a-build-3-nao-cobra.md`).
> Anexar agora só criaria a sensação de que está pronto. A build a anexar é a
> primeira que sair depois das chaves do RevenueCat.

Depois disso, na página da versão 1.0, o botão **Adicionar para revisão**.

> **A Apple mudou como as compras entram na revisão.** A própria tela avisa:
> agora as compras e assinaturas são enviadas **das seções Compras dentro do app
> e Assinaturas**, e você inclui a versão no envio para que sejam revisadas em
> conjunto. **Não existe mais a lista de produtos para marcar na página da
> versão** — a instrução antiga daqui está morta.
>
> A regra de fundo continua: a primeira assinatura e a primeira compra dentro do
> app têm de ir **junto** com uma versão do app.

O lançamento está em **manual**: mesmo aprovado, o app só entra no ar quando você
clicar. Isso é de propósito — dá tempo de conferir a página antes de existir para o
público.

---

## Se a Apple reprovar

Não é fracasso, é rotina. Os motivos mais comuns, e o que já está feito contra cada um:

| motivo | como está |
|---|---|
| Pedem login e não deram conta | as notas de revisão começam com **"NÃO É NECESSÁRIO LOGIN"** em maiúsculas |
| Botão Restaurar não funciona | implementado; **teste no iPhone** |
| Preço e renovação pouco claros | o paywall mostra preço, duração e renovação automática |
| Faltou a captura do paywall | anexada nos quatro produtos |
| App de saúde sem aviso | a política e a tela Sobre dizem que não é tratamento, e trazem o CVV |

A resposta chega em **Revisão de apps**, com o motivo. Me traga o texto que eu leio
e corrijo.

---

## Verificado no `.apk` de 23 de agosto

Abri a build de Android e conferi o que ela realmente contém, porque "compilou"
não é o mesmo que "levou junto":

| | |
|---|---|
| Sons da respiração | os três `.wav` presentes |
| `expo-speech-recognition` | 122 referências no código compilado |
| `expo-audio` | 326 |
| `expo-notifications` | 435 |
| `expo-haptics` | 35 |
| `expo-local-authentication` | 41 |
| `expo-print` | 57 |
| RevenueCat | 6.457 |
| Tipo de build | **release** — o bundle é bytecode Hermes, não JavaScript de debug |

O último item importa mais do que parece: numa build de debug o `__DEV__` seria
verdadeiro, e o app se comportaria diferente do que vai para a loja — o ditado
devolveria texto de exemplo em vez de falhar honestamente.

> **Um alerta que não se confirmou, anotado para o Google Play.** Lendo as
> permissões do manifesto binário apareceram `SYSTEM_ALERT_WINDOW` e `DUMP`, que
> não fazem sentido aqui. Investigando, quem declara a primeira é o source set de
> **debug** do React Native, e o próprio arquivo diz que serve só para isso.
>
> A leitura que fiz extrai o *pool de strings* do manifesto, que contém palavras
> não necessariamente declaradas — então o mais provável é que seja resíduo. Não
> dá para afirmar nem desmentir sem `aapt dump permissions`, que precisa do SDK
> do Android. **Antes de publicar no Google Play, confira**: uma permissão de
> desenhar sobre outros apps exige justificativa e fica péssima na ficha de um
> app que promete privacidade.

---

## O que ainda depende só de você

- [ ] **Programa para Pequenas Empresas** — 15% de comissão em vez de 30%
- [ ] **Resposta automática** do `brotinho.suporte@gmail.com`
