# Rodar o Brotinho no Expo Go

Serve para ver o app no celular em segundos, sem gerar build. É onde o
desenvolvimento acontece; a build é para o que o Expo Go não consegue mostrar.

---

## Os dois comandos

```bash
npm start
```

Aparece um QR. No Android, abra o **Expo Go** e leia o código. No iPhone, leia
com a câmera.

Se quiser o ditado por voz funcionando, abra **outro terminal**:

```bash
cd server && node index.js
```

Ele transcreve **nesta máquina**, com Whisper local: sem chave, sem conta, sem
custo, e o áudio não sai daqui.

---

## A pegadinha que já custou uma sessão inteira

O celular não enxerga `localhost`. O `.env` guarda o **IP desta máquina na
rede**, e esse IP muda — troca de roteador, cabo por Wi-Fi, DHCP renovando.

Quando o ditado falhar com *"Não consegui alcançar http://192.168.x.x:8787"*, é
quase sempre isso. Confira o IP atual:

```bash
powershell -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' } | Select-Object IPAddress, InterfaceAlias"
```

E ajuste `EXPO_PUBLIC_TRANSCRIPTION_URL` no `.env` da raiz. **Reinicie o
`npm start` depois**: as variáveis `EXPO_PUBLIC_*` entram no pacote na hora de
compilar, não na hora de rodar — trocar o `.env` com o servidor no ar não muda
nada, e isso engana bem.

O celular também precisa estar na **mesma rede** do computador. Rede de
visitante do roteador costuma isolar os aparelhos entre si e quebra tudo.

---

## O que não funciona no Expo Go, e por quê

Dois módulos nativos não vêm no aplicativo da Expo, e nenhum dos dois pode ser
resolvido por configuração — eles precisam de uma build de verdade.

| O que | Por quê | O que acontece |
|---|---|---|
| **Assinatura** (`react-native-purchases`) | módulo nativo de terceiro | o app **não bloqueia ninguém**: o estado vira `indisponivel` e o paywall do onboarding entra direto. Ver `services/subscription.ts`. |
| **Ditado local** (`expo-speech-recognition`) | módulo nativo de terceiro | cai no gravador + servidor da pasta `server/`, que só existe em desenvolvimento. Ver `services/transcription.ts`. |

> **Nenhum dos dois derruba o app.** Os dois são pedidos com uma checagem antes:
> `NativeModules.RNPurchases` num caso, `requireOptionalNativeModule` no outro.
> Isso não é zelo excessivo — o app **já caiu na abertura** uma vez por importar
> o pacote de reconhecimento de fala no topo do arquivo, e o comentário em
> `services/speech.ts` guarda essa lição.

Também não funciona: **notificação remota** no Android (a Expo tirou do Expo Go
no SDK 53). O Brotinho só usa notificação **local**, que continua funcionando —
então o lembrete diário e o resumo semanal podem ser testados normalmente.

Tudo o mais roda: diário, Composta, práticas, jardim, colheita, biometria,
exportar, trazer de volta, gravação de áudio, vibração.

---

## Por que o SDK está preso no 54

Está escrito no `AGENTS.md`, e vale repetir aqui porque é onde a pessoa vai
procurar: o Expo Go instalado no aparelho de teste é o **54.0.8**. Um app em SDK
55 simplesmente não abre nele.

Antes de subir de SDK, confirme qual versão do Expo Go o aparelho tem de fato —
a Play Store diz "atualizado" e entrega cliente antigo com alguma frequência.
O manifesto que o `npm start` serve carrega `runtimeVersion: exposdk:54.0.0`, e
é esse número que precisa bater.

---

## Quando a build é obrigatória

- Testar **cobrança** (compra, restaurar, sandbox).
- Testar o **ditado que não sai do aparelho** — o do Expo Go passa por um
  servidor, ainda que seja o seu.
- Qualquer coisa que dependa do `app.json`: ícone, splash, permissões,
  `privacyManifests`.

Para isso, `docs/da-build-ate-a-loja.md`.
