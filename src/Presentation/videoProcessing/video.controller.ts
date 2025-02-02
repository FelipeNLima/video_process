import {
  Controller,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { join } from 'path';
import { VideoService } from 'src/Application/services/video.service';
import path = require('path')

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${Date.now()}${ext}`);
        },
      }),
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    const outputDir = join(__dirname, '..', '..', 'frames');
    const zipPath = join(__dirname, '..', '..', 'output.zip');
    const videoPath = path.join('./uploads', file.filename);

    try {
      const zipFile = await this.videoService.processVideo({
        file,
        outputDir,
        zipPath,
      });
      res.download(zipPath, 'frames.zip', () => {
        fs.unlinkSync(videoPath); // Clean up
        fs.unlinkSync(zipPath);
      });
      return res.download(zipFile); // Send the zip file as a response
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
