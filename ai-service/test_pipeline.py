import sys
import logging
from tts_engines import synthesize_speech_sync

logging.basicConfig(level=logging.INFO)

def test_tts_engines():
    print("--- Testing Japanese TTS ('ja-JP') ---")
    ja_audio, ja_engine, ja_err = synthesize_speech_sync("こんにちは世界、リアルタイム翻訳テストです。", "ja-JP")
    print(f"Japanese TTS Engine Used: {ja_engine}")
    print(f"Japanese Audio Bytes Generated: {len(ja_audio)} bytes")
    print(f"Error (if any): {ja_err}")
    assert len(ja_audio) > 0, "Japanese audio synthesis failed!"

    print("\n--- Testing Hindi TTS ('hi-IN') ---")
    hi_audio, hi_engine, hi_err = synthesize_speech_sync("नमस्ते दुनिया, आपका स्वागत है।", "hi-IN")
    print(f"Hindi TTS Engine Used: {hi_engine}")
    print(f"Hindi Audio Bytes Generated: {len(hi_audio)} bytes")
    print(f"Error (if any): {hi_err}")
    assert len(hi_audio) > 0, "Hindi audio synthesis failed!"

    print("\n--- Testing English TTS ('en-US') ---")
    en_audio, en_engine, en_err = synthesize_speech_sync("Hello world, live call translation test.", "en-US")
    print(f"English TTS Engine Used: {en_engine}")
    print(f"English Audio Bytes Generated: {len(en_audio)} bytes")
    print(f"Error (if any): {en_err}")
    assert len(en_audio) > 0, "English audio synthesis failed!"

    print("\n[SUCCESS] All TTS tests passed successfully!")

if __name__ == "__main__":
    test_tts_engines()
