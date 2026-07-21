from main import detect_language, normalize_language_code, translate_text


def test_detect_language_detects_hindi():
    assert detect_language("नमस्ते, कैसे हैं आप?") == "hi"


def test_detect_language_detects_english():
    assert detect_language("Hello there, how are you?") == "en"


def test_normalize_language_code_maps_common_names():
    assert normalize_language_code("Hindi") == "hi"
    assert normalize_language_code("English") == "en"


def test_translate_text_has_fallback_for_hindi_english():
    translated = translate_text("Hello", "en", "hi")
    assert translated
    assert "नमस्ते" in translated or "Hello" in translated
