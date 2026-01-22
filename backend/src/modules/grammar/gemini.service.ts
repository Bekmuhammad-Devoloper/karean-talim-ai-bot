import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface GeminiResult {
  originalText: string;
  correctedText: string;
  errorsCount: number;
  errors: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
}

@Injectable()
export class GeminiService {
  private apiKeys: string[];
  private currentKeyIndex: number = 0;
  private failedKeys: Set<string> = new Set();
  private keyResetTime: Map<string, number> = new Map();

  constructor(private configService: ConfigService) {
    // Faqat environment variables dan API keys ni load qilish
    this.apiKeys = [
      this.configService.get('GEMINI_API_KEY_1', ''),
      this.configService.get('GEMINI_API_KEY_2', ''),
      this.configService.get('GEMINI_API_KEY_3', ''),
      this.configService.get('GEMINI_API_KEY_4', ''),
    ].filter(key => key && key.length > 10);
    
    if (this.apiKeys.length === 0) {
      console.warn('Warning: No Gemini API keys configured. Set GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc. in environment variables.');
    } else {
      console.log(`Gemini service initialized with ${this.apiKeys.length} API keys`);
    }
  }

  private getNextApiKey(): string | null {
    // Reset expired failed keys (after 60 seconds)
    const now = Date.now();
    for (const [key, resetTime] of this.keyResetTime.entries()) {
      if (now >= resetTime) {
        this.failedKeys.delete(key);
        this.keyResetTime.delete(key);
      }
    }
    
    // Find a working key
    for (let i = 0; i < this.apiKeys.length; i++) {
      const key = this.apiKeys[(this.currentKeyIndex + i) % this.apiKeys.length];
      if (!this.failedKeys.has(key)) {
        this.currentKeyIndex = (this.currentKeyIndex + i + 1) % this.apiKeys.length;
        return key;
      }
    }
    return null; // All keys are failed
  }

  private markKeyAsFailed(key: string, retryAfterSeconds: number = 60) {
    this.failedKeys.add(key);
    this.keyResetTime.set(key, Date.now() + retryAfterSeconds * 1000);
    console.log(`API key marked as failed, will retry after ${retryAfterSeconds}s`);
  }

  // ============ GRAMMAR CORRECTION ============
  async correctGrammar(text: string, language: string = 'uz'): Promise<GeminiResult> {
    try {
      const langNames: Record<string, string> = {
        uz: "O'zbek",
        ru: 'Rus',
        en: 'Ingliz',
        tr: 'Turk',
      };

      const langName = langNames[language] || "O'zbek";

      // Turk tili uchun maxsus prompt
      let prompt = '';
      
      if (language === 'tr') {
        prompt = `Sen professional Türkçe dil bilgisi düzelticisin. Aşağıdaki metni kontrol et ve MUTLAKA hataları düzelt.

ÖNEMLİ KURALLAR:
1. Türkçe'de özel karakterler (ç, ğ, ş, ı, ö, ü) MUTLAKA doğru kullanılmalı
2. "c" yerine "ç" olması gereken yerleri bul (örnek: cok → çok, gecen → geçen)
3. "g" yerine "ğ" olması gereken yerleri bul (örnek: ogretmen → öğretmen, ogrenmek → öğrenmek)
4. "s" yerine "ş" olması gereken yerleri bul (örnek: gormek → görmek)
5. "i" yerine "ı" olması gereken yerleri bul (örnek: yarin → yarın, sinif → sınıf)
6. "o" yerine "ö" olması gereken yerleri bul (örnek: odev → ödev, ogretmen → öğretmen)
7. "u" yerine "ü" olması gereken yerleri bul (örnek: guzel → güzel, Turkce → Türkçe, dun → dün)

ÖRNEK HATALAR:
- "Turkce ogrenmek istiyorum" → "Türkçe öğrenmek istiyorum" (3 hata: Turkce→Türkçe, ogrenmek→öğrenmek)
- "Ben dun okula gitmedim" → "Ben dün okula gitmedim" (1 hata: dun→dün)
- "Bu cok guzel" → "Bu çok güzel" (2 hata: cok→çok, guzel→güzel)
- "Gecen hafta ogretmen bize odev verdi" → "Geçen hafta öğretmen bize ödev verdi" (3 hata)

Yanıtı SADECE aşağıdaki JSON formatında ver:
{
  "correctedText": "düzeltilmiş metin",
  "errors": [
    {"original": "hatalı kelime", "corrected": "doğru kelime", "explanation": "açıklama"}
  ]
}

Eğer metin doğruysa:
{
  "correctedText": "orijinal metin",
  "errors": []
}

SADECE JSON döndür, başka hiçbir şey yazma.

Metin: "${text}"`;
      } else {
        prompt = `Sen ${langName} tilining professional grammatik tekshiruvchisisisan. Quyidagi matnni tekshir va ALBATTA xatolarni top.

MUHIM QOIDALAR:
1. Imlo xatolarini top (noto'g'ri yozilgan so'zlar)
2. Grammatik xatolarni top
3. Tinish belgilari xatolarini top
4. So'z birikmalarini tekshir

Javobni FAQAT quyidagi JSON formatda ber:
{
  "correctedText": "to'g'irlangan matn",
  "errors": [
    {"original": "xato so'z", "corrected": "to'g'ri so'z", "explanation": "tushuntirish"}
  ]
}

Agar xato bo'lmasa:
{
  "correctedText": "original matn",
  "errors": []
}

FAQAT JSON qaytar, boshqa hech narsa yozma.

Matn: "${text}"`;
      }

      const result = await this.callGeminiAPI(prompt);
      return this.parseGrammarResult(text, result);
    } catch (error) {
      console.error('Gemini grammar error:', error);
      return {
        originalText: text,
        correctedText: text,
        errorsCount: 0,
        errors: [],
      };
    }
  }

  // ============ SPEECH TO TEXT ============
  async transcribeAudio(audioUrl: string, language: string = 'uz'): Promise<string> {
    try {
      console.log('Gemini transcribing audio...');

      // Audio faylni yuklab olish
      const audioBuffer = await this.downloadFile(audioUrl);
      const base64Audio = audioBuffer.toString('base64');

      const langNames: Record<string, string> = {
        uz: "O'zbek",
        ru: 'Rus',
        en: 'Ingliz',
        tr: 'Turk',
      };

      const langName = langNames[language] || "O'zbek";

      const prompt = `Bu audio faylda ${langName} tilida gaplashilgan. Audiodagi nutqni aniq matnga o'gir. Faqat matnni qaytar, boshqa hech narsa yozma.`;

      const result = await this.callGeminiAPIWithMedia(prompt, base64Audio, 'audio/ogg');
      return result.trim();
    } catch (error) {
      console.error('Gemini audio transcription error:', error);
      return '';
    }
  }

  // ============ IMAGE OCR ============
  async extractTextFromImage(imageUrl: string, language: string = 'uz'): Promise<string> {
    try {
      console.log('Gemini extracting text from image...');

      // Rasmni yuklab olish
      const imageBuffer = await this.downloadFile(imageUrl);
      const base64Image = imageBuffer.toString('base64');

      // Rasm formatini aniqlash
      const mimeType = this.detectImageMimeType(imageBuffer);

      const langNames: Record<string, string> = {
        uz: "O'zbek",
        ru: 'Rus',
        en: 'Ingliz',
        tr: 'Turk',
      };

      const langName = langNames[language] || "O'zbek";

      const prompt = `Bu rasmda ${langName} tilida yozilgan matn bor. Rasmdagi barcha matnni aniq o'qi va qaytar. Faqat rasmdagi matnni yoz, boshqa hech narsa qo'shma.`;

      const result = await this.callGeminiAPIWithMedia(prompt, base64Image, mimeType);
      return result.trim();
    } catch (error) {
      console.error('Gemini image OCR error:', error);
      return '';
    }
  }

  // ============ GEMINI API CALLS ============
  private async callGeminiAPI(prompt: string): Promise<string> {
    // Barcha API key larni sinab ko'rish
    const triedKeys: string[] = [];
    
    while (triedKeys.length < this.apiKeys.length) {
      const apiKey = this.getNextApiKey();
      
      if (!apiKey) {
        throw new Error('All Gemini API keys exhausted. Please wait or add new keys.');
      }
      
      if (triedKeys.includes(apiKey)) {
        break; // Already tried this key
      }
      triedKeys.push(apiKey);
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }

        const errorText = await response.text();
        console.error(`Gemini API error with key ${triedKeys.length}:`, errorText.substring(0, 200));
        
        // 429 xato - quota tugagan
        if (response.status === 429) {
          // Parse retry delay if available
          try {
            const errorJson = JSON.parse(errorText);
            const retryDelay = errorJson.error?.details?.find((d: any) => d['@type']?.includes('RetryInfo'))?.retryDelay;
            const seconds = retryDelay ? parseInt(retryDelay) : 60;
            this.markKeyAsFailed(apiKey, Math.max(seconds, 30));
          } catch {
            this.markKeyAsFailed(apiKey, 60);
          }
          continue; // Try next key
        }
        
        // Boshqa xato
        this.markKeyAsFailed(apiKey, 30);
      } catch (error) {
        console.error('Gemini fetch error:', error);
        this.markKeyAsFailed(apiKey, 30);
      }
    }
    
    throw new Error('All Gemini API keys failed. Please try again later.');
  }

  private async callGeminiAPIWithMedia(prompt: string, base64Data: string, mimeType: string): Promise<string> {
    // Barcha API key larni sinab ko'rish
    const triedKeys: string[] = [];
    
    while (triedKeys.length < this.apiKeys.length) {
      const apiKey = this.getNextApiKey();
      
      if (!apiKey) {
        throw new Error('All Gemini API keys exhausted for media processing.');
      }
      
      if (triedKeys.includes(apiKey)) {
        break;
      }
      triedKeys.push(apiKey);
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }

        const errorText = await response.text();
        console.error(`Gemini media API error with key ${triedKeys.length}:`, errorText.substring(0, 200));
        
        if (response.status === 429) {
          this.markKeyAsFailed(apiKey, 60);
          continue;
        }
        
        this.markKeyAsFailed(apiKey, 30);
      } catch (error) {
        console.error('Gemini media fetch error:', error);
        this.markKeyAsFailed(apiKey, 30);
      }
    }
    
    throw new Error('All Gemini API keys failed for media processing.');
  }

  // ============ HELPER FUNCTIONS ============
  private async downloadFile(url: string): Promise<Buffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private detectImageMimeType(buffer: Buffer): string {
    // Check magic bytes
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      return 'image/jpeg';
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      return 'image/png';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49) {
      return 'image/gif';
    }
    if (buffer[0] === 0x52 && buffer[1] === 0x49) {
      return 'image/webp';
    }
    return 'image/jpeg'; // default
  }

  private parseGrammarResult(originalText: string, geminiResponse: string): GeminiResult {
    try {
      // JSON ni ajratib olish
      let jsonStr = geminiResponse;
      
      // Agar markdown code block ichida bo'lsa
      const jsonMatch = geminiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr.trim());

      return {
        originalText,
        correctedText: parsed.correctedText || originalText,
        errorsCount: parsed.errors?.length || 0,
        errors: parsed.errors || [],
      };
    } catch (error) {
      console.error('Error parsing Gemini grammar response:', error);
      
      // Agar JSON parse qilolmasa, oddiy matn sifatida qaytarish
      const cleanText = geminiResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      return {
        originalText,
        correctedText: cleanText || originalText,
        errorsCount: 0,
        errors: [],
      };
    }
  }
}
