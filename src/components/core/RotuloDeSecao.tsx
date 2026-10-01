import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

import { fonts, useTema } from '../../theme';

/**
 * O nome de uma seção: maiúsculas pequenas, espaçadas, em tom de apoio.
 *
 * ## Por que não é um título
 *
 * Porque ele não é lido — é **procurado**. Numa tela de ajustes a pessoa chega
 * sabendo o que quer e varre a página atrás da palavra; um título em corpo de
 * leitura compete com o conteúdo e faz a varredura parar em cada bloco. Em
 * maiúsculas pequenas ele some quando não está sendo procurado e aparece
 * quando está, que é exatamente o trabalho dele.
 *
 * ## Por que vive num componente
 *
 * Porque já existiam dois: o Perfil escrevia à mão e as Configurações tinham o
 * próprio `Section`, com outro corpo e outro peso. Duas telas de ajuste lado a
 * lado com rótulos diferentes leem como dois apps — e é o tipo de diferença
 * que ninguém nota uma por vez e todo mundo sente no conjunto.
 */
export function RotuloDeSecao({
  children,
  style,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
}) {
  const { palette } = useTema();
  return (
    <Text
      style={[
        {
          fontFamily: fonts.body.extraBold,
          fontSize: 13,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: palette.brown400,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
