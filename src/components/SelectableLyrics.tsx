import React, { useMemo, useState } from 'react';
import { Text, StyleProp, TextStyle, View } from 'react-native';

export type LyricSelection = {
  id: string;
  label: string;
  text: string;
  type: 'verse' | 'chorus';
};

type SelectableLyricsProps = {
  text: string;
  style?: StyleProp<TextStyle>;
  selectionColor?: string;
  onSelectSection?: (selection: LyricSelection) => void;
};

const normalizeSongText = (text: string) =>
  text
    .replace(/\\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ');

const getLyricSections = (text: string): LyricSelection[] => {
  const normalizedText = normalizeSongText(text || '').trim();
  if (!normalizedText) {
    return [];
  }

  const blocks = normalizedText
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  let verseCount = 0;
  let chorusCount = 0;

  return blocks.map((block, index) => {
    const firstLine = block.split('\n').find(Boolean)?.trim() || '';
    const isChorus =
      /chorus|refrain/i.test(firstLine) ||
      /^[-–—]{1,2}\s*.+\s*[-–—]{1,2}$/.test(firstLine) ||
      (index > 0 && blocks.slice(0, index).some((previous) => previous.trim() === block));

    if (isChorus) {
      chorusCount += 1;
      return {
        id: `chorus-${index}`,
        label: chorusCount > 1 ? `Chorus ${chorusCount}` : 'Chorus',
        text: block,
        type: 'chorus',
      };
    }

    verseCount += 1;
    return {
      id: `verse-${index}`,
      label: `Verse ${verseCount}`,
      text: block,
      type: 'verse',
    };
  });
};

const SelectableLyrics = ({
  text,
  style,
  selectionColor = '#EA9215',
  onSelectSection,
}: SelectableLyricsProps) => {
  const normalizedText = useMemo(() => normalizeSongText(text || ''), [text]);
  const sections = useMemo(() => getLyricSections(text || ''), [text]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (onSelectSection && sections.length > 0) {
    return (
      <View>
        {sections.map((section) => {
          const selected = selectedId === section.id;
          return (
            <Text
              key={section.id}
              selectable
              selectionColor={selectionColor}
              onLongPress={() => {
                setSelectedId(section.id);
                onSelectSection(section);
              }}
              style={[
                style,
                {
                  marginBottom: 18,
                  borderRadius: 16,
                  backgroundColor: selected ? `${selectionColor}24` : 'transparent',
                },
              ]}
            >
              {section.text}
            </Text>
          );
        })}
      </View>
    );
  }

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
