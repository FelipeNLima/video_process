import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as archiver from 'archiver';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import { AwsS3Service } from 'src/infra/aws/aws-s3.service';
import { AwsSnsService } from 'src/infra/aws/aws-sns.service';
import { AwsSqsService } from 'src/infra/aws/aws-sqs.service';
import { CustomRepository } from 'src/infra/database/typeorm-ex.decorator';
import { Video } from 'src/infra/typeorm/entities/video.entity';
import { Readable } from 'stream';
import { Repository } from 'typeorm';
import { IReturnFile } from '../interfaces/returnFile.interface';

@CustomRepository(Video)
export class VideoRepository extends Repository<Video> {
  constructor(
    @InjectRepository(Video)
    private readonly repository: Repository<Video>,
    private readonly awsS3: AwsS3Service,
    private readonly awsSqs: AwsSqsService,
    private readonly awsSns: AwsSnsService,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
  private readonly logger = new Logger(VideoRepository.name);

  async updateStatus(videoID: string, url: string) {
    try {
      const response = await this.repository.update(videoID, { status: 'finality', zipURL: url })
      return response
    } catch (error) {
      console.log(error)
      throw new Error('Error update DB')
    }
  }

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

  async getFromS3Bucket(key: string, bucket: string) {
    return await this.awsS3.getFromS3Bucket(key, bucket);
  }

  async sendToS3Bucket(fileContent: Buffer<ArrayBufferLike>, s3Key: string, queue: string) {
    return await this.awsS3.sendToS3Bucket(
      fileContent,
      s3Key,
      queue,
    );
  }

  async sendToSqs(message: string, queue: string) {
    return await this.awsSqs.sendMessage(message, queue);
  }

  async sendSnsEmail(params) {
    return await this.awsSns.sendEmail(params)
  }
}
