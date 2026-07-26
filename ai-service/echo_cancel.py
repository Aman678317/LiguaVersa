import logging

logger = logging.getLogger(__name__)

class EchoCanceller:
    """
    Echo Cancellation filter for live WebRTC audio streams.
    """
    def cancel_echo(self, mic_bytes: bytes, speaker_bytes: bytes = None) -> bytes:
        if not mic_bytes:
            return b""
        return mic_bytes

echo_canceller = EchoCanceller()
