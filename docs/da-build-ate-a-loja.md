# Da build até a loja

**Atualizado em 23 de agosto de 2026, depois que as duas builds saíram.**

---

## O que já aconteceu

| | |
|---|---|
| Projeto ligado ao EAS | `92636786-e023-4e58-bcfb-38aaa061c374`, conta `pedrodevtheone` |
| Build Android | `preview`, `.apk`, **finished** |
| Build iOS | `production`, build **3**, **finished** |
| Envio ao App Store Connect | **finished** |

O `.ipa` está com a Apple. Depois de processado, ele aparece em **TestFlight** e o
grupo **Time do Brotinho** distribui sozinho.

**O `.apk` que existe hoje está velho — gere outro antes de testar.**

```
npx eas-cli build --platform android --profile preview
```

> **Por que não serve o link antigo.** A build de Android começou por volta das
> 20h de 23 de agosto. Dois consertos entraram depois: às 20h22 o apagar da
> gravação, e às 20h25 o que impede que **uma pausa desligue a conferência da
> frase**.
>
> O segundo é justamente o que se quer testar. Naquele `.apk`, ficar dois
> segundos calado no meio da prática derruba a conferência para o modo acústico —
> e aí qualquer barulho volta a contar. Testar nele levaria à conclusão errada
> sobre o trabalho todo.
>
> O `.apk` velho, para registro:
> `https://expo.dev/artifacts/eas/gJLR3H3p4JV_lbfqIm7bcNrdwxPG3KRMjUKgbI6GVGo.apk`

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

Na página da versão 1.0, o botão **Adicionar para revisão**.

> **A primeira assinatura e a primeira compra dentro do app têm de ir junto com a
> versão.** Não dá para enviar antes nem depois. Confira que os quatro produtos
> estão marcados no envio.

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
- [ ] **Período de tolerância** nas assinaturas
- [ ] **Resposta automática** do `brotinho.suporte@gmail.com`
