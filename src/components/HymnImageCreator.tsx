import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Share, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Svg, {
  Circle,
  Image as SvgImage,
  Rect,
  Text as SvgText,
  TSpan,
} from 'react-native-svg';
import { ArrowUpTrayIcon, CheckIcon, XMarkIcon } from 'react-native-heroicons/outline';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import tw from '../../tailwind';
import { getDefaultFontStyle, getNokiaFontName } from '../utils/platformUtils';
import { useGlassTheme } from './glass/GlassBackground';
import type { LyricSelection } from './SelectableLyrics';

type HymnImageCreatorProps = {
  visible: boolean;
  selection: LyricSelection | null;
  songTitle: string;
  songNumber: number;
  englishTitle?: string;
  sourceType: 'hymnal' | 'hagerigna';
  onClose: () => void;
};

type ImageTheme = {
  id: string;
  name: string;
  background: [string, string];
  accent: string;
  text: string;
  muted: string;
  panel: string;
  note: string;
};

const themes: ImageTheme[] = [
  {
    id: 'sabbath',
    name: 'Sabbath Sky',
    background: ['#EAF6FF', '#F6E7B8'],
    accent: '#1F8EDB',
    text: '#10243A',
    muted: '#4A657C',
    panel: '#FFFFFF',
    note: '#2B8ED6',
  },
  {
    id: 'gold',
    name: 'Gold Chapel',
    background: ['#2B2012', '#D7A343'],
    accent: '#F8D77B',
    text: '#FFF8E6',
    muted: '#F0D79E',
    panel: '#2A2117',
    note: '#F8D77B',
  },
  {
    id: 'rose',
    name: 'Rose Dawn',
    background: ['#FFF1F2', '#C7D2FE'],
    accent: '#D9466B',
    text: '#29192A',
    muted: '#76506B',
    panel: '#FFFFFF',
    note: '#D9466B',
  },
  {
    id: 'midnight',
    name: 'Midnight Praise',
    background: ['#07111F', '#4C1D95'],
    accent: '#C4B5FD',
    text: '#FBF8FF',
    muted: '#D5C8EE',
    panel: '#0B1020',
    note: '#C4B5FD',
  },
];

type AspectOption = {
  id: 'portrait' | 'threeFour' | 'square' | 'wide';
  label: string;
  width: number;
  height: number;
};

const aspectOptions: AspectOption[] = [
  { id: 'square', label: '1:1', width: 1080, height: 1080 },
  { id: 'threeFour', label: '3:4', width: 1080, height: 1440 },
  { id: 'portrait', label: '9:16', width: 1080, height: 1920 },
  { id: 'wide', label: '16:9', width: 1600, height: 900 },
];

const logoSource = Image.resolveAssetSource(require('./assets/logo_round.png'));

const normalizeLines = (text: string) =>
  text
    .replace(/\\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

const wrapLine = (line: string, maxChars: number) => {
  const words = line.split(' ');
  const rows: string[] = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      rows.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) {
    rows.push(current);
  }

  return rows;
};

const createBackgroundImage = (theme: ImageTheme, width: number, height: number) => {
  const [start, end] = theme.background;
  const id = theme.id;
  const chapel = id === 'gold'
    ? `<path d="M0 ${height * 0.72} C${width * 0.22} ${height * 0.42},${width * 0.42} ${height * 0.42},${width * 0.58} ${height * 0.72} S${width * 0.9} ${height * 1.02},${width} ${height * 0.74} L${width} ${height} L0 ${height} Z" fill="${theme.accent}" opacity="0.16"/>`
    : '';
  const stars = id === 'midnight'
    ? `<g fill="#FFFFFF" opacity="0.58"><circle cx="${width * 0.18}" cy="${height * 0.2}" r="3"/><circle cx="${width * 0.72}" cy="${height * 0.16}" r="4"/><circle cx="${width * 0.84}" cy="${height * 0.48}" r="2.8"/><circle cx="${width * 0.34}" cy="${height * 0.72}" r="3.6"/><circle cx="${width * 0.58}" cy="${height * 0.64}" r="2.5"/></g>`
    : '';
  const petals = id === 'rose'
    ? `<g fill="${theme.accent}" opacity="0.16"><ellipse cx="${width * 0.16}" cy="${height * 0.18}" rx="${width * 0.16}" ry="${height * 0.055}" transform="rotate(-25 ${width * 0.16} ${height * 0.18})"/><ellipse cx="${width * 0.83}" cy="${height * 0.8}" rx="${width * 0.2}" ry="${height * 0.06}" transform="rotate(28 ${width * 0.83} ${height * 0.8})"/></g>`
    : '';
  const clouds = id === 'sabbath'
    ? `<g fill="#FFFFFF" opacity="0.24"><ellipse cx="${width * 0.16}" cy="${height * 0.76}" rx="${width * 0.28}" ry="${height * 0.1}"/><ellipse cx="${width * 0.9}" cy="${height * 0.18}" rx="${width * 0.22}" ry="${height * 0.09}"/></g>`
    : '';
  const staffY = height * 0.68;
  const staffGap = Math.max(16, height * 0.018);
  const notes = `
    <g opacity="0.18" stroke="${theme.note}" stroke-width="${Math.max(5, width * 0.006)}" stroke-linecap="round">
      <path d="M${width * 0.08} ${staffY} C${width * 0.32} ${staffY - height * 0.08},${width * 0.62} ${staffY + height * 0.08},${width * 0.92} ${staffY - height * 0.02}" fill="none"/>
      <path d="M${width * 0.08} ${staffY + staffGap} C${width * 0.32} ${staffY - height * 0.08 + staffGap},${width * 0.62} ${staffY + height * 0.08 + staffGap},${width * 0.92} ${staffY - height * 0.02 + staffGap}" fill="none"/>
      <path d="M${width * 0.08} ${staffY + staffGap * 2} C${width * 0.32} ${staffY - height * 0.08 + staffGap * 2},${width * 0.62} ${staffY + height * 0.08 + staffGap * 2},${width * 0.92} ${staffY - height * 0.02 + staffGap * 2}" fill="none"/>
    </g>
    <g fill="${theme.note}" opacity="0.22">
      <ellipse cx="${width * 0.23}" cy="${staffY + staffGap * 2.2}" rx="${width * 0.035}" ry="${height * 0.022}" transform="rotate(-18 ${width * 0.23} ${staffY + staffGap * 2.2})"/>
      <rect x="${width * 0.26}" y="${staffY - height * 0.12}" width="${Math.max(8, width * 0.012)}" height="${height * 0.15}" rx="6"/>
      <ellipse cx="${width * 0.7}" cy="${staffY - staffGap * 0.4}" rx="${width * 0.034}" ry="${height * 0.022}" transform="rotate(-18 ${width * 0.7} ${staffY - staffGap * 0.4})"/>
      <rect x="${width * 0.73}" y="${staffY - height * 0.16}" width="${Math.max(8, width * 0.012)}" height="${height * 0.15}" rx="6"/>
      <path d="M${width * 0.74} ${staffY - height * 0.16} C${width * 0.81} ${staffY - height * 0.14},${width * 0.82} ${staffY - height * 0.07},${width * 0.74} ${staffY - height * 0.06} Z"/>
    </g>
  `;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${start}"/>
          <stop offset="1" stop-color="${end}"/>
        </linearGradient>
        <radialGradient id="glow" cx="76%" cy="10%" r="56%">
          <stop offset="0" stop-color="${theme.accent}" stop-opacity="0.34"/>
          <stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <rect width="${width}" height="${height}" fill="url(#glow)"/>
      <circle cx="${width * 0.9}" cy="${height * 0.08}" r="${Math.min(width, height) * 0.22}" fill="${theme.accent}" opacity="0.2"/>
      <circle cx="${width * 0.05}" cy="${height * 0.94}" r="${Math.min(width, height) * 0.28}" fill="#FFFFFF" opacity="0.16"/>
      ${clouds}${chapel}${petals}${stars}${notes}
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const buildFittedLines = (text: string, width: number, availableHeight: number, maxFontSize: number) => {
  const availableWidth = width - 224;

  for (let fontSize = maxFontSize; fontSize >= 24; fontSize -= 2) {
    const maxChars = Math.max(12, Math.floor(availableWidth / (fontSize * 0.62)));
    const rows = normalizeLines(text).flatMap((line) => wrapLine(line, maxChars));
    const lineHeight = Math.round(fontSize * 1.32);

    if (rows.length * lineHeight <= availableHeight) {
      return { rows, fontSize, lineHeight };
    }
  }

  const fontSize = 24;
  const lineHeight = 32;
  const maxChars = Math.max(12, Math.floor(availableWidth / (fontSize * 0.62)));
  const maxRows = Math.max(1, Math.floor(availableHeight / lineHeight));
  return {
    rows: normalizeLines(text).flatMap((line) => wrapLine(line, maxChars)).slice(0, maxRows),
    fontSize,
    lineHeight,
  };
};

const HymnImageCreator = ({
  visible,
  selection,
  songTitle,
  songNumber,
  englishTitle,
  sourceType,
  onClose,
}: HymnImageCreatorProps) => {
  const svgRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const glass = useGlassTheme();
  const defaultThemeId = glass.isDarkMode ? 'gold' : 'sabbath';
  const [themeId, setThemeId] = useState(defaultThemeId);
  const [aspectId, setAspectId] = useState<AspectOption['id']>('square');
  const activeTheme = themes.find((theme) => theme.id === themeId) || themes[0];
  const activeAspect = aspectOptions.find((aspect) => aspect.id === aspectId) || aspectOptions[0];
  const cardWidth = activeAspect.width;
  const cardHeight = activeAspect.height;
  const cardRatio = cardWidth / cardHeight;
  const maxLyricHeight = activeAspect.id === 'wide'
    ? cardHeight * 0.32
    : activeAspect.id === 'square'
      ? cardHeight * 0.34
      : cardHeight * 0.42;
  const cardLines = useMemo(
    () => buildFittedLines(
      selection?.text || '',
      cardWidth,
      maxLyricHeight,
      activeAspect.id === 'wide' ? 52 : 66,
    ),
    [activeAspect.id, cardWidth, maxLyricHeight, selection?.text],
  );
  const titleFontSize = activeAspect.id === 'wide' ? 34 : 40;
  const titleLineHeight = Math.round(titleFontSize * 1.22);
  const titleRows = useMemo(
    () => wrapLine(`${songNumber}. ${songTitle}`, Math.max(18, Math.floor((cardWidth - 224) / (titleFontSize * 0.58)))).slice(0, 2),
    [cardWidth, songNumber, songTitle, titleFontSize],
  );
  const backgroundImage = useMemo(
    () => createBackgroundImage(activeTheme, cardWidth, cardHeight),
    [activeTheme, cardHeight, cardWidth],
  );
  const cardFontFamily = getNokiaFontName('bold');
  const cardTextColor = glass.isDarkMode ? '#FFFFFF' : activeTheme.text;
  const cardMutedTextColor = glass.isDarkMode ? 'rgba(255,255,255,0.82)' : activeTheme.muted;
  const sourceLabel = sourceType === 'hagerigna' ? 'ሃገርኛ' : 'ውዳሴ';
  const panelMaxHeight = Math.max(520, height - Math.max(insets.top, 20));

  useEffect(() => {
    if (visible) {
      setThemeId(defaultThemeId);
    }
  }, [defaultThemeId, visible]);
  const lyricBlockHeight = Math.max(0, (cardLines.rows.length - 1) * cardLines.lineHeight) + cardLines.fontSize;
  const titleBlockHeight = Math.max(0, (titleRows.length - 1) * titleLineHeight) + titleFontSize;
  const subtitleHeight = englishTitle ? 42 : 0;
  const contentGap = activeAspect.id === 'wide' ? 32 : 48;
  const titleGap = englishTitle ? 36 : 0;
  const contentHeight = lyricBlockHeight + contentGap + titleBlockHeight + titleGap + subtitleHeight;
  const idealCenterY = activeAspect.id === 'portrait'
    ? cardHeight * 0.6
    : activeAspect.id === 'threeFour'
      ? cardHeight * 0.57
      : activeAspect.id === 'wide'
        ? cardHeight * 0.58
        : cardHeight * 0.56;
  const minContentTop = activeAspect.id === 'wide' ? 220 : 250;
  const maxContentTop = cardHeight - contentHeight - 110;
  const contentTop = Math.max(minContentTop, Math.min(maxContentTop, idealCenterY - contentHeight / 2));
  const lyricY = contentTop + cardLines.fontSize;
  const titleY = lyricY + Math.max(0, (cardLines.rows.length - 1) * cardLines.lineHeight) + contentGap + titleFontSize;
  const subtitleY = titleY + Math.max(0, (titleRows.length - 1) * titleLineHeight) + titleGap;

  const shareImage = useCallback(() => {
    if (!svgRef.current?.toDataURL) {
      Toast.show({ type: 'error', text1: 'Image export is not available on this device.' });
      return;
    }

    svgRef.current.toDataURL(async (base64: string) => {
      const url = `data:image/png;base64,${base64}`;
      try {
        await Share.share({
          title: songTitle,
          message: `${songNumber}. ${songTitle}\n${selection?.text || ''}`,
          url,
        });
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Could not share image.' });
      }
    });
  }, [selection?.text, songNumber, songTitle]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 justify-end`}>
        <Pressable
          style={[
            tw`absolute inset-0`,
            { backgroundColor: glass.isDarkMode ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.5)' },
          ]}
          onPress={onClose}
        />
        <View
          style={[
            tw`rounded-t-3xl overflow-hidden`,
            { backgroundColor: glass.strongGlass, maxHeight: panelMaxHeight },
          ]}
        >
          <BlurView
            pointerEvents="none"
            blurType={glass.isDarkMode ? 'dark' : 'light'}
            blurAmount={24}
            overlayColor={glass.strongGlass}
            reducedTransparencyFallbackColor={glass.strongGlass}
            style={tw`absolute inset-0`}
          />
          <View style={[tw`self-center w-12 h-1.5 rounded-full mt-3 mb-2`, { backgroundColor: glass.border }]} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={tw`px-5 pt-1 pb-4`}
          >
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <View style={tw`flex-1 pr-4`}>
                <Text style={[tw`text-xs font-nokia-bold uppercase`, { color: glass.accent }]}>Image Studio</Text>
                <Text style={[tw`text-xl font-nokia-bold mt-1`, getDefaultFontStyle('bold'), { color: glass.text }]}>
                  Selected lyrics
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={tw`w-10 h-10 items-center justify-center`}>
                <XMarkIcon size={22} color={glass.mutedText} />
              </TouchableOpacity>
            </View>

            <Text style={[tw`text-sm font-nokia-bold mb-3`, { color: glass.text }]}>Theme</Text>
            <View style={tw`flex-row flex-wrap -mx-1 mb-5`}>
              {themes.map((theme) => {
                const active = theme.id === themeId;
                return (
                  <Pressable
                    key={theme.id}
                    onPress={() => setThemeId(theme.id)}
                    style={[
                      tw`m-1 px-3 py-3 rounded-2xl flex-row items-center`,
                      {
                        flexBasis: '47%',
                        backgroundColor: active ? glass.accent : glass.glass,
                      },
                    ]}
                  >
                    <View
                      style={[
                        tw`w-8 h-8 rounded-full mr-2 overflow-hidden border`,
                        { borderColor: active ? '#FFFFFF' : glass.border },
                      ]}
                    >
                      <View style={{ flex: 1, backgroundColor: theme.background[0] }} />
                      <View style={{ flex: 1, backgroundColor: theme.background[1] }} />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[tw`font-nokia-bold flex-1`, { color: active ? '#FFFFFF' : glass.text }]}
                    >
                      {theme.name}
                    </Text>
                    {active ? <CheckIcon size={18} color="#FFFFFF" /> : null}
                  </Pressable>
                );
              })}
            </View>

            <Text style={[tw`text-sm font-nokia-bold mb-3`, { color: glass.text }]}>Format</Text>
            <View style={tw`flex-row -mx-1 mb-5`}>
              {aspectOptions.map((aspect) => {
                const active = aspect.id === aspectId;
                return (
                  <Pressable
                    key={aspect.id}
                    onPress={() => setAspectId(aspect.id)}
                    style={[
                      tw`flex-1 mx-1 px-3 py-3 rounded-2xl items-center`,
                      { backgroundColor: active ? glass.accent : glass.glass },
                    ]}
                  >
                    <Text style={[tw`font-nokia-bold`, { color: active ? '#FFFFFF' : glass.text }]}>
                      {aspect.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={tw`items-center mb-5`}>
              <View
                style={[
                  tw`w-full max-w-sm rounded-3xl overflow-hidden`,
                  { aspectRatio: cardRatio },
                ]}
              >
                <Svg
                  key={`${themeId}-${aspectId}`}
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${cardWidth} ${cardHeight}`}
                >
                  <SvgImage
                    href={backgroundImage}
                    x="0"
                    y="0"
                    width={cardWidth}
                    height={cardHeight}
                    preserveAspectRatio="xMidYMid slice"
                  />
                  <Rect
                    x="78"
                    y="78"
                    width={cardWidth - 156}
                    height={cardHeight - 156}
                    rx="54"
                    fill={activeTheme.panel}
                    opacity={activeTheme.id === 'gold' || activeTheme.id === 'midnight' ? '0.54' : '0.34'}
                  />
                  <Circle cx={cardWidth * 0.86} cy={cardHeight * 0.12} r={Math.min(cardWidth, cardHeight) * 0.18} fill={activeTheme.accent} opacity="0.16" />
                  <Circle cx={cardWidth * 0.06} cy={cardHeight * 0.86} r={Math.min(cardWidth, cardHeight) * 0.24} fill="#FFFFFF" opacity="0.12" />
                  <SvgImage href={logoSource.uri} x="90" y="90" width="96" height="96" />
                  <SvgText x="210" y="132" fill={cardTextColor} fontSize="42" fontFamily={cardFontFamily} fontWeight="700">
                    Wudassie SDA
                  </SvgText>
                  <SvgText x="210" y="178" fill={cardMutedTextColor} fontSize="34" fontFamily={cardFontFamily} fontWeight="700">
                    {sourceLabel}
                  </SvgText>

                  <SvgText
                    x={cardWidth / 2}
                    y={lyricY}
                    fill={cardTextColor}
                    fontFamily={cardFontFamily}
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {cardLines.rows.map((line, index) => (
                      <TSpan
                        key={`${line}-${index}`}
                        x={cardWidth / 2}
                        dy={index === 0 ? 0 : cardLines.lineHeight}
                        fontSize={cardLines.fontSize}
                      >
                        {line}
                      </TSpan>
                    ))}
                  </SvgText>

                  <SvgText
                    x={cardWidth / 2}
                    y={titleY}
                    fill={cardTextColor}
                    fontSize={titleFontSize}
                    fontFamily={cardFontFamily}
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {titleRows.map((line, index) => (
                      <TSpan key={`${line}-${index}`} x={cardWidth / 2} dy={index === 0 ? 0 : titleLineHeight}>
                        {line}
                      </TSpan>
                    ))}
                  </SvgText>
                  {englishTitle ? (
                    <SvgText
                      x={cardWidth / 2}
                      y={subtitleY}
                      fill={cardMutedTextColor}
                      fontSize="30"
                      fontFamily={cardFontFamily}
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {englishTitle}
                    </SvgText>
                  ) : null}
                </Svg>
              </View>
            </View>
          </ScrollView>
          <View
            style={[
              tw`px-5 pt-3`,
              {
                paddingBottom: Math.max(insets.bottom, 12) + 12,
                backgroundColor: glass.strongGlass,
                borderTopWidth: 1,
                borderTopColor: glass.border,
              },
            ]}
          >
            <TouchableOpacity
              onPress={shareImage}
              activeOpacity={0.86}
              style={[
                tw`rounded-2xl py-4 px-5 flex-row items-center justify-center`,
                { backgroundColor: glass.accent },
              ]}
            >
              <ArrowUpTrayIcon size={21} color="#FFFFFF" />
              <Text style={[tw`text-white font-nokia-bold text-base ml-2`, getDefaultFontStyle('bold')]}>
                Share Image
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default HymnImageCreator;
