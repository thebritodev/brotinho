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

### No Android, nenhum plano seria encontrado

A Apple devolve `brotinho_anual`. O Google Play, desde a cobrança versão 5,
devolve `brotinho_anual:<plano base>` — o identificador da assinatura, dois
pontos, e o do plano base. O app procura o plano por **igualdade exata** contra
`PRODUTO_DO_PLANO`, nos três lugares onde alguém pode comprar.

Resultado no Android: nenhum plano encontrado, e o botão de assinar respondendo
"não consegui falar com a loja" para todo mundo, sempre — com a loja funcionando
perfeitamente do outro lado. O preço também cairia para o texto de reserva, que
é o que Apple e Google reprovam.

Não apareceria em nenhum teste de iOS, nem no Expo Go, que não tem compra.

→ `semOPlanoBase` em `services/subscription.ts`, que corta o sufixo antes de
comparar.

### Guardar a chave no EAS não bastava

Ao consertar a build que não cobra, encontrei a segunda metade do mesmo
problema: um perfil de build só recebe as variáveis do ambiente que ele
**declara**, e nenhum dos três perfis declarava nada. As chaves poderiam estar
guardadas no lugar certo e mesmo assim não chegar à compilação — o mesmo
sintoma, por outro caminho.

→ `"environment"` em cada perfil do `eas.json`, e `npm run confere-cobranca`,
que checa as três condições antes de gastar uma build. O `preview` aponta de
propósito para um ambiente **sem** chaves, para o `.apk` de teste seguir aberto.

### A queda da conferência era muda

Quando o reconhecimento não dava para usar — falta do português offline, erro do
serviço, ou desistir depois de religar seis vezes — a Composta voltava a contar
só pelo som **sem dizer nada**. Mesmo broto, mesmo texto, mesmo anel pulsando; a
única diferença invisível é que qualquer barulho voltava a contar.

Ou seja: no aparelho onde o conserto não funciona, a tela promete exatamente o
que ele conserta. Quem testasse ali concluiria que o trabalho todo falhou.

→ uma linha discreta explicando o modo, e o `da-build-ate-a-loja.md` diz como
instalar o idioma offline no Android.

> **Um defeito que eu mesmo escrevi e peguei antes de commitar.** A primeira
> versão do aviso olhava só para "não é por frase e não é manual" — mas os dois
> são falsos **antes** de a sessão escolher, enquanto o diálogo de permissão está
> na tela. O aviso apareceria por cima dele, na primeira vez que alguém abre a
> prática. Passou a depender de `running`, que só fica verdadeiro depois da
> escolha.

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
| **Sessão de áudio do iOS** | a suspeita era o clássico: gravar deixa a sessão em `playAndRecord`, que no iPhone joga o som seguinte no fone de ouvido do telefone em vez do alto-falante — a respiração ficaria quase inaudível depois da Composta. Fui ao Swift do `expo-audio`: o modo é um `Record` com padrões, então cada chamada **substitui** em vez de somar, e o guia da respiração define o seu na montagem. Não vaza |
| **Ciclos de animação** | os oito `setInterval`/`setTimeout`/`Animated.loop` do projeto têm limpeza no `return` do efeito. As partículas do FallingWords se removem sozinhas ao fim da queda |
| **Permissão de notificação** | pedida em `scheduleDailyReminder` antes de agendar, e o canal do Android é criado. No Android 13+ isso é o que separa "agendou" de "nunca apareceu" |
| **`android.permissions` no app.json** | é **aditivo**, confirmado na documentação do Expo — não limita o que os plugins acrescentam. O `POST_NOTIFICATIONS` do expo-notifications entra na build |
| **Acentos do `app.json`** | os bytes são UTF-8 corretos; o embaralhado que eu via era do console do Windows, não do arquivo |
| **Microfone negado na Composta** | não trava: sem permissão de fala cai no acústico, sem permissão de gravação cai no botão manual. Não existe caminho sem saída |
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
