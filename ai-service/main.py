import base64
import os
import re
import subprocess
import tempfile
from typing import Optional

import requests
from fastapi import FastAPI, Request, Response

try:
    from faster_whisper import WhisperModel
except Exception:  # pragma: no cover - optional dependency in local environments
    WhisperModel = None

app = FastAPI()

HF_TOKEN = os.getenv("HUGGINGFACE_API_KEY")
HF_MODEL = os.getenv("HF_TRANSLATION_MODEL", "facebook/nllb-200-distilled-600M")
HF_API_URL = os.getenv("HF_TRANSLATION_URL", f"https://api-inference.huggingface.co/models/{HF_MODEL}")

print("Loading faster-whisper model...")
try:
    whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8") if WhisperModel else None
    print("Model loaded." if whisper_model else "faster-whisper unavailable; using fallback STT path.")
except Exception as e:
    print(f"Failed to load whisper: {e}")
    whisper_model = None

LANGUAGE_ALIASES = {
    "en": "en",
    "english": "en",
    "eng": "en",
    "hi": "hi",
    "hindi": "hi",
    "hin": "hi",
    "es": "es",
    "spanish": "es",
    "spa": "es",
    "fr": "fr",
    "french": "fr",
    "fra": "fr",
    "de": "de",
    "german": "de",
    "deu": "de",
    "zh": "zh",
    "chinese": "zh",
    "zho": "zh",
    "ja": "ja",
    "japanese": "ja",
    "jpn": "ja",
    "mr": "mr",
    "marathi": "mr",
}

HF_LANGUAGE_CODES = {
    "en": "eng_Latn",
    "hi": "hin_Deva",
    "es": "spa_Latn",
    "fr": "fra_Latn",
    "de": "deu_Latn",
    "zh": "zho_Hans",
    "ja": "jpn_Jpan",
    "mr": "mar_Deva",
}

FALLBACK_TRANSLATIONS = {
    "en:hi": {"hello": "नमस्ते", "hi": "नमस्ते", "how are you": "आप कैसे हैं?", "goodbye": "अलविदा", "thank you": "धन्यवाद"},
    "hi:en": {"नमस्ते": "Hello", "हैलो": "Hello", "आप कैसे हैं?": "How are you?", "धन्यवाद": "Thank you", "अलविदा": "Goodbye"},
}

PIPER_VOICE_CANDIDATES = {
    "en": ["en_US-lessac-medium", "en_US-lessac-low"],
    "hi": ["hi_IN-hemant-medium", "hi_IN-hemant-low"],
    "es": ["es_ES-mls-medium", "es_ES-mls-low"],
    "fr": ["fr_FR-siwis-medium", "fr_FR-siwis-low"],
    "de": ["de_DE-eva_k-medium", "de_DE-karlsson-low"],
    "zh": ["zh_CN-huaying-medium", "zh_CN-huaying-low"],
    "ja": ["ja_JP-kotaro-medium", "ja_JP-kotaro-low"],
    "mr": ["mr_IN-hemant-medium", "mr_IN-hemant-low"],
}


def normalize_language_code(lang: Optional[str]) -> str:
    if not lang:
        return "en"
    normalized = re.sub(r"[^a-zA-Z]+", "", str(lang)).lower()
    if not normalized:
        return "en"
    return LANGUAGE_ALIASES.get(normalized, LANGUAGE_ALIASES.get(normalized[:2], "en"))


def detect_language(text: str) -> str:
    if not text:
        return "unknown"
    if re.search(r"[\u0900-\u097F]", text):
        return "hi"
    lowered = text.lower()
    english_markers = ["hello", "the", "and", "how", "are", "you", "thank", "goodbye"]
    if any(marker in lowered for marker in english_markers):
        return "en"
    return "unknown"


def _encode_header(value: str) -> str:
    return base64.b64encode(value.encode("utf-8")).decode("ascii")


def translate_with_metadata(text: str, src_lang: str = "en", tgt_lang: str = "hi") -> dict:
    src_lang = normalize_language_code(src_lang)
    tgt_lang = normalize_language_code(tgt_lang)
    if not text or src_lang == tgt_lang:
        return {"text": text, "available": True}

    try:
        if HF_TOKEN:
            src_code = HF_LANGUAGE_CODES.get(src_lang, "eng_Latn")
            tgt_code = HF_LANGUAGE_CODES.get(tgt_lang, "hin_Deva")
            response = requests.post(
                HF_API_URL,
                headers={"Authorization": f"Bearer {HF_TOKEN}"},
                json={"inputs": text, "parameters": {"src_lang": src_code, "tgt_lang": tgt_code}},
                timeout=12,
            )
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, list) and payload:
                translated = payload[0].get("translation_text", text)
                if translated and translated != text:
                    return {"text": translated, "available": True}
            if isinstance(payload, dict):
                translated = payload.get("translation_text", text)
                if translated and translated != text:
                    return {"text": translated, "available": True}
    except Exception as exc:
        print(f"HF translation failed: {exc}")

    lookup_key = f"{src_lang}:{tgt_lang}"
    fallback_map = FALLBACK_TRANSLATIONS.get(lookup_key, {})
    lowered_text = text.strip().lower()
    if lowered_text in fallback_map:
        return {"text": fallback_map[lowered_text], "available": True}
    return {"text": text, "available": False, "reason": "translation-unavailable"}


def translate_text(text: str, src_lang: str = "en", tgt_lang: str = "hi") -> str:
    return translate_with_metadata(text, src_lang, tgt_lang)["text"]


def tts_piper(text: str, target_lang: str = "en") -> bytes:
    normalized_target = normalize_language_code(target_lang)
    voice_candidates = PIPER_VOICE_CANDIDATES.get(normalized_target, ["en_US-lessac-medium"])

    for voice in voice_candidates:
        try:
            cmd = ["piper", "--model", voice, "--output_raw"]
            process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            raw_audio, err = process.communicate(input=text.encode("utf-8"))
            if process.returncode == 0 and raw_audio:
                return raw_audio
            if err:
                print(f"Piper voice {voice} failed: {err.decode('utf-8', 'ignore').strip()}")
        except FileNotFoundError:
            print("Piper not found. Skipping TTS.")
            return b""
        except Exception as exc:
            print(f"Piper synthesis failed for {voice}: {exc}")

    return b""


@app.post("/process-audio")
async def process_audio(request: Request):
    audio_data = await request.body()
    src_lang = request.headers.get("X-Source-Lang", "en")
    tgt_lang = request.headers.get("X-Target-Lang", "en")

    if not whisper_model:
        return Response(content=b"", status_code=204)

    temp_path = None
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_file:
        temp_path = temp_file.name
        temp_file.write(audio_data)

    try:
        segments, _ = whisper_model.transcribe(temp_path, beam_size=1)
        text = "".join([s.text for s in segments]).strip()

        if not text:
            return Response(content=b"", status_code=204)

        detected_lang = detect_language(text)
        resolved_src_lang = detected_lang if detected_lang != "unknown" and detected_lang in LANGUAGE_ALIASES.values() else normalize_language_code(src_lang)
        translation_result = translate_with_metadata(text, resolved_src_lang, tgt_lang)
        translated_text = translation_result["text"]
        if not translation_result.get("available", True):
            translated_text = text
        tts_audio = tts_piper(translated_text, tgt_lang)

        headers = {
            "X-Original-Text": _encode_header(text),
            "X-Translated-Text": _encode_header(translated_text),
            "X-Detected-Lang": detected_lang,
            "X-Source-Lang": resolved_src_lang,
            "X-Target-Lang": normalize_language_code(tgt_lang),
            "X-Translation-Available": "true" if translation_result.get("available", True) else "false",
        }

        return Response(content=tts_audio, media_type="application/octet-stream", headers=headers)
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@app.get("/health")
def health():
    return {"status": "ok", "whisper": whisper_model is not None, "translation_model": HF_MODEL}
