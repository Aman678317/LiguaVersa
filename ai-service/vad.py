import logging

logger = logging.getLogger(__name__)

class VoiceActivityDetector:
    """
    Voice Activity Detection (VAD) module to filter out silence and background noise.
    """
    def __init__(self, min_energy_threshold: float = 0.001):
        self.min_energy_threshold = min_energy_threshold

    def is_speech(self, audio_bytes: bytes) -> bool:
        if not audio_bytes or len(audio_bytes) < 100:
            return False
        # Calculate simple RMS / byte amplitude proxy for WebM/WAV chunks
        try:
            # Simple check: non-zero byte variance
            total_sum = sum(audio_bytes)
            avg = total_sum / len(audio_bytes)
            variance = sum((b - avg) ** 2 for b in audio_bytes[:1000]) / min(len(audio_bytes), 1000)
            return variance > 10.0
        except Exception as e:
            logger.debug(f"VAD check warning: {e}")
            return True

vad_detector = VoiceActivityDetector()
