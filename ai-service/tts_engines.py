import os
import shutil
import subprocess
import tempfile
import logging
import asyncio
import io
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

# Piper Voice Candidates Mapping
PIPER_VOICE_CANDIDATES = {
    "en": ["en_US-lessac-medium"],
    "es": ["es_ES-davefx-medium"],
    "fr": ["fr_FR-siwis-medium"],
    "hi": ["hi_IN-pratham-medium", "hi_IN-priyamvada-medium"],
    "zh": ["zh_CN-huayan-medium"],
    "de": ["de_DE-thorsten-medium"],
    "default": ["en_US-lessac-medium"]
}

PIPER_VOICES = {
    "en": "en_US-lessac-medium",
    "es": "es_ES-davefx-medium",
    "fr": "fr_FR-siwis-medium",
    "hi": "hi_IN-pratham-medium",
}

# Edge-TTS Neural Voice Mapping (covers 20+ CALL_LANGUAGES)
EDGE_VOICES = {
    "en": "en-US-AriaNeural",
    "es": "es-ES-ElviraNeural",
    "fr": "fr-FR-DeniseNeural",
    "hi": "hi-IN-SwaraNeural",
    "ja": "ja-JP-NanamiNeural",
    "ko": "ko-KR-SunHiNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
    "ar": "ar-SA-ZariyahNeural",
    "de": "de-DE-KatjaNeural",
    "mr": "mr-IN-AarohiNeural",
    "gu": "gu-IN-DhwaniNeural",
    "pa": "pa-IN-GurpreetNeural",
    "ta": "ta-IN-PallaviNeural",
    "te": "te-IN-MohanNeural",
    "ml": "ml-IN-SobhanaNeural",
    "kn": "kn-IN-GaganNeural",
    "bn": "bn-IN-TanishaaNeural",
    "ur": "ur-PK-UzmaNeural",
    "ru": "ru-RU-SvetlanaNeural",
    "tr": "tr-TR-AhmetNeural",
    "pt": "pt-BR-FranciscaNeural",
    "it": "it-IT-ElsaNeural",
    "default": "en-US-AriaNeural"
}

# Data-driven engine preference per language
LANGUAGE_ENGINE_MAP = {
    "en": {"primary": "piper", "voice": "en_US-lessac-medium"},
    "es": {"primary": "piper", "voice": "es_ES-davefx-medium"},
    "fr": {"primary": "piper", "voice": "fr_FR-siwis-medium"},
    "hi": {"primary": "piper", "voice": "hi_IN-pratham-medium"},
    "ja": {"primary": "edge-tts", "voice": "ja-JP-NanamiNeural"},
    "ko": {"primary": "edge-tts", "voice": "ko-KR-SunHiNeural"},
    "zh": {"primary": "piper", "voice": "zh_CN-huayan-medium"},
    "ar": {"primary": "edge-tts", "voice": "ar-SA-ZariyahNeural"},
    "de": {"primary": "edge-tts", "voice": "de-DE-KatjaNeural"},
    "mr": {"primary": "edge-tts", "voice": "mr-IN-AarohiNeural"},
    "gu": {"primary": "edge-tts", "voice": "gu-IN-DhwaniNeural"},
    "pa": {"primary": "edge-tts", "voice": "pa-IN-GurpreetNeural"},
    "ta": {"primary": "edge-tts", "voice": "ta-IN-PallaviNeural"},
    "te": {"primary": "edge-tts", "voice": "te-IN-MohanNeural"},
    "ml": {"primary": "edge-tts", "voice": "ml-IN-SobhanaNeural"},
    "kn": {"primary": "edge-tts", "voice": "kn-IN-GaganNeural"},
    "bn": {"primary": "edge-tts", "voice": "bn-IN-TanishaaNeural"},
    "ur": {"primary": "edge-tts", "voice": "ur-PK-UzmaNeural"},
    "ru": {"primary": "edge-tts", "voice": "ru-RU-SvetlanaNeural"},
    "tr": {"primary": "edge-tts", "voice": "tr-TR-AhmetNeural"},
    "pt": {"primary": "edge-tts", "voice": "pt-BR-FranciscaNeural"},
    "it": {"primary": "edge-tts", "voice": "it-IT-ElsaNeural"},
}


def convert_audio_to_wav(input_bytes: bytes) -> bytes:
    """Converts audio bytes (e.g. MP3) to 16-bit 22050Hz mono WAV bytes using ffmpeg if available."""
    if not input_bytes:
        return b""
    try:
        if not shutil.which("ffmpeg"):
            logger.warning("ffmpeg binary not found in PATH; returning raw audio bytes.")
            return input_bytes

        cmd = [
            "ffmpeg",
            "-hide_banner",
            "-loglevel", "error",
            "-i", "pipe:0",
            "-f", "wav",
            "-ar", "22050",
            "-ac", "1",
            "pipe:1"
        ]
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        out, err = process.communicate(input=input_bytes, timeout=10)
        if process.returncode == 0 and out:
            return out
        else:
            logger.error(f"ffmpeg conversion failed: {err.decode('utf-8', errors='ignore')}")
            return input_bytes
    except Exception as e:
        logger.error(f"Error converting audio to WAV: {e}")
        return input_bytes


class TTSEngine(ABC):
    """Abstract Base Class for TTS Engines."""

    @abstractmethod
    def can_handle(self, lang_code: str) -> bool:
        """Check if engine can handle the specified language."""
        pass

    @abstractmethod
    def synthesize(self, text: str, lang_code: str) -> bytes:
        """Synthesize text into raw WAV/PCM audio bytes."""
        pass


class PiperEngine(TTSEngine):
    """Local Piper TTS Engine (restricted to languages with pre-downloaded models)."""

    def __init__(self, voice_candidates: dict[str, list[str]] = PIPER_VOICE_CANDIDATES):
        self.voice_candidates = voice_candidates

    def can_handle(self, lang_code: str) -> bool:
        iso = lang_code.split("-")[0].lower()
        return iso in self.voice_candidates and shutil.which("piper") is not None

    def synthesize_with_meta(self, text: str, lang_code: str) -> tuple[bytes, str]:
        iso = lang_code.split("-")[0].lower()
        candidates = self.voice_candidates.get(iso, self.voice_candidates.get("default", []))
        if not candidates:
            return b"", ""

        for voice_candidate in candidates:
            try:
                cmd = ["piper", "--model", voice_candidate, "--output_file", "-"]
                process = subprocess.Popen(
                    cmd,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                try:
                    stdout_data, stderr_data = process.communicate(
                        input=text.encode("utf-8"), timeout=5.0
                    )
                    if process.returncode == 0 and stdout_data:
                        return stdout_data, f"piper:{voice_candidate}"
                    else:
                        logger.error(f"Piper process failed for '{voice_candidate}': {stderr_data.decode('utf-8', errors='ignore')}")
                except subprocess.TimeoutExpired:
                    logger.warning(f"Piper timeout expired for candidate '{voice_candidate}'. Killing process.")
                    process.kill()
                    process.communicate()
                    continue
            except Exception as e:
                logger.error(f"Piper synthesis error for candidate '{voice_candidate}': {e}")
                continue

        return b"", ""

    def synthesize(self, text: str, lang_code: str) -> bytes:
        audio, _ = self.synthesize_with_meta(text, lang_code)
        return audio


class EdgeTTSEngine(TTSEngine):
    """Microsoft Edge Neural TTS Engine (Free high-quality voices for all CALL_LANGUAGES)."""

    def __init__(self, voices: dict[str, str] = EDGE_VOICES):
        self.voices = voices

    def can_handle(self, lang_code: str) -> bool:
        return True

    def synthesize(self, text: str, lang_code: str) -> bytes:
        iso = lang_code.split("-")[0].lower()
        voice_name = self.voices.get(iso, self.voices.get(lang_code.lower(), self.voices.get("default")))
        try:
            import edge_tts
            communicate = edge_tts.Communicate(text, voice_name)
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
                tmp_path = tmp.name

            try:
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    loop = None

                if loop and loop.is_running():
                    future = asyncio.run_coroutine_threadsafe(communicate.save(tmp_path), loop)
                    future.result(timeout=15)
                else:
                    asyncio.run(communicate.save(tmp_path))

                with open(tmp_path, "rb") as f:
                    mp3_data = f.read()

                if mp3_data:
                    return convert_audio_to_wav(mp3_data)
                return b""
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
        except Exception as e:
            logger.error(f"Edge-TTS synthesis error for {lang_code} ({voice_name}): {e}")
            return b""


class GTTSFallbackEngine(TTSEngine):
    """gTTS Fallback Engine."""

    def can_handle(self, lang_code: str) -> bool:
        return True

    def synthesize(self, text: str, lang_code: str) -> bytes:
        iso = lang_code.split("-")[0].lower()
        try:
            from gtts import gTTS
            tts = gTTS(text=text, lang=iso)
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            mp3_data = fp.read()
            if mp3_data:
                return convert_audio_to_wav(mp3_data)
            return b""
        except Exception as e:
            logger.error(f"gTTS synthesis error for {lang_code}: {e}")
            return b""


class TTSEngineRouter:
    """Data-driven router for selecting and executing the appropriate TTS Engine."""

    def __init__(self):
        self.piper_engine = PiperEngine()
        self.edge_engine = EdgeTTSEngine()
        self.gtts_engine = GTTSFallbackEngine()

    def synthesize(self, text: str, target_lang: str) -> tuple[bytes, str, str]:
        """
        Synthesizes speech for target_lang.
        Returns: (audio_bytes, engine_name, error_message)
        """
        if not text or not text.strip():
            return b"", "none", "Empty text"

        iso_lang = target_lang.split("-")[0].lower() if target_lang else "en"
        config = LANGUAGE_ENGINE_MAP.get(iso_lang, {})
        primary_pref = config.get("primary", "edge-tts")

        # 1. Attempt Piper if preferred and available
        if primary_pref == "piper" and self.piper_engine.can_handle(iso_lang):
            audio, voice_name = self.piper_engine.synthesize_with_meta(text, iso_lang)
            if audio:
                return audio, voice_name, ""
            logger.warning(f"Piper failed for {iso_lang}, falling back to EdgeTTS...")

        # 2. Attempt EdgeTTS (primary for non-piper languages or fallback)
        if self.edge_engine.can_handle(iso_lang):
            audio = self.edge_engine.synthesize(text, target_lang)
            if audio:
                voice = EDGE_VOICES.get(iso_lang, EDGE_VOICES["default"])
                return audio, f"edge-tts:{voice}", ""
            logger.warning(f"EdgeTTS failed for {target_lang}, falling back to gTTS...")

        # 3. Attempt Piper as secondary fallback if supported
        if primary_pref != "piper" and self.piper_engine.can_handle(iso_lang):
            audio = self.piper_engine.synthesize(text, iso_lang)
            if audio:
                voice = PIPER_VOICES.get(iso_lang, "default")
                return audio, f"piper:{voice}", ""

        # 4. Attempt gTTS as final fallback
        if self.gtts_engine.can_handle(iso_lang):
            audio = self.gtts_engine.synthesize(text, iso_lang)
            if audio:
                return audio, f"gtts:{iso_lang}", ""

        return b"", "failed", f"All TTS engines failed for target language '{target_lang}'"


_router = TTSEngineRouter()


def synthesize_speech_sync(text: str, target_lang: str) -> tuple[bytes, str, str]:
    """Public helper function matching original function signature for backward compatibility."""
    return _router.synthesize(text, target_lang)
