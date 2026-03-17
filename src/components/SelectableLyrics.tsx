import React, { useMemo, useRef } from 'react';
import { TextInput, StyleProp, TextStyle } from 'react-native';

type SelectableLyricsProps = {
  text: string;
  style?: StyleProp<TextStyle>;
  selectionColor?: string;
};

const normalizeSongText = (text: string) => text.replace(/\\n/g, '\n');

const SelectableLyrics = ({ text, style, selectionColor = '#EA9215' }: SelectableLyricsProps) => {
  const normalizedText = useMemo(() => normalizeSongText(text || ''), [text]);
  const inputRef = useRef<TextInput>(null);

  return (
    <TextInput
      ref={inputRef}
      multiline
      value={normalizedText}
      onChangeText={() => undefined}
      onPressIn={() => inputRef.current?.focus()}
      style={style}
      underlineColorAndroid="transparent"
      showSoftInputOnFocus={false}
      scrollEnabled={false}
      selectionColor={selectionColor}
      textAlignVertical="top"
      caretHidden
      autoCorrect={false}
      spellCheck={false}
      contextMenuHidden={false}
    />
  );
};

export default SelectableLyrics;
