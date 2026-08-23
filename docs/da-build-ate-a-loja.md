# Da build até a loja

O que fazer depois que a compilação terminar, na ordem. Escrito antes de precisar,
para nada ser decidido no susto.

**Estado quando isto foi escrito (22 de agosto de 2026):** tudo do lado da Apple
está configurado e ativo. Falta a compilação, que depende de um `npx eas login`.

---

## O que trava, e por quê

| trava | quem resolve |
|---|---|
| `npx eas login` | você — é senha |
| Senha da Apple e código de dois fatores, na build de iOS | você — é senha |
| O resto | eu |

A build de **Android não pede senha nenhuma**: o EAS gera a chave de assinatura
sozinho. Essa dá para tocar inteira sem você.

---

## Passo 1 — Disparar

Um comando de cada vez. As duas rodam em paralelo na fila do Expo.

```
npx eas login
npx eas build --platform ios --profile production
npx eas build --platform android --profile preview
```

A primeira build vai perguntar se pode criar o projeto no EAS. **Sim.** Ela grava um
`extra.eas.projectId` no `app.json` — é esperado, e deve ser commitado.

Depois pede Apple ID, senha e o código de dois fatores. O EAS cria sozinho o
certificado de distribuição e o perfil de provisionamento, e guarda os dois. Da
segunda build em diante não pergunta mais.

> **`autoIncrement` está ligado** no perfil de produção, e o `appVersionSource` é
> `remote`. O número da build sobe sozinho a cada compilação, e quem manda é o
> servidor do EAS, não o `app.json`. Não mexa em versão na mão.

Cada build leva de 10 a 30 minutos, contando fila.

---

## Passo 2 — O `.apk` do Android, que dá para testar hoje

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

## Passo 3 — Enviar o iOS

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

## Passo 4 — Testar no iPhone

Precisa de um **iPhone de verdade**. Um MacBook não serve para isto: o simulador não
tem microfone, não vibra, e o reconhecimento de fala nele é irregular — justamente
o que precisa de teste.

No iPhone: baixe o **TestFlight** na App Store, aceite o convite, instale.

Refaça a lista do passo 2, e mais estas, que só existem no iOS:

- [ ] O **Taptic Engine** é diferente do vibrador do Android. A vibração ficou
      discreta demais ou forte demais?
- [ ] O reconhecimento de fala da Apple erra diferente do Google. A Composta ainda
      conta direito?
- [ ] A tela de compra, com um **testador Sandbox** (Usuários e acesso → Sandbox).
- [ ] **Restaurar compras** — é o motivo nº 1 de reprovação boba da Apple.

---

## Passo 5 — Mandar para revisão

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
| Botão Restaurar não funciona | implementado; **teste no passo 4** |
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

- [ ] `npx eas login`
- [ ] **Programa para Pequenas Empresas** — 15% de comissão em vez de 30%
- [ ] **Período de tolerância** nas assinaturas
- [ ] **Resposta automática** do `brotinho.suporte@gmail.com`
- [ ] **Revisão das 31 práticas por um psicólogo** — a única que não tem prazo, e a
      única que ninguém além de um profissional pode fazer
