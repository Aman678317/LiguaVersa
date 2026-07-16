import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TranslationService } from './translation.service';
import { SpeechService } from './speech.service';
import { TtsService } from './tts.service';

@WebSocketGateway({ cors: { origin: '*' }, maxHttpBufferSize: 1e8 })
export class MeetingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private translationService: TranslationService,
    private speechService: SpeechService,
    private ttsService: TtsService,
  ) {}

  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private socketSettings = new Map<string, any>(); // socketId -> settings object

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      // Broadcast to everyone that this user is online
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
  }

  @SubscribeMessage('get-online-users')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const onlineUsers = Array.from(this.connectedUsers.keys());
    client.emit('online-users-list', onlineUsers);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.roomId);
    client.to(data.roomId).emit('user-joined', { userId: client.id });
  }

  @SubscribeMessage('offer')
  handleOffer(@MessageBody() data: { offer: any, targetUserId: string, callerId: string, roomId: string }, @ConnectedSocket() client: Socket) {
    client.to(data.targetUserId).emit('offer', {
      offer: data.offer,
      callerId: data.callerId
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(@MessageBody() data: { answer: any, targetUserId: string, callerId: string, roomId: string }, @ConnectedSocket() client: Socket) {
    client.to(data.targetUserId).emit('answer', {
      answer: data.answer,
      callerId: data.callerId
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(@MessageBody() data: { candidate: any, targetUserId: string, callerId: string, roomId: string }, @ConnectedSocket() client: Socket) {
    client.to(data.targetUserId).emit('ice-candidate', {
      candidate: data.candidate,
      callerId: data.callerId
    });
  }

  @SubscribeMessage('set-language')
  handleSetLanguage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    this.socketSettings.set(client.id, data);
  }

  @SubscribeMessage('chat-message')
  async handleChatMessage(@MessageBody() data: { message: string, sender: string, roomId: string, sourceLang: string }, @ConnectedSocket() client: Socket) {
    const sockets = await this.server.in(data.roomId).fetchSockets();
    
    for (const socket of sockets) {
      if (socket.id === client.id) continue;
      
      const userSettings = this.socketSettings.get(socket.id) || {};
      const targetLang = userSettings.translationLanguage || userSettings.lang || 'English';
      let translatedMsg = data.message;
      
      if (data.sourceLang !== targetLang) {
        translatedMsg = await this.translationService.translateText(data.message, data.sourceLang, targetLang);
      }
      
      this.server.to(socket.id).emit('chat-message', {
        message: translatedMsg,
        originalMessage: data.message,
        sender: data.sender,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  }

  @SubscribeMessage('speech-transcription')
  async handleSpeech(@MessageBody() data: { text: string, senderId: string, roomId: string, sourceLang: string }, @ConnectedSocket() client: Socket) {
    const sockets = await this.server.in(data.roomId).fetchSockets();
    
    for (const socket of sockets) {
      if (socket.id === client.id) continue;
      
      const userSettings = this.socketSettings.get(socket.id) || {};
      const targetLang = userSettings.captionLanguage || userSettings.lang || 'English';
      let translatedText = data.text;
      
      if (data.sourceLang !== targetLang) {
        translatedText = await this.translationService.translateText(data.text, data.sourceLang, targetLang);
      }
      
      this.server.to(socket.id).emit('translated-speech', {
        senderId: data.senderId,
        originalText: data.text,
        translatedText: translatedText,
      });
    }
  }

  // --- Real-Time Voice Translation Pipeline ---

  @SubscribeMessage('translation:audio')
  async handleTranslationAudio(@MessageBody() data: { audioChunk: ArrayBuffer, senderId: string, roomId: string, sourceLang: string }, @ConnectedSocket() client: Socket) {
    try {
      const buffer = Buffer.from(data.audioChunk);
      
      // 1. Speech to Text (STT)
      const transcript = await this.speechService.transcribeAudio(buffer, 'audio/webm');
      if (!transcript || transcript.trim().length === 0) return;

      // Broadcast original caption to everyone
      this.server.to(data.roomId).emit('translation:caption', {
        senderId: data.senderId,
        originalText: transcript,
        translatedText: '',
      });

      // 2. Process for each target listener
      const sockets = await this.server.in(data.roomId).fetchSockets();
      
      for (const socket of sockets) {
        if (socket.id === client.id) continue; // Don't translate/play back to the sender
        
        const userSettings = this.socketSettings.get(socket.id) || {};
        const isTranslationEnabled = userSettings.translationEnabled !== false;
        
        if (!isTranslationEnabled) continue;

        const targetLang = userSettings.translationLanguage || userSettings.lang || 'English';
        const targetVoice = userSettings.translationVoice || 'alloy'; // 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'

        let translatedText = transcript;
        
        // 3. Translation
        if (data.sourceLang !== targetLang) {
          translatedText = await this.translationService.translateText(transcript, data.sourceLang, targetLang);
        }

        // Emit translated text for subtitle UI
        this.server.to(socket.id).emit('translation:text', {
          senderId: data.senderId,
          originalText: transcript,
          translatedText: translatedText,
        });

        // 4. Text to Speech (TTS)
        const audioBuffer = await this.ttsService.generateSpeech(translatedText, targetVoice);
        
        // Broadcast the generated audio stream specifically to this user
        this.server.to(socket.id).emit('translation:audio-out', {
          senderId: data.senderId,
          audioData: audioBuffer,
        });
      }
    } catch (error) {
      console.error('Translation Pipeline Error:', error);
      client.emit('translation:error', { message: 'Failed to process voice translation pipeline.' });
    }
  }
}
