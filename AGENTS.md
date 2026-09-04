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

Consequência prática, e é a que costuma pegar: **o app usa módulos nativos que o
Expo Go nunca teve** — `ExpoSpeechRecognition`, entre outros. Mesmo que as versões
batessem, a ditadura de voz do diário e a contagem da Composta não funcionariam lá.
Testar essas telas exige o development build, não o Expo Go.

## Antes de subir de SDK

Subir o SDK é decisão de produto, não de conveniência: a 1.0 está publicada (ou em
revisão) com este runtime, e trocar de SDK troca o que a Apple já revisou.
