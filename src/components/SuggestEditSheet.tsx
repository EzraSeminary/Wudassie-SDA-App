import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { BlurView } from '@react-native-community/blur';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XMarkIcon } from 'react-native-heroicons/outline';
import tw from '../../tailwind';
import type { HagerignaHymn, SDAHymn } from '../services/hymnalService';
import { suggestionService, type SuggestionHymnalType } from '../services/suggestionService';
import { glassSurface, useGlassTheme } from './glass/GlassBackground';

type SuggestEditSheetProps = {
  visible: boolean;
  onClose: () => void;
  hymnalType: SuggestionHymnalType;
  hymn: HagerignaHymn | SDAHymn;
};

type FormState = Record<string, string>;

type FieldConfig = {
  key: string;
  label: string;
  multiline?: boolean;
};

const hagerignaFields: FieldConfig[] = [
  { key: 'title', label: 'Title' },
  { key: 'artist', label: 'Artist' },
  { key: 'song', label: 'Song', multiline: true },
];

const sdaFields: FieldConfig[] = [
  { key: 'newHymnalTitle', label: 'New hymnal title' },
  { key: 'oldHymnalTitle', label: 'Old hymnal title' },
  { key: 'newHymnalLyrics', label: 'New hymnal lyrics', multiline: true },
  { key: 'englishTitleOld', label: 'English title old' },
  { key: 'oldHymnalLyrics', label: 'Old hymnal lyrics', multiline: true },
];

const optionalFields: FieldConfig[] = [
  { key: 'submitterName', label: 'Your name' },
  { key: 'submitterEmail', label: 'Your email' },
  { key: 'note', label: 'Note', multiline: true },
];

const showLineBreaks = (value?: string) => (value || '').replace(/\\n/g, '\n');

const buildInitialState = (hymnalType: SuggestionHymnalType, hymn: HagerignaHymn | SDAHymn): FormState => {
  if (hymnalType === 'hagerigna') {
    const item = hymn as HagerignaHymn;
    return {
      title: item.title || '',
      artist: item.artist || '',
      song: showLineBreaks(item.song),
      submitterName: '',
      submitterEmail: '',
      note: '',
    };
  }

  const item = hymn as SDAHymn;
  return {
    newHymnalTitle: item.newHymnalTitle || item.title || '',
    oldHymnalTitle: item.oldHymnalTitle || '',
    newHymnalLyrics: showLineBreaks(item.newHymnalLyrics || item.lyrics),
    englishTitleOld: item.englishTitleOld || '',
    oldHymnalLyrics: showLineBreaks(item.oldHymnalLyrics),
    submitterName: '',
    submitterEmail: '',
    note: '',
  };
};

const buildRequestedData = (hymnalType: SuggestionHymnalType, form: FormState) => {
  if (hymnalType === 'hagerigna') {
    return {
      title: form.title.trim(),
      artist: form.artist.trim(),
      song: form.song,
    };
  }

  return {
    newHymnalTitle: form.newHymnalTitle.trim(),
    oldHymnalTitle: form.oldHymnalTitle.trim(),
    newHymnalLyrics: form.newHymnalLyrics,
    englishTitleOld: form.englishTitleOld.trim(),
    oldHymnalLyrics: form.oldHymnalLyrics,
  };
};

const getHymnTitle = (hymnalType: SuggestionHymnalType, hymn: HagerignaHymn | SDAHymn) => {
  if (hymnalType === 'hagerigna') {
    return (hymn as HagerignaHymn).title || 'Hagerigna hymn';
  }
  const item = hymn as SDAHymn;
  return item.newHymnalTitle || item.title || item.oldHymnalTitle || 'SDA hymn';
};

const getSuggestionHymnId = (hymn: HagerignaHymn | SDAHymn) => hymn.backendId || hymn.id;

const SuggestEditSheet = ({ visible, onClose, hymnalType, hymn }: SuggestEditSheetProps) => {
  const glass = useGlassTheme();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['84%'], []);
  const [form, setForm] = useState<FormState>(() => buildInitialState(hymnalType, hymn));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tabBarHeight = 70 + Math.max(insets.bottom, 8);
  const topInset = Math.max(insets.top, 16) + 8;
  const bottomInset = tabBarHeight + 12;

  useEffect(() => {
    if (visible) {
      setForm(buildInitialState(hymnalType, hymn));
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [hymn, hymnalType, visible]);

  const fields = hymnalType === 'hagerigna' ? hagerignaFields : sdaFields;
  const title = getHymnTitle(hymnalType, hymn);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={glass.isDarkMode ? 0.64 : 0.42}
        pressBehavior="close"
      />
    ),
    [glass.isDarkMode],
  );

  const renderBackground = useCallback(
    (props: any) => (
      <View
        pointerEvents="none"
        style={[
          props.style,
          styles.sheetBackground,
          {
            backgroundColor: glass.glass,
            borderColor: glass.border,
          },
        ]}
      >
        <BlurView
          pointerEvents="none"
          blurType={glass.isDarkMode ? 'dark' : 'light'}
          blurAmount={24}
          overlayColor={glass.strongGlass}
          reducedTransparencyFallbackColor={glass.strongGlass}
          style={styles.sheetBlur}
        />
      </View>
    ),
    [glass.border, glass.glass, glass.isDarkMode, glass.strongGlass],
  );

  const setField = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await suggestionService.submitSuggestion({
        hymnalType,
        hymnId: getSuggestionHymnId(hymn),
        hymnTitle: title,
        requestedData: buildRequestedData(hymnalType, form),
        submitterName: form.submitterName.trim() || undefined,
        submitterEmail: form.submitterEmail.trim() || undefined,
        note: form.note.trim() || undefined,
      });
      Toast.show({
        type: 'success',
        text1: 'Suggestion sent for admin review',
      });
      bottomSheetRef.current?.close();
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to submit suggestion:', error);
      }
      Toast.show({
        type: 'error',
        text1: 'Failed to send suggestion',
        text2: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FieldConfig) => (
    <View key={field.key} style={tw`mb-4`}>
      <Text style={[tw`text-sm font-nokia-bold mb-2`, { color: glass.mutedText }]}>
        {field.label}
      </Text>
      <TextInput
        value={form[field.key] || ''}
        onChangeText={(value) => setField(field.key, value)}
        multiline={field.multiline}
        textAlignVertical={field.multiline ? 'top' : 'center'}
        placeholderTextColor={glass.mutedText}
        style={[
          tw`rounded-2xl px-4 font-nokia-bold`,
          glassSurface(glass),
          {
            minHeight: field.multiline ? 112 : 48,
            color: glass.text,
            paddingTop: field.multiline ? 12 : 0,
            paddingBottom: field.multiline ? 12 : 0,
          },
        ]}
      />
    </View>
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundComponent={renderBackground}
      handleIndicatorStyle={[tw`w-12 h-1.5 rounded-full`, { backgroundColor: glass.border }]}
      topInset={topInset}
      bottomInset={bottomInset}
    >
      <BottomSheetView style={tw`flex-1 px-5`}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={tw`flex-1`}
        >
          <View style={tw`flex-row items-start justify-between mb-4`}>
            <View style={tw`flex-1 pr-3`}>
              <Text style={[tw`text-xl font-nokia-bold`, { color: glass.text }]}>Suggest Edit</Text>
              <Text style={[tw`text-sm font-nokia-bold mt-1`, { color: glass.mutedText }]} numberOfLines={2}>
                {title}
              </Text>
            </View>
            <TouchableOpacity onPress={() => bottomSheetRef.current?.close()} style={tw`p-2 -mr-2`} activeOpacity={0.75}>
              <XMarkIcon size={24} color={glass.text} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={tw`flex-1`}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 28 }}
          >
            {fields.map(renderField)}
            <View style={[tw`rounded-2xl p-4 mt-2 mb-4`, glassSurface(glass, true)]}>
              <Text style={[tw`text-base font-nokia-bold mb-3`, { color: glass.text }]}>Optional Submitter Info</Text>
              {optionalFields.map(renderField)}
            </View>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.82}
              style={[
                tw`h-14 rounded-2xl items-center justify-center`,
                { backgroundColor: isSubmitting ? glass.mutedText : glass.accent },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={tw`text-white font-nokia-bold text-base`}>Submit Suggestion</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default SuggestEditSheet;

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetBlur: {
    ...StyleSheet.absoluteFillObject,
  },
});
