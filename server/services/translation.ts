import { TranslationServiceClient } from '@google-cloud/translate';

const SUPPORTED_LANGUAGES = {
  en: 'English',
  pa: 'Punjabi (Gurmukhi)',
  hi: 'Hindi',
  ur: 'Urdu',
  ta: 'Tamil',
  te: 'Telugu',
  gu: 'Gujarati',
  bn: 'Bengali',
  mr: 'Marathi',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

let translationClient: TranslationServiceClient | null = null;
let projectId: string | null = null;

function getTranslationClient() {
  if (!translationClient) {
    const apiKey = process.env.GOOGLE_CLOUD_TRANSLATION_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_CLOUD_TRANSLATION_API_KEY is not configured');
    }
    
    translationClient = new TranslationServiceClient({
      apiKey,
    });
    
    projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'viah-wedding';
  }
  return { client: translationClient, projectId: projectId! };
}

export async function translateText(
  text: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage: SupportedLanguage = 'en'
): Promise<TranslationResult> {
  const { client, projectId } = getTranslationClient();
  
  const request = {
    parent: `projects/${projectId}/locations/global`,
    contents: [text],
    mimeType: 'text/plain',
    sourceLanguageCode: sourceLanguage,
    targetLanguageCode: targetLanguage,
  };

  try {
    const [response] = await client.translateText(request);
    const translation = response.translations?.[0];
    
    if (!translation?.translatedText) {
      throw new Error('No translation returned from API');
    }

    return {
      originalText: text,
      translatedText: translation.translatedText,
      sourceLanguage,
      targetLanguage,
    };
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

export async function translateBatch(
  texts: string[],
  targetLanguage: SupportedLanguage,
  sourceLanguage: SupportedLanguage = 'en'
): Promise<TranslationResult[]> {
  const { client, projectId } = getTranslationClient();
  
  const request = {
    parent: `projects/${projectId}/locations/global`,
    contents: texts,
    mimeType: 'text/plain',
    sourceLanguageCode: sourceLanguage,
    targetLanguageCode: targetLanguage,
  };

  try {
    const [response] = await client.translateText(request);
    
    return (response.translations || []).map((translation, index) => ({
      originalText: texts[index],
      translatedText: translation.translatedText || '',
      sourceLanguage,
      targetLanguage,
    }));
  } catch (error) {
    console.error('Batch translation error:', error);
    throw error;
  }
}

export function getSupportedLanguages() {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
    code,
    name,
  }));
}

export function isLanguageSupported(code: string): code is SupportedLanguage {
  return code in SUPPORTED_LANGUAGES;
}

export function getLanguageName(code: SupportedLanguage): string {
  return SUPPORTED_LANGUAGES[code];
}

export async function translateInvitationContent(params: {
  householdName: string;
  coupleName: string;
  eventNames: string[];
  weddingDate?: string;
  personalMessage?: string;
  targetLanguage: SupportedLanguage;
}): Promise<{
  householdName: string;
  greeting: string;
  invitationText: string;
  eventListLabel: string;
  eventNames: string[];
  dateLabel: string;
  weddingDate: string;
  personalMessage: string;
  rsvpPrompt: string;
  closing: string;
}> {
  const {
    householdName,
    coupleName,
    eventNames,
    weddingDate,
    personalMessage,
    targetLanguage,
  } = params;

  const textsToTranslate = [
    `Dear ${householdName}`,
    `You are cordially invited to celebrate the wedding of ${coupleName}!`,
    'You are invited to the following events:',
    ...eventNames,
    'Wedding Date:',
    weddingDate || 'Date to be announced',
    personalMessage || '',
    'Please RSVP for each event by clicking the button below.',
    `With love, ${coupleName}`,
  ].filter(Boolean);

  const translations = await translateBatch(textsToTranslate, targetLanguage);
  
  let idx = 0;
  return {
    householdName,
    greeting: translations[idx++]?.translatedText || `Dear ${householdName}`,
    invitationText: translations[idx++]?.translatedText || `You are cordially invited to celebrate the wedding of ${coupleName}!`,
    eventListLabel: translations[idx++]?.translatedText || 'You are invited to the following events:',
    eventNames: eventNames.map(() => translations[idx++]?.translatedText || ''),
    dateLabel: translations[idx++]?.translatedText || 'Wedding Date:',
    weddingDate: translations[idx++]?.translatedText || weddingDate || 'Date to be announced',
    personalMessage: personalMessage ? (translations[idx++]?.translatedText || personalMessage) : '',
    rsvpPrompt: translations[idx++]?.translatedText || 'Please RSVP for each event by clicking the button below.',
    closing: translations[idx]?.translatedText || `With love, ${coupleName}`,
  };
}
