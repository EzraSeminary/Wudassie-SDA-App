import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { BlurView } from '@react-native-community/blur';
import type { RootState } from '../../store';

export type GlassPaletteId = 'sabbathPeace' | 'graceMercy' | 'midnightPrayer';

type GlassPalette = {
  id: GlassPaletteId;
  name: string;
  accent: string;
  light: {
    base: string;
    wash: string;
    horizon: string;
    blobA: string;
    blobB: string;
    blobC: string;
    text: string;
    mutedText: string;
    glass: string;
    strongGlass: string;
    border: string;
  };
  dark: {
    base: string;
    wash: string;
    horizon: string;
    blobA: string;
    blobB: string;
    blobC: string;
    text: string;
    mutedText: string;
    glass: string;
    strongGlass: string;
    border: string;
  };
};

const palettes: Record<GlassPaletteId, GlassPalette> = {
  sabbathPeace: {
    id: 'sabbathPeace',
    name: 'Sabbath Peace',
    accent: '#4AA8FF',
    light: {
      base: '#E0EAFC',
      wash: '#CFDEF3',
      horizon: '#FFF3C4',
      blobA: '#A7D8FF',
      blobB: '#D9C8FF',
      blobC: '#FFE3A3',
      text: '#132238',
      mutedText: '#4C647B',
      glass: 'rgba(255, 255, 255, 0.42)',
      strongGlass: 'rgba(255, 255, 255, 0.62)',
      border: 'rgba(255, 255, 255, 0.72)',
    },
    dark: {
      base: '#0F2027',
      wash: '#203A43',
      horizon: '#2C5364',
      blobA: '#315BFF',
      blobB: '#7C3AED',
      blobC: '#D946EF',
      text: '#F8FBFF',
      mutedText: '#B9C9D8',
      glass: 'rgba(15, 23, 42, 0.45)',
      strongGlass: 'rgba(15, 23, 42, 0.66)',
      border: 'rgba(255, 255, 255, 0.24)',
    },
  },
  graceMercy: {
    id: 'graceMercy',
    name: 'Grace & Mercy',
    accent: '#D6A44A',
    light: {
      base: '#F4E7C5',
      wash: '#E8D39A',
      horizon: '#F8F1DE',
      blobA: '#F3C96A',
      blobB: '#E3B651',
      blobC: '#B9903F',
      text: '#241C10',
      mutedText: '#6A5837',
      glass: 'rgba(255, 250, 236, 0.36)',
      strongGlass: 'rgba(255, 248, 226, 0.52)',
      border: 'rgba(255, 245, 213, 0.84)',
    },
    dark: {
      base: '#0F1411',
      wash: '#1F2419',
      horizon: '#3A2E18',
      blobA: '#D6A44A',
      blobB: '#927136',
      blobC: '#F0C45F',
      text: '#FFF8E8',
      mutedText: '#D3C4A0',
      glass: 'rgba(18, 22, 18, 0.44)',
      strongGlass: 'rgba(20, 24, 18, 0.6)',
      border: 'rgba(255, 232, 174, 0.38)',
    },
  },
  midnightPrayer: {
    id: 'midnightPrayer',
    name: 'Midnight Prayer',
    accent: '#C084FC',
    light: {
      base: '#E9E4FF',
      wash: '#DCEBFF',
      horizon: '#FFF0F7',
      blobA: '#8B5CF6',
      blobB: '#38BDF8',
      blobC: '#F0ABFC',
      text: '#171B34',
      mutedText: '#555A7A',
      glass: 'rgba(255, 255, 255, 0.43)',
      strongGlass: 'rgba(255, 255, 255, 0.63)',
      border: 'rgba(255, 255, 255, 0.72)',
    },
    dark: {
      base: '#070B18',
      wash: '#17113A',
      horizon: '#2E1452',
      blobA: '#4F46E5',
      blobB: '#9333EA',
      blobC: '#EC4899',
      text: '#FAF7FF',
      mutedText: '#C8BEE1',
      glass: 'rgba(11, 16, 32, 0.5)',
      strongGlass: 'rgba(11, 16, 32, 0.7)',
      border: 'rgba(255, 255, 255, 0.22)',
    },
  },
};

export const glassPaletteOptions = Object.values(palettes);

export const useGlassTheme = () => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const selectedPalette = useSelector((state: RootState) => state.theme.glassPalette);
  const palette = palettes[selectedPalette] ?? palettes.graceMercy;
  const colors = isDarkMode ? palette.dark : palette.light;

  return useMemo(() => ({
    isDarkMode,
    paletteId: palette.id,
    paletteName: palette.name,
    accent: palette.accent,
    ...colors,
  }), [colors, isDarkMode, palette.accent, palette.id, palette.name]);
};

type GlassBackgroundProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const GlassBackground = ({ children, style }: GlassBackgroundProps) => {
  const glass = useGlassTheme();
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'android') {
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 15000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 15000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const slowX = drift.interpolate({ inputRange: [0, 1], outputRange: [-18, 22] });
  const slowY = drift.interpolate({ inputRange: [0, 1], outputRange: [10, -18] });
  const reverseX = drift.interpolate({ inputRange: [0, 1], outputRange: [24, -16] });
  const scale = drift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View style={[styles.root, { backgroundColor: glass.base }, style]}>
      <View style={[styles.washTop, { backgroundColor: glass.wash }]} />
      <View style={[styles.washBottom, { backgroundColor: glass.horizon }]} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blob,
          styles.blobA,
          { backgroundColor: glass.blobA, transform: [{ translateX: slowX }, { translateY: slowY }, { scale }] },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blob,
          styles.blobB,
          { backgroundColor: glass.blobB, transform: [{ translateX: reverseX }, { translateY: slowY }] },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blob,
          styles.blobC,
          { backgroundColor: glass.blobC, transform: [{ translateY: slowY }, { scale }] },
        ]}
      />
      {children}
    </View>
  );
};

export const glassSurface = (glass: ReturnType<typeof useGlassTheme>, strong = false): ViewStyle => ({
  backgroundColor: strong ? glass.strongGlass : glass.glass,
  borderColor: 'transparent',
  borderWidth: 0,
  shadowColor: glass.isDarkMode ? '#050403' : '#8B6B2C',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: Platform.OS === 'android' ? 0 : (glass.isDarkMode ? 0.18 : 0.12),
  shadowRadius: Platform.OS === 'android' ? 0 : 18,
  elevation: Platform.OS === 'android' ? 0 : 8,
});

type GlassGradientBorderProps = {
  radius: number;
  opacity?: number;
};

export const GlassGradientBorder = ({ radius, opacity = 1 }: GlassGradientBorderProps) => {
  const glass = useGlassTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  };

  if (Platform.OS === 'android') {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.borderMeasure, { borderRadius: radius }]} onLayout={onLayout}>
      <BlurView
        pointerEvents="none"
        blurType={glass.isDarkMode ? 'dark' : 'light'}
        blurAmount={glass.isDarkMode ? 10 : 14}
        overlayColor="transparent"
        reducedTransparencyFallbackColor={glass.strongGlass}
        style={[styles.blurFill, { borderRadius: radius }]}
      />
      {!glass.isDarkMode && size.width > 2 && size.height > 2 ? (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id="glass-border" x1="0" y1="0" x2={size.width} y2="0">
              <Stop offset="0" stopColor={glass.border} stopOpacity={opacity * 0.76} />
              <Stop offset="0.55" stopColor={glass.border} stopOpacity={opacity * 0.24} />
              <Stop offset="1" stopColor={glass.border} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect
            x="0.75"
            y="0.75"
            width={Math.max(0, size.width - 1.5)}
            height={Math.max(0, size.height - 1.5)}
            rx={radius}
            ry={radius}
            fill="none"
            stroke="url(#glass-border)"
            strokeWidth="1"
          />
        </Svg>
      ) : null}
    </View>
  );
};

export const glassTextShadow = (isDarkMode: boolean) => ({
  textShadowColor: isDarkMode ? 'transparent' : 'rgba(255, 255, 255, 0.55)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: isDarkMode ? 0 : 2,
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  washTop: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.86,
  },
  washBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '48%',
    opacity: 0.62,
  },
  blob: {
    position: 'absolute',
    opacity: 0.24,
    borderRadius: 999,
  },
  blobA: {
    width: 260,
    height: 260,
    top: -58,
    right: -86,
  },
  blobB: {
    width: 320,
    height: 320,
    left: -118,
    top: 178,
  },
  blobC: {
    width: 240,
    height: 240,
    right: 20,
    bottom: 52,
  },
  borderMeasure: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blurFill: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
