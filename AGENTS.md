# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

Este projeto está no **SDK 54**.

## O Expo Go não vale mais como referência

O motivo antigo de travar no 54 era o Expo Go do aparelho de teste (54.0.8, Android).
Esse motivo **acabou**: a Play Store atualizou o Expo Go para o SDK 57, e o cliente
recusa qualquer projeto que não seja da versão dele.

A saída não foi subir de SDK — foi parar de depender do Expo Go. O projeto tem
`expo-dev-client`, e o perfil `development` do `eas.json` gera um **development
build**: um app próprio, com o mesmo runtime do projeto, que não fica refém da
versão que a loja resolver instalar.

Para gerar um:

```
npx eas build --profile development --platform android
```

E para rodar o Metro **para ele**, e não para o Expo Go:

```
npm start        # expo start --dev-client
npm run tunel    # o mesmo, por túnel, quando o celular não está na mesma rede
```

Os dois scripts já vinham errados: `npm start` era `expo start` puro, que
imprime o QR do **Expo Go**. Quem lia este arquivo, entendia, e depois rodava
`npm start` caía exatamente na armadilha que ele descreve — o Expo Go abre,
recusa o SDK e diz `error loading app`. Aconteceu.

Se esse erro aparecer de novo, a pergunta não é "o que quebrou no app": é
**qual aplicativo está abrindo o projeto**. `error loading app` é a mensagem
do Expo Go. O development build nunca diz isso; quando ele falha, mostra a
tela vermelha com a pilha.

Consequência prática, e é a que costuma pegar: **o app usa módulos nativos que o
Expo Go nunca teve** — `ExpoSpeechRecognition`, entre outros. Mesmo que as versões
batessem, a ditadura de voz do diário e a contagem da Composta não funcionariam lá.
Testar essas telas exige o development build, não o Expo Go.

## Antes de subir de SDK

Subir o SDK é decisão de produto, não de conveniência: a 1.0 está publicada (ou em
revisão) com este runtime, e trocar de SDK troca o que a Apple já revisou.
