import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TranslationService } from './translation.service';
import { SpeechService } from './speech.service';
import { TtsService } from './tts.service';
import { ChatService } from '../chat/chat.service';
import { CaptionService } from './caption.service';
import { AnalyticsService } from '../analytics/analytics.service';
import * as os from 'os';

@WebSocketGateway({ cors: { origin: '*' }, maxHttpBufferSize: 1e8 })
export class MeetingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private translationService: TranslationService,
    private speechService: SpeechService,
    private ttsService: TtsService,
    private chatService: ChatService,
    private captionService: CaptionService,
    private analyticsService: AnalyticsService,
  ) {
    setInterval(() => this.broadcastSystemHealth(), 5000);
  }

  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private socketSettings = new Map<string, any>(); // socketId -> settings object
  private meetingStartTimes = new Map<string, number>(); // roomId -> startTime
  // Active translation sessions (mocking a pipeline manager)
  private activeStreams = new Map<string, { buffer: Buffer[], timer: NodeJS.Timeout | null }>(); 

  private async broadcastSystemHealth() {
    if (!this.server) return;
    const cpuUsage = os.loadavg()[0]; // 1 minute load average
    const memoryUsage = (os.totalmem() - os.freemem()) / os.totalmem() * 100;
    
    const health = {
      cpuUsage,
      memoryUsage,
      activeSockets: this.server.engine.clientsCount,
      dbHealth: 'ok',
      apiHealth: 'ok'
    };

    // Log to DB via AnalyticsService
    await this.analyticsService.logSystemHealth(health);

    // Broadcast to admins (or all for now)
    this.server.emit('server:health', health);
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      this.server.emit('user-online', { userId });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.server.emit('user-offline', { userId });
    }
    this.socketSettings.delete(client.id);
    this.activeStreams.delete(client.id);
  }

  @SubscribeMessage('get-online-users')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    client.emit('online-users-list', Array.from(this.connectedUsers.keys()));
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.roomId);
    client.to(data.roomId).emit('user-joined', { userId: client.id });
    
    if (!this.meetingStartTimes.has(data.roomId)) {
      this.meetingStartTimes.set(data.roomId, Date.now());
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.leave(data.roomId);
    client.to(data.roomId).emit('user-left', { userId: client.id });

    const sockets = await this.server.in(data.roomId).fetchSockets();
    if (sockets.length === 0) {
      const startTime = this.meetingStartTimes.get(data.roomId);
      if (startTime) {
        const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
        await this.analyticsService.logMeeting({
          meetingId: data.roomId,
          durationSeconds,
          participants: 2, // approximation
          translationsMade: 0,
          captionsMade: 0
        });
        this.meetingStartTimes.delete(data.roomId);
      }
    }
  }

  @SubscribeMessage('offer')
  handleOffer(@MessageBody() data: { offer: any, targetUserId: string, callerId: string, roomId: string }, @ConnectedSocket() client: Socket) {
    client.to(data.targetUserId).emit('offer', { offer: data.offer, callerId: data.callerId });
  }

  @SubscribeMessage('answer')
  handleAnswer(@MessageBody() data: { answer: any, targetUserId: string, callerId: string, roomId: string }, @ConnectedSocket() client: Socket) {
    client.to(data.targetUserId).emit('answer', { answer: data.answer, callerId: data.callerId });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(@MessageBody() data: { candidate: any, targetUserId: string, callerId: string, roomId: string }, @ConnectedSocket() client: Socket) {
    client.to(data.targetUserId).emit('ice-candidate', { candidate: data.candidate, callerId: data.callerId });
  }

  @SubscribeMessage('set-language')
  handleSetLanguage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    this.socketSettings.set(client.id, { ...(this.socketSettings.get(client.id) || {}), ...data });
  }

  // --- Live Settings Sync Events ---

  @SubscribeMessage('settings:update')
  handleSettingsUpdate(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    this.socketSettings.set(client.id, { ...(this.socketSettings.get(client.id) || {}), ...data });
    // Broadcast preferences:sync to all sockets belonging to this userId
    const userId = client.handshake.query.userId as string;
    if (userId) {
      // For simplicity, we just send to the sender for immediate local apply
      client.emit('preferences:sync', data);
    }
  }

  @SubscribeMessage('language:change')
  handleLanguageChange(@MessageBody() data: { lang: string }, @ConnectedSocket() client: Socket) {
    const current = this.socketSettings.get(client.id) || {};
    this.socketSettings.set(client.id, { ...current, lang: data.lang, translationLanguage: data.lang });
    client.emit('preferences:sync', { speechLanguage: data.lang });
  }

  @SubscribeMessage('translation:toggle')
  handleTranslationToggle(@MessageBody() data: { enabled: boolean }, @ConnectedSocket() client: Socket) {
    const current = this.socketSettings.get(client.id) || {};
    this.socketSettings.set(client.id, { ...current, translationEnabled: data.enabled });
  }

  @SubscribeMessage('caption:toggle')
  handleCaptionToggle(@MessageBody() data: { enabled: boolean }, @ConnectedSocket() client: Socket) {
    const current = this.socketSettings.get(client.id) || {};
    this.socketSettings.set(client.id, { ...current, dualCaptionMode: data.enabled });
    client.emit('preferences:sync', { dualCaptionMode: data.enabled });
  }

  @SubscribeMessage('voice:update')
  handleVoiceUpdate(@MessageBody() data: { targetVoice: string }, @ConnectedSocket() client: Socket) {
    const current = this.socketSettings.get(client.id) || {};
    this.socketSettings.set(client.id, { ...current, translationVoice: data.targetVoice });
  }

  // --- Enterprise Multilingual Chat ---
  
  @SubscribeMessage('chat-message')
  async handleChatMessage(@MessageBody() data: { message: string, sender: string, senderUserId: string, roomId: string, sourceLang: string }, @ConnectedSocket() client: Socket) {
    // 1. Detect language & save original message
    const detectedLang = data.sourceLang; // Fast path: assume sourceLang is accurate, can be enhanced with AI
    let dbMessage: any = null;
    try {
      dbMessage = await this.chatService.saveMessage(data.roomId, data.senderUserId || 'unknown', data.message, detectedLang, 1.0);
    } catch (e) {
      console.warn("Could not save message to DB. Proceeding with delivery.", e);
    }

    const sockets = await this.server.in(data.roomId).fetchSockets();
    
    // 2. Multicast Translation and Delivery
    await Promise.all(sockets.map(async (socket) => {
      // Send the original message to the sender without translating
      if (socket.id === client.id) {
        this.server.to(socket.id).emit('chat-message', {
          id: dbMessage?.id,
          message: data.message,
          originalMessage: data.message,
          sender: data.sender,
          isSelf: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        return;
      }
      
      const userSettings = this.socketSettings.get(socket.id) || {};
      const targetLang = userSettings.translationLanguage || userSettings.lang || 'English';
      const autoTranslate = userSettings.autoTranslateChat !== false;
      let translatedMsg = data.message;
      
      try {
        if (autoTranslate && data.sourceLang !== targetLang) {
          const start = Date.now();
          translatedMsg = await this.translationService.translateText(data.message, data.sourceLang, targetLang);
          const timeMs = Date.now() - start;
          
          if (dbMessage) {
            await this.chatService.saveTranslation(dbMessage.id, targetLang, translatedMsg, timeMs, translatedMsg.length, false);
          }
        }
      } catch (e) {
        console.error(`Translation failed for user ${socket.id}`, e);
        // Fallback to original message
        translatedMsg = data.message;
      }
      
      this.server.to(socket.id).emit('chat-message', {
        id: dbMessage?.id,
        message: translatedMsg,
        originalMessage: userSettings.showOriginalMessage !== false ? data.message : null,
        sender: data.sender,
        isSelf: false,
        targetLang,
        sourceLang: data.sourceLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }));
  }

  @SubscribeMessage('chat:typing')
  handleTyping(@MessageBody() data: { isTyping: boolean, roomId: string, sender: string }, @ConnectedSocket() client: Socket) {
    client.to(data.roomId).emit('chat:typing', { sender: data.sender, isTyping: data.isTyping });
  }

  @SubscribeMessage('chat:voice')
  async handleChatVoice(@MessageBody() data: { audioChunk: ArrayBuffer, sender: string, senderUserId: string, roomId: string, sourceLang: string }, @ConnectedSocket() client: Socket) {
    try {
      const buffer = Buffer.from(data.audioChunk);
      const transcript = await this.speechService.transcribeAudio(buffer, 'audio/webm');
      if (transcript && transcript.trim().length > 0) {
        await this.handleChatMessage({
          message: transcript,
          sender: data.sender,
          senderUserId: data.senderUserId,
          roomId: data.roomId,
          sourceLang: data.sourceLang
        }, client);
      }
    } catch (e) {
      console.error("Error processing voice message:", e);
      client.emit('chat:error', { message: 'Failed to process voice message.' });
      this.analyticsService.logError({ service: 'speech', message: e.message });
    }
  }

  // --- Real-Time Voice Translation Pipeline ---

  @SubscribeMessage('translation:start')
  handleTranslationStart(@MessageBody() data: { meetingId: string, sourceLang: string }, @ConnectedSocket() client: Socket) {
    this.activeStreams.set(client.id, { buffer: [], timer: null });
  }

  @SubscribeMessage('translation:stop')
  handleTranslationStop(@MessageBody() data: { meetingId: string }, @ConnectedSocket() client: Socket) {
    const streamSession = this.activeStreams.get(client.id);
    if (streamSession && streamSession.timer) {
      clearTimeout(streamSession.timer);
    }
    this.activeStreams.delete(client.id);
  }

  @SubscribeMessage('translation:chunk')
  async handleTranslationChunk(@MessageBody() data: { sequenceId: number, audioChunk: ArrayBuffer, senderId: string, roomId: string, sourceLang: string }, @ConnectedSocket() client: Socket) {
    try {
      const buffer = Buffer.from(data.audioChunk);
      let streamSession = this.activeStreams.get(data.senderId);
      
      if (!streamSession) {
        streamSession = { buffer: [], timer: null };
        this.activeStreams.set(data.senderId, streamSession);
      }

      streamSession.buffer.push(buffer);

      if (streamSession.timer) clearTimeout(streamSession.timer);

      streamSession.timer = setTimeout(async () => {
        const fullBuffer = Buffer.concat(streamSession.buffer);
        streamSession.buffer = []; 
        
        const transcript = await this.speechService.transcribeAudio(fullBuffer, 'audio/webm');
        if (!transcript || transcript.trim().length === 0) return;

        // Broadcast partial caption for live feedback (simulated immediately for responsiveness)
        this.server.to(data.roomId).emit('caption:partial', {
          speakerId: data.senderId,
          text: transcript,
          timestamp: Date.now()
        });

        const sockets = await this.server.in(data.roomId).fetchSockets();
        
        await Promise.all(sockets.map(async (socket) => {
          if (socket.id === client.id) {
            // Echo back to sender
            this.server.to(socket.id).emit('caption:final', {
              speakerId: data.senderId,
              sequenceId: data.sequenceId,
              originalText: transcript,
              translatedText: transcript,
              targetLang: data.sourceLang,
              timestamp: Date.now()
            });
            return; 
          }
          
          const userSettings = this.socketSettings.get(socket.id) || {};
          const isTranslationEnabled = userSettings.translationEnabled !== false;
          
          if (!isTranslationEnabled) return;

          const targetLang = userSettings.translationLanguage || userSettings.lang || 'English';
          const targetVoice = userSettings.translationVoice || 'alloy'; 

          let translatedText = transcript;
          
          if (data.sourceLang !== targetLang) {
            translatedText = await this.translationService.translateText(transcript, data.sourceLang, targetLang);
          }

          // Save caption history asynchronously
          this.captionService.saveCaptionHistory(
            data.senderId || 'unknown',
            data.roomId,
            transcript,
            translatedText,
            targetLang,
            0.95,
            800
          );

          // Emit final synchronized caption
          this.server.to(socket.id).emit('caption:final', {
            speakerId: data.senderId,
            sequenceId: data.sequenceId,
            originalText: transcript,
            translatedText: translatedText,
            targetLang: targetLang,
            timestamp: Date.now()
          });

          // Text to Speech
          const audioBuffer = await this.ttsService.generateSpeech(translatedText, targetVoice);
          
          this.server.to(socket.id).emit('translation:audio-out', {
            senderId: data.senderId,
            sequenceId: data.sequenceId,
            audioData: audioBuffer,
          });
        }));
      }, 800);

    } catch (error) {
      console.error('Translation Pipeline Error:', error);
      client.emit('translation:error', { code: 'PIPELINE_ERROR', message: 'Failed to process voice translation pipeline.' });
    }
  }
}
