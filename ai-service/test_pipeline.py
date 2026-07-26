import sys
import logging
from tts_engines import synthesize_speech_sync

logging.basicConfig(level=logging.INFO)

def test_tts_engines():
    test_languages = [
        ("ja-JP", "こんにちは世界、リアルタイム翻訳テストです。", "Japanese (Edge-TTS)"),
        ("ko-KR", "안녕하세요, 실시간 번역 테스트입니다.", "Korean (Edge-TTS)"),
        ("ar-SA", "مرحبا بكم في اختبار الترجمة المباشرة.", "Arabic (Edge-TTS)"),
        ("hi-IN", "नमस्ते दुनिया, आपका स्वागत है।", "Hindi (Piper / Edge-TTS)"),
        ("es-ES", "Hola mundo, prueba de traducción en vivo.", "Spanish (Piper / Edge-TTS)"),
    ]

    print("=== STARTING MULTI-LANGUAGE TTS SUITE ===")
    for lang_code, text, label in test_languages:
        print(f"\n--- Testing {label} ('{lang_code}') ---")
        audio, engine, err = synthesize_speech_sync(text, lang_code)
        print(f"Engine Used: {engine}")
        print(f"Audio Bytes Output: {len(audio)} bytes")
        print(f"Error (if any): {err}")
        assert len(audio) > 0, f"Audio synthesis failed for {lang_code}!"

    print("\n--- Testing Failure Signaling for Empty Text ---")
    empty_audio, empty_engine, empty_err = synthesize_speech_sync("", "ja-JP")
    print(f"Empty Audio Output: {len(empty_audio)} bytes (Expected: 0)")
    assert len(empty_audio) == 0, "Empty text should return 0 bytes!"

    print("\n[SUCCESS] All multi-language TTS engine tests passed successfully!")

if __name__ == "__main__":
    test_tts_engines()
