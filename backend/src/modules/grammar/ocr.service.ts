import { Injectable } from '@nestjs/common';
import Tesseract from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OcrService {
  async extractText(imagePath: string, language: string = 'uz'): Promise<string> {
    try {
      // Map language codes to Tesseract language codes
      const languageMap: Record<string, string> = {
        uz: 'uzb',
        ru: 'rus',
        en: 'eng',
        tr: 'tur',
        ko: 'kor',
      };

      const tesseractLang = languageMap[language] || 'uzb+rus+eng';

      const result = await Tesseract.recognize(imagePath, tesseractLang, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      return result.data.text.trim();
    } catch (error) {
      console.error('OCR error:', error);
      throw new Error('Rasmdan matn o\'qishda xatolik yuz berdi');
    }
  }

  async downloadImage(url: string, fileName?: string): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'images');

    // Create directory if not exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const actualFileName = fileName || `image_${Date.now()}.jpg`;
    const filePath = path.join(uploadsDir, actualFileName);

    // Download file
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    return filePath;
  }

  cleanup(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('File cleanup error:', error);
    }
  }
}
