import os
import subprocess
import tempfile
import base64
from fastapi import FastAPI, Request, Response
from pydantic import BaseModel

import google.generativeai as genai

try:
    from faster_whisper import WhisperModel
except Exception:
    WhisperModel = None

app = FastAPI()

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Initialize faster-whisper
print("Loading faster-whisper model...")
try:
    whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8") if WhisperModel else None
    print("Model loaded." if whisper_model else "faster-whisper unavailable.")
except Exception as e:
    print(f"Failed to load whisper: {e}")
    whisper_model = None

def _encode_header(value: str) -> str:
    return base64.b64encode(value.encode("utf-8")).decode("ascii")

def translate_text(text: str, src_lang: str, tgt_lang: str) -> str:
    if not text.strip() or src_lang == tgt_lang:
        return text
    if not GEMINI_API_KEY:
        print("Warning: No GEMINI_API_KEY provided.")
        return text

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"Translate the following text from {src_lang} to {tgt_lang}. Only provide the translation, no extra text:\n\n{text}"
        response = model.generate_content(prompt)
        translated = response.text.strip()
        return translated if translated else text
    except Exception as e:
        print(f"Gemini translation failed: {e}")
        return text

def tts_piper(text: str, target_lang: str = "en") -> bytes:
    # A simplified single voice or mapping could go here. We'll use a generic fallback.
    voice = "en_US-lessac-medium" 
    try:
        cmd = ["piper", "--model", voice, "--output_raw"]
        process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        raw_audio, err = process.communicate(input=text.encode("utf-8"))
        if process.returncode == 0 and raw_audio:
            return raw_audio
    except FileNotFoundError:
        pass
    except Exception as exc:
        print(f"Piper synthesis failed: {exc}")
    return b""

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
        return {"answer": "AI Chat is disabled because GEMINI_API_KEY is not set."}
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
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
        response = model.generate_content(prompt)
        return {"answer": response.text.strip()}
    except Exception as e:
        print(f"Gemini chat failed: {e}")
        return {"answer": "Sorry, I encountered an error while processing your question."}

@app.post("/translate")
async def handle_translate(req: TranslateRequest):
    translated = translate_text(req.text, req.sourceLang, req.targetLang)
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
        segments, _ = whisper_model.transcribe(temp_path, beam_size=1)
        text = "".join([s.text for s in segments]).strip()
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
        segments, _ = whisper_model.transcribe(temp_path, beam_size=1)
        text = "".join([s.text for s in segments]).strip()

        if not text:
            return Response(content=b"", status_code=204)

        translated_text = translate_text(text, src_lang, tgt_lang)
        tts_audio = b""
        
        # Only generate TTS if translation was attempted and didn't fail badly
        if translated_text:
            tts_audio = tts_piper(translated_text, tgt_lang)

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
    return {"status": "ok"}
