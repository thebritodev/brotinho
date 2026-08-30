# O que a evidência diz sobre cancelamento

**Pesquisado em 25 de agosto de 2026.** Registrado porque a conclusão principal
contraria o manual de crescimento de apps de assinatura, e alguém — inclusive eu,
daqui a seis meses — vai propor streak de novo sem esta página.

---

## A contradição, que é o achado principal

**Apps de assinatura em geral:** desafios, ranking e conexão com amigos aparecem
associados a 20–35% menos cancelamento mensal em apps de fitness. Recompensa
variável é apontada como o mecanismo mais forte de engajamento.

**Apps de saúde mental, na literatura clínica:** elementos gamificados **não
melhoraram, e podem enfraquecer**, a retenção. O que reduz abandono são lembretes
e senso de acompanhamento — não pontuação.

A explicação está nos relatos de uso: gente que perdeu o streak **por estar
internada**, e gente cuja ansiedade piorou por causa de notificação cobrando
sessão perdida. Quem tem depressão, ansiedade ou traços de perfeccionismo é o
grupo mais vulnerável à culpa de streak — e é exatamente o público deste app.

A crítica de fundo: mecanismos de reforço priorizam a métrica de retenção sobre o
benefício terapêutico, e produzem uso habitual sem progresso psicológico.

> **Conclusão para o Brotinho: não implementar streak, ofensiva, placar nem
> ranking.** Não é conservadorismo — é o que a evidência recomenda para esta
> categoria.

## O que o Brotinho já faz certo

Escolhas que estão no código desde antes desta pesquisa, e que ela valida:

- **O broto nunca regride e nunca morre de abandono.** `diasNoCiclo` só soma os
  dias em que a pessoa apareceu.
- **O lembrete é proibido de cobrar.** Três regras em `data/lembretes.ts`, duas
  delas verificadas por `scripts/testa-lembretes.js`.
- **`diasSemAparecer` existe para acolher quem voltou**, não para marcar falta.
- **Nada sai do aparelho.** Ver abaixo: isso é retenção, não só ética.

## Os números de base

- Apps de saúde mental perdem **mais de 90% dos usuários em 30 dias**. Um estudo
  de uso real mediu **3,3%** de retenção em 30 dias, e 74% param depois de dez
  usos.
- **~14% dos cancelamentos na App Store são falha de cobrança** (31% no Google
  Play) — cartão vencido, limite estourado. A pessoa não decidiu sair.
- Formação de hábito leva de **21 a 66 dias** até o gatilho virar interno. É a
  janela que o lembrete precisa cobrir. Não por acaso, `MATURIDADE = 21`.

## Causas de abandono nomeadas na literatura, e o que cabe aqui

| causa | o que o Brotinho pode fazer |
|---|---|
| Falta de apoio emocional percebido | o tom já é este; manter |
| **Preocupação com privacidade dos dados** | dizer "nada sai do aparelho" **onde a pessoa decide pagar**, não só na tela de Privacidade |
| **Benefício percebido pouco claro** | o app calcula padrões, tempo de casa e retornos a um mesmo assunto, e quase nada disso encontra a pessoa fora da tela de terapia |
| Falta de acompanhamento | o lembrete em fila, refeito em 25/08 |

## Cancelamento involuntário

O único item aqui que mexe em dinheiro sem tocar em design:

- **Período de tolerância** (grace period) — ✅ **ativo desde antes desta
  pesquisa; conferido em 25/08/2026: 16 dias, todas as renovações, produção e
  Sandbox.** A Apple e o Google seguem tentando
  cobrar por até 30 dias e a assinatura continua ativa. O RevenueCat detecta e
  trata sozinho.
- **Campanhas de recuperação** disparam no evento de **expiração**, não no de
  cancelamento — a oferta chega a quem de fato perdeu o acesso.

## A dor de quem usa — pesquisa de 28 de agosto

A primeira rodada olhou cancelamento de assinatura. Esta olhou **reclamação de
usuário**, que é outra coisa.

**A página em branco é o motivo mais citado de abandono em app de diário.** Não
é falta de assunto: a maioria desiste em um mês porque a caixa vazia vence. O
Brotinho já dava três frases prontas na Composta e deixava o Diário vazio, com
"Escreva livremente sobre o seu dia..." — que é instrução, não começo.

→ `data/comecos.ts`. A pergunta sai do que o app já sabe: o humor marcado hoje,
o horário e os valores escolhidos no onboarding. Uma lista genérica é fácil de
escrever e fácil de ignorar; esta soa como alguém que estava prestando atenção.

**Onboarding pesado derrubа gente antes do valor.** A literatura clínica aponta
expectativa não atendida e desconforto no onboarding como causas diretas de
abandono precoce. O Brotinho tem catorze passos antes do paywall — analisado
separadamente, sem mexer.

**Portabilidade dos dados** aparece nas reclamações de apps concorrentes ("não
deixam exportar"). Aqui já é ponto forte: `.txt` e `.json`, sem conta.

### O que verifiquei e estava certo

O app **nunca desliga** `allowFontScaling`. Quem usa fonte a 150% ou 200% — a
maioria das pessoas acima de cinquenta anos — vê o texto crescer, e há limites
sensatos nos três lugares onde crescer demais quebraria o layout. Isso costuma
estar errado nos apps, e aqui está certo.

### A lacuna de segurança

O CVV existia só na tela Sobre e na política de privacidade, ambas atrás de
Perfil → Configurações. Quem está em sofrimento agudo, de madrugada, escrevendo
no diário, não navega três telas para achar um telefone.

→ `components/brand/AjudaAgora.tsx`, no Diário e na Composta.

> **O que ele deliberadamente não faz: ler o que a pessoa escreveu.** A tentação
> óbvia seria detectar palavras de risco e oferecer ajuda sozinho. É onde esse
> recurso erra feio nos dois sentidos: um alarme falso invade quem estava só
> desabafando — e num app cuja promessa é que ninguém lê o que ela escreve, o
> app se denunciar lendo é pior que o alarme. O convite fica sempre visível e
> sempre igual, e quem decide é ela.

## Pesquisa de 28 de agosto — revisão da Apple e descoberta

### O risco da diretriz 1.4.1

A Apple reprova apps que **pareçam** dar orientação médica sem aprovação
regulatória, e os relatos de desenvolvedores mostram reprovação **mesmo com
aviso de "não é tratamento"** — o disclaimer sozinho não salva.

Os textos das práticas afirmavam mecanismos fisiológicos como fato:

> *"reduz a atividade da amígdala"* · *"em estudos de neuroimagem, nomear uma
> emoção diminui a resposta da amígdala"*

São achados reais, mas o app não tem como sustentá-los se alguém cobrar — e
menos ainda depois que a revisão por psicólogo foi descartada.

→ os seis textos passaram a descrever a **experiência** em vez do mecanismo. As
práticas continuam idênticas; mudou só como são justificadas. O nome das
técnicas e a autoria ficaram: *rotulação afetiva*, *Edmund Jacobson*, *Martin
Seligman* — isso é atribuição verificável, não afirmação clínica.

A ficha da loja já estava limpa: só menciona "defusão cognitiva, da terapia ACT".

### O app nunca pedia avaliação

Avaliação é o principal motor de descoberta na App Store, e não havia nenhum
`StoreReview` no código.

A recomendação padrão é pedir "depois de uma ação concluída". **Num app de saúde
mental isso é insuficiente:** a Composta também termina em conclusão, e ali a
pessoa acabou de dizer em voz alta o pensamento que mais a machuca. Pedir um
favor naquele instante trata a dor dela como oportunidade de marketing.

→ o pedido mora **só na colheita**: três semanas de cuidado, a planta amadureceu,
e é a única boa notícia do app que não depende de algo difícil ter acabado de
acontecer. É raro por natureza, o que também evita insistir. A Apple mostra no
máximo três vezes por ano e pode não mostrar nenhuma; nada depende disso.

## O que fica de fora, de propósito

Táticas que aparecem na literatura de crescimento e que **não** entram aqui:

- Streak, ofensiva, placar, ranking, competição entre pessoas
- Notificação que cobra ausência ou anuncia o que foi perdido
- Fricção artificial no cancelamento
- Contagem regressiva falsa e escassez inventada no paywall

As três primeiras pelo motivo clínico acima. As duas últimas porque são padrões
enganosos, e num app de saúde mental o dano é maior que o ganho.

---

## Pesquisa de 28 de agosto — a segunda rodada

Três frentes. Duas fecharam sem nada a fazer, e registrar isso vale tanto
quanto registrar a que rendeu: sem esta página, alguém volta a "melhorar" o
horário do lembrete daqui a três meses.

### Horário do lembrete — já estava certo

A evidência sobre notificação em app de saúde mental aponta **tarde e noite**
como as faixas de maior resposta, e **fim de semana** como a pior janela: sem
rotina, a notificação se perde. O padrão do Brotinho é **21:00**, e a pessoa
escolhe o dela. Nada a mudar.

Dois avisos da mesma literatura que o app já respeita: **conteúdo repetitivo
irrita** (resolvido em 25/08 com as 53 frases em fila) e **quem usa muito para
de responder a sugestão** — motivo a mais para o lembrete não virar cobrança.

### Acessibilidade — não era a lacuna que eu esperava

43 `accessibilityLabel` e 53 `accessibilityRole` para 52 elementos tocáveis, e
`allowFontScaling` nunca desligado. Coberto.

### A exportação era uma porta que só abria para fora

Esta rendeu. O comentário de `services/exportarDados.ts` já dizia:

> *"sem conta e sem servidor, se o celular se perder e o backup do sistema
> estiver desligado, o diário acabou — não existe cópia nossa para devolver.
> **Este arquivo é a única rede.**"*

E não existia nada no app que lesse esse arquivo de volta. A rede tinha uma
ponta só.

O backup do sistema está configurado certo — `RCTAsyncStorageExcludeFromBackup:
false` no iOS, `allowBackup: true` no Android —, então troca de celular pelo
iCloud preserva tudo. O que ele **não** cobre: apagar o app para liberar
espaço, iPhone indo para Android, e restaurar de um backup não criptografado,
que é justamente o caso em que a Apple deixa o diário de fora. Nas reclamações
de apps de diário, perder as entradas é o que faz a pessoa dizer que não volta
mais.

→ `services/importarDados.ts` e "Trazer de volta" em Privacidade.

**Três decisões que valem registro:**

1. **`sanitizarDados` sozinho não bastava.** Ele devolve um `AppData` válido
   para qualquer entrada, inclusive lixo — o que é certo ao ler o disco e
   perigoso aqui: entregar a ele um arquivo qualquer responderia "importado" e
   apagaria o diário com um estado vazio. O envelope (`app`, `formato`,
   `dados`) é conferido **antes**, e é isso que `scripts/testa-importacao.js`
   verifica nos dois sentidos — nada estranho entra, e o arquivo do próprio app
   sempre entra. Um teste que só recusasse seria satisfeito por uma função que
   recusa sempre.
2. **Substitui, não junta.** Misturar dois diários exigiria decidir sozinho o
   que fazer com registros do mesmo dia, ajustes conflitantes e dois jardins —
   decisões invisíveis para quem toca no botão. A tela mostra os dois lados em
   números ("diário: 12 aqui, 40 no arquivo") antes de perguntar, porque a
   pessoa pode ter escolhido o arquivo errado.
3. **A cópia do seletor é apagada.** O seletor duplica o arquivo escolhido para
   o cache, e ali dentro está o diário inteiro em texto puro. Ela não tem o
   prefixo que `limparExportacoes` varre, então some no `finally` — inclusive
   quando a leitura falha. É o mesmo cuidado da gravação da Composta.

O JSON passou a se chamar **"cópia de segurança"**. Antes o link dizia "Prefiro
o formato técnico (JSON)", errado duas vezes: a tela inteira fala **com** a
pessoa e só ali falava **por** ela, e "formato técnico" diz do que o arquivo é
feito em vez de para que serve — justamente no único arquivo que volta. O cartão
de cima também prometia "guardar onde quiser", sugerindo backup num `.txt` que
não restaura nada.

**E a saída não podia morar só em Privacidade.** Isso apareceu dirigindo a tela:
Privacidade fica atrás dos catorze passos do onboarding **e** do paywall, e quem
acabou de reinstalar está na tela de abertura, no "Já usei o Brotinho antes" —
cujo modal promete "seus registros voltam sozinhos" e não oferecia nada a quem
o backup do sistema não cobriu. Quem mais precisava da saída era exatamente quem
menos conseguiria chegar até ela. O mesmo componente aparece nos dois lugares.

### Uma decisão de loja que não é minha

Não há teste grátis configurado. A pesquisa da RevenueCat mostra que trial de 3
e 7 dias concentra cancelamento no dia 0 e no dia 1 — gente que cancela por
precaução antes de experimentar. Fica registrado como decisão comercial, não
como melhoria pendente.

## Pesquisa de 28 de agosto — a terceira rodada

Feita a pedido, antes de gerar a build nova: funcionalidade, práticas novas,
animação e surpresa. Os três primeiros achados saíram de vasculhar o código, e
não da literatura.

### Metade do conteúdo mandava escrever, e não abria o diário

Vinte e cinco das quarenta e uma práticas pedem "Escreva…", "Liste…". O app tem
a folha mais cuidada da categoria — rascunho salvo a cada 600 ms, ditado por
voz, pergunta de partida — e não havia **nenhuma** ligação entre as duas coisas.
A pessoa lia "Escreva o que está sentindo", fechava a prática, procurava o
diário e tentava lembrar o que ia escrever.

→ o campo `comecoNoDiario` nas práticas, o botão "Escrever no diário" na tela de
conclusão, e a pergunta da prática ocupando o lugar da pergunta do dia. Some
quando ela salva o registro: a folha seguinte volta a ser a do dia.

Guardado por `confere-praticas.js`: prática cujos passos usam o imperativo
"escreva", "liste" ou "anote" **tem** de abrir o diário, salvo duas exceções
nomeadas — a mensagem que se envia a alguém e a tarefa anotada num papel. Sem
esse guarda, a próxima prática nasce sem a ligação e ninguém percebe, porque
nada quebra.

> A primeira versão da regra pegava qualquer "escrev", e acusou *Dois minutos*
> por causa de "Escrever o título", que ali é exemplo de primeiro passo numa
> tarefa qualquer. Consertei a regra em vez de abrir exceção: guarda que grita
> à toa vira exceção até não sobrar guarda.

### O humor não levava a lugar nenhum

Marcar "Ansioso" registrava em silêncio. As três práticas de ansiedade ficavam
duas telas adiante, atrás de uma lista de treze temas. Era o único momento do
dia em que a pessoa conta o que sente, e o momento em que o app menos fazia com
isso.

→ `data/sugestao.ts`, uma linha discreta embaixo das carinhas.

**Para três humores dos seis.** Feliz, leve e neutro não recebem nada, e isso é
a decisão, não um caso esquecido: oferecer exercício a quem acabou de dizer que
está bem é a mesma insistência que a pesquisa da primeira rodada desaconselha.
Calar quando não há o que oferecer é o que faz a oferta valer quando aparece.
`testa-sugestao.js` existe sobretudo para essa regra sobreviver a quem, daqui a
seis meses, achar que faltou preencher os outros três.

**Cansado de madrugada não é cansado de tarde.** A partir das 21h a porta é a
insônia; antes, o estresse. Mesma palavra, duas coisas — e o relógio distingue
as duas sem precisar perguntar.

### Faltavam temas inteiros

Dez temas cobriam bem ansiedade, tristeza, insônia, estresse, solidão, raiva,
procrastinação, autoestima, foco e gratidão. Não havia **luto**, **culpa e
vergonha** nem **comparação** — e foco tinha duas práticas contra três dos
outros temas.

→ três temas novos com três práticas cada, mais a terceira de foco. **13 temas,
41 práticas.** Todas escritas como autocuidado, sem afirmação de mecanismo — a
lição da diretriz 1.4.1, da rodada anterior.

### Sobre "animação": o que a literatura oferecia não servia

A pesquisa de micro-interações e design emocional fala em dopamina, recompensa
e "animação de high-five após um marco". É a gamificação que a primeira rodada
mostrou não funcionar — e possivelmente prejudicar — nesta categoria. Não entrou
nada dali.

A única lacuna visual real era outra, e estava no código: a cena da janela era
sempre ensolarada, inclusive para quem instala o app às duas da manhã — que é
justamente quando muita gente procura um app assim.

→ três faixas: dia, entardecer e noite. Não são quatro porque manhã e tarde só
se distinguem por sombra, e inventar essa diferença seria decoração sem
informação. Não marca nada, não muda por mérito e não há o que alcançar: é só o
mundo lá fora estando do jeito que está.

### Uma decisão registrada, e não adotada

**Adiar a preocupação** (*worry postponement*) apareceu na busca como candidata
a prática nova para ansiedade. Ficou de fora: a meta-análise mostra efeito em
amostras não clínicas, resultado misto em quem tem transtorno de ansiedade
generalizada, e nenhuma evidência de que o mecanismo proposto explique o efeito
quando ele aparece. É protocolo clínico com evidência ambígua — exatamente o que
a diretriz 1.4.1 desaconselha um app sem profissional a bordo apresentar.

## Pesquisa de 29 de agosto — o que os concorrentes fazem

Primeira rodada olhando para fora: Finch, Daylio, Rosebud, Cíngulo, Zenklub. Dois
dos achados **confirmam** decisões que já estavam tomadas aqui, e registrar isso
vale tanto quanto registrar as faltas — foi por pouco que a conclusão intuitiva
("seja mais parecido com o Finch") não foi a errada.

### Simplicidade ganha da gamificação — agora com dado de produto

O **Daylio retém cerca de 40% no trigésimo dia; o Finch, cerca de 22%.** A
análise credita a diferença à simplicidade do registro diário somada à
visualização de longo prazo — e não à gamificação, que é justamente o que o
Finch tem de sobra: bichinho, acessórios, aventuras, micropets, países.

É a mesma conclusão da primeira rodada desta página, que veio da literatura
clínica. Duas fontes independentes, mesma resposta: **não implementar streak,
placar nem ranking.**

### O modelo grátis do Finch seria um mau negócio aqui

O Finch libera o essencial de graça e cobra US$ 9,99/mês por customização. Copiar
isso pareceria generoso e seria caro:

- Paywall duro converte **10,7% contra 2,1%** da freemium até o dia 35.
- Gera **21% mais receita por usuário em um ano**.
- E a retenção depois de um ano é praticamente **idêntica**: 27% contra 28%.

> O paywall duro do Brotinho está certo. O que a mesma fonte recomenda para apps
> de saúde e ainda **não** temos é o **teste grátis** — registrado, não decidido.

### O arco do humor estava escondido

Já calculávamos 7, 30 e 90 dias — só que dentro de "Para minha terapia", onde o
gráfico dizia respeito a outra pessoa. Quem não faz terapia registrava o humor
todos os dias e nunca via o próprio arco, que é exatamente a função a que se
credita a vitória do Daylio.

→ `components/brand/HumorNoTempo.tsx`, no Perfil e na tela de terapia.

### O SOS do Cíngulo, na versão mais conservadora possível

O Cíngulo — o app de terapia digital mais bem avaliado do país — tem um recurso
SOS com técnicas para crise aguda. O Brotinho já tinha as técnicas (aterramento
5-4-3-2-1 e respiração 4-7-8) e o CVV; faltava o caminho curto, porque em crise
ninguém percorre treze temas.

A literatura dá o enquadramento seguro: ancoragem sensorial alivia sofrimento
agudo em **30 a 120 segundos**, e a linguagem correta é a de bem-estar — apoiar
ancoragem e relaxamento —, nunca diagnóstico ou tratamento.

→ um terceiro botão dentro do CVV que já existia: **"Fazer um exercício comigo"**.
Nenhum conteúdo novo, nenhuma afirmação nova; só a remoção da navegação. Vem
**depois** do 188 e do chat de propósito: a pessoa continua vindo primeiro, e a
saída existe para quem abriu aquela porta e não estava pronta para falar com
ninguém — que antes só podia fechar.

`confere-praticas.js` passa a exigir que a `ANCORA_RAPIDA` aponte para uma
prática existente **e com guia**. Renomear aquela prática não quebraria
compilação nem teste: a porta abriria no vazio, no pior momento possível.

### O widget, adiado com o motivo escrito

É o motor de retenção do Daylio **e** do Finch, pelo mesmo motivo nos dois:
ocupa espaço permanente na tela inicial, entrega valor sem urgência e — ao
contrário da notificação — não envelhece na fila nem é descartado.

Ficou para depois, e não por preguiça: o `expo-widgets` está em **alpha** e só
cobre iOS; o Android exige módulo nativo escrito à mão. Nenhum dos dois roda no
Expo Go, ou seja, custaria justamente o fluxo de desenvolvimento que acabou de
ser consertado. **Depois da primeira leva de usuários reais.**

### O preço mensal é caro de propósito

O Cíngulo cobra R$ 99,90 por semestre — cerca de R$ 16,65 por mês. O anual do
Brotinho sai a R$ 14,99/mês e está competitivo; o mensal, a R$ 29,90, está uns
80% acima.

**Isso é deliberado**, decidido pelo dono do app em 29/08/2026: o mensal é caro
para empurrar ao anual. Fica escrito aqui porque, sem isso, alguém — inclusive
eu, daqui a seis meses — vai "corrigir" esse preço achando que é descuido.

## Fontes

- [Clinical review of user engagement with mental health smartphone apps](https://pmc.ncbi.nlm.nih.gov/articles/PMC10270395/)
- [Engagement and retention in digital mental health interventions: a narrative review](https://bmcdigitalhealth.biomedcentral.com/articles/10.1186/s44247-024-00105-9)
- [Objective User Engagement With Mental Health Apps (JMIR)](https://www.jmir.org/2019/9/e14567/)
- [Digital wellness or digital dependency? (Frontiers in Psychiatry)](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2025.1581779/full)
- [Gamification in Apps and Technologies for Improving Mental Health and Well-Being: Systematic Review](https://mental.jmir.org/2019/6/e13717/)
- [Streak Creep: When Gamified Engagement Mechanics Backfire](https://thedecisionlab.com/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification)
- [Implementing iOS Subscription Grace Periods (RevenueCat)](https://www.revenuecat.com/blog/engineering/ios-subscription-grace-periods)
- [Win-back campaigns (RevenueCat)](https://www.revenuecat.com/win-back)
- [Why Most Health App Users Churn Within 90 Days (Sahha)](https://sahha.ai/blog/health-app-churn-retention/)
- [Real-World Receptivity to Adaptive Mental Health Interventions](https://arxiv.org/pdf/2508.02817)
- [The Effect of Timing and Frequency of Push Notifications (PLOS One)](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0169162)
- [To Prompt or Not to Prompt? A Microrandomized Trial of Push Notifications](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6293241/)
- [Back up, export, and print Journal entries on iPhone (Apple)](https://support.apple.com/121822)
- [Data Loss and Recovery Options (Day One)](https://dayoneapp.com/guides/troubleshooting/data-loss-and-recovery-options/)
- [State of Subscription Apps 2025 (RevenueCat)](https://www.revenuecat.com/state-of-subscription-apps-2025)
- [Effects of Worry Postponement on Daily Worry: a Meta-Analysis](https://www.piekeren.com/wp-content/uploads/2024/03/Dippel.2023_Worry-postponement-meta-analysis.pdf)
- [Worry Postponement From the Metacognitive Perspective: A Randomized Waitlist-Controlled Trial](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11303915/)
- [Self-guided Cognitive Behavioral Therapy Apps for Depression (JMIR)](https://www.jmir.org/2021/7/e27619/)
- [A Systematic Review of Cognitive Behavioral Therapy and Behavioral Activation Apps for Depression](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4852920/)
- [Daylio, Finch e a mecânica de widget (Deconstructor of Fun)](https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl)
- [UX Teardown: Finch Self-Care App](https://medium.com/@deepthi.aipm/ux-teardown-finch-self-care-app-18122357fae7)
- [Hard Paywall vs Free Trial: RevenueCat 2026 Data](https://www.buildmvpfast.com/blog/hard-paywall-vs-free-trial-revenuecat-indie-app-2026)
- [State of Subscription Apps 2026 (RevenueCat)](https://www.revenuecat.com/state-of-subscription-apps)
- [Como cuidar da saúde mental usando o Cíngulo (TechTudo)](https://www.techtudo.com.br/dicas-e-tutoriais/2019/12/como-cuidar-da-saude-mental-usando-o-cingulo-melhor-app-do-ano-para-android.ghtml)
- [7 plataformas de saúde mental no Brasil (Startups)](https://startups.com.br/negocios/healthtechs/7-plataformas-que-te-ajudam-a-cuidar-da-sua-saude-mental/)
- [13 Grounding Techniques to Help Calm Anxiety (Cleveland Clinic)](https://health.clevelandclinic.org/grounding-techniques)
- [Rosebud: AI Journal — avaliações e reclamações](https://apps.apple.com/us/app/rosebud-ai-journal-diary/id6451135127?see-all=reviews&platform=iphone)
