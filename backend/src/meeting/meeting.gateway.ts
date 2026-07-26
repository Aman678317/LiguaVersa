import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import { CaptionService } from './caption.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { MeetingService } from './meeting.service';
import * as os from 'os';

@WebSocketGateway({ cors: { origin: '*' }, maxHttpBufferSize: 1e8 })
export class MeetingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MeetingGateway.name);

  constructor(
    private chatService: ChatService,
    private captionService: CaptionService,
    private analyticsService: AnalyticsService,
    @Inject(forwardRef(() => MeetingService))
    private meetingService: MeetingService,
  ) {
    setInterval(() => this.broadcastSystemHealth(), 5000);
  }

  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private socketSettings = new Map<string, any>(); // socketId -> settings object
  private meetingStartTimes = new Map<string, number>(); // roomId -> startTime
  private activeStreams = new Map<string, { buffer: Buffer[], timer: NodeJS.Timeout | null }>(); 
  
  // Phase 1 Host Controls State
  private roomWaitingUsers = new Map<string, Map<string, { socketId: string; userId: string; name: string }>>(); // roomId -> (socketId -> info)
  private roomRaisedHands = new Map<string, Set<string>>(); // roomId -> Set of socketIds
  private roomHosts = new Map<string, string>(); // roomId -> hostUserId
  private roomLockedState = new Map<string, boolean>(); // roomId -> isLocked

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
    this.logger.log(`Client connected: ${client.id} (userId: ${userId || 'anonymous'})`);
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      this.server.emit('user-online', { userId });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    this.logger.log(`Client disconnected: ${client.id} (userId: ${userId || 'anonymous'})`);
    if (userId) {
      this.connectedUsers.delete(userId);
      this.server.emit('user-offline', { userId });
    }
    this.socketSettings.delete(client.id);
    this.activeStreams.delete(client.id);

    // Clean up waiting room & raised hand state across rooms
    this.roomWaitingUsers.forEach((waitingMap, roomId) => {
      if (waitingMap.has(client.id)) {
        waitingMap.delete(client.id);
        this.server.in(roomId).emit('waiting-room:updated', Array.from(waitingMap.values()));
      }
    });
    this.roomRaisedHands.forEach((handSet, roomId) => {
      if (handSet.has(client.id)) {
        handSet.delete(client.id);
        this.server.in(roomId).emit('hand:updated', { socketId: client.id, isHandRaised: false });
      }
    });
  }

  @SubscribeMessage('get-online-users')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    client.emit('online-users-list', Array.from(this.connectedUsers.keys()));
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(@MessageBody() data: { roomId: string; name?: string }, @ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId as string;
    let isHost = false;

    try {
      if (userId && data.roomId) {
        isHost = await this.meetingService.isHost(data.roomId, userId);
        if (isHost) {
          this.roomHosts.set(data.roomId, userId);
        }
      }
    } catch (e) {
      this.logger.warn(`Could not verify host status for user ${userId} in room ${data.roomId}`);
    }

    const isLocked = this.roomLockedState.get(data.roomId) || false;

    // 1. If meeting is locked and client is not host, deny entry
    if (isLocked && !isHost) {
      this.logger.log(`Socket ${client.id} denied entry to locked room ${data.roomId}`);
      client.emit('room:locked', { message: 'Meeting is locked by the host.' });
      return;
    }

    // 2. Check if waiting room is enabled
    let waitingRoomEnabled = false;
    try {
      if (data.roomId && userId) {
        const meeting = await this.meetingService.getMeetingById(data.roomId, userId).catch(() => null);
        if (meeting?.waitingRoom) waitingRoomEnabled = true;
      }
    } catch (e) {}

    if (waitingRoomEnabled && !isHost) {
      this.logger.log(`Socket ${client.id} placed in waiting room for ${data.roomId}`);
      if (!this.roomWaitingUsers.has(data.roomId)) {
        this.roomWaitingUsers.set(data.roomId, new Map());
      }
      const waitingMap = this.roomWaitingUsers.get(data.roomId)!;
      waitingMap.set(client.id, { socketId: client.id, userId: userId || client.id, name: data.name || 'Guest Participant' });

      client.emit('room:waiting-holding', { roomId: data.roomId, message: 'Waiting for the host to admit you...' });
      
      // Notify host(s) in the room
      this.server.in(data.roomId).emit('waiting-room:user-waiting', {
        socketId: client.id,
        userId: userId || client.id,
        name: data.name || 'Guest Participant'
      });
      this.server.in(data.roomId).emit('waiting-room:updated', Array.from(waitingMap.values()));
      return;
    }

    // 3. Normal room entry
    client.join(data.roomId);
    client.emit('room:role', { isHost });

    const sockets = await this.server.in(data.roomId).fetchSockets();
    const existingUserIds = sockets.map(s => s.id).filter(id => id !== client.id);

    this.logger.log(`Socket ${client.id} (Host: ${isHost}) joined room ${data.roomId}. Total room participants: ${sockets.length}`);

    client.emit('all-users', existingUserIds);
    client.to(data.roomId).emit('user-joined', { userId: client.id, socketId: client.id });
    
    // Send existing waiting room users to host if joining
    if (isHost && this.roomWaitingUsers.has(data.roomId)) {
      const waitingMap = this.roomWaitingUsers.get(data.roomId)!;
      client.emit('waiting-room:updated', Array.from(waitingMap.values()));
    }

    if (!this.meetingStartTimes.has(data.roomId)) {
      this.meetingStartTimes.set(data.roomId, Date.now());
    }
  }

  // --- Phase 1 Host-Only Socket Event Handlers ---

  @SubscribeMessage('host:admit-user')
  async handleAdmitUser(@MessageBody() data: { roomId: string; targetSocketId: string }, @ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId as string;
    const isHost = await this.meetingService.isHost(data.roomId, userId).catch(() => false);
    if (!isHost) {
      this.logger.warn(`Non-host socket ${client.id} attempted to admit user`);
      client.emit('error', { message: 'Unauthorized host action' });
      return;
    }

    const waitingMap = this.roomWaitingUsers.get(data.roomId);
    if (waitingMap && waitingMap.has(data.targetSocketId)) {
      waitingMap.delete(data.targetSocketId);
      this.logger.log(`Host admitted socket ${data.targetSocketId} to room ${data.roomId}`);

      const targetSocket = this.server.sockets.sockets.get(data.targetSocketId);
      if (targetSocket) {
        targetSocket.join(data.roomId);
        targetSocket.emit('waiting-room:admitted', { roomId: data.roomId });

        const sockets = await this.server.in(data.roomId).fetchSockets();
        const existingUserIds = sockets.map(s => s.id).filter(id => id !== data.targetSocketId);

        targetSocket.emit('all-users', existingUserIds);
        targetSocket.to(data.roomId).emit('user-joined', { userId: data.targetSocketId, socketId: data.targetSocketId });
      }

      this.server.in(data.roomId).emit('waiting-room:updated', Array.from(waitingMap.values()));
    }
  }

  @SubscribeMessage('host:deny-user')
  async handleDenyUser(@MessageBody() data: { roomId: string; targetSocketId: string }, @ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId as string;
    const isHost = await this.meetingService.isHost(data.roomId, userId).catch(() => false);
    if (!isHost) {
      client.emit('error', { message: 'Unauthorized host action' });
      return;
    }

    const waitingMap = this.roomWaitingUsers.get(data.roomId);
    if (waitingMap && waitingMap.has(data.targetSocketId)) {
      waitingMap.delete(data.targetSocketId);
      this.logger.log(`Host denied socket ${data.targetSocketId} from entering ${data.roomId}`);

      const targetSocket = this.server.sockets.sockets.get(data.targetSocketId);
      if (targetSocket) {
        targetSocket.emit('waiting-room:denied', { message: 'Entry denied by the host.' });
      }

      this.server.in(data.roomId).emit('waiting-room:updated', Array.from(waitingMap.values()));
    }
  }

  @SubscribeMessage('host:mute-user')
  async handleMuteUser(@MessageBody() data: { roomId: string; targetSocketId: string }, @ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId as string;
    const isHost = await this.meetingService.isHost(data.roomId, userId).catch(() => false);
    if (!isHost) return;

    this.logger.log(`Host muted socket ${data.targetSocketId} in room ${data.roomId}`);
    this.server.to(data.targetSocketId).emit('host:muted');
    this.server.in(data.roomId).emit('participant:muted', { socketId: data.targetSocketId });
  }

  @SubscribeMessage('host:mute-all')
  async handleMuteAll(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId as string;
    const isHost = await this.meetingService.isHost(data.roomId, userId).catch(() => false);
    if (!isHost) return;

    this.logger.log(`Host triggered Mute All in room ${data.roomId}`);
    client.to(data.roomId).emit('host:muted');
    this.server.in(data.roomId).emit('participant:mute-all');
  }

  @SubscribeMessage('host:remove-user')
  async handleRemoveUser(@MessageBody() data: { roomId: string; targetSocketId: string }, @ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId as string;
    const isHost = await this.meetingService.isHost(data.roomId, userId).catch(() => false);
    if (!isHost) return;

    this.logger.log(`Host removed socket ${data.targetSocketId} from room ${data.roomId}`);
    const targetSocket = this.server.sockets.sockets.get(data.targetSocketId);
    if (targetSocket) {
      targetSocket.emit('host:removed', { message: 'You have been removed from the meeting by the host.' });
      targetSocket.leave(data.roomId);
    }

    this.server.in(data.roomId).emit('user-left', { userId: data.targetSocketId });
  }

  @SubscribeMessage('host:toggle-lock')
  async handleToggleLock(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId as string;
    try {
      const result = await this.meetingService.toggleLock(data.roomId, userId);
      this.roomLockedState.set(data.roomId, result.isLocked);
      this.logger.log(`Host toggled lock for room ${data.roomId}: isLocked=${result.isLocked}`);
      this.server.in(data.roomId).emit('room:lock-updated', { isLocked: result.isLocked });
    } catch (e) {
      client.emit('error', { message: e.message || 'Failed to toggle room lock' });
    }
  }

  @SubscribeMessage('hand:toggle')
  handleToggleHand(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    if (!this.roomRaisedHands.has(data.roomId)) {
      this.roomRaisedHands.set(data.roomId, new Set());
    }
    const handSet = this.roomRaisedHands.get(data.roomId)!;
    const isRaised = !handSet.has(client.id);

    if (isRaised) {
      handSet.add(client.id);
    } else {
      handSet.delete(client.id);
    }

    this.logger.log(`Socket ${client.id} toggled raised hand in ${data.roomId}: isRaised=${isRaised}`);
    this.server.in(data.roomId).emit('hand:updated', { socketId: client.id, isHandRaised: isRaised });
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.leave(data.roomId);
    this.logger.log(`Socket ${client.id} left room ${data.roomId}`);
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
    this.logger.log(`Relaying WebRTC offer from ${client.id} to ${data.targetUserId}`);
    client.to(data.targetUserId).emit('offer', { offer: data.offer, callerId: data.callerId });
  }

  @SubscribeMessage('answer')
  handleAnswer(@MessageBody() data: { answer: any, targetUserId: string, callerId: string, roomId: string }, @ConnectedSocket() client: Socket) {
    this.logger.log(`Relaying WebRTC answer from ${client.id} to ${data.targetUserId}`);
    client.to(data.targetUserId).emit('answer', { answer: data.answer, callerId: data.callerId });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(@MessageBody() data: { candidate: any, targetUserId: string, callerId: string, roomId: string }, @ConnectedSocket() client: Socket) {
    this.logger.debug(`Relaying ICE candidate from ${client.id} to ${data.targetUserId}`);
    client.to(data.targetUserId).emit('ice-candidate', { candidate: data.candidate, callerId: data.callerId });
  }

  // --- AI Remote Call Signaling ---
  @SubscribeMessage('initiate-ai-call')
  handleInitiateAiCall(@MessageBody() data: { targetUserId: string, callerId: string, callerName: string, roomId: string }, @ConnectedSocket() client: Socket) {
    client.to(data.targetUserId).emit('ai-call-ring', { 
      callerId: data.callerId, 
      callerName: data.callerName,
      roomId: data.roomId 
    });
    client.to(data.targetUserId).emit('call:incoming', { 
      callerId: data.callerId, 
      callerName: data.callerName,
      roomId: data.roomId 
    });
  }

  @SubscribeMessage('call:ringing')
  handleCallRinging(@MessageBody() data: { targetUserId: string, roomId: string }, @ConnectedSocket() client: Socket) {
    client.to(data.targetUserId).emit('call:ringing', { roomId: data.roomId });
  }

  @SubscribeMessage('accept-ai-call')
  handleAcceptAiCall(@MessageBody() data: { targetUserId: string, roomId: string }, @ConnectedSocket() client: Socket) {
    client.to(data.targetUserId).emit('ai-call-accepted', { roomId: data.roomId });
    client.to(data.targetUserId).emit('call:accepted', { roomId: data.roomId });
  }

  @SubscribeMessage('call:connected')
  handleCallConnected(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    this.server.in(data.roomId).emit('call:connected', { roomId: data.roomId, timestamp: Date.now() });
  }

  @SubscribeMessage('reject-ai-call')
  handleRejectAiCall(@MessageBody() data: { targetUserId: string }, @ConnectedSocket() client: Socket) {
    client.to(data.targetUserId).emit('ai-call-rejected');
  }

  @SubscribeMessage('call:ended')
  handleCallEnded(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    this.server.in(data.roomId).emit('call:ended', { roomId: data.roomId, timestamp: Date.now() });
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
      const targetLang = userSettings.translationLanguage || userSettings.lang || 'en-US';
      const autoTranslate = userSettings.autoTranslateChat !== false;
      let translatedMsg = data.message;
      
      try {
        if (autoTranslate && data.sourceLang !== targetLang) {
          const start = Date.now();
          const axios = require('axios');
          const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
          const response = await axios.post(`${aiServiceUrl}/translate`, {
            text: data.message,
            sourceLang: data.sourceLang,
            targetLang: targetLang
          }, { timeout: 10000 });

          translatedMsg = response.data.translatedText || data.message;
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
      const axios = require('axios');
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const response = await axios.post(`${aiServiceUrl}/transcribe`, buffer, {
        headers: { 'Content-Type': 'application/octet-stream' }
      });
      const transcript = response.data.text;
      
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
      this.analyticsService.logError({ service: 'speech', message: e.message || 'Error' });
    }
  }

  // --- Real-Time Voice Translation Pipeline ---

  @SubscribeMessage('translation:start')
  handleTranslationStart(@MessageBody() data: { meetingId: string, sourceLang: string }, @ConnectedSocket() client: Socket) {
    this.activeStreams.set(client.id, { buffer: [], timer: null });
    client.emit('translation:status', { status: 'ACTIVE', meetingId: data.meetingId });
  }

  @SubscribeMessage('translation:stop')
  handleTranslationStop(@MessageBody() data: { meetingId: string }, @ConnectedSocket() client: Socket) {
    const streamSession = this.activeStreams.get(client.id);
    if (streamSession && streamSession.timer) {
      clearTimeout(streamSession.timer);
    }
    this.activeStreams.delete(client.id);
    client.emit('translation:status', { status: 'STOPPED', meetingId: data.meetingId });
  }

  @SubscribeMessage('translation:status')
  handleTranslationStatus(@MessageBody() data: { meetingId: string }, @ConnectedSocket() client: Socket) {
    const isActive = this.activeStreams.has(client.id);
    client.emit('translation:status', { status: isActive ? 'ACTIVE' : 'IDLE', meetingId: data.meetingId });
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
        
        try {
          // Parallel Pipeline: STT -> Translate -> TTS via AI Service
          const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
          const axios = require('axios');
          
          const sockets = await this.server.in(data.roomId).fetchSockets();
          
          await Promise.all(sockets.map(async (socket) => {
            const isSelf = (socket.id === client.id);
            const userSettings = this.socketSettings.get(socket.id) || {};
            const isTranslationEnabled = userSettings.translationEnabled !== false;
            
            if (!isTranslationEnabled) return;

            const targetLang = isSelf 
              ? (userSettings.lang || data.sourceLang || 'en-US')
              : (userSettings.translationLanguage || userSettings.lang || 'en-US');
            
            const response = await axios.post(`${aiServiceUrl}/process-audio`, fullBuffer, {
              headers: { 
                'Content-Type': 'application/octet-stream',
                'X-Source-Lang': data.sourceLang,
                'X-Target-Lang': targetLang
              },
              responseType: 'arraybuffer',
              timeout: 30000
            });

            const translatedAudio = response.data;
            const rawTranslatedText = response.headers['x-translated-text'];
            const rawOriginalText = response.headers['x-original-text'];
            const detectedLang = response.headers['x-detected-lang'];
            const translationStatus = response.headers['x-translation-status'] || 'ok';
            const translatedText = Buffer.isBuffer(rawTranslatedText) ? rawTranslatedText.toString('utf8') : (rawTranslatedText || '');
            const originalText = Buffer.isBuffer(rawOriginalText) ? rawOriginalText.toString('utf8') : (rawOriginalText || '');
            const decodedTranslatedText = translatedText ? Buffer.from(translatedText, 'base64').toString('utf8') : translatedText;
            const decodedOriginalText = originalText ? Buffer.from(originalText, 'base64').toString('utf8') : originalText;
            
            if (decodedTranslatedText || decodedOriginalText) {
               const captionPayload = {
                 speakerId: isSelf ? 'You' : data.senderId,
                 sequenceId: data.sequenceId,
                 originalText: decodedOriginalText || decodedTranslatedText,
                 translatedText: decodedTranslatedText || decodedOriginalText,
                 targetLang: targetLang,
                 sourceLang: detectedLang || data.sourceLang,
                 status: translationStatus,
                 timestamp: Date.now()
               };
               this.server.to(socket.id).emit('caption:final', captionPayload);
               this.server.to(socket.id).emit('translation:caption', captionPayload);

               // Save caption history asynchronously
               this.captionService.saveCaptionHistory(
                 data.senderId || 'unknown',
                 data.roomId,
                 decodedOriginalText || decodedTranslatedText,
                 decodedTranslatedText || decodedOriginalText,
                 targetLang,
                 0.95,
                 800
               );
            }

            if (!isSelf && translatedAudio && translatedAudio.length > 0) {
               const audioPayload = {
                 senderId: data.senderId,
                 sequenceId: data.sequenceId,
                 audioData: translatedAudio,
                 translatedText: translatedText,
                 targetLang: targetLang,
                 targetSocketId: socket.id
               };
               // 1. Emit to target listener socket for immediate WebAudio playback
               this.server.to(socket.id).emit('translation:audio-in', audioPayload);
               this.server.to(socket.id).emit('translation:audio', audioPayload);

               // 2. Emit to sender socket for WebRTC track injection & local feedback
               this.server.to(client.id).emit('translation:audio-out', audioPayload);
            }
          }));
        } catch (err) {
          console.error("AI Pipeline failed:", err.message);
        }

      }, 900); // Wait until we have roughly ~900ms of speech

    } catch (error) {
      console.error('Translation Pipeline Error:', error);
      client.emit('translation:error', { code: 'PIPELINE_ERROR', message: 'Failed to process voice translation pipeline.' });
    }
  }
}
