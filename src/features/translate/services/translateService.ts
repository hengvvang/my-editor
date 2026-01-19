// Translation Service - Abstract Layer
import { TranslationProvider, TranslationResult } from '../types';

/**
 * Abstract translation function that delegates to specific providers
 */
export async function translate(
    text: string,
    targetLang: string,
    sourceLang: string = 'auto',
    provider: TranslationProvider = 'google'
): Promise<TranslationResult> {
    const startTime = Date.now();

    try {
        let translatedText: string;

        switch (provider) {
            case 'google':
                translatedText = await googleTranslate(text, targetLang, sourceLang);
                break;
            case 'bing':
                translatedText = await bingTranslate(text, targetLang, sourceLang);
                break;
            default:
                translatedText = await googleTranslate(text, targetLang, sourceLang);
        }

        return {
            success: true,
            originalText: text,
            translatedText,
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            provider,
            timestamp: startTime,
        };
    } catch (error) {
        return {
            success: false,
            originalText: text,
            translatedText: '',
            targetLanguage: targetLang,
            provider,
            timestamp: startTime,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

/**
 * Google Translate (Free API via translate.googleapis.com)
 * Note: This uses the free web API, rate limits may apply
 */
async function googleTranslate(
    text: string,
    targetLang: string,
    sourceLang: string = 'auto'
): Promise<string> {
    // Convert language codes to Google format
    const sl = sourceLang === 'auto' ? 'auto' : sourceLang;
    const tl = targetLang;

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status}`);
    }

    const data = await response.json();

    // Parse Google's response format: [[["translated text","original text",null,null,10],...]]
    if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedParts = data[0]
            .filter((part: any) => Array.isArray(part) && part[0])
            .map((part: any) => part[0]);
        return translatedParts.join('');
    }

    throw new Error('Unexpected response format from Google Translate');
}

/**
 * Bing Translator (Free API)
 * Uses Microsoft's Edge translate endpoint
 */
async function bingTranslate(
    text: string,
    targetLang: string,
    sourceLang: string = 'auto'
): Promise<string> {
    // Bing uses slightly different language codes
    const fromLang = sourceLang === 'auto' ? '' : sourceLang;
    const toLang = convertToBingLangCode(targetLang);

    // First, get auth token
    const tokenUrl = 'https://edge.microsoft.com/translate/auth';
    const tokenResponse = await fetch(tokenUrl);
    const token = await tokenResponse.text();

    // Then translate
    const translateUrl = 'https://api-edge.cognitive.microsofttranslator.com/translate';
    const params = new URLSearchParams({
        'api-version': '3.0',
        to: toLang,
        ...(fromLang && { from: fromLang }),
    });

    const response = await fetch(`${translateUrl}?${params}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify([{ Text: text }]),
    });

    if (!response.ok) {
        throw new Error(`Bing Translate API error: ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data) && data[0]?.translations?.[0]?.text) {
        return data[0].translations[0].text;
    }

    throw new Error('Unexpected response format from Bing Translate');
}

/**
 * Convert standard language codes to Bing format
 */
function convertToBingLangCode(code: string): string {
    const mapping: Record<string, string> = {
        'zh-CN': 'zh-Hans',
        'zh-TW': 'zh-Hant',
    };
    return mapping[code] || code;
}

/**
 * Translate a document with bilingual output
 * Returns original and translated text interleaved
 */
export async function translateDocument(
    text: string,
    targetLang: string,
    sourceLang: string = 'auto',
    provider: TranslationProvider = 'google',
    bilingual: boolean = true
): Promise<TranslationResult> {
    // Split by paragraphs for better bilingual display
    const paragraphs = text.split(/\n\n+/);
    const results: string[] = [];

    for (const para of paragraphs) {
        if (!para.trim()) continue;

        const result = await translate(para.trim(), targetLang, sourceLang, provider);

        if (result.success) {
            if (bilingual) {
                // Bilingual format: original + translation
                results.push(para.trim());
                results.push(`> ${result.translatedText}`);
                results.push(''); // Empty line separator
            } else {
                results.push(result.translatedText);
            }
        } else {
            // Keep original if translation fails
            results.push(para.trim());
            if (bilingual) {
                results.push(`> [Translation failed: ${result.error}]`);
                results.push('');
            }
        }
    }

    return {
        success: true,
        originalText: text,
        translatedText: results.join('\n'),
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        provider,
        timestamp: Date.now(),
    };
}

/**
 * Detect language of given text
 */
export async function detectLanguage(text: string): Promise<string> {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text.substring(0, 100))}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // The detected language is usually at index [2]
        if (data && data[2]) {
            return data[2];
        }
    } catch {
        // Ignore errors
    }

    return 'unknown';
}
