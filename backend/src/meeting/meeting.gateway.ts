import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TranslationService } from './translation.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class MeetingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private translationService: TranslationService) {}

  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private socketLanguages = new Map<string, string>(); // socketId -> language name

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
    this.socketLanguages.delete(client.id);
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
  handleSetLanguage(@MessageBody() data: { lang: string }, @ConnectedSocket() client: Socket) {
    this.socketLanguages.set(client.id, data.lang);
  }

  @SubscribeMessage('chat-message')
  async handleChatMessage(@MessageBody() data: { message: string, sender: string, roomId: string, sourceLang: string }, @ConnectedSocket() client: Socket) {
    const sockets = await this.server.in(data.roomId).fetchSockets();
    
    for (const socket of sockets) {
      if (socket.id === client.id) continue;
      
      const targetLang = this.socketLanguages.get(socket.id) || 'English';
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
      
      const targetLang = this.socketLanguages.get(socket.id) || 'English';
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
}
