import { BACKEND_URL } from '../config';

export class RecordingManager {
  constructor(meetingId, token) {
    this.meetingId = meetingId;
    this.token = token;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
  }

  async startRecording(stream) {
    if (!stream) {
      console.error("No stream provided for recording");
      return;
    }

    try {
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9,opus' });
    } catch (e) {
      this.mediaRecorder = new MediaRecorder(stream); // Fallback
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
        this.uploadChunk(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.finalizeRecording();
    };

    // Record in 10 second chunks
    this.mediaRecorder.start(10000);
    this.isRecording = true;
    console.log("Started recording");
  }

  pauseRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isRecording = false;
    }
  }

  resumeRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.isRecording = true;
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  async uploadChunk(blob) {
    const formData = new FormData();
    formData.append('chunk', blob, `chunk-${Date.now()}.webm`);
    formData.append('meetingId', this.meetingId);

    try {
      await fetch(`${BACKEND_URL}/recordings/upload-chunk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      });
    } catch (error) {
      console.error("Failed to upload recording chunk:", error);
    }
  }

  async finalizeRecording() {
    try {
      await fetch(`${BACKEND_URL}/recordings/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ meetingId: this.meetingId })
      });
      console.log("Recording finalized successfully");
    } catch (error) {
      console.error("Failed to finalize recording:", error);
    }
  }
}
