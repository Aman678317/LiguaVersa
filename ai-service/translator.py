import os
import logging
from fastapi.concurrency import run_in_threadpool
import google.generativeai as genai

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_model = None
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-1.5-flash")

class TranslatorEngine:
    """
    Translates text between languages using Gemini API with ultra-low latency.
    """
    async def translate(self, text: str, src_lang: str, tgt_lang: str) -> tuple[str, str]:
        if not text or not text.strip():
            return text, "ok"

        src_iso = src_lang.split("-")[0].lower() if src_lang else ""
        tgt_iso = tgt_lang.split("-")[0].lower() if tgt_lang else ""

        if src_iso == tgt_iso or src_lang == tgt_lang:
            return text, "ok"

        if not gemini_model:
            logger.warning("Gemini model not initialized. Returning untranslated text.")
            return text, "degraded"

        try:
            prompt = (
                f"Translate the following text from {src_lang} to {tgt_lang}.\n"
                "Return ONLY the translated text.\n"
                "Do not explain.\n"
                "Keep punctuation intact.\n"
                "Do not translate names.\n\n"
                f"{text}"
            )
            response = await run_in_threadpool(gemini_model.generate_content, prompt)
            translated = response.text.strip() if response and response.text else ""
            if translated:
                return translated, "ok"
            return text, "degraded"
        except Exception as e:
            logger.error(f"Translation error: {e}")
            return text, "degraded"

translator_engine = TranslatorEngine()
