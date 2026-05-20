const APP_SHARE_URL = 'https://play.google.com/store/apps/details?id=com.wudassieapp';

const SECTION_HEADER_PATTERN = /^(?:\d+[.)]?|verse\s*\d*|chorus|refrain|bridge|መዝሙር|ኮረስ)/i;

const normalizeLine = (line: string) => line.replace(/\s+/g, ' ').trim();

export const formatLyricsForShare = (lyrics: string): string => {
  const normalizedLyrics = lyrics.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
  const lines = normalizedLyrics.split('\n');
  const formatted: string[] = [];
  let pendingBlankLine = false;

  lines.forEach((rawLine) => {
    const line = normalizeLine(rawLine);

    if (!line) {
      pendingBlankLine = formatted.length > 0;
      return;
    }

    const previousLine = formatted[formatted.length - 1];
    const needsSectionGap =
      Boolean(previousLine) &&
      SECTION_HEADER_PATTERN.test(line) &&
      previousLine !== '';

    if ((pendingBlankLine || needsSectionGap) && previousLine !== '') {
      formatted.push('');
    }

    formatted.push(line);
    pendingBlankLine = false;
  });

  return formatted.join('\n').trim();
};

type ShareMessageOptions = {
  songNumber: number;
  title: string;
  lyrics: string;
  artist?: string;
};

export const buildSongShareMessage = ({ songNumber, title, lyrics, artist }: ShareMessageOptions): string => {
  const parts = [`${songNumber}. ${title}`];

  if (artist) {
    parts.push(artist);
  }

  const formattedLyrics = formatLyricsForShare(lyrics);
  if (formattedLyrics) {
    parts.push(formattedLyrics);
  }

  parts.push(APP_SHARE_URL);

  return parts.join('\n\n').trim();
};
