# Rodar o Brotinho no celular

> **Este documento descrevia o Expo Go, e o Expo Go não vale mais aqui.**
>
> A Play Store subiu o Expo Go para o SDK 57, e o cliente recusa qualquer
> projeto que não seja da versão dele — este está no 54. A saída não foi subir
> de SDK, foi parar de depender do Expo Go: o projeto tem `expo-dev-client`, e
> o perfil `development` do `eas.json` gera um **development build**, um app
> próprio com o mesmo runtime do projeto.
>
> ```
> npx eas build --profile development --platform android
> ```
>
> Continua valendo tudo o que está abaixo sobre o servidor de desenvolvimento, o
> túnel, o firewall e o servidor de transcrição. O que trocou é **quem lê o QR**:
> o development build, não o Expo Go. Ver `AGENTS.md`.

Serve para ver o app no celular sem gerar build nova a cada mudança: o
development build baixa o JavaScript do servidor, igual o Expo Go fazia.

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

## Quando o celular simplesmente não conecta

Aconteceu, e a causa não estava no app: o **firewall do Windows bloqueia a
entrada na porta 8081**. Ele vem ativo no perfil Private e não traz regra
nenhuma para o node — então o celular bate na porta e não passa.

O que engana aqui é que **tudo parece certo do lado do computador**: o
`curl http://SEU-IP:8081` responde 200, o manifesto sai correto, o pacote
compila. Requisição saindo da própria máquina não atravessa o firewall. O
sintoma no celular é só um tempo esgotado, sem explicação.

Para conferir se é isso, num PowerShell:

```powershell
Get-NetFirewallRule -Direction Inbound -Enabled True | Where-Object { $_.DisplayName -match 'node|expo|8081' }
```

Se não voltar nada, é isto.

### Saída 1 — o túnel, que não pede nada do firewall

```bash
npx expo start --tunnel
```

O pacote sai por um endereço público em vez da rede local, e funciona até com o
celular no 4G. É mais lento para recarregar, e **o endereço muda a cada vez**.

Na primeira vez ele pede o `@expo/ngrok`; para instalar sem sujar o
`package.json`:

```bash
npm install --no-save @expo/ngrok@^4.1.0
```

**O ditado por voz não funciona pelo túnel.** Só o Metro é tunelado; o servidor
de transcrição continua na rede local, onde o celular não chega.

### Saída 2 — abrir as portas, uma vez só

Resolve de vez e mantém a rede local, que é mais rápida e faz o ditado
funcionar. É mexer em configuração de segurança do sistema, então rode você
mesmo, num PowerShell **como administrador**:

```powershell
New-NetFirewallRule -DisplayName "Expo Metro 8081" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -Profile Private
```

```powershell
New-NetFirewallRule -DisplayName "Brotinho transcricao 8787" -Direction Inbound -Protocol TCP -LocalPort 8787 -Action Allow -Profile Private
```

Só o perfil `Private` de propósito: em rede pública — cafeteria, aeroporto —
essas portas continuam fechadas, que é o certo.

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

## Por que o SDK continua no 54

O motivo **mudou**, e o que estava escrito aqui ficou errado. Dizia que o Expo
Go do aparelho era o 54.0.8 e que por isso o projeto não podia subir. Esse
motivo acabou quando a Play Store atualizou o Expo Go: hoje ele é 57, e o
projeto deixou de depender dele.

O motivo de agora é de produto, não de ferramenta: a 1.0 foi revisada pela Apple
com este runtime, e trocar de SDK troca o que ela já revisou. Ver `AGENTS.md`.

---

## Quando o APK baixa inteiro e não instala

Acontece desde 07/09/2026 no aparelho de teste, e é o motivo de nenhuma
build nova ter chegado nele desde então: o download vai até 100%, o arquivo
está lá, e tocar nele não abre instalador nenhum. Sem erro, sem aviso.

**O que está descartado.** Não é a build: os mesmos arquivos instalam em
outros aparelhos, e o EAS marca `FINISHED` com o APK assinado. Não é espaço
em disco nem download corrompido — o arquivo chega completo.

**A suspeita, e ela é suspeita.** O Auto Blocker do One UI bloqueia
instalação de app vindo de fora da loja, e quando bloqueia ele faz
exatamente isto: nada. É o comportamento que bate com o sintoma, e ainda
não foi confirmado no aparelho.

### Os três caminhos, do mais provável para o mais trabalhoso

1. **Desligar o Auto Blocker.** Ajustes → Segurança e privacidade → Auto
   Blocker. Se estiver ligado, é quase certo que era ele.
2. **Autorizar só o navegador.** Ajustes → Apps → o navegador usado →
   Instalar apps desconhecidos → permitir. Mantém o Auto Blocker ligado para
   o resto.
3. **Instalar pelo cabo, com `adb install`.** É o caminho que não depende de
   nenhum ajuste do aparelho, e o único que dá **mensagem de erro** quando
   falha — que é o que falta hoje para sair do palpite.

### O caminho do cabo, passo a passo

O `adb` **não está nesta máquina** (conferido em 16/09/2026: não está no
PATH nem nas pastas padrão do Android SDK). Ele vem no pacote
`platform-tools`, que é um zip de uns 10 MB e não precisa instalar nada:

1. Baixar o `platform-tools` para Windows, do site de desenvolvedores do
   Android, e descompactar numa pasta qualquer.
2. No celular: Ajustes → Sobre o telefone → Informações de software → tocar
   sete vezes em "Número da versão". Isso liga as Opções do desenvolvedor.
3. Ajustes → Opções do desenvolvedor → **Depuração USB**, ligar.
4. Ligar o cabo e aceitar a pergunta que aparece na tela do celular.
5. Na pasta do `platform-tools`: `.\adb.exe devices` deve listar o aparelho,
   e `.\adb.exe install -r caminho\do\brotinho.apk` instala.

O `-r` reinstala por cima mantendo os dados. Sem ele, um app já instalado
com assinatura diferente devolve `INSTALL_FAILED_UPDATE_INCOMPATIBLE` — e aí
o caminho é desinstalar antes, **o que apaga o diário do aparelho**, porque
os dados são locais e não existe cópia nossa. Antes de desinstalar qualquer
coisa, exportar em Ajustes → Meus dados.

---

## Quando a build é obrigatória

- Testar **cobrança** (compra, restaurar, sandbox).
- Testar o **ditado do diário** e a contagem da Composta: os dois usam
  `ExpoSpeechRecognition`, módulo nativo que o Expo Go nunca teve. No
  development build funcionam.
- Ouvir a **voz das práticas guiadas**: `expo-speech`, desde 16/09/2026. É
  módulo nativo como os outros, então não chega por recarregar o bundle —
  o app antigo continua mudo por mais que o Metro atualize o JavaScript.
- Qualquer coisa que dependa do `app.json`: ícone, splash, permissões,
  `privacyManifests`.

Para isso, `docs/da-build-ate-a-loja.md`.
