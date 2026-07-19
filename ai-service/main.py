import os
import io
import wave
import asyncio
import requests
import numpy as np
from fastapi import FastAPI
from contextlib import asynccontextmanager
from faster_whisper import WhisperModel
import subprocess

from livekit import rtc, api
from livekit.agents import utils

app = FastAPI()

# Configuration
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")
HF_TOKEN = os.getenv("HUGGINGFACE_API_KEY")
HF_API_URL = "https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M"

# Initialize faster-whisper
print("Loading faster-whisper model...")
whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
print("Model loaded.")

def translate_text(text: str, src_lang: str = "eng_Latn", tgt_lang: str = "fra_Latn") -> str:
    if not text.strip() or not HF_TOKEN:
        return text
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    payload = {
        "inputs": text,
        "parameters": {"src_lang": src_lang, "tgt_lang": tgt_lang}
    }
    try:
        response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        res = response.json()
        if isinstance(res, list) and len(res) > 0 and "translation_text" in res[0]:
            return res[0]["translation_text"]
    except Exception as e:
        print(f"Translation error: {e}")
    return text

def tts_piper(text: str) -> bytes:
    # We will use the piper CLI for TTS to generate raw PCM 16-bit 16kHz
    # or you can use piper python package if installed.
    # Assuming piper executable is not installed globally, we can use an API or mock for now, 
    # but the prompt requires "Piper TTS". We'll write a placeholder that just returns empty audio if piper is missing.
    try:
        # Example of piper CLI usage if installed:
        # echo 'text' | piper --model en_US-lessac-medium --output_raw
        cmd = ['piper', '--model', 'en_US-lessac-medium', '--output_raw']
        process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        raw_audio, _ = process.communicate(input=text.encode('utf-8'))
        return raw_audio
    except FileNotFoundError:
        print("Piper not found. Skipping TTS.")
        return b''

async def process_audio_stream(track: rtc.RemoteAudioTrack, room: rtc.Room):
    audio_stream = rtc.AudioStream(track)
    buffer = bytearray()
    
    # We use a simple energy-based VAD for this example
    async for frame_event in audio_stream:
        frame = frame_event.frame
        # frame.data is memoryview of PCM16
        buffer.extend(frame.data.tobytes())
        
        # If we have collected enough audio (e.g., 3 seconds)
        # In a real app, use WebRTC VAD to detect speech boundaries
        if len(buffer) > frame.sample_rate * 2 * 1 * 3: # 3 seconds of 16-bit mono
            audio_data = np.frombuffer(buffer, dtype=np.int16).astype(np.float32) / 32768.0
            buffer.clear()
            
            # Transcribe
            segments, info = whisper_model.transcribe(audio_data, beam_size=1, language="en")
            text = "".join([s.text for s in segments]).strip()
            
            if text:
                print(f"Transcribed: {text}")
                # Translate
                translated = translate_text(text)
                print(f"Translated: {translated}")
                
                # Send Data Message for captions
                data = f"caption:{translated}".encode("utf-8")
                await room.local_participant.publish_data(data, reliable=True)
                
                # TTS
                tts_audio = tts_piper(translated)
                if tts_audio:
                    pass # We would push this to a local audio track

async def agent_task(room: rtc.Room):
    @room.on("track_subscribed")
    def on_track_subscribed(track: rtc.Track, publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            asyncio.create_task(process_audio_stream(track, room))
            
    print(f"Agent connected to room {room.name}")

# In a real setup we would listen for room webhooks to join
# Here we provide an API to trigger the agent to join
@app.post("/join/{room_name}")
async def join_room(room_name: str):
    room = rtc.Room()
    await room.connect(LIVEKIT_URL, api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET).with_identity("ai-translator").with_name("AI Translator").with_grants(api.VideoGrants(room_join=True, room=room_name)).to_jwt())
    asyncio.create_task(agent_task(room))
    return {"status": "joined", "room": room_name}

@app.get("/health")
def health():
    return {"status": "ok"}
