import {
  Controller,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import * as path from 'path';

import { VideoService } from 'src/Application/services/video.service';

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
    const outputDir = path.join(__dirname, '..', '..', 'frames');
    const zipPath = path.join(__dirname, '..', '..', 'output.zip');
    
    try {
      const zipFile = await this.videoService.processVideo({
        file,
        outputDir,
        zipPath,
      });

      return res.download(zipFile); // Send the zip file as a response
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
