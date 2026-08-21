/**
 * Política de privacidade.
 *
 * ATENÇÃO: este texto descreve o que o código realmente faz hoje. Se o
 * comportamento do app mudar — passar a usar servidor, analytics, login ou
 * publicidade — este arquivo precisa mudar junto, ou vira declaração falsa.
 *
 * Não é peça jurídica revisada. Antes de publicar nas lojas, passe por
 * revisão de alguém da área.
 */

/**
 * Quem responde pelos dados, na linguagem da LGPD.
 *
 * Aparece em três lugares: nesta política, na tela Sobre e como destinatário
 * do e-mail de feedback. Precisa identificar uma pessoa ou empresa real — um
 * nome de marca sozinho não cumpre a exigência.
 */
export const OPERADOR = 'Pedro Henrique de Brito Pinto Ferreira';

/**
 * Destinatário do botão de feedback e contato exigido pelas lojas.
 *
 * É uma caixa dedicada, não o e-mail pessoal: num app de saúde mental chegam
 * mensagens pesadas e fora de hora, e isso precisa de resposta automática
 * própria — com o CVV e um aviso de que aqui não é atendimento de emergência.
 */
export const CONTATO = 'brotinho.suporte@gmail.com';

export const POLICY_VERSION = '1.0';
export const POLICY_DATE = 'agosto de 2026';

export type PolicySection = { title: string; paragraphs: string[] };

export const PRIVACY_POLICY: PolicySection[] = [
  {
    title: 'O resumo',
    paragraphs: [
      'O Brotinho guarda tudo no seu próprio aparelho. Não há cadastro, não há servidor nosso, e não enviamos seus registros para lugar nenhum.',
      'Nem o que você escreve, nem a sua voz: o reconhecimento de fala roda dentro do celular, e as gravações temporárias são apagadas ao fim de cada prática.',
    ],
  },
  {
    title: 'O que o app guarda',
    paragraphs: [
      'As respostas que você dá no início: como se chama, faixa etária, como se identifica, como tem se sentido, o que já tentou, seus horários e os valores que escolheu.',
      'O que você registra depois: humor de cada dia, textos do diário, pensamentos compostados e as práticas que fez.',
      'Suas preferências: lembretes, bloqueio do app e análise dos registros.',
      'Tudo isso fica no armazenamento local do aplicativo, no seu aparelho — e na cópia de segurança que o próprio sistema do seu celular faz, descrita mais adiante.',
    ],
  },
  {
    title: 'O que o app não faz',
    paragraphs: [
      'Não pedimos cadastro, e-mail ou senha.',
      'Não usamos serviços de análise de uso, rastreadores ou publicidade.',
      'Não vendemos nem compartilhamos dados com terceiros.',
      'Não mantemos servidor nem banco de dados com os seus registros. Nós não temos acesso ao que você escreve.',
    ],
  },
  {
    title: 'Microfone',
    paragraphs: [
      'A prática Composta usa o reconhecimento de fala do próprio aparelho para conferir se o que você falou é mesmo a frase que você escreveu — sem isso, qualquer som contaria como uma repetição. Esse reconhecimento acontece dentro do seu celular, e o áudio não sai dele.',
      'Nada disso é guardado: nem o áudio, nem o texto reconhecido. Da prática ficam salvos apenas a frase que você mesmo escreveu, quantas repetições você fez e quantos segundos durou.',
      'Em aparelhos que não conseguem reconhecer fala sem internet, a Composta não transcreve nada: ela volta a apenas medir se há som com jeito de voz, sem saber o que foi dito.',
      'No diário, você pode ditar em vez de escrever. A transcrição é feita pelo reconhecimento de fala do próprio sistema do seu aparelho, funcionando sem internet — o áudio não sai dele.',
      'Se o seu celular não tiver o pacote de voz do português instalado, o ditado não funciona e o app avisa. Preferimos que ele não funcione a mandar a sua voz para um servidor sem você saber.',
      'O microfone só liga quando você toca no botão correspondente, e desliga quando a prática termina.',
    ],
  },
  {
    title: 'O áudio nunca sai do aparelho',
    paragraphs: [
      'Tanto a Composta quanto o ditado do diário usam o reconhecimento de fala do próprio celular, configurado para funcionar sem internet. Nenhum áudio é enviado para nós nem para terceiros.',
      'Não existe caminho alternativo: o app não tem servidor de transcrição. Se o seu aparelho não conseguir reconhecer fala sem internet, o recurso simplesmente não funciona e o app avisa.',
      'Nenhuma gravação fica guardada. O arquivo temporário que o microfone cria é apagado assim que a prática termina, mesmo quando ela termina com erro.',
    ],
  },
  {
    title: 'Cópia de segurança do seu aparelho',
    paragraphs: [
      'O Brotinho permite que o sistema do seu celular inclua os dados do app na cópia de segurança que ele já faz: o backup automático do Android, guardado no seu Google Drive, e o backup do iCloud no iPhone.',
      'Isso existe para você não perder seu diário ao trocar de aparelho ou reinstalar o app. A cópia fica na sua conta Google ou Apple, protegida por ela — não passa por nós e não temos como acessá-la.',
      'Se preferir que não haja cópia alguma, desative o backup do Brotinho nas configurações do seu celular: no Android, em Google › Backup; no iPhone, em Ajustes › seu nome › iCloud.',
      'Vale saber: por causa dessa cópia, reinstalar o app pode trazer seus registros de volta. Para apagar de verdade, use "Apagar meus dados" dentro do app antes de desinstalar.',
    ],
  },
  {
    title: 'Análise dos seus textos',
    paragraphs: [
      'O app procura palavras nos seus registros para sugerir valores e temas. Essa leitura acontece inteiramente dentro do aparelho: nenhum texto é enviado para análise em outro lugar, e não há inteligência artificial remota envolvida.',
      'Você pode desligar isso em Privacidade › Análise dos meus registros. Desligado, o app para de ler o conteúdo dos seus textos.',
    ],
  },
  {
    title: 'Biometria',
    paragraphs: [
      'Se você ativar o bloqueio do app, a verificação é feita pelo sistema do seu aparelho. O Brotinho recebe apenas a resposta de que a verificação deu certo ou não. Sua digital ou seu rosto nunca chegam ao aplicativo.',
    ],
  },
  {
    title: 'Notificações',
    paragraphs: [
      'Os lembretes são agendados localmente pelo seu aparelho. Não passam por servidor nosso e não carregam conteúdo dos seus registros.',
    ],
  },
  {
    title: 'Seus direitos',
    paragraphs: [
      'Você pode ver e corrigir o que informou em Configurações › Meus dados.',
      'Você pode apagar tudo em Privacidade › Apagar meus dados. A exclusão no aparelho é imediata e definitiva. Se você usa a cópia de segurança do sistema, apague os dados pelo app antes de desinstalar, para que a cópia também fique vazia.',
      'A Lei Geral de Proteção de Dados (Lei 13.709/2018) garante a você acesso, correção, portabilidade e eliminação dos seus dados. Como todo o tratamento acontece no seu aparelho e sob seu controle, esses direitos se exercem pelas próprias telas do app: os registros estão no Diário, onde também dá para editá-los e apagá-los um a um, e em Privacidade você encontra “Baixar meus dados”, que gera um arquivo com tudo, e “Apagar meus dados”.',
    ],
  },
  {
    title: 'Crianças e adolescentes',
    paragraphs: [
      'O Brotinho não é destinado a menores de 13 anos. Se você tem menos de 18, converse com um responsável antes de usar.',
    ],
  },
  {
    title: 'Isto não é tratamento',
    paragraphs: [
      'As práticas do app são de autocuidado e apoio, baseadas em técnicas conhecidas. Elas não substituem acompanhamento psicológico ou médico.',
      'Se você estiver em sofrimento intenso ou pensando em se machucar, procure ajuda: o CVV atende de graça, 24 horas, pelo telefone 188 e em cvv.org.br.',
    ],
  },
  {
    title: 'Mudanças nesta política',
    paragraphs: [
      'Se o funcionamento do app mudar de um jeito que afete seus dados, este texto muda junto e a data no fim da página é atualizada.',
    ],
  },
];
