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

### A tela de Lembretes prometia o que o sistema estava bloqueando

Ela mostrava "Todos os dias às 21:00" olhando **apenas para a chave interna do
app**. Quem tivesse negado a permissão do sistema via o interruptor ligado, o
horário escrito, e nunca recebia nada — depois de o onboarding ter prometido
exatamente aquele horário.

O mais revelador: `isDailyReminderScheduled` existia desde sempre, comentada
como *"reflete o estado real do sistema, não o que o app acha que agendou"*, e
**não era chamada em lugar nenhum**. A ferramenta certa estava escrita e nunca
foi plugada.

→ virou `notificacoesPermitidas`, e a tela avisa com um caminho para os ajustes
do aparelho. Pergunta pela permissão e não pela fila agendada de propósito: a
fila é escrita por um efeito que roda **depois** da troca do interruptor, então
consultá-la logo após ligar acusaria um problema que não existe.

### Trocar de aba apagava o desabafo em andamento

O `MainTabs` monta **só a aba ativa** — `renderTab()` é um `switch`. Sair do
Diário desmonta a tela, e o texto em andamento vivia só em `useState`.

Bastava tocar em Início no meio de um desabafo, ou tocar numa notificação (que
troca a aba sozinha, pelo `onNotificationTap`), para perder a página inteira sem
nenhum aviso. Num app de diário, é a pior falha possível.

→ o composer passou a gravar rascunho, com atraso para não escrever em disco a
cada tecla e uma gravação final na saída da tela — que é justamente o instante
que o rascunho existe para cobrir.

### O jardim repetia o mesmo valor em todas as plantas

O humor de cada planta era filtrado pelo ciclo dela; o valor saía de
`livedValues`, que lê o diário **inteiro**. Da segunda planta em diante isso
devolvia quase sempre o valor da primeira — a "fileira de troféus iguais" que o
comentário do próprio arquivo diz querer evitar.

### O broto encolhia quando alguém apagava um registro

A contagem de dias cuidados vinha só do que estava guardado. Apagar o único
registro de um dia derrubava o total, e o broto podia voltar de estágio ou
deixar de estar pronto para colher — punindo um ato legítimo, às vezes doloroso.

Junto, uma assimetria sem justificativa: práticas contavam como **aparecer** e
não como **cuidar**, então quem usasse o app só pelas práticas nunca via o broto
crescer.

### O diário exportado ficava no cache para sempre

"Baixar meus dados" escreve o **diário inteiro em texto puro** num arquivo, e o
resumo para a terapia escreve um PDF. Os dois iam para o cache, eram entregues à
tela de compartilhar — e ficavam lá, indefinidamente.

Num app cuja promessa é que o que a pessoa escreve não sai do aparelho, uma
cópia legível de tudo esquecida no disco é o oposto do que ele diz fazer. É o
mesmo erro da gravação da Composta, corrigido dias antes.

→ `services/limparExportacoes.ts`. A limpeza roda **na abertura seguinte do app**
e **antes de exportar de novo**, e não logo após compartilhar: no Android o
`shareAsync` devolve o controle quando o outro app é chamado, não quando ele
terminou de ler — apagar ali entregaria arquivo vazio ao WhatsApp. Só apaga o
que tem o prefixo do próprio app; o cache é do Brotinho, mas bibliotecas também
escrevem ali.

### Tocar fora descartava a edição de um registro

O modal de editar fechava no toque fora do cartão, **sem perguntar**, perdendo
tudo o que tinha sido reescrito — enquanto excluir um registro, que é menos
grave, tem tela de confirmação. Agora, com alteração pendente, o toque fora não
fecha, e o botão passa a dizer "Descartar alterações": sair vira uma escolha.

### O interruptor de análise tinha um vazamento

Ele promete "permite que o broto identifique padrões nos seus textos". Com ele
**desligado**, a Composta continuava dizendo *"esta é a terceira vez que esse
pensamento volta"* — que é, literalmente, um padrão identificado nos textos da
pessoa. `vezesQueVoltou` era a única leitura de texto do app fora da regra.

`lembranca` fica fora da regra **de propósito**, e agora está escrito por quê:
mostrar um registro antigo é o diário devolvendo o que a pessoa escreveu,
escolhido por data. Não há leitura de conteúdo ali, e desligar a análise não
deveria trancar o próprio diário.

Junto: "apagar tudo" passou a varrer também as cópias exportadas no cache, em
vez de esperar a abertura seguinte. Quem toca nesse botão costuma estar
preocupado exatamente com isso.

### Metade das práticas era um beco sem saída

**Dezessete das trinta e uma práticas não tinham como ser marcadas como
feitas.** As guiadas registram ao fim do guia; as outras não tinham botão
nenhum — a tela terminava em "Por que funciona", com um único botão na página
inteira: "Voltar".

A pessoa lia um exercício de dez minutos, fazia, voltava, e o app agia como se
ela não tivesse aparecido. Nada entrava em `practicesDone`, então nem "retomar
de onde parou" nem "mais feitas" a enxergavam — e, depois da mudança que fez as
práticas contarem como cuidado, o broto também não crescia.

**Só apareceu dirigindo o app.** Ler o código não denunciava: a condição
`{!!practice.guide && ...}` parece completa até você abrir uma prática sem guia
e ver que não sobra nada.

→ "Já fiz esta prática", só onde não há guia. O comentário de `concluir` diz que
abrir e desistir não é ter feito, e continua valendo: aqui a pessoa declara, e
declarar é o único sinal que existe numa prática que acontece fora da tela. Num
app sem placar, não há o que inflar.

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

## O que rodou de verdade — 25 de agosto

Até aqui, tudo neste documento era código lido, simulado e revisado. Nada tinha
sido **executado**. Isso mudou: o app foi levantado no navegador
(`npm run web`, o `launch.json` está versionado) e percorrido.

| | |
|---|---|
| Bundle | compila — HTTP 200, 5,8 MB, todos os módulos resolvem |
| Abertura | a tela de boas-vindas renderiza |
| Console | **nenhum erro**; só avisos esperados de web (notificações e `useNativeDriver`) |
| Persistência | `leu vazio` → `gravou 453 bytes`, na abertura |
| **Rascunho do onboarding** | **verificado de ponta a ponta** |

O rascunho foi o teste que valeu a pena: preencher o nome, avançar, recarregar a
página — o equivalente ao sistema matar o app — e voltar. O disco tinha
`{"step":2,"draft":{"name":"..."}}`, e o app retomou em **3/13** com o nome
preservado.

> **Uma coisa que só apareceu rodando, e já foi corrigida.** Depois da
> interrupção a pessoa caía na tela de boas-vindas de novo, com o trabalho salvo
> escondido atrás dela — por um instante parecia que tudo tinha se perdido.
> Agora o app abre direto no passo onde ela estava.
>
> O raciocínio antigo (*"quem fechou na tela de boas-vindas ainda não contou
> nada ao Brotinho"*) continua valendo para quem parou **na porta**. Por isso o
> pulo exige progresso de verdade, `step > 0`: um rascunho no passo zero é um
> rascunho vazio, e pular a porta ali esconderia o "Já usei o Brotinho antes" de
> quem ainda pode precisar dele.
>
> Os dois caminhos foram conferidos rodando: com rascunho abre em 3/13; sem
> rascunho, a tela de boas-vindas com os dois botões. Console limpo nos dois.

### O onboarding inteiro, e o rascunho do diário

Numa segunda passada o app foi percorrido **do começo ao fim**: os catorze
passos, o experimento da Composta (as palavras caem, a tela vira "Repare no que
sobrou"), o paywall — onde a garantia de privacidade que foi acrescentada
aparece no lugar certo — e a entrada no app.

Já dentro dele, o conserto mais grave da rodada foi exercitado no gesto exato
que o quebrava:

| passo | resultado |
|---|---|
| Escrever no diário | texto no campo |
| Trocar para Início | `{"text":"Hoje foi um dia difícil…"}` no disco |
| Voltar ao Diário | **texto restaurado, intacto** |
| Salvar o registro | campo limpo, 1 registro gravado, **rascunho apagado** |

As duas metades: o desabafo não se perde, e não sobra uma segunda cópia dele no
aparelho. Console sem nenhum erro em todo o percurso.

### O resto do app, dirigido

Numa terceira passada foram percorridas as telas que faltavam. **Nenhum defeito
novo**, e duas coisas que valem registro:

| tela | o que aconteceu |
|---|---|
| **Composta** | sem microfone cai no modo manual, com o aviso certo. Segurando o botão: 18 repetições, o contador andou, as partículas caíram, a tela de conclusão abriu com o adubo assentando |
| **Jardim** | "1 dia de cuidado. Faltam 2 para o próximo passo" — estado vazio bem resolvido |
| **Perfil** | contagens corretas |
| **Terapia** | derivou `Autocuidado 1x`, `Sono 1 registro`, `Saúde 1 registro` de um único desabafo |

> **Um alarme falso meu, anotado porque errar assim é o risco do método.** O
> gráfico de humor mostrava `S S D S T Q Q` e eu conclui que a ordem dos dias
> estava trocada. Fui conferir: hoje é **quinta, 27**, e a sequência correta dos
> últimos sete dias é exatamente essa. Quem estava errado era eu, e a checagem
> levou trinta segundos.

O cronômetro da Composta conta **segundos de voz**, não tempo de tela — por isso
fica parado enquanto ninguém fala. É o desenho certo, e foi confirmado.

### A edição de registro, e um quase-alarme

O conserto do "tocar fora descartava em silêncio" foi exercitado: mexer no texto
trocou o botão para **"Descartar alterações"**, e o toque fora **não fechou** o
modal — o texto reescrito continuou lá.

> **Quase reportei um defeito grave que não existia.** Na primeira tentativa o
> campo de edição apareceu **vazio**, o que significaria que editar um registro
> apagaria o texto dele. Fui ao código antes de escrever: `entries` passa
> `text: e.text` e `onEdit` repassa — estava certo.
>
> O problema era o meu teste. `document.querySelector('textarea')` pega a
> **primeira** da página, que é a folha do diário, não a do modal; eu vinha
> escrevendo na caixa errada e lendo estado sujo de uma tentativa anterior.
> Recarregando limpo, o campo trouxe o texto do registro corretamente.
>
> Duas lições que valem para as próximas verificações: **recarregue entre
> cenários**, e **prefira o código à tela quando os dois discordam** — a tela
> pode estar refletindo o meu erro, não o do app.

Confirmado no mesmo teste: os modais do React Native Web **só existem no DOM
quando abertos**. O modal de excluir, que eu nunca abri, não aparecia; o de
ajuda, fechado, também não. Isso valida as verificações anteriores que liam
conteúdo de modal.

**O que este teste não cobre:** microfone, reconhecimento de fala, vibração,
compra e notificações — nada disso existe no navegador.

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
