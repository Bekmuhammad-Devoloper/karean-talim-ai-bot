import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SpeechToTextService {
  constructor(private configService: ConfigService) {}

  async transcribe(audioUrl: string, language: string = 'en'): Promise<string> {
    try {
      // 1. AssemblyAI - eng yaxshi sifat (bepul $50 kredit)
      const assemblyKey = this.configService.get('ASSEMBLYAI_API_KEY', '');
      if (assemblyKey) {
        const result = await this.transcribeWithAssemblyAI(audioUrl, language, assemblyKey);
        if (result) return result;
      }

      // 2. Deepgram API (bepul 45,000 daqiqa/oy)
      const deepgramKey = this.configService.get('DEEPGRAM_API_KEY', '');
      if (deepgramKey) {
        const result = await this.transcribeWithDeepgram(audioUrl, language, deepgramKey);
        if (result) return result;
      }

      // 3. Wit.ai
      const witTokens: Record<string, string> = {
        en: this.configService.get('WIT_TOKEN_EN', ''),
        ru: this.configService.get('WIT_TOKEN_RU', ''),
        tr: this.configService.get('WIT_TOKEN_TR', ''),
        uz: this.configService.get('WIT_TOKEN_EN', ''),
      };

      const token = witTokens[language] || witTokens['en'];
      if (token) {
        const result = await this.transcribeWithWitAi(audioUrl, language, token);
        if (result) return result;
      }

      console.log('No speech-to-text service available');
      return '';
    } catch (error) {
      console.error('Speech-to-text error:', error);
      return '';
    }
  }

  private async transcribeWithAssemblyAI(audioUrl: string, language: string, apiKey: string): Promise<string> {
    try {
      console.log('Using AssemblyAI for transcription...');
      
      // 1. Upload audio yoki URL dan foydalanish
      // Telegram URL ni to'g'ridan-to'g'ri ishlatamiz
      
      // 2. Transcription so'rovi
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_detection: true, // Avtomatik til aniqlash
        }),
      });

      if (!transcriptResponse.ok) {
        console.error('AssemblyAI transcript request failed:', await transcriptResponse.text());
        return '';
      }

      const transcriptData = await transcriptResponse.json();
      const transcriptId = transcriptData.id;
      console.log('AssemblyAI transcript ID:', transcriptId);

      // 3. Natijani kutish (polling)
      let result = '';
      let attempts = 0;
      const maxAttempts = 60; // 60 soniya max

      while (attempts < maxAttempts) {
        const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: {
            'Authorization': apiKey,
          },
        });

        const statusData = await statusResponse.json();
        console.log('AssemblyAI status:', statusData.status);

        if (statusData.status === 'completed') {
          result = statusData.text || '';
          console.log('AssemblyAI result:', result);
          break;
        } else if (statusData.status === 'error') {
          console.error('AssemblyAI error:', statusData.error);
          return '';
        }

        // 1 soniya kutish
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      return result;
    } catch (error) {
      console.error('AssemblyAI error:', error);
      return '';
    }
  }

  private async transcribeWithDeepgram(audioUrl: string, language: string, apiKey: string): Promise<string> {
    try {
      // Deepgram qo'llab-quvvatlaydigan tillar
      // O'zbek tili yo'q, shuning uchun detect_language ishlatamiz
      const langMap: Record<string, string> = {
        en: 'en',
        ru: 'ru',
        tr: 'tr',
        uz: '', // O'zbek yo'q - avtomatik aniqlash
      };

      console.log('Downloading audio for Deepgram...');
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) return '';
      
      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      console.log('Audio downloaded, size:', audioBuffer.length);

      // Agar til qo'llab-quvvatlanmasa, detect_language ishlatamiz
      const lang = langMap[language];
      let url = 'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true';
      
      if (lang) {
        url += `&language=${lang}`;
      } else {
        // O'zbek va boshqa tillar uchun avtomatik aniqlash
        url += '&detect_language=true';
      }

      console.log('Sending to Deepgram...', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'audio/ogg',
        },
        body: audioBuffer,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Deepgram response:', JSON.stringify(data, null, 2));
        
        const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
        console.log('Transcribed text:', transcript);
        return transcript;
      } else {
        const errorText = await response.text();
        console.error('Deepgram error:', response.status, errorText);
        return '';
      }
    } catch (error) {
      console.error('Deepgram error:', error);
      return '';
    }
  }

  private async transcribeWithWitAi(audioUrl: string, language: string, token: string): Promise<string> {
    try {
      console.log('Downloading audio for Wit.ai...');
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) return '';
      
      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      console.log('Audio downloaded, size:', audioBuffer.length);

      console.log('Sending to Wit.ai...');
      const response = await fetch('https://api.wit.ai/speech?v=20230215', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'audio/ogg',
        },
        body: audioBuffer,
      });

      if (response.ok) {
        const responseText = await response.text();
        console.log('Wit.ai raw response:', responseText);
        
        const lines = responseText.trim().split('\n');
        let finalText = '';
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.text) finalText = data.text;
          } catch {}
        }
        
        console.log('Transcribed text:', finalText);
        return finalText;
      } else {
        const errorText = await response.text();
        console.error('Wit.ai error:', response.status, errorText);
        return '';
      }
    } catch (error) {
      console.error('Wit.ai error:', error);
      return '';
    }
  }

  async downloadVoice(url: string, fileName?: string): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'voice');
    
    // Create directory if not exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const actualFileName = fileName || `voice_${Date.now()}.ogg`;
    const filePath = path.join(uploadsDir, actualFileName);

    // Download file using fetch
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    return filePath;
  }

  async transcribeVideo(videoUrl: string, language: string = 'en'): Promise<string> {
    try {
      // 1. AssemblyAI - eng yaxshi sifat
      const assemblyKey = this.configService.get('ASSEMBLYAI_API_KEY', '');
      if (assemblyKey) {
        const result = await this.transcribeWithAssemblyAI(videoUrl, language, assemblyKey);
        if (result) return result;
      }

      // 2. Deepgram
      const deepgramKey = this.configService.get('DEEPGRAM_API_KEY', '');
      if (deepgramKey) {
        const result = await this.transcribeVideoWithDeepgram(videoUrl, language, deepgramKey);
        if (result) return result;
      }

      console.log('No video transcription service available');
      return '';
    } catch (error) {
      console.error('Video transcription error:', error);
      return '';
    }
  }

  private async transcribeVideoWithDeepgram(videoUrl: string, language: string, apiKey: string): Promise<string> {
    try {
      // Deepgram qo'llab-quvvatlaydigan tillar
      const langMap: Record<string, string> = {
        en: 'en',
        ru: 'ru',
        tr: 'tr',
        uz: '', // O'zbek yo'q - avtomatik aniqlash
      };

      console.log('Downloading video for Deepgram...');
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) return '';
      
      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
      console.log('Video downloaded, size:', videoBuffer.length);

      // Content type ni URL dan aniqlash
      let contentType = 'video/mp4';
      if (videoUrl.includes('.webm')) contentType = 'video/webm';
      else if (videoUrl.includes('.mpeg')) contentType = 'video/mpeg';

      const lang = langMap[language];
      let url = 'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true';
      
      if (lang) {
        url += `&language=${lang}`;
      } else {
        url += '&detect_language=true';
      }

      console.log('Sending video to Deepgram...', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': contentType,
        },
        body: videoBuffer,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Deepgram video response:', JSON.stringify(data, null, 2));
        
        const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
        console.log('Video transcribed text:', transcript);
        return transcript;
      } else {
        const errorText = await response.text();
        console.error('Deepgram video error:', response.status, errorText);
        return '';
      }
    } catch (error) {
      console.error('Deepgram video error:', error);
      return '';
    }
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
