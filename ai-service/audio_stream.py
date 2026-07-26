import logging
from fastapi import Response

logger = logging.getLogger(__name__)

class AudioStreamHandler:
    """
    Streaming audio helper module.
    """
    def process_stream(self, audio_data: bytes) -> Response:
        if not audio_data:
            return Response(content=b"", status_code=204)
        return Response(content=audio_data, media_type="audio/wav")

audio_stream_handler = AudioStreamHandler()
