import os
import shutil
import subprocess
import tempfile
import logging
import asyncio
import io

logger = logging.getLogger(__name__)

# Piper Voice Mapping
PIPER_VOICES = {
    "en": "en_US-lessac-medium",
    "es": "es_ES-davefx-medium",
    "fr": "fr_FR-siwis-medium",
    "hi": "hi_IN-swara-medium",
}

# Edge-TTS Neural Voice Mapping (high quality for Japanese, German, Chinese, etc.)
EDGE_VOICES = {
    "ja": "ja-JP-NanamiNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
    "de": "de-DE-KatjaNeural",
    "mr": "mr-IN-AarohiNeural",
    "ta": "ta-IN-PallaviNeural",
    "pa": "pa-IN-GurpreetNeural",
    "ar": "ar-SA-ZariyahNeural",
    "en": "en-US-AriaNeural",
    "hi": "hi-IN-SwaraNeural",
    "es": "es-ES-ElviraNeural",
    "fr": "fr-FR-DeniseNeural",
    "default": "ja-JP-NanamiNeural"
}

def _synthesize_piper(text: str, voice_model: str) -> bytes:
    """Synthesize speech using local Piper binary into WAV format."""
    try:
        if not shutil.which("piper"):
            logger.warning("Piper binary not found in PATH.")
            return b""
        
        # Use --output_file - to produce WAV format with headers instead of raw PCM
        cmd = ["piper", "--model", voice_model, "--output_file", "-"]
        process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout_data, stderr_data = process.communicate(input=text.encode("utf-8"), timeout=15)
        
        if process.returncode == 0 and stdout_data:
            return stdout_data
        else:
            logger.error(f"Piper process failed: {stderr_data.decode('utf-8', errors='ignore')}")
            return b""
    except Exception as e:
        logger.error(f"Piper synthesis error: {e}")
        return b""

async def _synthesize_edge_tts_async(text: str, voice_name: str) -> bytes:
    """Synthesize speech asynchronously using edge-tts."""
    try:
        import edge_tts
        communicate = edge_tts.Communicate(text, voice_name)
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            tmp_path = tmp.name
        
        try:
            await communicate.save(tmp_path)
            with open(tmp_path, "rb") as f:
                data = f.read()
            return data
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except Exception as e:
        logger.error(f"Edge-TTS synthesis error: {e}")
        return b""

def _synthesize_gtts(text: str, lang_code: str) -> bytes:
    """Fallback TTS using gTTS."""
    try:
        from gtts import gTTS
        tts = gTTS(text=text, lang=lang_code)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        return fp.read()
    except Exception as e:
        logger.error(f"gTTS synthesis error: {e}")
        return b""

def synthesize_speech_sync(text: str, target_lang: str) -> tuple[bytes, str, str]:
    """
    Pluggable TTS Dispatcher:
    - If language has a pre-downloaded Piper model (en, es, fr, hi) and piper binary exists, use Piper.
    - Otherwise (e.g., Japanese 'ja', German 'de', Chinese 'zh'), use Edge-TTS.
    - Fallback to gTTS if Edge-TTS fails.
    Returns: (audio_bytes, engine_name, error_message)
    """
    if not text.strip():
        return b"", "none", "Empty text"

    iso_lang = target_lang.split("-")[0].lower() if target_lang else "en"

    # 1. Try Piper if model exists for this language
    if iso_lang in PIPER_VOICES:
        piper_voice = PIPER_VOICES[iso_lang]
        audio = _synthesize_piper(text, piper_voice)
        if audio:
            return audio, f"piper:{piper_voice}", ""
        logger.warning(f"Piper failed for {iso_lang}, attempting edge-tts fallback...")

    # 2. Try Edge-TTS (Primary for Japanese and non-Piper languages)
    edge_voice = EDGE_VOICES.get(iso_lang, EDGE_VOICES.get(target_lang.lower(), EDGE_VOICES["default"]))
    try:
        # edge-tts is async, run in loop if inside sync threadpool
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        audio = loop.run_until_complete(_synthesize_edge_tts_async(text, edge_voice))
        loop.close()
        if audio:
            return audio, f"edge-tts:{edge_voice}", ""
    except Exception as e:
        logger.error(f"Edge-TTS event loop run failed for {iso_lang}: {e}")

    # 3. Fallback to gTTS
    audio = _synthesize_gtts(text, iso_lang)
    if audio:
        return audio, f"gtts:{iso_lang}", ""

    return b"", "failed", f"All TTS engines failed for target language '{target_lang}'"
