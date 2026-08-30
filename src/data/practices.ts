import type { IconName } from '../components';
import type { IllustrationName } from '../components/brand/PracticeIllustration';
import { moodColors, palette } from '../theme';

/**
 * Conteúdo das práticas.
 *
 * Cada prática ensina: o que fazer (passos numerados), por que funciona e,
 * quando faz diferença, um guia que conduz a pessoa em tempo real.
 *
 * As técnicas aqui são de autocuidado consolidado (respiração diafragmática,
 * aterramento sensorial, relaxamento muscular progressivo, escrita expressiva,
 * gratidão). Não substituem acompanhamento profissional.
 */

export type BreathingPhase = { label: string; seconds: number; /** 'in' infla, 'out' esvazia, 'hold' mantém */ motion: 'in' | 'hold' | 'out' };

export type Guide =
  | { kind: 'breathing'; phases: BreathingPhase[]; cycles: number }
  | { kind: 'steps'; steps: { label: string; text: string; seconds: number }[] };

export type Practice = {
  key: string;
  title: string;
  /** Duração aproximada, mostrada como etiqueta. */
  duration: string;
  summary: string;
  illustration: IllustrationName;
  steps: { title: string; text: string }[];
  why: string;
  guide?: Guide;
  /**
   * A pergunta com que o diário abre quando a prática termina.
   *
   * Dezesseis destas práticas mandam a pessoa escrever, e o app tinha a folha
   * mais cuidada da categoria — com rascunho salvo, ditado por voz e pergunta
   * de partida — sem nenhuma ligação entre as duas. Ela lia "Escreva o que
   * está sentindo", fechava a prática, procurava o diário e tentava lembrar o
   * que ia escrever.
   *
   * Fica no lugar da pergunta do dia, que é o mesmo espaço de `comecos.ts` e
   * segue as mesmas três regras: nada do que ela escreveu, nunca cobrar, e é
   * um começo e não um formulário. Ausente nas práticas cuja escrita não é
   * diário — a mensagem que se envia a alguém, a tarefa anotada num papel.
   */
  comecoNoDiario?: string;
};

export type PracticeTopic = {
  key: string;
  title: string;
  icon: IconName;
  tint: string;
  intro: string;
  practices: Practice[];
};

/**
 * A prática que a porta de "estou muito mal agora" abre.
 *
 * Ancoragem sensorial é o que a literatura aponta para sofrimento agudo — 5-4-3-2-1,
 * respiração pausada, estímulo frio —, e ela alivia em algo entre trinta e cento e
 * vinte segundos. O aterramento já existia aqui; o que faltava era o caminho curto,
 * porque em crise ninguém percorre treze temas.
 *
 * Fica nomeado neste arquivo, e não escrito à mão na navegação, porque renomear a
 * prática lá deixaria a porta abrindo no vazio sem quebrar nada. `confere-praticas.js`
 * confere que ela existe **e que tem guia**: em crise ninguém lê, alguém precisa conduzir.
 */
export const ANCORA_RAPIDA = { topico: 'ansiedade', pratica: 'aterramento-54321' } as const;

export const PRACTICE_TOPICS: PracticeTopic[] = [
  {
    key: 'ansiedade',
    title: 'Ansiedade',
    icon: 'sparkle',
    tint: moodColors.ansioso,
    intro: 'A ansiedade acelera o corpo antes da cabeça entender por quê. Estas práticas começam pelo corpo.',
    practices: [
      {
        key: 'respiracao-478',
        title: 'Respiração 4-7-8',
        duration: '4 minutos',
        summary: 'Expiração longa para desacelerar o coração.',
        illustration: 'breathing',
        steps: [
          {
            title: 'Sente-se com as costas apoiadas',
            text: 'Pode ser em qualquer lugar. Deixe os ombros caírem e apoie as mãos nas pernas.',
          },
          {
            title: 'Inspire pelo nariz contando até 4',
            text: 'Sem forçar. O ar deve encher a barriga antes do peito.',
          },
          {
            title: 'Segure o ar contando até 7',
            text: 'Se 7 for demais no começo, segure até 4 e vá aumentando com o tempo.',
          },
          {
            title: 'Solte pela boca contando até 8',
            text: 'Solte devagar, como se estivesse embaçando um vidro. Repita quatro vezes.',
          },
        ],
        why: 'A expiração mais longa que a inspiração ativa o nervo vago, que é o freio natural do corpo. A frequência cardíaca cai em poucos ciclos — é fisiologia, não sugestão.',
        guide: {
          kind: 'breathing',
          cycles: 4,
          phases: [
            { label: 'Inspire pelo nariz', seconds: 4, motion: 'in' },
            { label: 'Segure', seconds: 7, motion: 'hold' },
            { label: 'Solte pela boca', seconds: 8, motion: 'out' },
          ],
        },
      },
      {
        key: 'aterramento-54321',
        title: 'Aterramento 5-4-3-2-1',
        duration: '3 minutos',
        summary: 'Traz você de volta ao lugar onde seu corpo está.',
        illustration: 'senses',
        steps: [
          { title: 'Olhe em volta e nomeie 5 coisas que você vê', text: 'Em voz alta ou por dentro. Coisas banais servem: uma tomada, a barra da cortina.' },
          { title: '4 coisas que você pode tocar', text: 'Toque de verdade. A textura da roupa, a temperatura da mesa.' },
          { title: '3 sons que você escuta', text: 'Inclua os de fundo, aqueles que você já tinha parado de notar.' },
          { title: '2 cheiros', text: 'Se não houver cheiro nenhum, lembre de dois que você gosta.' },
          { title: '1 sabor', text: 'O gosto que está na sua boca agora, ou um que te traz calma.' },
        ],
        why: 'A ansiedade vive no futuro: no que pode dar errado. Os sentidos só funcionam no presente. Percorrê-los um a um ocupa a atenção com o que está de fato aqui.',
        guide: {
          kind: 'steps',
          steps: [
            { label: '5 coisas que você vê', text: 'Olhe em volta sem pressa e nomeie cinco.', seconds: 40 },
            { label: '4 que você pode tocar', text: 'Encoste em cada uma enquanto nomeia.', seconds: 35 },
            { label: '3 sons', text: 'Inclua os sons de fundo.', seconds: 30 },
            { label: '2 cheiros', text: 'Ou dois que você gosta de lembrar.', seconds: 25 },
            { label: '1 sabor', text: 'O que está na sua boca agora.', seconds: 20 },
          ],
        },
      },
      {
        key: 'carta-ansiedade',
        comecoNoDiario: 'Comece por "Oi, ansiedade". O que ela está tentando proteger?',
        title: 'Carta para a ansiedade',
        duration: '10 minutos',
        summary: 'Escrever para ela em vez de discutir com ela.',
        illustration: 'letter',
        steps: [
          { title: 'Escreva "Oi, ansiedade"', text: 'Trate como alguém que chegou sem avisar, não como um defeito seu.' },
          { title: 'Conte o que ela está tentando proteger', text: 'Ela quase sempre acha que está te defendendo de alguma coisa. Escreva do quê.' },
          { title: 'Diga o que você vai fazer mesmo assim', text: 'Não precisa expulsá-la. Só deixe claro quem decide.' },
          { title: 'Releia no dia seguinte', text: 'Quase sempre parece menor no papel do que parecia na cabeça.' },
        ],
        why: 'Nomear o que se sente costuma tirar força do sentimento. Escrever cria distância: você deixa de ser a ansiedade e passa a ser quem escreve sobre ela.',
      },
    ],
  },

  {
    key: 'tristeza',
    title: 'Tristeza',
    icon: 'flower',
    tint: palette.slate100,
    intro: 'Tristeza não é um problema a resolver. É um estado que pede companhia — inclusive a sua.',
    practices: [
      {
        key: 'nomear-o-que-doi',
        comecoNoDiario: 'Qual é a palavra exata para o que dói? E onde ela aparece no corpo?',
        title: 'Nomear o que dói',
        duration: '5 minutos',
        summary: 'Trocar "estou mal" pela palavra exata.',
        illustration: 'letter',
        steps: [
          { title: 'Escreva o que está sentindo, sem editar', text: 'Frases quebradas servem. Ninguém vai ler.' },
          { title: 'Troque "estou mal" pela palavra certa', text: 'É desamparo? Saudade? Vergonha? Cansaço? Vazio? A palavra exata muda o tamanho da coisa.' },
          { title: 'Aponte onde isso aparece no corpo', text: 'Peito, garganta, ombros, estômago. A tristeza quase sempre tem endereço.' },
          { title: 'Pergunte o que ela está apontando', text: 'Tristeza costuma marcar uma perda. Do que você sente falta?' },
        ],
        why: 'Chama-se rotulação afetiva. Pôr o sentimento em palavras específicas costuma diminuir o tamanho dele. "Estou mal" não é nome: é um balde onde cabe tudo.',
      },
      {
        key: 'um-passo-pequeno',
        title: 'Um passo pequeno',
        duration: '5 minutos',
        summary: 'Fazer uma coisa mínima, sem esperar a vontade chegar.',
        illustration: 'pause',
        steps: [
          { title: 'Escolha algo minúsculo', text: 'Lavar uma louça. Abrir a janela. Trocar de roupa. Pequeno de verdade.' },
          { title: 'Não espere ter vontade', text: 'A vontade não vem antes. Este é o ponto do exercício.' },
          { title: 'Faça só aquilo', text: 'Terminou, acabou. Não vire faxina.' },
          { title: 'Repare em como você ficou depois', text: 'Sem exigir melhora. Só note se mudou alguma coisa, mesmo pouca.' },
        ],
        why: 'Chama-se ativação comportamental, e é um dos tratamentos com mais evidência para humor deprimido. A lógica que parece invertida é a correta: a disposição aparece depois da ação, não antes. Esperar sentir vontade é esperar na ordem errada.',
        guide: {
          kind: 'steps',
          steps: [
            { label: 'Escolha uma coisa mínima', text: 'A primeira que vier. Se hesitar, é porque é grande demais — diminua.', seconds: 40 },
            { label: 'Levante e faça', text: 'Sem negociar com você mesmo pelo caminho.', seconds: 150 },
            { label: 'Volte e repare', text: 'Como está o corpo agora? Nada precisa ter mudado.', seconds: 40 },
          ],
        },
      },
      {
        key: 'companhia-que-voce-daria',
        comecoNoDiario: 'O que você faria por alguém que você ama, triste assim?',
        title: 'A companhia que você daria',
        duration: '10 minutos',
        summary: 'Fazer por você o que você faria por quem ama.',
        illustration: 'kindness',
        steps: [
          { title: 'Imagine alguém que você ama, triste assim', text: 'Mesma situação, mesmo peso, na pessoa que você mais quer bem.' },
          { title: 'Escreva o que você FARIA por ela', text: 'Não o que diria. O que faria: sentar junto, fazer um chá, não cobrar nada.' },
          { title: 'Escolha uma dessas coisas', text: 'A mais fácil da lista.' },
          { title: 'Faça por você agora', text: 'Você não precisa merecer isso primeiro.' },
        ],
        why: 'Quase todo mundo tem um repertório de cuidado pronto e só não aplica em si. A autocompaixão pesquisada por Kristin Neff não é elogio: é tratar-se com a mesma decência com que você trataria alguém que sofre.',
      },
    ],
  },

  {
    key: 'luto',
    title: 'Luto',
    icon: 'book',
    tint: palette.blue100,
    intro:
      'Luto não é só morte, e não tem prazo. É o que sobra quando alguma coisa que era sua deixou de ser.',
    practices: [
      {
        key: 'carta-a-quem-nao-esta',
        comecoNoDiario: 'Escreva para quem não está. Continue de onde vocês pararam.',
        title: 'Carta para quem não está',
        duration: '10 a 15 minutos',
        summary: 'Escrever para quem se foi, sem precisar terminar.',
        illustration: 'letter',
        steps: [
          { title: 'Escreva como se fosse conversa', text: 'Sem começo formal. Continue de onde vocês pararam.' },
          { title: 'Conte o que ficou por dizer', text: 'O agradecimento, a briga, o pedido de desculpa. O que estiver ali.' },
          { title: 'Diga como as coisas estão agora', text: 'O que mudou desde então. O que essa pessoa perderia de ver.' },
          { title: 'Termine sem fechar', text: 'Não precisa de despedida. Você pode escrever de novo depois.' },
        ],
        why: 'Escrever para alguém que não pode responder tira o peso de ter que dizer em voz alta, e o que ficou por dizer costuma ser justamente o que mais pesa. Continuar conversando com quem se foi é comum, e não é sinal de que você não aceitou.',
      },
      {
        key: 'o-que-ficou-de-heranca',
        comecoNoDiario: 'O que ficou de herança de quem não está mais?',
        title: 'O que ficou de herança',
        duration: '10 minutos',
        summary: 'O que essa pessoa deixou em você e continua funcionando.',
        illustration: 'gratitude',
        steps: [
          { title: 'Liste manias e frases que você pegou dela', text: 'O jeito de fazer café, a expressão que você repete sem perceber.' },
          { title: 'Escreva uma coisa que você faz melhor por causa dela', text: 'Ensinada de propósito ou aprendida de tanto conviver.' },
          { title: 'Escolha uma para fazer hoje', text: 'A mais fácil da lista.' },
          { title: 'Repare que aquilo continua acontecendo', text: 'Está em você, e está em uso.' },
        ],
        why: '"O que ficou" é uma pergunta diferente de "o que eu perdi", e as duas são verdadeiras ao mesmo tempo. Olhar para o que continua não apaga a falta — coloca ela ao lado de outra coisa.',
      },
      {
        key: 'quando-vem-em-onda',
        title: 'Quando a saudade vem em onda',
        duration: '5 minutos',
        summary: 'O que fazer no minuto em que a falta chega de repente.',
        illustration: 'pause',
        steps: [
          { title: 'Pare o que estiver fazendo, se der', text: 'Sentar já ajuda. Não precisa sair do lugar nem ir para outro cômodo.' },
          { title: 'Diga o nome do que você está sentindo', text: 'Saudade. Raiva. Culpa. Alívio, às vezes. A palavra dá contorno.' },
          { title: 'Deixe subir sem apressar', text: 'Costuma vir em onda: sobe, fica um tempo e desce. Você não precisa fazer nada enquanto está no alto.' },
          { title: 'Volte devagar', text: 'Um gole de água, uma janela aberta. Sem cobrar que você siga como estava antes.' },
        ],
        why: 'A falta raramente vem constante — vem em onda, e é por isso que pega de surpresa mesmo meses depois. Saber que ela sobe e desce muda o que se faz enquanto está no alto: esperar, em vez de brigar.',
        guide: {
          kind: 'steps',
          steps: [
            { label: 'Sente onde você estiver', text: 'Costas apoiadas, pés no chão. Só isso.', seconds: 20 },
            { label: 'Diga o nome', text: 'Em voz alta ou por dentro: o que é isto que chegou?', seconds: 30 },
            { label: 'Deixe estar', text: 'Sem empurrar e sem alimentar. Ela sobe, fica, e começa a descer.', seconds: 90 },
            { label: 'Volte devagar', text: 'Repare no lugar onde você está. O ar, a luz, o barulho de fora.', seconds: 40 },
          ],
        },
      },
    ],
  },
  {
    key: 'insonia',
    title: 'Insônia',
    icon: 'moon',
    tint: moodColors.cansado,
    intro: 'Dormir não se força. O que dá para fazer é preparar o corpo e tirar a pressa da cabeça.',
    practices: [
      {
        key: 'relaxamento-progressivo',
        title: 'Relaxamento antes de dormir',
        duration: '8 minutos',
        summary: 'Contrair e soltar cada parte, dos pés à testa.',
        illustration: 'bodyscan',
        steps: [
          { title: 'Deite-se de barriga para cima', text: 'Braços ao lado do corpo, pernas descruzadas.' },
          { title: 'Contraia um grupo de músculos por 5 segundos', text: 'Comece pelos pés. Aperte com firmeza, sem chegar a doer.' },
          { title: 'Solte de uma vez e repare na diferença', text: 'Esse contraste é o exercício inteiro. Fique 10 segundos ali.' },
          { title: 'Suba pelo corpo', text: 'Panturrilhas, coxas, barriga, mãos, braços, ombros, rosto. Um de cada vez.' },
        ],
        why: 'Relaxamento muscular progressivo, criado por Edmund Jacobson nos anos 1920. Tensão e alerta andam juntos, e costuma ser mais fácil soltar o corpo do que convencer a cabeça — por isso a prática começa pelos músculos.',
        guide: {
          kind: 'steps',
          steps: [
            { label: 'Pés', text: 'Encolha os dedos com força. Segure... e solte.', seconds: 30 },
            { label: 'Pernas', text: 'Aperte panturrilhas e coxas. Segure... e solte.', seconds: 30 },
            { label: 'Barriga', text: 'Contraia o abdômen. Segure... e solte.', seconds: 30 },
            { label: 'Mãos e braços', text: 'Feche os punhos e dobre os braços. Segure... e solte.', seconds: 30 },
            { label: 'Ombros', text: 'Suba os ombros até as orelhas. Segure... e solte.', seconds: 30 },
            { label: 'Rosto', text: 'Aperte os olhos e a testa. Segure... e solte.', seconds: 30 },
            { label: 'Corpo inteiro', text: 'Repare no peso do corpo na cama. Não precisa fazer mais nada.', seconds: 40 },
          ],
        },
      },
      {
        key: 'varredura-corporal',
        title: 'Varredura corporal',
        duration: '6 minutos',
        summary: 'Passar a atenção pelo corpo, sem mudar nada.',
        illustration: 'scan',
        steps: [
          { title: 'Feche os olhos e comece pelos pés', text: 'Só repare no que já está lá: peso, temperatura, formigamento, nada.' },
          { title: 'Suba devagar', text: 'Pernas, quadril, costas, peito, braços, pescoço, rosto.' },
          { title: 'Não conserte nada', text: 'Se doer ou incomodar, apenas note e siga. O objetivo não é relaxar, é reparar.' },
          { title: 'Se a cabeça viajar, volte', text: 'Ela vai viajar várias vezes. Voltar faz parte, não é falha.' },
        ],
        why: 'Sem uma tarefa, a mente à noite volta para preocupações. A varredura dá a ela algo concreto e sem urgência para fazer, e a atenção ao corpo compete diretamente com o pensamento repetitivo.',
        guide: {
          kind: 'steps',
          steps: [
            { label: 'Pés e tornozelos', text: 'O que você sente aí agora?', seconds: 40 },
            { label: 'Pernas', text: 'Peso, contato com a cama, temperatura.', seconds: 40 },
            { label: 'Quadril e costas', text: 'Onde o corpo toca a superfície.', seconds: 40 },
            { label: 'Barriga e peito', text: 'Acompanhe a respiração sem mudá-la.', seconds: 40 },
            { label: 'Braços e mãos', text: 'Dos ombros até a ponta dos dedos.', seconds: 40 },
            { label: 'Pescoço e rosto', text: 'Mandíbula, olhos, testa.', seconds: 40 },
          ],
        },
      },
      {
        key: 'diario-da-noite',
        comecoNoDiario: 'O que ficou em aberto hoje?',
        title: 'Diário da noite',
        duration: '5 minutos',
        summary: 'Tirar da cabeça o que ficou pendente.',
        illustration: 'nightjournal',
        steps: [
          { title: 'Escreva o que ficou em aberto', text: 'Tudo que a cabeça insiste em lembrar. Lista solta, sem organizar.' },
          { title: 'Marque o que é do dia seguinte', text: 'Só marcar já basta. Você não precisa resolver agora.' },
          { title: 'Escreva uma frase sobre o dia', text: 'Como ele foi, em uma linha. Boa ou ruim, tanto faz.' },
          { title: 'Feche o caderno', text: 'O gesto de fechar conta. Ficou registrado, pode soltar.' },
        ],
        why: 'Existe um estudo conhecido em que pessoas que escreviam a lista de tarefas do dia seguinte antes de dormir adormeciam mais rápido do que quem escrevia sobre o que já tinha feito. A cabeça segura o que não foi anotado.',
      },
    ],
  },

  {
    key: 'estresse',
    title: 'Estresse',
    icon: 'droplet',
    tint: moodColors.triste,
    intro: 'Estresse acumula no corpo antes de virar pensamento. Estas práticas são curtas de propósito.',
    practices: [
      {
        key: 'pausa-3-minutos',
        title: 'Pausa de 3 minutos',
        duration: '3 minutos',
        summary: 'Um respiro no meio do dia, em três tempos.',
        illustration: 'pause',
        steps: [
          { title: 'Minuto 1 — o que está acontecendo', text: 'Note o que você está pensando, sentindo e como o corpo está. Sem julgar.' },
          { title: 'Minuto 2 — só a respiração', text: 'Estreite a atenção até só o ar entrando e saindo.' },
          { title: 'Minuto 3 — abra de novo', text: 'Volte a incluir o corpo inteiro e o lugar onde você está.' },
        ],
        why: 'É o "espaço de respiração de três minutos" da terapia cognitiva baseada em mindfulness. O formato afunila e depois alarga a atenção de propósito — sai do piloto automático sem exigir que você pare o dia.',
        guide: {
          kind: 'steps',
          steps: [
            { label: 'O que está acontecendo', text: 'Pensamentos, sensações, humor. Só reparar.', seconds: 60 },
            { label: 'Só a respiração', text: 'Acompanhe o ar entrando e saindo.', seconds: 60 },
            { label: 'Abra de novo', text: 'O corpo inteiro, o lugar, os sons.', seconds: 60 },
          ],
        },
      },
      {
        key: 'alongamento-leve',
        title: 'Alongamento leve',
        duration: '5 minutos',
        summary: 'Soltar o que travou de ficar parado.',
        illustration: 'stretch',
        steps: [
          { title: 'Pescoço', text: 'Incline a cabeça para um lado, sem forçar com a mão. 20 segundos de cada lado.' },
          { title: 'Braços acima da cabeça', text: 'Entrelace os dedos, vire as palmas para cima e estique. Respire fundo duas vezes.' },
          { title: 'Torção sentada', text: 'Gire o tronco para um lado apoiando a mão no encosto. Troque de lado.' },
          { title: 'Dobre para frente', text: 'Sentado ou em pé, deixe o tronco cair solto. Deixe a cabeça pesar.' },
        ],
        why: 'Estresse prolongado mantém músculos em contração baixa e constante, principalmente pescoço e ombros. Alongar interrompe esse padrão e aumenta o fluxo sanguíneo — o alívio é físico e imediato.',
      },
      {
        key: 'ombros',
        title: 'Liberar tensão nos ombros',
        duration: '2 minutos',
        summary: 'O lugar onde o estresse costuma morar.',
        illustration: 'shoulders',
        steps: [
          { title: 'Suba os ombros até as orelhas', text: 'Bem alto, e segure contando até cinco.' },
          { title: 'Deixe cair de uma vez', text: 'Solte sem controlar a descida. Repita três vezes.' },
          { title: 'Gire para trás', text: 'Cinco círculos lentos e amplos, com os ombros para trás.' },
          { title: 'Repare onde ficaram', text: 'Quase sempre mais baixos do que estavam. Esse é o ponto.' },
        ],
        why: 'Elevar os ombros é uma resposta automática de proteção. Como é automática, você não percebe que está fazendo. Exagerar de propósito e soltar devolve o controle voluntário sobre o músculo.',
      },
    ],
  },

  {
    key: 'solidao',
    title: 'Solidão',
    icon: 'user',
    tint: palette.brown100,
    intro: 'Solidão não é falta de gente por perto. É a distância entre o que você sente e o que os outros sabem.',
    practices: [
      {
        key: 'mensagem-de-um-minuto',
        title: 'A mensagem de um minuto',
        duration: '2 minutos',
        summary: 'Uma linha para alguém, sem assunto importante.',
        illustration: 'kindness',
        steps: [
          { title: 'Escolha uma pessoa', text: 'A primeira que vier à cabeça. Não precisa ser a mais próxima.' },
          { title: 'Escreva uma linha só', text: '"Lembrei de você hoje" basta. Não precisa de motivo nem de assunto.' },
          { title: 'Envie antes de reler', text: 'Reler é onde a mensagem morre.' },
        ],
        why: 'As pessoas subestimam sistematicamente o quanto o outro gosta de receber contato — o efeito aparece em estudos sobre iniciar conversas. O medo de incomodar é quase sempre maior que o incômodo real.',
        guide: {
          kind: 'steps',
          steps: [
            { label: 'Escolha quem', text: 'A primeira pessoa que vier. Não avalie a escolha.', seconds: 25 },
            { label: 'Escreva uma linha', text: 'Curta. Sem assunto importante, sem pedido.', seconds: 60 },
            { label: 'Envie', text: 'Agora, antes de reler.', seconds: 15 },
          ],
        },
      },
      {
        key: 'quem-ja-esteve-la',
        comecoNoDiario: 'Quem apareceu quando foi difícil? O que cada um fez?',
        title: 'Quem já esteve lá',
        duration: '8 minutos',
        summary: 'A solidão apaga da memória quem apareceu.',
        illustration: 'achievements',
        steps: [
          { title: 'Liste quem apareceu em momentos difíceis', text: 'Vale quem apareceu uma vez só. Vale gente com quem você não fala mais.' },
          { title: 'Escreva o que cada um fez', text: 'Concreto: ficou ao telefone, buscou você, mandou mensagem todo dia.' },
          { title: 'Marque com quem você não fala há mais de um mês', text: 'Sem culpa. É só um mapa.' },
        ],
        why: 'A solidão distorce a leitura social: faz parecer que ninguém se importa e que nunca ninguém se importou. Escrever nomes e fatos coloca evidência contra uma impressão — e a impressão costuma perder.',
      },
      {
        key: 'presenca-sem-conversa',
        title: 'Presença sem conversa',
        duration: '30 minutos',
        summary: 'Estar perto de gente sem precisar falar com ninguém.',
        illustration: 'pause',
        steps: [
          { title: 'Escolha um lugar com movimento', text: 'Café, praça, biblioteca, padaria. Nada que exija interação.' },
          { title: 'Leve algo para fazer', text: 'Livro, caderno, nada. Não precisa ser produtivo.' },
          { title: 'Fique meia hora', text: 'Sem meta de falar com ninguém. Estar junto já é o exercício.' },
        ],
        why: 'Estar na presença de outras pessoas reduz a sensação de isolamento mesmo sem interação — é o que se chama de co-presença. Para quem está sem energia para conversar, é a porta mais baixa que existe.',
      },
    ],
  },

  {
    key: 'raiva',
    title: 'Raiva',
    icon: 'footprints',
    tint: palette.terracotta100,
    intro: 'Raiva quase sempre é a capa de outra coisa. Descarregar o corpo primeiro é o que deixa ver o que tem embaixo.',
    practices: [
      {
        key: 'descarregar-o-corpo',
        title: 'Descarregar o corpo',
        duration: '4 minutos',
        summary: 'A raiva é energia física. Gaste antes de decidir qualquer coisa.',
        illustration: 'stretch',
        steps: [
          { title: 'Reconheça que é o corpo', text: 'Mandíbula travada, mãos fechadas, calor no rosto. Isso não é pensamento, é preparo para agir.' },
          { title: 'Mova com força por um minuto e meio', text: 'Subir escada, andar rápido, apertar uma almofada, agachar. Intenso e sem bater em nada.' },
          { title: 'Respire longo depois', text: 'Solte o ar mais devagar do que puxa. É isso que desliga o alarme.' },
          { title: 'Só então decida', text: 'Nenhuma mensagem, nenhuma conversa antes desta etapa.' },
        ],
        why: 'A raiva dispara uma resposta de luta: adrenalina, tensão muscular, coração acelerado. Sem gasto, essa energia fica circulando e alimenta a ruminação. Gastar não resolve o motivo — só devolve a você a capacidade de escolher o que fazer com ele.',
        guide: {
          kind: 'steps',
          steps: [
            { label: 'Aperte as mãos com força', text: 'Feche os punhos, segure a tensão e sinta onde ela está.', seconds: 30 },
            { label: 'Mova com força', text: 'Escada, caminhada rápida, agachamento. Sem bater em nada.', seconds: 90 },
            { label: 'Respire soltando devagar', text: 'Puxe em quatro, solte em oito. Repita.', seconds: 60 },
            { label: 'Repare no que sobrou', text: 'Tirando a adrenalina, o que ficou? Mágoa? Medo? Injustiça?', seconds: 40 },
          ],
        },
      },
      {
        key: 'carta-nao-enviada',
        comecoNoDiario: 'Escreva a carta que não vai ser enviada. Sem filtro — ninguém vai ler.',
        title: 'A carta que não vai ser enviada',
        duration: '12 minutos',
        summary: 'Escrever tudo, sem filtro, e guardar por um dia.',
        illustration: 'letter',
        steps: [
          { title: 'Escreva para a pessoa, sem poupar', text: 'Ninguém vai ler. Injusto pode. Exagerado pode.' },
          { title: 'Diga o que você não diria na frente dela', text: 'É justamente essa parte que está te consumindo.' },
          { title: 'Guarde por 24 horas', text: 'Não apague, não envie. Só espere.' },
          { title: 'Releia no dia seguinte', text: 'Aí sim decida se alguma coisa dali precisa virar conversa de verdade.' },
        ],
        why: 'A escrita expressiva dá saída ao que está preso sem os custos de dizer no pico. E o intervalo de um dia é o que protege as relações: quase nenhuma decisão tomada no auge da raiva sobrevive ao dia seguinte.',
      },
      {
        key: 'o-que-estava-embaixo',
        comecoNoDiario: 'O que estava embaixo da raiva?',
        title: 'O que estava embaixo',
        duration: '8 minutos',
        summary: 'Raiva costuma ser a segunda emoção, não a primeira.',
        illustration: 'scan',
        steps: [
          { title: 'Descreva o que aconteceu em uma frase', text: 'Só o fato, sem adjetivo.' },
          { title: 'Pergunte o que foi ameaçado', text: 'Sua dignidade? Sua segurança? Algo que você considera justo?' },
          { title: 'Procure a emoção de baixo', text: 'Quase sempre é mágoa, medo, vergonha ou impotência. Nomeie.' },
          { title: 'Reescreva a frase com essa emoção', text: '"Fiquei com raiva" vira "me senti descartado". É outra conversa.' },
        ],
        why: 'A raiva é frequentemente uma emoção secundária: chega por cima de uma mais vulnerável, porque protege melhor. Enquanto ela é a única nomeada, o que de fato dói fica sem tratamento.',
      },
    ],
  },

  {
    key: 'procrastinacao',
    title: 'Procrastinação',
    icon: 'check',
    tint: palette.amber100,
    intro: 'Procrastinar raramente é preguiça. É quase sempre uma tarefa grande demais para o estado em que você está.',
    practices: [
      {
        key: 'dois-minutos',
        title: 'Dois minutos',
        duration: '2 minutos',
        summary: 'Combinar só o começo, e ter o direito de parar.',
        illustration: 'focus',
        steps: [
          { title: 'Escolha a tarefa que está travada', text: 'A que você adiou mais vezes.' },
          { title: 'Combine dois minutos, e só', text: 'Não é truque para fazer mais. Você tem direito real de parar no fim.' },
          { title: 'Comece pela parte mais boba', text: 'Abrir o arquivo. Achar o número. Escrever o título.' },
          { title: 'No fim, decida', text: 'Parar está permitido. Continuar também.' },
        ],
        why: 'A resistência é maior antes de começar do que durante — depois de iniciada, uma tarefa incompleta passa a puxar a atenção sozinha. Dois minutos derrubam a barreira de entrada sem exigir a promessa que te fez adiar.',
        guide: {
          kind: 'steps',
          steps: [
            { label: 'Escolha e abra', text: 'Só abrir o que precisa estar aberto.', seconds: 20 },
            { label: 'Dois minutos', text: 'Qualquer parte serve. Feio serve.', seconds: 120 },
            { label: 'Decida', text: 'Parar agora é um resultado válido.', seconds: 20 },
          ],
        },
      },
      {
        key: 'quebrar-ate-ficar-ridiculo',
        comecoNoDiario: 'Qual é o primeiro passo, pequeno até ficar ridículo?',
        title: 'Quebrar até ficar ridículo',
        duration: '6 minutos',
        summary: 'Se o primeiro passo não parece bobo, ainda está grande.',
        illustration: 'blocks',
        steps: [
          { title: 'Escreva a tarefa como ela está na sua cabeça', text: 'Provavelmente algo tipo "resolver o imposto".' },
          { title: 'Quebre em partes', text: 'Quatro ou cinco. Ainda vai parecer grande.' },
          { title: 'Quebre a primeira parte de novo', text: 'E de novo, até o primeiro passo parecer bobo de tão pequeno.' },
          { title: 'Faça só esse', text: 'O resto da lista não é para agora.' },
        ],
        why: 'A tarefa que trava é quase sempre a que não tem primeiro passo definido — a cabeça encara o bloco inteiro e recua. Quebrar até o absurdo tira a decisão do caminho: não sobra o que avaliar, só o que fazer.',
      },
      {
        key: 'custo-de-adiar',
        comecoNoDiario: 'O que adiar isso já custou a você?',
        title: 'O custo de adiar',
        duration: '5 minutos',
        summary: 'O peso invisível de carregar aquilo todo dia.',
        illustration: 'nightjournal',
        steps: [
          { title: 'Escreva o que adiar já te custou', text: 'Prazo, dinheiro, uma conversa que ficou pior.' },
          { title: 'Inclua o custo que ninguém vê', text: 'Lembrar disso toda vez que deita. Acordar com isso. Isso conta.' },
          { title: 'Escreva como seria não ter mais isso na cabeça', text: 'Descreva a sensação, não a tarefa.' },
          { title: 'Compare com o tempo real da tarefa', text: 'Quase sempre carregar custa mais caro do que fazer.' },
        ],
        why: 'Adiar alivia agora e cobra depois, e a conta chega em parcelas invisíveis: atenção ocupada, sono pior, culpa de fundo. Tornar esse custo explícito equilibra uma comparação que a cabeça costuma fazer torta.',
      },
    ],
  },

  {
    key: 'autoestima',
    title: 'Autoestima',
    icon: 'heart',
    tint: moodColors.feliz,
    intro: 'Autoestima não se conserta com elogio. Se constrói reparando no que já está lá.',
    practices: [
      {
        key: 'carta-gentil',
        comecoNoDiario: 'Escreva para você como escreveria para alguém que você ama.',
        title: 'Carta gentil para você',
        duration: '10 minutos',
        summary: 'Falar consigo como falaria com um amigo.',
        illustration: 'kindness',
        steps: [
          { title: 'Pense numa coisa que você se cobra', text: 'Aquela em que você é mais duro consigo mesmo.' },
          { title: 'Imagine um amigo te contando isso', text: 'Exatamente a mesma situação, dita por alguém que você gosta.' },
          { title: 'Escreva o que você diria a ele', text: 'Com as palavras que usaria de verdade. Provavelmente não seriam as que você usa consigo.' },
          { title: 'Troque para "você"', text: 'Releia endereçando a si mesmo. É a mesma carta, e agora é sua.' },
        ],
        why: 'É a prática central da autocompaixão pesquisada por Kristin Neff. Quase todo mundo tem um repertório de gentileza pronto — só não o aplica em si. A troca de destinatário torna esse repertório acessível.',
      },
      {
        key: 'tres-conquistas',
        comecoNoDiario: 'Quais foram as conquistas de hoje? Vale pequeno.',
        title: 'Três conquistas do dia',
        duration: '3 minutos',
        summary: 'Contar o que você fez, não o que faltou.',
        illustration: 'achievements',
        steps: [
          { title: 'Liste três coisas que você fez hoje', text: 'Levantar num dia difícil conta. Responder aquela mensagem conta.' },
          { title: 'Escreva o que cada uma exigiu de você', text: 'Coragem, paciência, organização. Nomeie.' },
          { title: 'Não compare com o que faltou', text: 'A lista do que não deu tempo é para outro momento. Aqui não entra.' },
        ],
        why: 'A gente lembra do que deu errado com mais força do que do que deu certo — é o viés de negatividade, útil para sobreviver e péssimo para se avaliar. Listar de propósito reequilibra o que fica do dia.',
        guide: {
          kind: 'steps',
          steps: [
            { label: 'Uma coisa que você fez hoje', text: 'A primeira que vier. Levantar num dia difícil conta.', seconds: 30 },
            { label: 'A segunda', text: 'Não precisa ser importante. Precisa ser verdade.', seconds: 30 },
            { label: 'A terceira', text: 'Se travar, vale algo que você fez por outra pessoa.', seconds: 30 },
            { label: 'O que cada uma exigiu', text: 'Coragem, paciência, organização. Nomeie a qualidade.', seconds: 45 },
          ],
        },
      },
      {
        key: 'inventario-do-que-atravessou',
        comecoNoDiario: 'O que você já atravessou achando que não ia dar conta?',
        title: 'Inventário do que você atravessou',
        duration: '10 minutos',
        summary: 'Autoestima construída em prova, não em elogio.',
        illustration: 'achievements',
        steps: [
          { title: 'Liste três momentos difíceis que já passaram', text: 'Coisas que na época pareciam sem saída. E passaram.' },
          { title: 'Escreva o que você fez em cada um', text: 'Concreto. Aguentou, pediu ajuda, mudou de rota, esperou.' },
          { title: 'Nomeie a qualidade que aquilo exigiu', text: 'Teimosia, paciência, coragem, humildade. Uma palavra por item.' },
          { title: 'Releia a lista de qualidades', text: 'Não é o que você acha de si. É o que você já demonstrou.' },
        ],
        why: 'Elogio não gruda em quem não acredita nele — a cabeça descarta como exagero. Evidência gruda. Listar o que você atravessou substitui opinião por histórico, que é bem mais difícil de discutir consigo mesmo.',
      },
      {
        key: 'cinco-minutos-de-gentileza',
        comecoNoDiario: 'Qual frase a autocrítica repete? E o que você diria a um amigo no seu lugar?',
        title: 'Cinco minutos de gentileza',
        duration: '5 minutos',
        summary: 'Trocar a frase que você repete sobre si mesmo.',
        illustration: 'kindness',
        steps: [
          { title: 'Escute a autocrítica e escreva ela', text: 'A frase exata que passa na sua cabeça. "Sou um fracasso", "não sirvo pra isso".' },
          { title: 'Reconheça que dói', text: 'Não discuta com ela ainda. Só admita que ouvir isso todo dia machuca.' },
          { title: 'Escreva a frase que você diria a um amigo', text: 'Na mesma situação, para alguém que você gosta.' },
          { title: 'Repita ela para você, devagar', text: 'Vai soar falso nas primeiras vezes. É assim mesmo no começo.' },
        ],
        why: 'A fala interna não muda por decisão, muda por repetição — foi repetindo que a crítica ficou automática. A autocompaixão de Kristin Neff tem três partes, e as três estão aqui: reconhecer a dor, lembrar que não é só com você, e responder com gentileza.',
        guide: {
          kind: 'steps',
          steps: [
            { label: 'Nomeie a autocrítica', text: 'Diga por dentro a frase exata que você repete sobre si.', seconds: 60 },
            { label: 'Reconheça que dói', text: 'Sem discutir com ela. Só: isso machuca, e não sou o único.', seconds: 60 },
            { label: 'A frase gentil', text: 'A que você diria a um amigo. Repita devagar, umas cinco vezes.', seconds: 120 },
            { label: 'Respire e repare', text: 'Nada precisa ter mudado. Só note como ficou.', seconds: 60 },
          ],
        },
      },
    ],
  },

  {
    key: 'culpa',
    title: 'Culpa e vergonha',
    icon: 'lock',
    tint: palette.cream300,
    intro:
      'Culpa é "eu fiz uma coisa ruim". Vergonha é "eu sou ruim". A primeira dá para resolver; a segunda só cresce no escuro.',
    practices: [
      {
        key: 'o-tamanho-real',
        comecoNoDiario: 'O que você fez, sem adjetivo? E o que dependia mesmo de você?',
        title: 'O tamanho real da culpa',
        duration: '10 minutos',
        summary: 'Separar o que você fez do que você concluiu sobre si por causa disso.',
        illustration: 'scan',
        steps: [
          { title: 'Escreva exatamente o que você fez', text: 'Só o fato, como uma câmera registraria. Sem adjetivo e sem "eu sou".' },
          { title: 'Separe o que era seu do que não era', text: 'O que dependia de você, e o que dependia dos outros, do acaso e do que ninguém tinha como saber na hora.' },
          { title: 'Escreva o que você faria diferente hoje', text: 'Com o que você sabe agora — e não com o que você sabia naquele dia.' },
          { title: 'Se ainda dá para reparar, escreva o primeiro passo', text: 'Se não dá mais, escreva isso também. Também é uma resposta.' },
        ],
        why: 'Culpa incha quando fica vaga. Escrever o fato separado do julgamento devolve o tamanho da coisa: sobra o que você fez, que quase sempre é menor do que "eu estraguei tudo".',
      },
      {
        key: 'tirar-do-escuro',
        comecoNoDiario: 'Qual é a frase que você nunca disse a ninguém?',
        title: 'Tirar a vergonha do escuro',
        duration: '10 minutos',
        summary: 'Dizer uma vez, sozinho, o que você acha que não pode ser dito.',
        illustration: 'kindness',
        steps: [
          { title: 'Escreva a frase que você nunca disse a ninguém', text: 'Aquela que você tem certeza de que faria as pessoas se afastarem.' },
          { title: 'Leia em voz alta, sozinho', text: 'Uma vez só. Repare que a sala continua igual depois.' },
          { title: 'Escreva quem poderia ouvir isso sem te largar', text: 'Uma pessoa basta. Vale alguém a quem você ainda não contou nada.' },
          { title: 'Decida se quer contar, sem prazo', text: 'Decidir que ainda não é hora também é decidir.' },
        ],
        why: 'Vergonha se alimenta de segredo e da certeza de ser o único assim. Dizer em voz alta, mesmo sem ninguém ouvindo, quebra a parte que diz que aquilo nunca pode ser dito.',
      },
      {
        key: 'de-quem-e-a-regua',
        comecoNoDiario: 'Qual regra você acha que quebrou — e de quem ela é?',
        title: 'De quem é essa régua',
        duration: '10 minutos',
        summary: 'Ler por extenso a regra que você acha que quebrou.',
        illustration: 'letter',
        steps: [
          { title: 'Escreva a regra que você acha que quebrou', text: 'Começa com "eu deveria". Escreva ela inteira, até o fim.' },
          { title: 'Descubra de quem ela é', text: 'De uma pessoa, de uma casa, de uma época, de uma igreja, da internet. Quase nunca é sua.' },
          { title: 'Pergunte se você exigiria isso de outra pessoa', text: 'Na mesma situação, com as mesmas informações e o mesmo cansaço.' },
          { title: 'Reescreva a regra do jeito que você assinaria', text: 'Uma que dê para cumprir também num dia ruim.' },
        ],
        why: 'Boa parte da culpa vem de regras que a pessoa nunca escolheu e nunca leu inteiras. Escrever a regra por extenso é o que permite discordar dela — em vez de discordar de si mesma.',
      },
    ],
  },
  {
    key: 'comparacao',
    title: 'Comparação',
    icon: 'search',
    tint: palette.green50,
    intro: 'Comparar é automático. O que machuca é medir o seu bastidor contra a estreia dos outros.',
    practices: [
      {
        key: 'o-que-nao-esta-na-foto',
        comecoNoDiario: 'O que você viu dessa pessoa — e o que você não viu?',
        title: 'O que não está na foto',
        duration: '10 minutos',
        summary: 'Escrever a parte da conta que você não tinha.',
        illustration: 'scan',
        steps: [
          { title: 'Escolha a pessoa com quem você ficou se comparando', text: 'Uma só. Provavelmente já veio à cabeça enquanto você lia.' },
          { title: 'Escreva o que você viu', text: 'O post, a notícia, o que te contaram. Só o que chegou até você mesmo.' },
          { title: 'Escreva o que você não viu', text: 'O que você não faz ideia: quanto custou, quem ajudou, o que ficou pelo caminho, como essa pessoa dorme.' },
          { title: 'Compare o tamanho das duas listas', text: 'A segunda é sempre maior. Era com a primeira que você estava se medindo.' },
        ],
        why: 'A comparação nas redes coloca o que a outra pessoa escolheu mostrar contra tudo o que você sabe de você. Escrever a segunda lista não é consolo — é repor a informação que faltava na conta.',
      },
      {
        key: 'a-sua-linha',
        comecoNoDiario: 'Onde você estava há um ano, e onde você está agora?',
        title: 'A sua linha, não a corrida',
        duration: '10 minutos',
        summary: 'Trocar o ponto de comparação: você, e não os outros.',
        illustration: 'achievements',
        steps: [
          { title: 'Escreva onde você estava há um ano', text: 'No que importa para você — não no que rende foto.' },
          { title: 'Escreva onde você está agora', text: 'Inclua o que não parece conquista: continuar, aguentar, mudar de ideia a tempo.' },
          { title: 'Marque a distância entre as duas', text: 'Pode ser pequena. Pequena e sua continua sendo distância.' },
          { title: 'Escolha o próximo passo dessa linha', text: 'Da sua linha. Não da de ninguém.' },
        ],
        why: 'Comparação com os outros não tem fim, porque sempre há mais gente. Comparar com quem você era tem um ponto de referência só, e ele é o seu — o que também é o único que você tem informação suficiente para julgar.',
      },
      {
        key: 'uma-hora-sem-vitrine',
        comecoNoDiario: 'Como você chegou no fim da hora sem tela?',
        title: 'Uma hora sem vitrine',
        duration: '1 hora',
        summary: 'Tirar do alcance a parte da comparação que dá para mudar.',
        illustration: 'pause',
        steps: [
          { title: 'Escolha uma hora do dia', text: 'De preferência aquela em que você rola a tela sem ter decidido rolar.' },
          { title: 'Deixe o celular longe do braço', text: 'Outro cômodo, se der. Modo silencioso não basta: o gesto de pegar é automático.' },
          { title: 'Faça uma coisa que ninguém vai ver', text: 'Cozinhar, andar, dormir, arrumar uma gaveta. Não precisa render nada.' },
          { title: 'Repare como você chegou no fim da hora', text: 'Sem meta e sem cobrar melhora. Só note.' },
        ],
        why: 'Nenhuma conversa com a própria cabeça compete com exposição contínua. Tirar a vitrine do alcance por uma hora é a parte da comparação que se resolve mexendo no ambiente, e não em você.',
      },
    ],
  },
  {
    key: 'foco',
    title: 'Foco',
    icon: 'leaf',
    tint: palette.green100,
    intro: 'Foco não é força de vontade. É reduzir o número de coisas competindo pela sua atenção.',
    practices: [
      {
        key: 'respiracao-foco',
        title: 'Respiração de foco',
        duration: '4 minutos',
        summary: 'Quatro tempos iguais para estabilizar a atenção.',
        illustration: 'breathing',
        steps: [
          { title: 'Sente-se ereto, sem rigidez', text: 'Pés no chão, mãos apoiadas.' },
          { title: 'Inspire em 4, segure em 4', text: 'Conte no mesmo ritmo, sem acelerar.' },
          { title: 'Solte em 4, espere em 4', text: 'O vazio no fim também é contado. É a parte que a maioria pula.' },
          { title: 'Repita seis vezes', text: 'Depois volte à tarefa sem checar o celular no caminho.' },
        ],
        why: 'Respiração quadrada, usada em treinamento militar e por atletas. Tempos iguais funcionam como metrônomo: dão à atenção um alvo simples e previsível, o que reduz a dispersão antes de uma tarefa exigente.',
        guide: {
          kind: 'breathing',
          cycles: 6,
          phases: [
            { label: 'Inspire', seconds: 4, motion: 'in' },
            { label: 'Segure', seconds: 4, motion: 'hold' },
            { label: 'Solte', seconds: 4, motion: 'out' },
            { label: 'Espere', seconds: 4, motion: 'hold' },
          ],
        },
      },
      {
        key: 'blocos-de-atencao',
        title: 'Blocos de atenção',
        duration: '25 minutos',
        summary: 'Uma coisa só, com hora para acabar.',
        illustration: 'blocks',
        steps: [
          { title: 'Escolha uma tarefa só', text: 'Escreva ela numa linha. Se não couber numa linha, está grande demais — corte.' },
          { title: 'Tire o que compete', text: 'Celular longe do alcance do braço, abas fechadas, notificações mudas.' },
          { title: 'Trabalhe até o bloco acabar', text: 'Cerca de 25 minutos. Se lembrar de outra coisa, anote num papel e volte.' },
          { title: 'Pare antes de cansar', text: 'Cinco minutos de pausa longe da tela. Parar cedo é o que permite voltar.' },
        ],
        why: 'Cada troca de tarefa cobra um custo de retomada que pode passar de vários minutos. O ganho não vem do cronômetro, e sim da decisão antecipada do que você não vai fazer nesse intervalo.',
      },
      {
        key: 'descarregar-a-cabeca',
        comecoNoDiario: 'O que está aberto na sua cabeça agora?',
        title: 'Descarregar a cabeça',
        duration: '5 a 10 minutos',
        summary: 'Tirar do pensamento tudo o que está disputando espaço, para sobrar atenção para uma coisa.',
        illustration: 'blocks',
        steps: [
          { title: 'Escreva tudo o que está em aberto', text: 'Trabalho, casa, mensagem não respondida, consulta não marcada. Lista solta, sem ordem e sem organizar.' },
          { title: 'Vá até acabar, inclusive as bobagens', text: 'Bobagem que ocupa espaço ocupa o mesmo espaço que o resto.' },
          { title: 'Marque o que é de hoje', text: 'Quase sempre são duas ou três coisas, e não a lista inteira.' },
          { title: 'Escolha uma e comece por ela', text: 'O resto está escrito. Não vai sumir enquanto você faz esta.' },
        ],
        why: 'Uma cabeça com muita coisa em aberto gasta atenção só em não esquecer delas. Escrever tudo passa essa tarefa para o papel, que lembra melhor — e o que sobra de atenção fica livre para uma coisa de cada vez.',
      },
    ],
  },

  {
    key: 'gratidao',
    title: 'Gratidão',
    icon: 'star',
    tint: palette.yellow100,
    intro: 'Gratidão não é fingir que está tudo bem. É reparar no que sustentou o dia.',
    practices: [
      {
        key: 'tres-coisas-boas',
        comecoNoDiario: 'Quais foram as coisas boas de hoje?',
        title: 'Três coisas boas de hoje',
        duration: '5 minutos',
        summary: 'E por que cada uma aconteceu.',
        illustration: 'gratitude',
        steps: [
          { title: 'Escreva três coisas que foram boas hoje', text: 'Pequenas valem mais que grandes: o café certo, o silêncio da manhã.' },
          { title: 'Para cada uma, escreva por que aconteceu', text: 'Esta é a parte que faz efeito. Alguém fez? Você fez? Foi acaso?' },
          { title: 'Repita por uma semana', text: 'O efeito é cumulativo, não imediato.' },
        ],
        why: 'O exercício "três coisas boas", de Martin Seligman, é dos mais testados da psicologia positiva. O ganho está no "por quê": ele treina a busca por causas de coisas boas, algo que a cabeça faz sozinha com as ruins.',
        guide: {
          kind: 'steps',
          steps: [
            { label: 'A primeira coisa boa', text: 'Pequena vale mais que grande. O café certo, o silêncio da manhã.', seconds: 30 },
            { label: 'Por que ela aconteceu', text: 'Alguém fez? Você fez? Foi acaso? Esta é a parte que faz efeito.', seconds: 35 },
            { label: 'A segunda, e o porquê', text: 'Mesma coisa: o fato e a causa.', seconds: 50 },
            { label: 'A terceira, e o porquê', text: 'Se só vier uma, tudo bem. Uma com causa vale mais que três sem.', seconds: 50 },
          ],
        },
      },
      {
        key: 'carta-agradecimento',
        comecoNoDiario: 'Para quem é essa carta? Escreva o que essa pessoa fez.',
        title: 'Carta de agradecimento',
        duration: '15 minutos',
        summary: 'Para alguém que você nunca agradeceu direito.',
        illustration: 'letter',
        steps: [
          { title: 'Pense em alguém que te ajudou', text: 'Alguém a quem você nunca agradeceu de verdade.' },
          { title: 'Escreva o que essa pessoa fez', text: 'Seja concreto. O que ela fez, quando, e o que mudou para você.' },
          { title: 'Diga como isso te afeta hoje', text: 'A parte que a pessoa provavelmente não sabe.' },
          { title: 'Entregue, se quiser', text: 'Escrever já funciona. Entregar funciona mais — mas é opcional.' },
        ],
        why: 'Nos estudos de Seligman, a carta de gratidão produziu o maior aumento de bem-estar entre os exercícios testados, com efeito mensurável por até um mês. Funciona mesmo sem entregar.',
      },
      {
        key: 'saboreio-de-dois-minutos',
        title: 'Saboreio de dois minutos',
        duration: '2 minutos',
        summary: 'Demorar de propósito numa lembrança boa.',
        illustration: 'gratitude',
        steps: [
          { title: 'Escolha uma lembrança boa recente', text: 'Dos últimos dias. Pequena serve melhor que marcante.' },
          { title: 'Volte nos detalhes sensoriais', text: 'O que você via, ouvia, cheirava. Reconstrua devagar.' },
          { title: 'Repare no corpo agora', text: 'Onde a lembrança aparece: peito, ombros, rosto.' },
          { title: 'Fique mais um pouco', text: 'A pressa de seguir em frente é justamente o que se está treinando a soltar.' },
        ],
        why: 'Chama-se saborear. Experiências boas passam rápido porque a atenção não demora nelas — o que ameaça leva prioridade. Demorar de propósito numa lembrança boa costuma fazê-la render mais, e é uma habilidade que melhora com prática.',
        guide: {
          kind: 'steps',
          steps: [
            { label: 'Escolha a lembrança', text: 'Dos últimos dias. A primeira que vier.', seconds: 30 },
            { label: 'Volte nos detalhes', text: 'O que você via, ouvia, cheirava. Sem pressa.', seconds: 60 },
            { label: 'Repare no corpo', text: 'Onde essa lembrança aparece agora.', seconds: 30 },
          ],
        },
      },
      {
        key: 'o-que-quase-nao-aconteceu',
        comecoNoDiario: 'O que é bom na sua vida e quase não aconteceu?',
        title: 'O que quase não aconteceu',
        duration: '6 minutos',
        summary: 'Imaginar a ausência devolve o valor que o hábito tirou.',
        illustration: 'scan',
        steps: [
          { title: 'Escolha algo bom que existe na sua vida', text: 'Uma pessoa, um trabalho, um lugar onde morar.' },
          { title: 'Escreva como aquilo apareceu', text: 'A sequência de acasos que precisou dar certo.' },
          { title: 'Imagine que um deles não tivesse acontecido', text: 'Você não foi naquela festa. Não mandou aquele currículo. Descreva a vida sem isso.' },
          { title: 'Volte para o presente', text: 'E repare que aquilo está aqui.' },
        ],
        why: 'Chama-se subtração mental. Agradecer pelo que se tem tem efeito curto porque a cabeça se acostuma com tudo. Imaginar a ausência quebra esse hábito — e funciona melhor do que simplesmente listar o que é bom.',
      },
    ],
  },
];

export const findTopic = (key: string) => PRACTICE_TOPICS.find((t) => t.key === key);

export const findPractice = (topicKey: string, practiceKey: string) =>
  findTopic(topicKey)?.practices.find((p) => p.key === practiceKey);
