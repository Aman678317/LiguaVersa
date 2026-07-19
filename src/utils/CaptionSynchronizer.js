// src/utils/CaptionSynchronizer.js
export class CaptionSynchronizer {
  constructor(onDisplayCaption) {
    this.buffer = new Map(); // sequenceId -> captionPayload
    this.onDisplayCaption = onDisplayCaption;
  }

  // Called when WebSocket receives a caption:final event
  queueCaption(sequenceId, payload) {
    this.buffer.set(sequenceId, payload);
  }

  // Called from AudioContext when TTS buffer starts playing
  syncAndDisplay(sequenceId) {
    const payload = this.buffer.get(sequenceId);
    if (payload) {
      this.onDisplayCaption(payload);
      // Clean up old ones to prevent memory leak
      for (let [key, val] of this.buffer.entries()) {
        if (key <= sequenceId) {
          this.buffer.delete(key);
        }
      }
    }
  }

  // If TTS fails, we might just display immediately
  forceDisplay(payload) {
    this.onDisplayCaption(payload);
  }
}
