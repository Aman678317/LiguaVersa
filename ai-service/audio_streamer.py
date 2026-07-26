import logging
from fastapi import Response

logger = logging.getLogger(__name__)

class AudioStreamer:
    """
    Formats audio data into HTTP audio streams.
    """
    def format_audio_response(self, audio_bytes: bytes, headers: dict, status_code: int = None) -> Response:
        if not audio_bytes:
            code = status_code if status_code is not None else 204
            return Response(content=b"", status_code=code, headers=headers)
        code = status_code if status_code is not None else 200
        return Response(content=audio_bytes, media_type="application/octet-stream", status_code=code, headers=headers)

audio_streamer = AudioStreamer()
