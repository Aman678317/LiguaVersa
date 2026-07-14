import { WebSocketGateway } from '@nestjs/websockets';
import { PipelineManager } from './pipeline.manager';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/ai-stream' })
export class AudioStreamGateway {
  constructor(private readonly pipelineManager: PipelineManager) {}
}
