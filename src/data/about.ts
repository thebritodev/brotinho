/**
 * Conteúdo da tela "Sobre o Brotinho".
 *
 * O responsável e o contato saem de privacyPolicy.ts para não existirem em
 * dois lugares — se mudarem, mudam uma vez só.
 */

export type AboutSection = { title: string; paragraphs: string[] };

export const ABOUT: AboutSection[] = [
  {
    title: 'Por que um broto',
    paragraphs: [
      'Cuidar da própria cabeça se parece mais com jardinagem do que com conserto. Não existe um botão que resolve: existe rega, luz, tempo e alguma paciência com os dias em que nada parece acontecer.',
      'O broto cresce conforme você aparece. Ele não cobra, não pontua e não fica bravo quando você some por uma semana. Ele só continua ali.',
    ],
  },
  {
    title: 'O que é compostar um pensamento',
    paragraphs: [
      'Pensamentos difíceis não somem porque alguém mandou parar de pensar neles. Tentar empurrá-los para longe costuma dar mais força a eles.',
      'Compostar é fazer o contrário: pegar a frase que te incomoda, repetir em voz alta até ela virar só som, e deixar que isso alimente o crescimento em vez de apodrecer por dentro. É uma técnica real, chamada defusão cognitiva, usada na terapia ACT.',
    ],
  },
  {
    title: 'Seus registros são seus',
    paragraphs: [
      'Não há cadastro e não há servidor nosso. O que você escreve fica no seu aparelho, e nunca chega até nós. Até a análise que sugere seus valores e temas roda aqui dentro.',
      'Isso tem um custo que preferimos assumir: sem conta, ninguém pode recuperar seu diário para você. Em troca, ninguém além de você o lê — nem nós.',
      'Trocar de celular não é problema: seus registros entram na cópia de segurança que o próprio aparelho já faz, no Google Drive ou no iCloud, e voltam quando você reinstala o app com a mesma conta.',
    ],
  },
  {
    title: 'Isto não é tratamento',
    paragraphs: [
      'As práticas daqui são de autocuidado, baseadas em técnicas conhecidas. Elas ajudam, mas não substituem acompanhamento psicológico ou médico.',
      'Se você estiver em sofrimento intenso ou pensando em se machucar, procure ajuda. O CVV atende de graça, 24 horas por dia, pelo telefone 188 e em cvv.org.br.',
    ],
  },
];

/** Bibliotecas de código aberto que sustentam o app. */
export const OPEN_SOURCE = [
  'React Native',
  'Expo',
  'react-native-svg',
  'react-native-gesture-handler',
  'Whisper (transcrição)',
  'Baloo 2 e Nunito (fontes)',
];
