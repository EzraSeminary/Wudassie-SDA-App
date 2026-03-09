import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { getNokiaFontName } from '../utils/platformUtils';

const candidates = [
  // Android-style (filenames without extension)
  'NOKIAPUREHEADLINE_RG',
  'NOKIAPUREHEADLINE_RG.TTF',
  'Nokia Pure Headline Bold',
  'NokiaPureHeadline-Bold',
  'NokiaPureHeadline_Bold',
  'NokiaPureHeadline_Lt',
  'Nokia Pure Headline Ultra Light',
  'NokiaPureHeadline_XBd..ttf',
  // from getNokiaFontName
  getNokiaFontName('regular'),
  getNokiaFontName('bold'),
  getNokiaFontName('light'),
  getNokiaFontName('ultraLight'),
];

const sampleEnglish = 'The quick brown fox — Nokia Font Test';
const sampleAmharic = 'ሰላም እንዴት ነህ? — የፊደል ሙከራ';

export default function FontDebug() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Font Debug — Candidate Names</Text>
      {candidates.map((name, i) => (
        <View key={`${name}-${i}`} style={styles.block}>
          <Text style={styles.label}>{String(name)}</Text>
          <Text style={[styles.sample, { fontFamily: String(name) }]}>{sampleEnglish}</Text>
          <Text style={[styles.sample, { fontFamily: String(name) }]}>{sampleAmharic}</Text>
        </View>
      ))}
      <View style={{height: 48}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  header: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  block: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 12 },
  label: { fontSize: 12, color: '#666', marginBottom: 6 },
  sample: { fontSize: 18 },
});
