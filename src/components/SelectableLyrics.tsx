import React, { useMemo } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';

type SelectableLyricsProps = {
  text: string;
  style?: StyleProp<TextStyle>;
  selectionColor?: string;
};

const normalizeSongText = (text: string) =>
  text
    .replace(/\\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ');

const SelectableLyrics = ({ text, style, selectionColor = '#EA9215' }: SelectableLyricsProps) => {
  const normalizedText = useMemo(() => normalizeSongText(text || ''), [text]);

  return (
    <Text
      selectable
      style={style}
      selectionColor={selectionColor}
    >
      {normalizedText}
    </Text>
  );
};

export default SelectableLyrics;
