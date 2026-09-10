const ranges = [
  ['te', /[\u0C00-\u0C7F]/], ['ta', /[\u0B80-\u0BFF]/], ['kn', /[\u0C80-\u0CFF]/],
  ['ml', /[\u0D00-\u0D7F]/], ['bn', /[\u0980-\u09FF]/], ['gu', /[\u0A80-\u0AFF]/],
  ['pa', /[\u0A00-\u0A7F]/], ['hi', /[\u0900-\u097F]/], ['ur', /[\u0600-\u06FF]/]
];
export function detectLanguage(text, fallback = 'en') {
  const value = String(text || '').trim();
  if (!value) return fallback;
  const found = ranges.find(([, pattern]) => pattern.test(value));
  return found?.[0] || fallback;
}
export const languageNames = { en: 'English', hi: 'Hindi', te: 'Telugu', ta: 'Tamil', kn: 'Kannada', ml: 'Malayalam', bn: 'Bengali', gu: 'Gujarati', pa: 'Punjabi', ur: 'Urdu' };
