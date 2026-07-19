// src/utils/AudioMixer.js
export class AudioMixer {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.originalVolumeNode = this.audioContext.createGain();
    this.translatedVolumeNode = this.audioContext.createGain();
    
    this.originalVolumeNode.connect(this.audioContext.destination);
    this.translatedVolumeNode.connect(this.audioContext.destination);
    
    // Default mixes
    this.originalVolumeNode.gain.value = 1.0;
    this.translatedVolumeNode.gain.value = 1.0;
  }

  setOriginalVolume(volume) {
    this.originalVolumeNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
  }

  setTranslatedVolume(volume) {
    this.translatedVolumeNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
  }

  duckOriginal(duckVolume = 0.2) {
    this.originalVolumeNode.gain.setTargetAtTime(duckVolume, this.audioContext.currentTime, 0.2);
  }

  restoreOriginal(normalVolume = 1.0) {
    this.originalVolumeNode.gain.setTargetAtTime(normalVolume, this.audioContext.currentTime, 0.5);
  }
}
