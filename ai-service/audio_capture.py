import logging

logger = logging.getLogger(__name__)

class AudioCapture:
    """
    Captures raw input audio stream and formats for STT and translation engines.
    """
    def __init__(self, sample_rate: int = 16000, channels: int = 1):
        self.sample_rate = sample_rate
        self.channels = channels

    def capture_chunk(self, audio_data: bytes) -> dict:
        if not audio_data:
            return {"status": "empty", "bytes_count": 0}
        return {
            "status": "captured",
            "bytes_count": len(audio_data),
            "sample_rate": self.sample_rate,
            "channels": self.channels
        }

audio_capture_engine = AudioCapture()
