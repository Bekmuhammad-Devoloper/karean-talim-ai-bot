import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData = require('form-data');

export interface OpenAIResult {
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
export class OpenAIService {
  private apiKey: string;
  private model: string = 'gpt-4o';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('OPENAI_API_KEY', '');
    
    if (!this.apiKey) {
      console.warn('[OpenAI] Warning: OPENAI_API_KEY not configured');
    } else {
      console.log('[OpenAI] Service initialized with GPT-4o');
    }
  }

  async correctGrammar(text: string, language: string = 'uz'): Promise<OpenAIResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const langNames: { [key: string]: string } = {
      uz: "O'zbek",
      ru: 'Русский',
      en: 'English',
      tr: 'Türkçe',
      ko: '한국어',
    };

    const langName = langNames[language] || "O'zbek";

    // Koreyscha uchun maxsus prompt
    let systemPrompt: string;
    let userPrompt: string;

    if (language === 'ko') {
      systemPrompt = `당신은 전문 한국어 문법 검사기입니다.
당신의 임무:
1. 텍스트의 문법 오류, 맞춤법 오류, 문장 부호 오류를 확인합니다
2. 오류를 수정하고 각 오류에 대한 간단한 설명을 제공합니다
3. 수정된 텍스트를 반환합니다

중요: 답변은 반드시 다음 JSON 형식으로만 제공하세요:
{
  "correctedText": "수정된 텍스트",
  "errors": [
    {
      "original": "잘못된 단어 또는 구문",
      "corrected": "올바른 버전",
      "explanation": "간단한 설명"
    }
  ]
}

오류가 없으면 errors 배열을 비워 두세요.`;
      userPrompt = `다음 한국어 텍스트를 확인하고 오류를 수정하세요:\n\n"${text}"`;
    } else {
      systemPrompt = `Sen professional ${langName} tili grammatika tekshiruvchisi va muharririsisan. 
Sening vazifang:
1. Matnni grammatik xatolar, imlo xatolari, tinish belgilari va uslubiy xatolar uchun tekshirish
2. Xatolarni tuzatish va har bir xato uchun qisqa tushuntirish berish
3. To'g'rilangan matnni qaytarish

MUHIM: Javobingni faqat quyidagi JSON formatida ber, boshqa hech narsa yozma:
{
  "correctedText": "to'g'rilangan matn",
  "errors": [
    {
      "original": "noto'g'ri so'z yoki ibora",
      "corrected": "to'g'ri variant",
      "explanation": "qisqa tushuntirish"
    }
  ]
}

Agar matnda xato bo'lmasa, errors massivini bo'sh qoldir.`;
      userPrompt = `Quyidagi ${langName} tilidagi matnni tekshir va xatolarini to'g'rila:\n\n"${text}"`;
    }

    try {
      console.log('[OpenAI] Sending request to GPT-4o...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[OpenAI] API error:', response.status, errorData);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      console.log('[OpenAI] Response received, parsing...');

      // JSON ni parse qilish
      let result;
      try {
        // JSON ni topish (ba'zan markdown code block ichida bo'lishi mumkin)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('[OpenAI] JSON parse error:', parseError);
        // Fallback - original text qaytarish
        return {
          originalText: text,
          correctedText: text,
          errorsCount: 0,
          errors: [],
        };
      }

      const errors = result.errors || [];
      
      console.log('[OpenAI] Grammar check completed. Errors found:', errors.length);

      return {
        originalText: text,
        correctedText: result.correctedText || text,
        errorsCount: errors.length,
        errors: errors,
      };
    } catch (error: any) {
      console.error('[OpenAI] Error:', error.message);
      throw error;
    }
  }

  // GPT-4o Vision - rasmdan matn o'qish va grammatik tekshirish (qo'lyozma ham!)
  async analyzeImage(imageUrl: string, language: string = 'uz'): Promise<OpenAIResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const langNames: { [key: string]: string } = {
      uz: "O'zbek",
      ru: 'Русский',
      en: 'English',
      tr: 'Türkçe',
      ko: '한국어',
    };

    const langName = langNames[language] || "O'zbek";

    // Koreyscha uchun maxsus prompt
    let systemPrompt: string;
    let userPromptText: string;

    if (language === 'ko') {
      systemPrompt = `당신은 전문 한국어 문법 검사기입니다.

당신의 임무:
1. 이미지에서 텍스트를 읽습니다 (인쇄 또는 손글씨)
2. 문법 오류를 확인합니다
3. 오류를 수정하고 설명합니다

중요: 답변은 반드시 다음 JSON 형식으로만 제공하세요:
{
  "extractedText": "이미지에서 읽은 원본 텍스트",
  "correctedText": "문법적으로 수정된 텍스트",
  "errors": [
    {
      "original": "잘못된 단어",
      "corrected": "올바른 단어",
      "explanation": "간단한 설명"
    }
  ]
}

참고: 손글씨도 주의 깊게 읽어주세요!`;
      userPromptText = `이 이미지의 한국어 텍스트를 읽고 문법을 확인해 주세요. 손글씨도 주의 깊게 읽어주세요.`;
    } else {
      systemPrompt = `Sen professional ${langName} tili bo'yicha matn tanuvchi va grammatika tekshiruvchisisisan.

Sening vazifang:
1. Rasmdagi matnni (bosma yoki QO'LYOZMA) diqqat bilan o'qish
2. Matnni grammatik xatolar uchun tekshirish
3. Xatolarni tuzatish va tushuntirish

MUHIM: Javobingni FAQAT quyidagi JSON formatida ber:
{
  "extractedText": "rasmdan o'qilgan asl matn",
  "correctedText": "grammatik jihatdan to'g'rilangan matn",
  "errors": [
    {
      "original": "xato so'z",
      "corrected": "to'g'ri variant",
      "explanation": "qisqa tushuntirish"
    }
  ]
}

Eslatma: Qo'lyozma bo'lsa ham har bir so'zni diqqat bilan o'qi!`;
      userPromptText = `Bu rasmdagi ${langName} tilidagi matnni o'qi va grammatik tekshir. Qo'lyozma bo'lsa ham diqqat bilan o'qi.`;
    }

    try {
      console.log('[OpenAI Vision] Analyzing image...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { 
              role: 'user', 
              content: [
                { 
                  type: 'text', 
                  text: userPromptText
                },
                { 
                  type: 'image_url', 
                  image_url: { url: imageUrl } 
                }
              ]
            }
          ],
          temperature: 0.3,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[OpenAI Vision] API error:', response.status, errorData);
        throw new Error(`OpenAI Vision API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI Vision');
      }

      console.log('[OpenAI Vision] Response received, parsing...');

      // JSON ni parse qilish
      let result;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('[OpenAI Vision] JSON parse error, returning raw text');
        // Agar JSON parse bo'lmasa, matnni qisqartirib qaytarish (Telegram limit 4096)
        const truncatedContent = content.length > 3000 ? content.substring(0, 3000) + '...' : content;
        return {
          originalText: truncatedContent,
          correctedText: truncatedContent,
          errorsCount: 0,
          errors: [],
        };
      }

      const errors = result.errors || [];
      let extractedText = result.extractedText || '';
      let correctedText = result.correctedText || extractedText;
      
      // Matnni qisqartirish (Telegram limit 4096 belgi)
      if (extractedText.length > 2500) {
        extractedText = extractedText.substring(0, 2500) + '...';
      }
      if (correctedText.length > 2500) {
        correctedText = correctedText.substring(0, 2500) + '...';
      }
      
      console.log('[OpenAI Vision] Image analysis completed. Text length:', extractedText.length, 'Errors:', errors.length);

      return {
        originalText: extractedText,
        correctedText: correctedText,
        errorsCount: errors.length,
        errors: errors,
      };
    } catch (error: any) {
      console.error('[OpenAI Vision] Error:', error.message);
      throw error;
    }
  }

  // Audio dan kelgan matnni tekshirish
  async correctSpeechText(speechText: string, language: string = 'uz'): Promise<OpenAIResult> {
    return this.correctGrammar(speechText, language);
  }

  // OpenAI Whisper - ovozdan matnga (eng aniq!)
  async transcribeAudio(audioBuffer: Buffer, language: string = 'uz'): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Til kodlari Whisper uchun
    const whisperLangCodes: { [key: string]: string } = {
      uz: 'uz',
      ru: 'ru',
      en: 'en',
      tr: 'tr',
    };

    const langCode = whisperLangCodes[language] || 'uz';

    try {
      console.log('[OpenAI Whisper] Starting transcription, audio size:', audioBuffer.length, 'bytes');
      
      // form-data kutubxonasi bilan FormData yaratish
      const formData = new FormData();
      
      // Audio buffer ni to'g'ridan-to'g'ri qo'shish
      formData.append('file', audioBuffer, {
        filename: 'audio.ogg',
        contentType: 'audio/ogg',
      });
      formData.append('model', 'whisper-1');
      formData.append('language', langCode);
      formData.append('response_format', 'text');
      
      // Prompt - tilga qarab yaxshiroq tanib olish uchun
      const prompts: { [key: string]: string } = {
        uz: "Bu o'zbek tilidagi ovozli xabar. Tinish belgilarini to'g'ri qo'y.",
        ru: "Это голосовое сообщение на русском языке. Расставь знаки препинания правильно.",
        en: "This is an English voice message. Add proper punctuation.",
        tr: "Bu Türkçe bir sesli mesaj. Noktalama işaretlerini doğru koy.",
      };
      formData.append('prompt', prompts[langCode] || prompts['uz']);

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          ...formData.getHeaders(),
        },
        body: formData as any,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[OpenAI Whisper] API error:', response.status, errorData);
        throw new Error(`Whisper API error: ${response.status}`);
      }

      const text = await response.text();
      console.log('[OpenAI Whisper] Transcription completed:', text.substring(0, 100) + '...');
      
      return text.trim();
    } catch (error: any) {
      console.error('[OpenAI Whisper] Error:', error.message);
      throw error;
    }
  }

  // URL dan audio yuklab Whisper ga yuborish
  async transcribeAudioFromUrl(audioUrl: string, language: string = 'uz'): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      console.log('[OpenAI Whisper] Downloading audio from URL...');
      
      // Audio faylni yuklash
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);
      
      console.log('[OpenAI Whisper] Audio downloaded, size:', audioBuffer.length, 'bytes');
      
      return this.transcribeAudio(audioBuffer, language);
    } catch (error: any) {
      console.error('[OpenAI Whisper] URL transcribe error:', error.message);
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}
