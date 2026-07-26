import os
import tempfile
import logging

logger = logging.getLogger(__name__)

try:
    from faster_whisper import WhisperModel
except Exception:
    WhisperModel = None

class WhisperStreamEngine:
    """
    Streaming Speech-to-Text wrapper using faster-whisper.
    """
    def __init__(self, model_size: str = "tiny"):
        self.model = None
        try:
            if WhisperModel:
                self.model = WhisperModel(model_size, device="cpu", compute_type="int8")
                logger.info(f"WhisperStreamEngine initialized with {model_size} model.")
            else:
                logger.warning("faster-whisper is not installed.")
        except Exception as e:
            logger.error(f"Failed to initialize Whisper model: {e}")

    def transcribe_file(self, file_path: str, src_lang: str = None) -> tuple[str, str, float]:
        """
        Transcribes audio file.
        Returns: (transcribed_text, detected_language, confidence)
        """
        if not self.model:
            return "", src_lang or "en", 0.0

        try:
            kwargs = {"beam_size": 1}
            if src_lang:
                iso_lang = src_lang.split("-")[0].lower()
                if len(iso_lang) == 2:
                    kwargs["language"] = iso_lang

            segments, info = self.model.transcribe(file_path, **kwargs)
            text = "".join([s.text for s in segments]).strip()
            detected_lang = info.language or (src_lang.split("-")[0] if src_lang else "en")
            confidence = info.language_probability or 1.0
            return text, detected_lang, confidence
        except Exception as e:
            logger.error(f"WhisperStreamEngine transcription failed: {e}")
            return "", src_lang or "en", 0.0

whisper_stream_engine = WhisperStreamEngine()
