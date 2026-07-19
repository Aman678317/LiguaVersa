export class AudioStreamBuilder {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.destination = this.audioContext.createMediaStreamDestination();
    this.nextPlayTime = 0;
  }

  getStream() {
    return this.destination.stream;
  }

  async addAudioChunk(arrayBuffer) {
    if (!arrayBuffer || arrayBuffer.byteLength === 0) return;

    try {
      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.destination);

      const currentTime = this.audioContext.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime + 0.1; // Small buffer for smoothness
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      
      return audioBuffer.duration;
    } catch (e) {
      console.error("AudioStreamBuilder decoding error:", e);
      return 0;
    }
  }
}
