import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GrammarResult {
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
export class GrammarService {
  constructor(private configService: ConfigService) {}

  async correctGrammar(text: string, language: string = 'uz'): Promise<GrammarResult> {
    try {
      // O'zbek tili uchun faqat asosiy tekshiruv (API qo'llab-quvvatlamaydi)
      if (language === 'uz') {
        return this.basicCheck(text, language);
      }

      // Turkcha uchun LanguageTool
      if (language === 'tr') {
        const languageToolResult = await this.checkWithLanguageTool(text, language);
        if (languageToolResult && languageToolResult.errorsCount > 0) {
          return languageToolResult;
        }
        return this.basicCheck(text, language);
      }

      // Ingliz va Rus tillari uchun GrammarBot + LanguageTool
      if (language === 'en' || language === 'ru') {
        const grammarBotResult = await this.checkWithGrammarBot(text, language);
        if (grammarBotResult && grammarBotResult.errorsCount > 0) {
          return grammarBotResult;
        }

        const languageToolResult = await this.checkWithLanguageTool(text, language);
        if (languageToolResult && languageToolResult.errorsCount > 0) {
          return languageToolResult;
        }
      }

      // Oddiy tekshiruv
      return this.basicCheck(text, language);
    } catch (error) {
      console.error('Grammar correction error:', error);
      return this.basicCheck(text, language);
    }
  }

  private async checkWithGrammarBot(text: string, language: string): Promise<GrammarResult | null> {
    try {
      const response = await fetch('https://api.grammarbot.io/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: text,
          language: language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'en-US',
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      
      if (!data.matches || data.matches.length === 0) {
        return null;
      }

      const errors: Array<{original: string; corrected: string; explanation: string}> = [];
      let correctedText = text;
      let offset = 0;

      for (const match of data.matches) {
        const original = text.substring(match.offset, match.offset + match.length);
        const corrected = match.replacements?.[0]?.value || original;
        
        if (original !== corrected) {
          errors.push({
            original,
            corrected,
            explanation: match.message || 'Grammatik xato',
          });

          const start = match.offset + offset;
          const end = start + match.length;
          correctedText = correctedText.substring(0, start) + corrected + correctedText.substring(end);
          offset += corrected.length - match.length;
        }
      }

      return {
        originalText: text,
        correctedText,
        errorsCount: errors.length,
        errors,
      };
    } catch (error) {
      console.error('GrammarBot error:', error);
      return null;
    }
  }

  private async checkWithLanguageTool(text: string, language: string): Promise<GrammarResult> {
    try {
      const langMap: Record<string, string> = {
        ru: 'ru-RU',
        en: 'en-US',
        tr: 'tr-TR',
      };

      const lang = langMap[language] || 'auto';

      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: text,
          language: lang,
          enabledOnly: 'false',
        }),
      });

      if (!response.ok) {
        return this.fallbackCorrection(text, language);
      }

      const data = await response.json();
      
      if (!data.matches || data.matches.length === 0) {
        return {
          originalText: text,
          correctedText: text,
          errorsCount: 0,
          errors: [],
        };
      }

      const errors: Array<{original: string; corrected: string; explanation: string}> = [];
      let correctedText = text;
      let offset = 0;

      for (const match of data.matches) {
        const original = text.substring(match.offset, match.offset + match.length);
        const corrected = match.replacements?.[0]?.value || original;
        
        if (original !== corrected) {
          errors.push({
            original,
            corrected,
            explanation: match.message || 'Grammatik xato',
          });

          const start = match.offset + offset;
          const end = start + match.length;
          correctedText = correctedText.substring(0, start) + corrected + correctedText.substring(end);
          offset += corrected.length - match.length;
        }
      }

      return {
        originalText: text,
        correctedText,
        errorsCount: errors.length,
        errors,
      };
    } catch (error) {
      console.error('Grammar correction error:', error);
      return this.fallbackCorrection(text, language);
    }
  }

  private async fallbackCorrection(text: string, language: string): Promise<GrammarResult> {
    return this.basicCheck(text, language);
  }

  private basicCheck(text: string, language: string): GrammarResult {
    let correctedText = text;
    const errors: Array<{original: string; corrected: string; explanation: string}> = [];

    // Ortiqcha bo'sh joy
    const doubleSpaces = correctedText.match(/  +/g);
    if (doubleSpaces) {
      errors.push({
        original: '  ',
        corrected: ' ',
        explanation: "Ortiqcha bo'sh joy",
      });
      correctedText = correctedText.replace(/  +/g, ' ');
    }

    // Tinish belgilaridan keyin bo'sh joy
    const punctuation = correctedText.match(/[.!?,;:][^\s\n"')\]]/g);
    if (punctuation) {
      for (const p of punctuation) {
        errors.push({
          original: p,
          corrected: p[0] + ' ' + p[1],
          explanation: "Tinish belgisidan keyin bo'sh joy bo'lishi kerak",
        });
      }
      correctedText = correctedText.replace(/([.!?,;:])([^\s\n"')\]])/g, '$1 $2');
    }

    // Kichik harfdan boshlangan gap
    const sentences = correctedText.match(/[.!?]\s+[a-zа-яўқғҳ]/g);
    if (sentences) {
      for (const s of sentences) {
        const fixed = s.slice(0, -1) + s.slice(-1).toUpperCase();
        errors.push({
          original: s,
          corrected: fixed,
          explanation: "Gap bosh harf bilan boshlanishi kerak",
        });
      }
      correctedText = correctedText.replace(/([.!?]\s+)([a-zа-яўқғҳ])/g, (m, p1, p2) => p1 + p2.toUpperCase());
    }

    // Bosh harf (gapning boshida)
    if (/^[a-zа-яўқғҳ]/.test(correctedText)) {
      const firstLetter = correctedText[0];
      errors.push({
        original: firstLetter,
        corrected: firstLetter.toUpperCase(),
        explanation: "Gap bosh harf bilan boshlanishi kerak",
      });
      correctedText = correctedText[0].toUpperCase() + correctedText.slice(1);
    }

    // Turkcha keng tarqalgan xatolar - maxsus harflar
    if (language === 'tr') {
      const trErrors: Record<string, string> = {
        // Türkçe → ç harfi
        'Turkce': 'Türkçe',
        'turkce': 'türkçe',
        'cok': 'çok',
        'Cok': 'Çok',
        'cocuk': 'çocuk',
        'cocuklar': 'çocuklar',
        'calis': 'çalış',
        'calisiyorum': 'çalışıyorum',
        'calistim': 'çalıştım',
        'icin': 'için',
        'gec': 'geç',
        'gecen': 'geçen',
        'Gecen': 'Geçen',
        'gectim': 'geçtim',
        'gectik': 'geçtik',
        'gecti': 'geçti',
        // ğ harfi
        'piknige': 'pikniğe',
        'dogru': 'doğru',
        'Dogru': 'Doğru',
        'yagli': 'yağlı',
        'yagmur': 'yağmur',
        'oglum': 'oğlum',
        'ogretmen': 'öğretmen',
        'Ogretmen': 'Öğretmen',
        'ogrenci': 'öğrenci',
        'Ogrenci': 'Öğrenci',
        'ogrenciler': 'öğrenciler',
        'ogrenmek': 'öğrenmek',
        'ogreniyorum': 'öğreniyorum',
        'ogrendim': 'öğrendim',
        'eglendik': 'eğlendik',
        'eglence': 'eğlence',
        // ü harfi
        'guzel': 'güzel',
        'Guzel': 'Güzel',
        'guzeldi': 'güzeldi',
        'gun': 'gün',
        'Gun': 'Gün',
        'gunler': 'günler',
        'bugun': 'bugün',
        'Bugun': 'Bugün',
        'dun': 'dün',
        'Dun': 'Dün',
        'guler': 'güler',
        'guldum': 'güldüm',
        'ustun': 'üstün',
        'ustu': 'üstü',
        'uzere': 'üzere',
        // ö harfi
        'oglen': 'öğlen',
        'Oglen': 'Öğlen',
        'onde': 'önde',
        'once': 'önce',
        'Once': 'Önce',
        'odev': 'ödev',
        'Odev': 'Ödev',
        'onemli': 'önemli',
        'Onemli': 'Önemli',
        // ı harfi
        'yapiyorum': 'yapıyorum',
        'yaptim': 'yaptım',
        'yaptik': 'yaptık',
        'gittim': 'gittim',
        'dondum': 'döndüm',
        'donduk': 'döndük',
        'sinif': 'sınıf',
        'sinifa': 'sınıfa',
        'yarin': 'yarın',
        'Yarin': 'Yarın',
        'kahvalti': 'kahvaltı',
        'yapacagiz': 'yapacağız',
        // ş harfi
        'is': 'iş',
        'iste': 'işte',
        'isler': 'işler',
        'basla': 'başla',
        'basladi': 'başladı',
        'basladik': 'başladık',
        'goster': 'göster',
        'gosterdi': 'gösterdi',
        'kosuyorum': 'koşuyorum',
        'kosarak': 'koşarak',
        // Boshqa xatolar
        'gidiyorm': 'gidiyorum',
        'geliyorm': 'geliyorum',
        'herkez': 'herkes',
        'yalniz': 'yalnız',
        'istiyoru': 'istiyorum',
      };
      
      for (const [wrong, correct] of Object.entries(trErrors)) {
        if (wrong !== correct) {
          const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
          if (regex.test(correctedText)) {
            errors.push({
              original: wrong,
              corrected: correct,
              explanation: "Türkçe imla hatası",
            });
            correctedText = correctedText.replace(regex, correct);
          }
        }
      }
    }

    // O'zbekcha keng tarqalgan xatolar
    if (language === 'uz') {
      const uzErrors: Record<string, string> = {
        // Imlo xatolari
        'qayerde': 'qayerda',
        'ishliman': 'ishlayman',
        'borayotman': 'borayapman',
        'kelayotman': 'kelyapman',
        'korayotman': 'ko\'rayapman',
        'olayotman': 'olyapman',
        'qilayotman': 'qilyapman',
        'yozayotman': 'yozyapman',
        'o\'qiyotman': 'o\'qiyapman',
        'ishlaydman': 'ishlayman',
        'boradman': 'boraman',
        'keladman': 'kelaman',
        'ishlaysz': 'ishlaysiz',
        'borasiz': 'borasiz',
        'kelasiz': 'kelasiz',
        'qilasiz': 'qilasiz',
        'ko\'rasiz': 'ko\'rasiz',
        'bilamn': 'bilaman',
        'bilasn': 'bilasan',
        'boladi': 'bo\'ladi',
        'bolmaydi': 'bo\'lmaydi',
        'bolsa': 'bo\'lsa',
        'bolganda': 'bo\'lganda',
        'uyga': 'uyga',
        'maktabga': 'maktabga',
        'ishga': 'ishga',
        'mashina': 'mashina',
        'kompyuter': 'kompyuter',
        'telefon': 'telefon',
      };
      
      for (const [wrong, correct] of Object.entries(uzErrors)) {
        if (wrong !== correct) {
          // Case-insensitive qidirish
          const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
          if (regex.test(correctedText)) {
            errors.push({
              original: wrong,
              corrected: correct,
              explanation: "Imlo xatosi",
            });
            correctedText = correctedText.replace(regex, correct);
          }
        }
      }
    }

    return {
      originalText: text,
      correctedText: correctedText.trim(),
      errorsCount: errors.length,
      errors,
    };
  }

  formatResult(result: GrammarResult): string {
    let message = '';

    if (result.errorsCount === 0) {
      message = `✅ *Grammatik xato topilmadi!*\n\nSizning matningiz to'g'ri yozilgan.`;
    } else {
      message = `📝 *Grammatik tekshiruv natijasi:*\n\n`;
      message += `❌ *Topilgan xatolar:* ${result.errorsCount} ta\n\n`;
      message += `📄 *Asl matn:*\n${result.originalText}\n\n`;
      message += `✅ *To'g'irlangan matn:*\n${result.correctedText}\n\n`;

      if (result.errors.length > 0) {
        message += `📋 *Xatolar ro'yxati:*\n`;
        result.errors.forEach((error, index) => {
          message += `${index + 1}. "${error.original}" → "${error.corrected}"\n   💡 ${error.explanation}\n`;
        });
      }
    }

    return message;
  }
}
