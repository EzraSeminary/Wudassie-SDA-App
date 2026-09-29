export type HymnPitchRecommendation = {
  key: string;
  mode: 'major' | 'minor';
  label: string;
};

const normalizeTitle = (title?: string) =>
  (title || '')
    .toLowerCase()
    .replace(/\\'/g, "'")
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const curatedKeys: Record<string, HymnPitchRecommendation> = {
  'praise god form whom all blessing flow': { key: 'G', mode: 'major', label: 'Key G' },
  'praise god from whom all blessing flow': { key: 'G', mode: 'major', label: 'Key G' },
  'holy holy holy': { key: 'D', mode: 'major', label: 'Key D' },
  'all hail the power of jesus name': { key: 'G', mode: 'major', label: 'Key G' },
  'a mighty fortress is our god': { key: 'C', mode: 'major', label: 'Key C' },
  'to god be the glory': { key: 'G', mode: 'major', label: 'Key G' },
  'praise to the lord': { key: 'D', mode: 'major', label: 'Key D' },
  'count your blessing': { key: 'G', mode: 'major', label: 'Key G' },
  'revive us again': { key: 'G', mode: 'major', label: 'Key G' },
  'fairest lord jesus': { key: 'F', mode: 'major', label: 'Key F' },
  'abide with me': { key: 'E-flat', mode: 'major', label: 'Key Eb' },
  'o worship the king': { key: 'G', mode: 'major', label: 'Key G' },
  'how great thou art': { key: 'B-flat', mode: 'major', label: 'Key Bb' },
  'just as i am': { key: 'D', mode: 'major', label: 'Key D' },
  "lord i'm coming home": { key: 'A-flat', mode: 'major', label: 'Key Ab' },
  'all to jesus i surrender': { key: 'D', mode: 'major', label: 'Key D' },
  'pass me not o gentle saviour': { key: 'A-flat', mode: 'major', label: 'Key Ab' },
  'there is power in the blood': { key: 'A-flat', mode: 'major', label: 'Key Ab' },
  'jesus paid it all': { key: 'D', mode: 'major', label: 'Key D' },
  'sweet hour of prayer': { key: 'D-flat', mode: 'major', label: 'Key Db' },
  'amazing grace': { key: 'G', mode: 'major', label: 'Key G' },
  'i am thine o lord': { key: 'A-flat', mode: 'major', label: 'Key Ab' },
  'nearer my god to thee': { key: 'F', mode: 'major', label: 'Key F' },
  'take time to be holy': { key: 'F', mode: 'major', label: 'Key F' },
  'turn your eyes upon jesus': { key: 'F', mode: 'major', label: 'Key F' },
  'safe in the arms of jesus': { key: 'F', mode: 'major', label: 'Key F' },
  "we're marching to zion": { key: 'G', mode: 'major', label: 'Key G' },
  'he leadeth me': { key: 'D', mode: 'major', label: 'Key D' },
  'i come to the garden alone': { key: 'A-flat', mode: 'major', label: 'Key Ab' },
  'leaning on the everlasting arms': { key: 'G', mode: 'major', label: 'Key G' },
  'what a friend we have in jesus': { key: 'F', mode: 'major', label: 'Key F' },
  'like a river glorious': { key: 'F', mode: 'major', label: 'Key F' },
  'be thou my vision': { key: 'E-flat', mode: 'major', label: 'Key Eb' },
  'blessed assurance': { key: 'D', mode: 'major', label: 'Key D' },
  'when peace like a river': { key: 'D-flat', mode: 'major', label: 'Key Db' },
  'it is well with my soul': { key: 'D-flat', mode: 'major', label: 'Key Db' },
  'joyful joyful we adore thee': { key: 'D', mode: 'major', label: 'Key D' },
  'my jesus i love thee': { key: 'F', mode: 'major', label: 'Key F' },
  'love lifted me': { key: 'A-flat', mode: 'major', label: 'Key Ab' },
  'nothing but the blood of jesus': { key: 'G', mode: 'major', label: 'Key G' },
  'saviour like a shepherd lead us': { key: 'F', mode: 'major', label: 'Key F' },
  'come thou fount of every blessing': { key: 'D', mode: 'major', label: 'Key D' },
  'when i survey the wondrous cross': { key: 'F', mode: 'major', label: 'Key F' },
  'jesus keep me near the cross': { key: 'F', mode: 'major', label: 'Key F' },
  'the old rugged cross': { key: 'B-flat', mode: 'major', label: 'Key Bb' },
  'at the cross': { key: 'G', mode: 'major', label: 'Key G' },
  'o sacred head now wonded': { key: 'E-flat', mode: 'major', label: 'Key Eb' },
  'o sacred head now wounded': { key: 'E-flat', mode: 'major', label: 'Key Eb' },
  "don't forget the sabbath": { key: 'F', mode: 'major', label: 'Key F' },
  'give me the bible': { key: 'B-flat', mode: 'major', label: 'Key Bb' },
  'tell me the story of jesus': { key: 'G', mode: 'major', label: 'Key G' },
  'wonderful words of life': { key: 'A-flat', mode: 'major', label: 'Key Ab' },
  'onward christian soldiers': { key: 'E-flat', mode: 'major', label: 'Key Eb' },
  'stand up stand up for jesus': { key: 'B-flat', mode: 'major', label: 'Key Bb' },
  'we have this hope': { key: 'F', mode: 'major', label: 'Key F' },
  'lift up the trumpet': { key: 'B-flat', mode: 'major', label: 'Key Bb' },
  'when weall get to heaven': { key: 'G', mode: 'major', label: 'Key G' },
  'when we all get to heaven': { key: 'G', mode: 'major', label: 'Key G' },
  'when the roll is called up younder': { key: 'A-flat', mode: 'major', label: 'Key Ab' },
  'face to face': { key: 'A-flat', mode: 'major', label: 'Key Ab' },
  'shall we gather at the river': { key: 'D', mode: 'major', label: 'Key D' },
  "this is my father's world": { key: 'F', mode: 'major', label: 'Key F' },
  'i sing the mighty power of god': { key: 'F', mode: 'major', label: 'Key F' },
  'jesus loves me': { key: 'G', mode: 'major', label: 'Key G' },
  'away in manger': { key: 'F', mode: 'major', label: 'Key F' },
  'what child is this': { key: 'E minor', mode: 'minor', label: 'Key Em' },
  'o holy night': { key: 'B-flat', mode: 'major', label: 'Key Bb' },
  'o little town of bethlehem': { key: 'F', mode: 'major', label: 'Key F' },
  'o come all ye faithful': { key: 'G', mode: 'major', label: 'Key G' },
  'hark the herald angel sing': { key: 'G', mode: 'major', label: 'Key G' },
  'hark the herald angels sing': { key: 'G', mode: 'major', label: 'Key G' },
  'silent night holy night': { key: 'B-flat', mode: 'major', label: 'Key Bb' },
  'joy to the world': { key: 'D', mode: 'major', label: 'Key D' },
  'angels we have heard on hign': { key: 'F', mode: 'major', label: 'Key F' },
  'angels we have heard on high': { key: 'F', mode: 'major', label: 'Key F' },
  'tis so sweet to trust in jesus': { key: 'G', mode: 'major', label: 'Key G' },
  'i need thee every hour': { key: 'A-flat', mode: 'major', label: 'Key Ab' },
  'standing on the promises': { key: 'B-flat', mode: 'major', label: 'Key Bb' },
  'when we walk with the lord': { key: 'F', mode: 'major', label: 'Key F' },
  'trust and obey': { key: 'F', mode: 'major', label: 'Key F' },
  'i have decided to follow jesus': { key: 'G', mode: 'major', label: 'Key G' },
  'there is a fountain': { key: 'E-flat', mode: 'major', label: 'Key Eb' },
  'rock of age': { key: 'B-flat', mode: 'major', label: 'Key Bb' },
  'rock of ages': { key: 'B-flat', mode: 'major', label: 'Key Bb' },
  'jesus christ is risen today': { key: 'C', mode: 'major', label: 'Key C' },
  'he lives': { key: 'A-flat', mode: 'major', label: 'Key Ab' },
  'christ arose': { key: 'A-flat', mode: 'major', label: 'Key Ab' },
  'god be with you': { key: 'F', mode: 'major', label: 'Key F' },
  'asleep in jesus': { key: 'E-flat', mode: 'major', label: 'Key Eb' },
};

const fallbackKeys = ['F', 'G', 'D', 'E-flat', 'B-flat', 'A-flat'];

export const getCongregationalPitch = (
  englishTitle?: string,
  songNumber?: number,
): HymnPitchRecommendation => {
  const normalized = normalizeTitle(englishTitle);
  const exact = curatedKeys[normalized];
  if (exact) {
    return exact;
  }

  const matchedKey = Object.keys(curatedKeys).find(
    (key) => normalized.includes(key) || key.includes(normalized),
  );
  if (matchedKey) {
    return curatedKeys[matchedKey];
  }

  const index = songNumber ? Math.abs(songNumber - 1) % fallbackKeys.length : 0;
  const key = fallbackKeys[index];
  return {
    key,
    mode: 'major',
    label: `Key ${key.replace('E-flat', 'Eb').replace('B-flat', 'Bb').replace('A-flat', 'Ab')}`,
  };
};
