# transcribe.py

import sys
import json
import os
from faster_whisper import WhisperModel

# UTF-8 encoding (Windows için önemli)
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

print("Python code running...", file=sys.stderr)


def send_error(message: str):
    error = {"status": "error", "message": message}
    print(json.dumps(error, ensure_ascii=False))
    sys.exit(1)


try:
    # 1. Ses dosyası yolu alınmazsa hata ver
    if len(sys.argv) < 2:
        send_error("Ses dosyası yolu eksik. Kullanım: python transcribe.py <dosya.mp3>")

    audio_path = sys.argv[1].strip('"\'')  # tırnak temizleme
    print(f"[PY] Dosya alındı: {audio_path}", file=sys.stderr)

    if not os.path.exists(audio_path):
        send_error(f"Dosya bulunamadı: {audio_path}")

    if not audio_path.lower().endswith(('.mp3', '.wav', '.m4a', '.flac', '.ogg')):
        send_error("Desteklenmeyen dosya formatı. MP3, WAV, M4A, FLAC, OGG kullanın.")

    # 2. Whisper modelini yükle
    print("[PY] Model yükleniyor (small)...", file=sys.stderr)
    model = WhisperModel(
        "small",
        device="cuda",          # GPU varsa en hızlı
        compute_type="float32", # gerekirse int8 yapabilirsin
        download_root="./models"
    )

    print("[PY] Transkripsiyon başlatılıyor...", file=sys.stderr)
    
    # 3. Ses çözümleme işlemi
    segments, info = model.transcribe(
        audio_path,
        language="tr",
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500)
    )

    # 4. Metin birleştir
    full_text = " ".join(
        [segment.text.strip() for segment in segments if segment.text.strip()]
    )

    print(f"[PY] Transkripsiyon tamamlandı. Karakter: {len(full_text)}", file=sys.stderr)

    # 5. JSON çıktısı üret
    result = {
        "status": "success",
        "language": info.language,
        "confidence": round(info.language_probability, 4),
        "duration_seconds": round(info.duration, 2),
        "text": full_text,
        "segments": [
            {
                "start": round(s.start, 2),
                "end": round(s.end, 2),
                "text": s.text.strip()
            }
            for s in segments if s.text.strip()
        ]
    }

    print(json.dumps(result, ensure_ascii=False))

except Exception as e:
    send_error(f"Beklenmeyen hata: {str(e)}")
