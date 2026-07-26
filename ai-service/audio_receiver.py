import logging

logger = logging.getLogger(__name__)

class AudioReceiver:
    """
    Receives and buffers incoming audio chunks from clients or WebSocket streams.
    """
    def __init__(self, max_buffer_bytes: int = 10 * 1024 * 1024):
        self.max_buffer_bytes = max_buffer_bytes

    def receive_chunk(self, raw_bytes: bytes) -> bytes:
        if not raw_bytes:
            return b""
        if len(raw_bytes) > self.max_buffer_bytes:
            logger.warning(f"Chunk size {len(raw_bytes)} exceeds max buffer limits.")
            return raw_bytes[:self.max_buffer_bytes]
        return raw_bytes

audio_receiver = AudioReceiver()
