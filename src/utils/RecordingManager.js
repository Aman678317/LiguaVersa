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

    this.recordedChunks = [];

    // Supported mimeTypes for video recording
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];

    let selectedMimeType = '';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }

    try {
      this.mediaRecorder = selectedMimeType 
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);
    } catch (e) {
      console.warn("Falling back to default MediaRecorder options:", e);
      this.mediaRecorder = new MediaRecorder(stream);
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

    // Collect data in 1 second chunks for smooth recording
    this.mediaRecorder.start(1000);
    this.isRecording = true;
    console.log("Started recording meeting video & audio");
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

  downloadVideo() {
    if (!this.recordedChunks || this.recordedChunks.length === 0) {
      console.warn("No recorded video chunks available for download");
      return false;
    }

    try {
      const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
      const blob = new Blob(this.recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `LinguaVerse-Meeting-${this.meetingId}-${timestamp}.${extension}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);
      console.log("Downloaded meeting recording video successfully!");
      return true;
    } catch (e) {
      console.error("Error triggering video download:", e);
      return false;
    }
  }

  async uploadChunk(blob) {
    if (!this.token) return;
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
      console.warn("Failed to upload recording chunk to server:", error);
    }
  }

  async finalizeRecording() {
    if (!this.token) return;
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
      console.warn("Failed to finalize recording on server:", error);
    }
  }
}
