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

from tts_engines import synthesize_speech_sync

def _encode_header(value: str) -> str:
    return base64.b64encode(value.encode("utf-8")).decode("ascii")

def _do_transcribe(file_path: str, src_lang: str = None) -> str:
    """Synchronous whisper transcription, to be run in threadpool."""
    if not whisper_model:
        return ""
    try:
        kwargs = {"beam_size": 1}
        # Derive 2-letter ISO code from BCP-47 identifiers (e.g. ja-JP -> ja, hi-IN -> hi)
        if src_lang:
            iso_lang = src_lang.split("-")[0].lower()
            kwargs["language"] = iso_lang
            
        segments, info = whisper_model.transcribe(file_path, **kwargs)
        logger.info(f"Whisper detected language: {info.language} with probability {info.language_probability}")
        return "".join([s.text for s in segments]).strip()
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return ""

async def translate_text_async(text: str, src_lang: str, tgt_lang: str) -> tuple[str, str]:
    """
    Translates text using Gemini.
    Returns: (translated_text, status) where status is 'ok', 'degraded', or 'failed'
    """
    if not text.strip():
        return text, "ok"
        
    src_iso = src_lang.split("-")[0].lower() if src_lang else ""
    tgt_iso = tgt_lang.split("-")[0].lower() if tgt_lang else ""
    
    if src_iso == tgt_iso or src_lang == tgt_lang:
        return text, "ok"

    if not gemini_model:
        logger.warning("Cannot translate: GEMINI_API_KEY is not set.")
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
        else:
            return text, "degraded"
    except Exception as e:
        logger.error(f"Gemini translation failed: {e}")
        return text, "degraded"

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
    if not GEMINI_API_KEY:
        return {"answer": "Hello! I am your AI Meeting Assistant. GEMINI_API_KEY is not set on the server."}
    
    prompt = f"""
You are LinguaVerse AI, a helpful, intelligent, friendly AI Assistant inside a live video meeting.
Answer the user's question clearly, thoroughly, and nicely in {req.language}.
If the user asks about the meeting, use the provided meeting context.
If the user is greeting you or asking a general question, answer warmly and helpfully.

Meeting Context:
{req.context}

User Question:
{req.question}
"""
    models_to_try = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro"]
    for model_name in models_to_try:
        try:
            m = genai.GenerativeModel(model_name)
            response = await run_in_threadpool(m.generate_content, prompt)
            if response and response.text:
                return {"answer": response.text.strip()}
        except Exception as e:
            logger.warning(f"Gemini model {model_name} failed: {e}")
            
    return {"answer": "Hello! I'm your AI Meeting Assistant. I'm here to help you with meeting summaries, translations, and questions!"}


@app.post("/translate")
async def handle_translate(req: TranslateRequest):
    translated, status = await translate_text_async(req.text, req.sourceLang, req.targetLang)
    return {"translatedText": translated, "status": status}

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
    src_lang = request.headers.get("X-Source-Lang", "en-US")
    tgt_lang = request.headers.get("X-Target-Lang", "en-US")

    if not whisper_model:
        headers = {"X-Translation-Status": "failed", "X-Translation-Error": _encode_header("Whisper model unavailable")}
        return Response(content=b"", status_code=204, headers=headers)

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_file:
        temp_path = temp_file.name
        temp_file.write(audio_data)

    try:
        text = await run_in_threadpool(_do_transcribe, temp_path, src_lang)

        if not text:
            headers = {"X-Translation-Status": "ok", "X-Translation-Note": _encode_header("No speech detected")}
            return Response(content=b"", status_code=204, headers=headers)

        translated_text, trans_status = await translate_text_async(text, src_lang, tgt_lang)
        tts_audio = b""
        tts_engine = "none"
        tts_error = ""

        if translated_text:
            tts_audio, tts_engine, tts_error = await run_in_threadpool(synthesize_speech_sync, translated_text, tgt_lang)

        if tts_error or tts_engine == "failed":
            trans_status = "degraded"

        headers = {
            "X-Original-Text": _encode_header(text),
            "X-Translated-Text": _encode_header(translated_text),
            "X-Detected-Lang": src_lang,
            "X-Source-Lang": src_lang,
            "X-Target-Lang": tgt_lang,
            "X-Translation-Status": trans_status,
            "X-TTS-Engine": tts_engine,
            "X-Translation-Available": "true",
        }
        if tts_error:
            headers["X-TTS-Error"] = _encode_header(tts_error)

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
        "piper": piper_available,
        "edge_tts": True
    }

