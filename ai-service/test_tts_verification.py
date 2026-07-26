import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_tts")

from tts_engines import synthesize_speech_sync, EDGE_VOICES, PIPER_VOICES

def run_tests():
    test_cases = [
        ("Hello, nice to meet you!", "en-US", "Supported Piper / Fallback Language (English)"),
        ("Hello, nice to meet you!", "ja-JP", "Unsupported Piper / Edge-TTS Fallback (Japanese)"),
        ("Hello, nice to meet you!", "ko-KR", "Unsupported Piper / Edge-TTS Fallback (Korean)"),
        ("Hello, nice to meet you!", "ar-SA", "Unsupported Piper / Edge-TTS Fallback (Arabic)"),
        ("Hello, nice to meet you!", "es-ES", "Spanish Language Test"),
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

    # Test invalid language code
    print("\nTesting invalid language code (Invalid Lang check)...")
    inv_bytes, inv_engine, inv_err = synthesize_speech_sync("Hello", "invalid_lang_xyz")
    inv_status = "PASSED" if (len(inv_bytes) == 0 and inv_engine == "failed") else "FAILED"
    print(f"Result: Engine='{inv_engine}', Audio Bytes={len(inv_bytes)}, Error='{inv_err}', Status={inv_status}")

    print("\n=== SUMMARY ===")
    for label, lang, engine, b_len, st in results:
        print(f"- {label} [{lang}]: {st} | Engine: {engine} | Size: {b_len} bytes")
    print(f"- Empty Text Case: {empty_status}")
    print(f"- Invalid Language Code Case: {inv_status}")

    assert all(r[4] == "PASSED" for r in results) and empty_status == "PASSED" and inv_status == "PASSED", "TTS verification tests failed!"

if __name__ == "__main__":
    run_tests()

