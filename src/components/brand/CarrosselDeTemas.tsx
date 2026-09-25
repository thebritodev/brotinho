import React from 'react';
import { ScrollView, View } from 'react-native';

/**
 * Uma fileira de cartões de tema que anda para o lado.
 *
 * ## Por que não o `Carrossel`
 *
 * O `Carrossel` deste app é de **um cartão por vez**: o cartão ocupa quase a
 * tela, a fatia do vizinho ensina o gesto, e os pontinhos dizem onde se está.
 * Ele foi feito para o cartão largo da tela inicial.
 *
 * Aqui são cartões pequenos, dois e pouco à vista de cada vez, e o que importa
 * é comparar — "o que eu tenho para o corpo acelerado?" é uma pergunta que se
 * responde olhando os quatro, não um de cada vez. Pontinho para quatro cartões
 * com dois à vista mentiria sobre a posição, então quem ensina o gesto é a
 * espia: o cartão cortado na borda direita.
 *
 * ## A troca que isto faz
 *
 * A grade mostrava os treze temas de uma vez — descoberta máxima, presença
 * mínima: treze retângulos de 124 pontos empilhados em sete fileiras. A fileira
 * que anda dá o contrário: o cartão cresce, a cena cabe, a tela encurta, e em
 * troca os últimos temas de cada grupo só aparecem para quem arrasta. A espia é
 * o que paga esse preço — sem ela, ninguém arrasta.
 *
 * ## Sangra até a borda
 *
 * A tela tem 20 de margem e o carrossel precisa atravessá-la: o cartão de fora
 * tem de ser cortado **pela tela**, e não pelo conteúdo. Cortado pelo conteúdo,
 * ele acaba numa borda invisível a 20 pontos do fim e lê como cartão pequeno,
 * não como cartão que continua. Daí a margem negativa e o mesmo valor devolvido
 * como recuo interno.
 */

/** O vão entre um cartão e o próximo. */
export const VAO_DO_CARROSSEL = 12;

/**
 * Quantos cartões ficam à vista de uma vez, contando a espia.
 *
 * Um e nove décimos: um cartão inteiro e quase todo o segundo, cortado pela
 * borda da tela — e é esse corte que diz que a fileira continua. Um número
 * inteiro de cartões faria o grupo ler como se tivesse só aqueles, e ninguém
 * arrastaria.
 *
 * O valor foi escolhido olhando três montados no app, e o que decidiu não foi
 * só o tamanho da cena: **a partir de 181 pontos de largura os títulos param de
 * quebrar em duas linhas**. "Baixar o estresse" e "Recuperar o foco" passam a
 * caber numa linha, e a fileira inteira fica mais limpa.
 */
const CARTOES_A_VISTA = 1.9;

/**
 * A proporção do cartão de tema: quadrado.
 *
 * Começou em retrato, 1,16, pensando que a cena precisava de altura. Montadas
 * três no app, o retrato mostrou o contrário: o que crescia com a altura era o
 * **vão vazio** entre o título e a paisagem, e nas cenas de campo aberto isso
 * vira um meio sem nada acontecendo. No quadrado os objetos do primeiro plano
 * preenchem o quadro, e a faixa do meio volta a ser faixa.
 *
 * O limite de baixo é o título: em 156 pontos de altura, um título de duas
 * linhas — "Acalmar a ansiedade" — quase encosta no horizonte, e o céu deixa
 * de ser folga. Quadrado é o ponto onde a tela mostra três grupos inteiros sem
 * apertar nenhuma das duas coisas.
 */
const ALTURA_SOBRE_LARGURA = 1;

/** A largura de cada cartão numa tela desta largura. */
export function larguraDoCartaoDoTema(larguraDaTela: number, recuo = 20) {
  const faixa = larguraDaTela - recuo;
  return Math.round((faixa - VAO_DO_CARROSSEL * (CARTOES_A_VISTA - 1)) / CARTOES_A_VISTA);
}

/** A altura que combina com essa largura. */
export function alturaDoCartaoDoTema(largura: number) {
  return Math.round(largura * ALTURA_SOBRE_LARGURA);
}

type Props = {
  /** Um filho por cartão. */
  children: React.ReactNode;
  /** A largura de cada cartão: é ela que define onde o gesto encaixa. */
  largura: number;
  /** A margem da tela que o carrossel atravessa. */
  recuo?: number;
};

export function CarrosselDeTemas({ children, largura, recuo = 20 }: Props) {
  return (
    <View style={{ marginHorizontal: -recuo }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        /*
          Encaixa de cartão em cartão, e não em página.

          Sem `snapToInterval` a fileira para onde o dedo soltar, e meio cartão
          cortado no meio da tela lê como defeito de rolagem. Com ele, soltar em
          qualquer lugar assenta no próximo — e `decelerationRate` rápido é o
          que faz isso parecer encaixe e não freada.
        */
        snapToInterval={largura + VAO_DO_CARROSSEL}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: recuo,
          gap: VAO_DO_CARROSSEL,
        }}
      >
        {children}
      </ScrollView>
    </View>
  );
}
