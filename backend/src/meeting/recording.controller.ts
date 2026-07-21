import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Body, Req, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('recordings')
export class RecordingController {
  constructor(
    private prisma: PrismaService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload-chunk')
  @UseInterceptors(FileInterceptor('chunk'))
  async uploadChunk(@UploadedFile() file: any, @Body('meetingId') meetingId: string) {
    if (!file) throw new BadRequestException('Chunk is missing');
    if (!meetingId) throw new BadRequestException('Meeting ID is missing');

    const uploadDir = path.join(process.cwd(), 'uploads', meetingId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const chunkPath = path.join(uploadDir, file.originalname);
    fs.writeFileSync(chunkPath, file.buffer);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('finalize')
  async finalizeRecording(@Body('meetingId') meetingId: string) {
    if (!meetingId) throw new BadRequestException('Meeting ID is missing');

    const uploadDir = path.join(process.cwd(), 'uploads', meetingId);
    const finalVideoPath = path.join(process.cwd(), 'uploads', `${meetingId}.webm`);
    
    // In production, use ffmpeg to merge chunks. For demo, we just assemble bytes.
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir).sort();
      const outStream = fs.createWriteStream(finalVideoPath);
      for (const file of files) {
        const data = fs.readFileSync(path.join(uploadDir, file));
        outStream.write(data);
      }
      outStream.end();
    }

    // Save recording metadata to DB
    const recording = await this.prisma.recording.create({
      data: {
        meetingId,
        url: `/uploads/${meetingId}.webm`,
        status: 'COMPLETED',
        summaryJson: '{}',
      }
    });

    return { success: true, recording };
  }
}
