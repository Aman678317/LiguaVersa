import logging

logger = logging.getLogger(__name__)

class LanguageDetector:
    """
    Automatic Language Detection module.
    """
    def detect_language(self, text: str, hint_lang: str = None) -> str:
        if not text or not text.strip():
            return hint_lang or "en"
        
        # Simple Unicode script detection for rapid zero-latency resolution
        has_devanagari = any('\u0900' <= char <= '\u097F' for char in text)
        if has_devanagari:
            return "hi"
            
        has_cjk = any('\u4e00' <= char <= '\u9fff' for char in text)
        if has_cjk:
            return "zh"
            
        has_japanese = any('\u3040' <= char <= '\u30ff' for char in text)
        if has_japanese:
            return "ja"
            
        if hint_lang:
            return hint_lang.split("-")[0].lower()
            
        return "en"

language_detector = LanguageDetector()
