import { Injectable } from '@nestjs/common';

@Injectable()
export class TranslationService {
  async translateStream(text: string, sourceLang: string, targetLang: string) {
    return text;
  }
}
