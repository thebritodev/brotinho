# Backend de transcrição do Brotinho

Transcreve o áudio do diário. Por padrão roda **Whisper nesta máquina**: sem chave, sem conta, sem custo, e o áudio não sai daqui.

Também sabe falar com serviços de nuvem. Nesse caso ele existe para **guardar a chave fora do aplicativo** — chave embutida no APK é chave vazada.

## Configurar

```bash
cd server
npm install
```

O npm bloqueia os scripts de instalação por padrão, e dois pacotes precisam deles
para baixar seus binários. Rode uma vez:

```bash
node node_modules/ffmpeg-static/install.js
```

```bash
node node_modules/onnxruntime-node/script/install
```

Pronto. **Não é preciso configurar mais nada** — o padrão transcreve nesta máquina.

## Provedores

| Provedor | Custo | Precisa de |
|---|---|---|
| **local** (padrão) | zero | nada |
| groq | camada gratuita | chave em https://console.groq.com/keys |
| openai | ~US$ 0,006/min | chave em https://platform.openai.com/api-keys |
| deepgram | crédito inicial | chave em https://console.deepgram.com |

Para trocar, copie `.env.example` para `.env` e ajuste `TRANSCRIPTION_PROVIDER`.

### Como o local funciona

O áudio chega em m4a, o ffmpeg converte para PCM mono 16 kHz e um modelo Whisper
em ONNX transcreve — tudo nesta máquina, sem rede.

A primeira transcrição baixa o modelo e fica em cache. Depois disso, cerca de
4 segundos por frase, em CPU.

### Escolha do modelo

O padrão é `whisper-small`, escolhido por medição num teste com quatro frases
típicas de diário em português:

| Modelo | Erro por palavra | Tempo por frase |
|---|---|---|
| whisper-base (q8) | 12,5% | 3,1s |
| whisper-base (fp32) | 10,8% | 1,8s |
| **whisper-small (q8)** | **0%** | **3,9s** |

O `base` produzia coisas como *"fazer a respirar calque a aprendia aqui"* onde o
correto era *"fazer a respiração que aprendi aqui"*. O `small` acertou as quatro
frases inteiras.

Se precisar de mais robustez com ruído de fundo ou sotaque forte, dá para subir
mais no `.env` — ao custo de ~800 MB de download e bem mais tempo em CPU:

```
LOCAL_WHISPER_MODEL=onnx-community/whisper-large-v3-turbo
```

## Apontar o app para cá

No `.env` da **raiz do projeto** (não o do server), coloque o endereço da sua máquina na rede — o celular não enxerga `localhost`:

```
EXPO_PUBLIC_TRANSCRIPTION_URL=http://192.168.0.91:8787/transcrever
```

Reinicie o `npx expo start` depois de mexer no `.env`; variáveis `EXPO_PUBLIC_*` entram no bundle na hora do build.

## Contrato

`POST /transcrever` — multipart com o campo `audio`.
Resposta: `{ "text": "..." }`.

## Trocar de provedor

Mude `TRANSCRIPTION_PROVIDER` no `.env`. Os adaptadores ficam em [`providers.js`](providers.js) — cada um é uma função que recebe o buffer do áudio e devolve texto. Adicionar um terceiro é escrever uma função e registrá-la no objeto `PROVIDERS`.

## Antes de ir para produção

Isto é o suficiente para desenvolver, mas **não** para publicar:

- Sem autenticação: qualquer um que alcance a porta gasta sua cota. Exija um token do app e valide aqui.
- Sem HTTPS: em produção, coloque atrás de um proxy com TLS.
- Sem limite por usuário: adicione rate limiting.
- O áudio passa pela memória e não é gravado em disco — mas ele **é enviado ao provedor**. Deixe isso claro na política de privacidade do app, já que a tela de Privacidade promete que nada é compartilhado sem o usuário pedir.
