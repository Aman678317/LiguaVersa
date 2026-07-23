FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download Piper voice models so live requests don't stall on network download
RUN python3 -m piper.download_voices en_US-lessac-medium && \
    python3 -m piper.download_voices es_ES-davefx-medium && \
    python3 -m piper.download_voices fr_FR-siwis-medium && \
    python3 -m piper.download_voices hi_IN-swara-medium

COPY . .

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
