import os
import io
import subprocess
from fastapi import FastAPI, Request, Response
from faster_whisper import WhisperModel

app = FastAPI()

# Configuration
HF_TOKEN = os.getenv("HUGGINGFACE_API_KEY")

# Initialize faster-whisper
print("Loading faster-whisper model...")
try:
    whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
    print("Model loaded.")
except Exception as e:
    print(f"Failed to load whisper: {e}")
    whisper_model = None

def translate_text(text: str, src_lang: str = "eng_Latn", tgt_lang: str = "fra_Latn") -> str:
    # This could integrate with NLLB or SeamlessM4T locally.
    # For now, placeholder or basic fallback:
    return f"[Translated] {text}"

def tts_piper(text: str) -> bytes:
    try:
        # Example of piper CLI usage if installed:
        cmd = ['piper', '--model', 'en_US-lessac-medium', '--output_raw']
        process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        raw_audio, _ = process.communicate(input=text.encode('utf-8'))
        return raw_audio
    except FileNotFoundError:
        print("Piper not found. Skipping TTS.")
        return b''

@app.post("/process-audio")
async def process_audio(request: Request):
    audio_data = await request.body()
    src_lang = request.headers.get('X-Source-Lang', 'en')
    tgt_lang = request.headers.get('X-Target-Lang', 'es')
    
    if not whisper_model:
        return Response(content=b'', status_code=204)

    # Save buffer to temp file
    temp_path = "temp_chunk.webm"
    with open(temp_path, "wb") as f:
        f.write(audio_data)
        
    try:
        # STT
        segments, _ = whisper_model.transcribe(temp_path, beam_size=1)
        text = "".join([s.text for s in segments]).strip()
        
        if not text:
            return Response(content=b'', status_code=204)
            
        # Translation
        translated_text = translate_text(text, src_lang, tgt_lang)
        
        # TTS
        tts_audio = tts_piper(translated_text)
        
        headers = {
            "X-Translated-Text": translated_text.encode('utf-8').decode('latin-1') # Ensure header encoding
        }
        
        return Response(content=tts_audio, media_type="application/octet-stream", headers=headers)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.get("/health")
def health():
    return {"status": "ok"}
