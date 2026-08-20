# Brotinho — React Native (Expo)

Porte do protótipo `Brotinho - Onboarding completo (offline).html` para React Native com Expo SDK 54 e TypeScript.

## Rodando

```bash
npm install
```

```bash
npx expo start
```

Abra pelo **Expo Go** lendo o QR code, ou pressione `a` (Android) / `i` (iOS, só em macOS) / `w` (navegador).

## O que está aqui

**Onboarding (12 telas)** — boas-vindas, check-in, nome, valores (até 3), horário de sono, o que já tentou, lembrete diário, faixa etária, gênero, canal de aquisição, resumo e paywall. O botão "Continuar sem assinar" leva à variante gratuita.

**App (5 abas)** — Início, Práticas, Diário, Valores e Perfil, mais as telas empilhadas: Composta (pela Home), e Para minha terapia, Configurações e Privacidade (pelo Perfil).

## Composta

A ferramenta central da Home. A pessoa escreve um pensamento que a incomoda e o repete em voz alta por 35 segundos; a frase vai se desmanchando na tela e cada repetição vira adubo para o broto.

O fundamento é real: **saciedade semântica** — repetir uma frase rápido e muitas vezes faz o cérebro parar de processá-la como significado. Em terapia ACT chama-se defusão cognitiva.

Quatro passos em [`src/screens/composta/`](src/screens/composta/): explicação → escolha do pensamento → compostagem → resultado.

**O microfone é sensor, não gravador.** [`useCompostSession`](src/screens/composta/useCompostSession.ts) lê o medidor de nível do `expo-audio` para confirmar que há voz de verdade — não dá para fingir nem pausar. Detecta repetições pelo ataque da voz, com piso de ruído adaptativo para funcionar em ambientes diferentes. Nenhum áudio é salvo ou enviado.

Sem permissão de microfone a prática não morre: cai para um botão "segurar e repetir".

## Estrutura

```
App.tsx                     carrega as fontes e monta os providers
src/
  theme/                    tokens (cores, espaçamento, sombras, tipografia)
  components/
    core/                   Button, Card, Chip, Icon, Input, Switch, TextArea, Badge, IconButton
    brand/                  Sprout, AnimatedSprout, MoodSelector, ValueBadge, InsightCard,
                            PracticeTopicCard, PracticeIllustration
    feedback/               StatRow
    navigation/             BottomNav, TopBar
  screens/
    onboarding/             OnboardingScreen, Paywall, TimeWheel, parts
    app/                    Home, Practices, Journal, Values, Profile, TherapySummary, Settings, Privacy
    composta/               CompostaScreen, useCompostSession, FallingWords
    practices/              PracticeDetailScreen, BreathingGuide, StepGuide
  navigation/               RootNavigator (onboarding vs app), MainTabs
  state/                    AppStateProvider, tipos e cálculos derivados
  storage/                  wrapper do AsyncStorage
  services/                 fala, transcrição, notificações, PDF da terapia
  data/                     copy do onboarding e conteúdo das práticas
```

### Notas de porte

- **Tokens** — as CSS custom properties (`--green-500`, `--shadow-sm`...) viraram objetos em `src/theme/tokens.ts`. As sombras usam `shadow*` + `elevation` para cobrir iOS e Android.
- **Fontes** — Baloo 2 (títulos) e Nunito (corpo) vêm de `@expo-google-fonts`. Como `fontWeight` não é confiável com fontes customizadas no RN, cada peso é uma família própria (`fonts.body.bold`, `fonts.display.extraBold`).
- **Mascote** — o SVG do broto foi portado para `react-native-svg` mantendo os mesmos paths, estágios (1–3), humores e enfeites por valor.
- **Roda de horário** — o arrasto por ponteiro virou `PanResponder`, com o mesmo passo de 26px por unidade. O `<input type="time">` do passo do lembrete virou um campo que abre a roda em um modal.
- **Papel pautado do Diário** — o `repeating-linear-gradient` virou linhas posicionadas atrás do `TextInput`.
- **Navegação** — feita por estado (`RootNavigator` + `MainTabs`), espelhando o protótipo e preservando a `BottomNav` própria. Trocar por React Navigation depois é direto: as telas não conhecem o navegador.

## Dados

Tudo local, via AsyncStorage, na chave `@brotinho/app-state-v1`: respostas do onboarding, plano escolhido, histórico de humor, registros do diário, compostagens e as preferências de lembrete e privacidade. Não há login nem backend.

"Sair da conta" (Configurações) limpa os dados locais e devolve o app ao onboarding — útil para testar o fluxo de novo.

## Dados reais, não placeholders

Nada de número inventado. Tudo que a interface mostra como estatística é calculado em [`src/state/derived.ts`](src/state/derived.ts) a partir do que a pessoa registrou:

- **dias cuidados** — dias distintos com humor ou registro no diário
- **valores vividos** — termos ligados a cada valor encontrados nos textos
- **padrões** — só aparecem a partir de 5 registros; abaixo disso seria adivinhação
- **humor na semana** — dias sem registro ficam vazados, não coloridos de mentira
- **temas dos desabafos** — palavras-chave nos próprios textos

A análise roda inteira no aparelho: nenhum texto do diário sai do celular para isso.

Quem acabou de instalar vê zeros e mensagens de "ainda não dá pra dizer" — não um histórico falso.

## Voz no Diário

A pessoa fala e o texto aparece. Duas implementações, escolhidas automaticamente:

**No aparelho (padrão).** `expo-speech-recognition` usa o reconhecimento de fala nativo do Android/iOS: sem chave, sem servidor, sem custo por minuto, e **o áudio nunca sai do celular** — o que sustenta a promessa da tela de Privacidade. O texto aparece ao vivo enquanto a pessoa fala. Por ser módulo nativo de terceiros, só funciona em build próprio, não no Expo Go.

**Na nuvem (reserva).** Onde o módulo nativo não existe — Expo Go — o app grava com `expo-audio` e envia para o backend em [`server/`](server/). Esse backend existe por um motivo só: guardar a chave da API fora do aplicativo, porque chave embutida em APK é chave vazada.

Para ligar o caminho de nuvem:

```bash
cd server && npm install && cp .env.example .env
```

Preencha `GROQ_API_KEY` — a camada gratuita do Groq não pede cartão (chave em https://console.groq.com/keys). OpenAI e Deepgram também funcionam; troque `TRANSCRIPTION_PROVIDER`. Depois `npm start`.

O `.env` da raiz aponta para `http://192.168.0.91:8787/transcrever`; ajuste se o IP da máquina mudar, porque o celular não enxerga `localhost`.

Sem chave nenhuma, o áudio é gravado mas o texto inserido é de demonstração — e a tela avisa isso, em vez de fingir que transcreveu.

## Lembrete diário

`expo-notifications` agenda a notificação no horário escolhido no passo 6 do onboarding. O agendamento fica sincronizado com o switch de Configurações e com o horário: mudar qualquer um dos dois reagenda, e usa identificador fixo para nunca acumular duplicatas.

## Cópia de segurança

O app não tem conta nem servidor, então perder o celular seria perder o diário. A saída sem backend: deixar o próprio sistema do aparelho cuidar disso.

- **Android** — `android.allowBackup: true` no `app.json`. O backup automático guarda os dados do app no Google Drive da pessoa e restaura sozinho na reinstalação. Já era o padrão; está explícito agora para ninguém desligar sem querer.
- **iOS** — `RCTAsyncStorageExcludeFromBackup: false` no `ios.infoPlist`. **Necessário**: o AsyncStorage exclui seus dados do iCloud por padrão (veja `RNCAsyncStorage.mm`, "by default, we want to exclude AsyncStorage data from backup").

A cópia fica na conta Google ou Apple da própria pessoa. Nada passa por nós, e a política de privacidade descreve isso, inclusive como desativar e o efeito colateral: reinstalar pode trazer os registros de volta, então quem quer apagar de verdade deve usar "Apagar meus dados" antes de desinstalar.

Isto é backup de aparelho, não sincronização: restaura ao trocar de celular, mas não mantém dois aparelhos em dia. Backup por conta de e-mail exigiria autenticação, servidor e — para um diário — criptografia ponta a ponta, para que o operador não consiga ler os desabafos.

## Privacidade

Os interruptores de Privacidade fazem o que dizem — não há controle decorativo:

- **Bloqueio do app** exige biometria ao abrir e ao voltar do segundo plano.
- **Análise dos meus registros**, quando desligada, faz `livedValues` e `ventThemes` pararem de ler os textos do diário. A aba Valores e o resumo de terapia esvaziam, e a mensagem diz que a análise está desligada, em vez de fingir que faltam registros.

Havia um terceiro, "Contribuir de forma anônima", herdado do protótipo. Ele só gravava um booleano e nunca enviou nada. Foi **removido**: prometer coleta anônima sem implementá-la é declaração falsa numa tela de privacidade, e as lojas exigem declarar o que se coleta. Se um dia houver telemetria de verdade, o interruptor volta junto com a política de privacidade que o sustente.

## Bloqueio do app

`expo-local-authentication` cobre o app com uma tela de bloqueio quando o switch de Privacidade está ligado, e **rebloqueia ao voltar do segundo plano**. Se o aparelho não tiver biometria cadastrada, o bloqueio é ignorado — trancar a pessoa para fora do próprio diário seria pior do que não bloquear.

## Resumo para terapia em PDF

`expo-print` gera o PDF a partir dos dados reais e `expo-sharing` abre a folha de compartilhamento do sistema. O PDF traz padrões, contagens e o humor da semana — **o texto dos registros não vai junto**, para a pessoa decidir o que quer contar.

## Ainda não integrado

| O quê | Onde | O que falta |
| --- | --- | --- |
| Assinatura | paywall | RevenueCat ou IAP — exige contas na App Store / Play Console e build próprio |

## Antes de publicar

1. **Build próprio** — `npx expo prebuild` + EAS Build. O Expo Go não carrega o reconhecimento de fala nativo nem compras no app.
2. **Pagamentos** — o paywall coleta a escolha do plano, mas não cobra. Ligue RevenueCat antes de anunciar preço.
3. **Política de privacidade** — obrigatória nas lojas. O app processa tudo localmente; se você mantiver o caminho de nuvem da transcrição, isso precisa estar escrito lá.
4. **Ícone e splash** — ainda são os do template do Expo.
5. **`app.json`** — confira `bundleIdentifier` e `package` (`com.brotinho.app`).
