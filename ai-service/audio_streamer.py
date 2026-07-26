import logging
from fastapi import Response

logger = logging.getLogger(__name__)

class AudioStreamer:
    """
    Formats audio data into HTTP audio streams.
    """
    def format_audio_response(self, audio_bytes: bytes, headers: dict) -> Response:
        if not audio_bytes:
            return Response(content=b"", status_code=204, headers=headers)
        return Response(content=audio_bytes, media_type="application/octet-stream", headers=headers)

audio_streamer = AudioStreamer()
