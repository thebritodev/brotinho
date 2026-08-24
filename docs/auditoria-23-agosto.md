# Auditoria de 23 de agosto de 2026

Varredura feita depois que as duas builds saíram, procurando o que quebraria em
aparelho. Registrada porque **metade do valor de uma auditoria é saber o que já
foi olhado** — sem isto, a próxima pessoa refaz o mesmo caminho e chega às
mesmas conclusões.

---

## O que estava quebrado

### A gravação podia nunca ser apagada

O mesmo "apagar" existia em duas telas, lendo a URI em momentos diferentes: a
Composta **antes** de parar o gravador, o diário **depois**.

A de antes estava errada. Em `expo-audio` a URI só é confiável quando a gravação
foi finalizada — então na Composta ela podia vir nula e o `.m4a` ficar no cache.
Justamente onde pesa mais: o áudio da pessoa dizendo em voz alta o pensamento que
mais a machuca, num arquivo que o modo acústico **nem chega a abrir**.

É um erro que não aparece em teste nenhum: o app funciona igual, e o áudio fica.

→ virou `services/apagarGravacao.ts`, que lê a URI dos dois lados.

### Uma pausa desligava a conferência da frase

Dois caminhos, o mesmo estrago, pelo motivo mais banal numa prática que **tem**
pausas:

- o handler de `error` caía para o modo acústico em qualquer erro, inclusive
  `no-speech`, que só significa silêncio
- o handler de `end` fazia o mesmo: o reconhecedor encerra sozinho após alguns
  segundos quietos, mesmo com `continuous`

→ erros benignos ignorados; o `end` religa até 6 vezes antes de desistir, e o
conferidor é recriado junto, porque a transcrição recomeça vazia.

### A tela Sobre contradizia a política

Dizia que "sem conta, não dá para você acessar de outro celular". O backup do
sistema devolve o diário, e a política já dizia isso. Num app de diário, quem
acha que vai perder tudo escreve com menos verdade.

### A build 3 não cobra de ninguém

O achado mais grave. Está em `a-build-3-nao-cobra.md`.

---

## O que foi verificado e estava certo

Não inventar defeito é parte do trabalho. Estes foram checados e passaram:

| área | como foi verificado |
|---|---|
| **Rótulos de acessibilidade** | scanner em todos os `Pressable` com papel de botão. O único apontado era falso positivo do próprio scanner: o texto estava além da janela que ele lia |
| **Tratamento de erros** | exportação, PDF da terapia e notificações — todos com `try/catch` e mensagem para a pessoa |
| **Datas** | `diasSemAparecer` usa `Math.round` sobre meias-noites locais, que é o que absorve horário de verão |
| **Jardim** | `colherPlanta` guarda contra colher duas vezes pelo `id`; `diasNoCiclo` desconta o que já foi colhido |
| **Carregamento de dados** | 21 cenários de lixo em `scripts/testa-sanitize.js` — nenhum estoura |
| **Regras das notificações** | as duas se sustentam: nenhum texto do diário e nenhuma contagem de dias chegam à tela bloqueada. Nem o nome da pessoa |
| **Escape no PDF** | tudo que é texto da pessoa passa por `escape`. Os dois valores sem escape (`p.topic`, `p.practice`) são só chaves de busca e nunca chegam ao HTML — e o relatório **não contém texto do diário**, só padrões |
| **Microfone ao sair da tela** | `useEffect(() => stop, [stop])` só dispara ao desmontar: `useAudioRecorder` depende de `JSON.stringify(options)`, não da identidade do objeto, então o `recorder` é estável entre renders |
| **Dimensão negativa em SVG** | classe fechada. Só duas subtrações de largura no projeto, as duas com `Math.max`. Multiplicação e divisão dão zero, que é tamanho válido |
| **Conteúdo do `.apk`** | os três `.wav` e os sete módulos nativos presentes; build é **release** (bundle em bytecode Hermes) |

---

## O que ficou sem verificação

- **Tudo em aparelho.** Nada do que está acima foi exercitado num celular. A
  conferência da frase, o ditado local e o apagar das gravações existem apenas
  como código lido, simulado e revisado.
- **As permissões do manifesto Android**, com ferramenta adequada — ver a
  ressalva em `da-build-ate-a-loja.md`.

> **Revisão das práticas por um profissional: descartada em 23 de agosto**, por
> decisão do dono do app. Fica registrado aqui porque um relatório de auditoria
> que perde de vista o que ficou sem verificar deixa de servir para o que existe.
> Os 31 textos estão escritos como autocuidado e nunca como tratamento, e a tela
> Sobre e a política dizem isso — foi o que levou à decisão.
