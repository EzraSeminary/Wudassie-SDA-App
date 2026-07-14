import React from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  BookOpenIcon,
  Cog6ToothIcon,
  HeartIcon,
  MusicalNoteIcon,
  PlayIcon,
} from 'react-native-heroicons/outline';
import { BlurView } from '@react-native-community/blur';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNokiaFontName } from '../../utils/platformUtils';
import { GlassGradientBorder, glassSurface, useGlassTheme } from './GlassBackground';

const BAR_SIDE_MARGIN = 16;
const BAR_PADDING = 7;
const BAR_HEIGHT = 70;

const getBottomFadeOpacity = (isDarkMode: boolean) => {
  if (Platform.OS === 'android') {
    return {
      bottom: isDarkMode ? 0.88 : 0.82,
      middle: isDarkMode ? 0.7 : 0.64,
    };
  }

  return {
    bottom: isDarkMode ? 0.76 : 0.58,
    middle: isDarkMode ? 0.54 : 0.38,
  };
};

const iconForRoute = (name: string) => {
  if (name === 'Hymnals') {
    return BookOpenIcon;
  }
  if (name === 'Hagerigna') {
    return MusicalNoteIcon;
  }
  if (name === 'Favorites') {
    return HeartIcon;
  }
  if (name === 'Music') {
    return PlayIcon;
  }
  return Cog6ToothIcon;
};

const labelForRoute = (name: string) => {
  if (name === 'Hymnals') {
    return 'Hymns';
  }
  if (name === 'Hagerigna') {
    return 'Songs';
  }
  return name;
};

const GlassTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const glass = useGlassTheme();
  const insets = useSafeAreaInsets();
  const focusedDescriptor = descriptors[state.routes[state.index]?.key];
  const tabBarStyle = StyleSheet.flatten(focusedDescriptor?.options.tabBarStyle);
  const shouldHide = (tabBarStyle as { display?: string } | undefined)?.display === 'none';
  const bottomFadeOpacity = getBottomFadeOpacity(glass.isDarkMode);
  const bottomFadeColor = glass.isDarkMode ? glass.base : glass.horizon;

  if (shouldHide) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View
        pointerEvents="none"
        style={[
          styles.bottomFade,
          { height: BAR_HEIGHT + Math.max(insets.bottom, 8) + 48 },
        ]}
      >
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <SvgLinearGradient id="tab-bottom-fade" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor={bottomFadeColor} stopOpacity={bottomFadeOpacity.bottom} />
              <Stop offset="0.58" stopColor={bottomFadeColor} stopOpacity={bottomFadeOpacity.middle} />
              <Stop offset="1" stopColor={bottomFadeColor} stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#tab-bottom-fade)" />
        </Svg>
      </View>
      <View
        style={[
          styles.bar,
          styles.barBorder,
          glassSurface(glass, true),
          {
            marginHorizontal: BAR_SIDE_MARGIN,
            shadowColor: glass.accent,
          },
        ]}
      >
        {Platform.OS === 'android' ? (
          <BlurView
            pointerEvents="none"
            blurType={glass.isDarkMode ? 'dark' : 'light'}
            blurAmount={18}
            overlayColor={glass.strongGlass}
            reducedTransparencyFallbackColor={glass.strongGlass}
            style={styles.androidBlur}
          />
        ) : null}
        <GlassGradientBorder radius={34} />
        <View style={styles.items}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const descriptor = descriptors[route.key];
            const Icon = iconForRoute(route.name);
            const color = focused ? glass.accent : glass.mutedText;
            const label = labelForRoute(route.name);

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={descriptor.options.tabBarAccessibilityLabel}
                testID={descriptor.options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.item}
              >
                {({ pressed }) => (
                  <Animated.View style={[styles.itemInner, pressed ? styles.pressed : null]}>
                    <Icon size={22} color={color} strokeWidth={focused ? 2.6 : 2.2} />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.label,
                        {
                          color,
                          opacity: focused ? 1 : 0.72,
                          fontFamily: getNokiaFontName('bold'),
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </Animated.View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: 34,
    padding: BAR_PADDING,
    overflow: 'hidden',
  },
  barBorder: {
    borderColor: 'rgba(255, 250, 236, 0.72)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  androidBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  items: {
    flex: 1,
    flexDirection: 'row',
  },
  item: {
    flex: 1,
    borderRadius: 28,
  },
  itemInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.86,
  },
  label: {
    fontSize: 10,
    lineHeight: 12,
  },
});

export default GlassTabBar;
