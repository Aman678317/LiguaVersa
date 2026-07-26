import time
import logging

logger = logging.getLogger(__name__)

class PipelineMetrics:
    """
    Tracks and records latencies across STT, Translation, TTS, and total streaming.
    Target: STT <300ms, Translation <150ms, TTS <250ms, Streaming <100ms (Total <800ms)
    """
    def __init__(self):
        self.reset()

    def reset(self):
        self.start_time = time.time()
        self.stt_time_ms = 0
        self.translation_time_ms = 0
        self.tts_time_ms = 0
        self.tts_engine = "none"
        self.total_time_ms = 0

    def record_stt(self, duration_ms: float):
        self.stt_time_ms = round(duration_ms, 2)

    def record_translation(self, duration_ms: float):
        self.translation_time_ms = round(duration_ms, 2)

    def record_tts(self, duration_ms: float, engine_name: str = "none"):
        self.tts_time_ms = round(duration_ms, 2)
        self.tts_engine = engine_name

    def finalize(self) -> dict:
        self.total_time_ms = round((time.time() - self.start_time) * 1000, 2)
        metrics_data = {
            "stt_time_ms": self.stt_time_ms,
            "translation_time_ms": self.translation_time_ms,
            "tts_time_ms": self.tts_time_ms,
            "tts_engine": self.tts_engine,
            "total_latency_ms": self.total_time_ms,
            "meets_target": self.total_time_ms <= 800.0
        }
        logger.info(f"Pipeline Metrics: STT={self.stt_time_ms}ms, Trans={self.translation_time_ms}ms, TTS={self.tts_time_ms}ms (Engine={self.tts_engine}) | Total={self.total_time_ms}ms (Target <=800ms: {metrics_data['meets_target']})")
        return metrics_data
