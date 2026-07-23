// src/utils/VAD.js
export class VAD {
  constructor(audioContext, stream, options = {}) {
    this.audioContext = audioContext;
    this.stream = stream;
    this.options = {
      fftSize: 512,
      minDecibels: -80,
      maxDecibels: -10,
      smoothingTimeConstant: 0.1,
      threshold: 0.01, // Sensitive volume threshold for speech detection
      ...options
    };

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.options.fftSize;
    this.analyser.minDecibels = this.options.minDecibels;
    this.analyser.maxDecibels = this.options.maxDecibels;
    this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant;

    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.source.connect(this.analyser);

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  isSpeaking() {
    this.analyser.getByteFrequencyData(this.dataArray);
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const average = sum / this.dataArray.length;
    const volume = average / 255;
    return volume > this.options.threshold;
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
    }
  }
}
