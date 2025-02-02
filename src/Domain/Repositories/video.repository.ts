import { Injectable } from '@nestjs/common';
import * as archiver from 'archiver';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import { Readable } from 'stream';
import { IReturnFile } from '../interfaces/returnFile.interface';

@Injectable()
export class VideoRepository {
  constructor() {}

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

      const fileContent = fs.readFileSync(zipPath);

      return { file, fileContent };
    } catch (error) {
      throw new Error(error);
    }
  }

  async processVideoMp4(
    videoStream: string | Readable,
    outputDir: string,
    zipPath: string,
  ) {
    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoStream)
        .inputFormat('mp4')
        .outputOptions([
          '-c:v libx264', // Set video codec to libx264 (common for MP4)
          '-vf',
          'fps=1', // Capture 1 frame per second
          '-q:v',
          '2', // Quality
          '-loglevel',
          'debug', // Set log level to debug for better insights
        ])
        .output(`${outputDir}/frame-%04d.png`)
        .on('start', (commandLine) => {
          console.log('FFmpeg command line:', commandLine);
        })
        .on('stderr', (stderrLine) => {
          console.log('FFmpeg stderr:', stderrLine);
        })
        .on('end', () => {
          console.log(`✅ Frames extracted and saved to ${outputDir}`);
        })
        .on('error', (err) => {
          console.error('❌ FFmpeg Error:', err);
        })
        .run();
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

    const fileContent = fs.readFileSync(zipPath);

    return { file, fileContent };
  }

  bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null); // End of stream
    return stream;
  }
}
