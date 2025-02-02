import { Injectable, Logger } from '@nestjs/common';
import * as archiver from 'archiver';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import { Readable } from 'stream';
import { IReturnFile } from '../interfaces/returnFile.interface';

@Injectable()
export class VideoRepository {
  constructor() {}
  private readonly logger = new Logger(VideoRepository.name);
  async processVideo(
    videoPath: string | Readable,
    outputDir: string,
    zipPath: string,
  ): Promise<IReturnFile> {
    try {
      // Ensure the output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Extract frames from the video
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .on('end', () => {
            this.logger.log(`✅ Frames extracted and saved`);
            resolve()
          })
          .on('error', (err) => {
            this.logger.error('❌ FFmpeg Error:', err);
            reject
          })
          .save(`${outputDir}/frame-%04d.png`);
      });

      // Create a zip file with the extracted frames
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      const file = await new Promise((resolve, reject) => {
        archive.pipe(output);

        archive.directory(outputDir, false);

        archive.on('error', reject);
        archive.on('end', () => {
          this.logger.log(`✅ Archive extracted and saved .zip`);
        })
        archive.on('error', (err) => {
          this.logger.error('❌ Archive Error:', err);
          reject
        })
        output.on('close', () => resolve(zipPath));

        archive.finalize();
      });

      const fileContent = fs.readFileSync(zipPath);

      return { file, fileContent };
    } catch (error) {
      throw new Error(error);
    }
  }
}
