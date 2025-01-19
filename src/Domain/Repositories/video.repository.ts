import { Injectable } from '@nestjs/common';
import * as archiver from 'archiver';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import path from 'path';
import { CustomRepository } from 'src/infra/database/typeorm-ex.decorator';
import { Repository } from 'typeorm';
import { Video } from '../Entities/video';
import { IReturnFile } from '../interfaces/returnFile.interface';

@Injectable()
@CustomRepository(Video)
export class VideoRepository extends Repository<Video> {
  async processVideo(
    videoPath: string,
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
          .on('end', () => resolve())
          .on('error', reject)
          .save(`${outputDir}/frame-%04d.png`);
      });

      // Create a zip file with the extracted frames
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      const file = await new Promise((resolve, reject) => {
        archive.pipe(output);

        archive.directory(outputDir, false);

        archive.on('error', reject);
        output.on('close', () => resolve(zipPath));

        archive.finalize();
      });

      const fileContent = fs.readFileSync(path.join(__dirname, outputDir));

      return { file, fileContent };
    } catch (error) {
      throw new Error(error);
    }
  }
}
