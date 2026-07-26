import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_tts")

from tts_engines import synthesize_speech_sync, EDGE_VOICES, PIPER_VOICES

def run_tests():
    test_cases = [
        ("Hello, nice to meet you!", "ja-JP", "Japanese (Non-Piper)"),
        ("Hello, nice to meet you!", "ko-KR", "Korean (Non-Piper)"),
        ("Hello, nice to meet you!", "ar-SA", "Arabic (Non-Piper)"),
        ("Hello, nice to meet you!", "hi-IN", "Hindi (Piper / EdgeTTS)"),
        ("Hello, nice to meet you!", "es-ES", "Spanish (Piper / EdgeTTS)"),
    ]

    print("=== STARTING TTS ENGINE MULTI-LANGUAGE TESTS ===")
    results = []

    for text, lang, label in test_cases:
        print(f"\nTesting {label} [{lang}]...")
        audio_bytes, engine_used, err = synthesize_speech_sync(text, lang)
        byte_len = len(audio_bytes)
        print(f"Result: Engine='{engine_used}', Audio Bytes={byte_len}, Error='{err}'")
        
        status = "PASSED" if byte_len > 0 else "FAILED"
        results.append((label, lang, engine_used, byte_len, status))

    # Test empty text / failure signaling
    print("\nTesting empty text (Failure Signaling check)...")
    empty_bytes, empty_engine, empty_err = synthesize_speech_sync("", "ja-JP")
    empty_status = "PASSED" if len(empty_bytes) == 0 else "FAILED"
    print(f"Result: Engine='{empty_engine}', Audio Bytes={len(empty_bytes)}, Error='{empty_err}', Status={empty_status}")

    print("\n=== SUMMARY ===")
    for label, lang, engine, b_len, st in results:
        print(f"- {label} [{lang}]: {st} | Engine: {engine} | Size: {b_len} bytes")
    print(f"- Empty Text Case: {empty_status}")

if __name__ == "__main__":
    run_tests()
