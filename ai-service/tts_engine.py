import logging
from tts_engines import synthesize_speech_sync

logger = logging.getLogger(__name__)

class TTSEngineWrapper:
    """
    Streaming Text-To-Speech Synthesis wrapper module.
    """
    def synthesize(self, text: str, target_lang: str) -> tuple[bytes, str, str]:
        """
        Synthesizes text to audio bytes.
        Returns: (audio_bytes, engine_name, error_message)
        """
        if not text or not text.strip():
            return b"", "none", "Empty text provided"
        return synthesize_speech_sync(text, target_lang)

tts_engine_wrapper = TTSEngineWrapper()
