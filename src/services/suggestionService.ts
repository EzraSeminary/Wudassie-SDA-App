import api from './api';
import type { HagerignaHymn, SDAHymn } from './hymnalService';

export type SuggestionStatus = 'pending' | 'applied';
export type SuggestionHymnalType = 'hagerigna' | 'sda';

export type HagerignaSuggestionData = Pick<
  HagerignaHymn,
  'title' | 'artist' | 'song'
>;

export type SDASuggestionData = Pick<
  SDAHymn,
  | 'newHymnalTitle'
  | 'oldHymnalTitle'
  | 'newHymnalLyrics'
  | 'englishTitleOld'
  | 'oldHymnalLyrics'
>;

export type SuggestionRequest = {
  hymnalType: SuggestionHymnalType;
  hymnId: string;
  hymnTitle: string;
  requestedData: HagerignaSuggestionData | SDASuggestionData;
  submitterName?: string;
  submitterEmail?: string;
  note?: string;
};

export const suggestionService = {
  async submitSuggestion(payload: SuggestionRequest) {
    const response = await api.post('/suggestions', payload);
    return response.data;
  },
};
