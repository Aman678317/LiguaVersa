import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class TranslationService {
  private readonly API_URL = 'https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M';

  async translateStream(text: string, sourceLang: string, targetLang: string) {
    const hfToken = process.env.HUGGINGFACE_API_KEY;
    if (!hfToken) {
      throw new HttpException('Hugging Face API key not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const payload = {
      inputs: text,
      parameters: {
        src_lang: sourceLang,
        tgt_lang: targetLang,
      },
    };

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new HttpException(`Hugging Face API error: ${response.statusText}`, response.status);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to communicate with Hugging Face API', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
