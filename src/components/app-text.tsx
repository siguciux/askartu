import { Text, type TextProps } from 'react-native';

import { colors, fonts, fontSize, type ColorName } from '@/theme';

type Props = TextProps & {
  bold?: boolean;
  size?: keyof typeof fontSize;
  color?: ColorName;
};

/** Tekstas su Atkinson Hyperlegible šriftu. Telefono šrifto padidinimas veikia. */
export function AppText({ bold, size = 'body', color = 'ink', style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: bold ? fonts.bold : fonts.regular, fontSize: fontSize[size], color: colors[color] },
        style,
      ]}
    />
  );
}
