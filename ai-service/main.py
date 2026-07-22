import os
import subprocess
import tempfile
import base64
import logging
from fastapi import FastAPI, Request, Response
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    from faster_whisper import WhisperModel
except Exception:
    WhisperModel = None

app = FastAPI()

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

gemini_model = None
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-1.5-flash")
else:
    logger.warning("GEMINI_API_KEY is not set. Translation and Chat features will be disabled.")

# Initialize faster-whisper
whisper_model = None
logger.info("Loading faster-whisper model...")
try:
    if WhisperModel:
        whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
        logger.info("faster-whisper model loaded successfully.")
    else:
        logger.warning("faster-whisper library is unavailable.")
except Exception as e:
    logger.error(f"Failed to load whisper model: {e}")

# Voice Mapping for Piper TTS
VOICES = {
    "en": "en_US-lessac-medium",
    "es": "es_ES-davefx-medium",
    "fr": "fr_FR-siwis-medium",
    "hi": "hi_IN-swara-medium",
    "default": "en_US-lessac-medium"
}

def _encode_header(value: str) -> str:
    return base64.b64encode(value.encode("utf-8")).decode("ascii")

def _do_transcribe(file_path: str, src_lang: str = None) -> str:
    """Synchronous whisper transcription, to be run in threadpool."""
    if not whisper_model:
        return ""
    try:
        kwargs = {"beam_size": 1}
        # Whisper expects language code like 'en', 'es'. Pass only if we are fairly sure it's a 2-char code.
        if src_lang and len(src_lang) == 2:
            kwargs["language"] = src_lang
            
        segments, info = whisper_model.transcribe(file_path, **kwargs)
        logger.info(f"Whisper detected language: {info.language} with probability {info.language_probability}")
        return "".join([s.text for s in segments]).strip()
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return ""

def _do_tts(text: str, target_lang: str) -> bytes:
    """Synchronous TTS synthesis, to be run in threadpool."""
    voice = VOICES.get(target_lang[:2].lower(), VOICES["default"])
    try:
        cmd = ["piper", "--model", voice, "--output_raw"]
        process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        raw_audio, err = process.communicate(input=text.encode("utf-8"))
        if process.returncode == 0 and raw_audio:
            return raw_audio
        else:
            logger.error(f"Piper returned non-zero code or empty audio: {err.decode('utf-8')}")
    except FileNotFoundError:
        logger.warning("Piper executable not found in PATH.")
    except Exception as exc:
        logger.error(f"Piper synthesis failed: {exc}")
    return b""

async def translate_text_async(text: str, src_lang: str, tgt_lang: str) -> str:
    if not text.strip() or src_lang == tgt_lang:
        return text
    if not gemini_model:
        logger.warning("Cannot translate: No GEMINI model initialized.")
        return text

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
        translated = response.text.strip()
        return translated if translated else text
    except Exception as e:
        logger.error(f"Gemini translation failed: {e}")
        return text

class TranslateRequest(BaseModel):
    text: str
    sourceLang: str
    targetLang: str

class ChatRequest(BaseModel):
    question: str
    language: str
    context: str

@app.post("/chat")
async def handle_chat(req: ChatRequest):
    if not gemini_model:
        return {"answer": "AI Chat is disabled because GEMINI_API_KEY is not set."}
    
    try:
        prompt = f"""
You are an AI Meeting Assistant. You will be provided with the JSON summary of a meeting.
Based ONLY on this context, answer the user's question. 
If the answer is not in the context, say so politely.
Provide your final answer in the requested language: {req.language}.

Context:
{req.context}

User Question:
{req.question}
"""
        response = await run_in_threadpool(gemini_model.generate_content, prompt)
        return {"answer": response.text.strip()}
    except Exception as e:
        logger.error(f"Gemini chat failed: {e}")
        return {"answer": "Sorry, I encountered an error while processing your question."}

@app.post("/translate")
async def handle_translate(req: TranslateRequest):
    translated = await translate_text_async(req.text, req.sourceLang, req.targetLang)
    return {"translatedText": translated}

@app.post("/transcribe")
async def handle_transcribe(request: Request):
    audio_data = await request.body()
    if not whisper_model or not audio_data:
        return {"text": ""}
        
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_file:
        temp_path = temp_file.name
        temp_file.write(audio_data)
        
    try:
        text = await run_in_threadpool(_do_transcribe, temp_path)
        return {"text": text}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/process-audio")
async def process_audio(request: Request):
    audio_data = await request.body()
    src_lang = request.headers.get("X-Source-Lang", "en")
    tgt_lang = request.headers.get("X-Target-Lang", "en")

    if not whisper_model:
        return Response(content=b"", status_code=204)

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_file:
        temp_path = temp_file.name
        temp_file.write(audio_data)

    try:
        text = await run_in_threadpool(_do_transcribe, temp_path, src_lang)

        if not text:
            return Response(content=b"", status_code=204)

        translated_text = await translate_text_async(text, src_lang, tgt_lang)
        tts_audio = b""
        
        if translated_text:
            tts_audio = await run_in_threadpool(_do_tts, translated_text, tgt_lang)

        headers = {
            "X-Original-Text": _encode_header(text),
            "X-Translated-Text": _encode_header(translated_text),
            "X-Detected-Lang": src_lang,
            "X-Source-Lang": src_lang,
            "X-Target-Lang": tgt_lang,
            "X-Translation-Available": "true",
        }

        return Response(content=tts_audio, media_type="application/octet-stream", headers=headers)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.get("/health")
def health():
    import shutil
    piper_available = shutil.which("piper") is not None
    return {
        "status": "ok",
        "whisper": whisper_model is not None,
        "gemini": gemini_model is not None,
        "piper": piper_available
    }
