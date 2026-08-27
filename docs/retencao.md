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

- **Período de tolerância** (grace period): a Apple e o Google seguem tentando
  cobrar por até 30 dias e a assinatura continua ativa. O RevenueCat detecta e
  trata sozinho.
- **Campanhas de recuperação** disparam no evento de **expiração**, não no de
  cancelamento — a oferta chega a quem de fato perdeu o acesso.

## O que fica de fora, de propósito

Táticas que aparecem na literatura de crescimento e que **não** entram aqui:

- Streak, ofensiva, placar, ranking, competição entre pessoas
- Notificação que cobra ausência ou anuncia o que foi perdido
- Fricção artificial no cancelamento
- Contagem regressiva falsa e escassez inventada no paywall

As três primeiras pelo motivo clínico acima. As duas últimas porque são padrões
enganosos, e num app de saúde mental o dano é maior que o ganho.

---

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
