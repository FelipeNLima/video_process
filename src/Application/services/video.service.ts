import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { format } from 'date-fns';
import { join } from 'path';
import { VideoRepository } from 'src/Domain/Repositories/video.repository';
import { videoDto } from '../dtos/video.dto';

@Injectable()
export class VideoService {
  constructor(
    @Inject(VideoRepository)
    private readonly videoRepository: VideoRepository,
    private readonly configService: ConfigService,
  ) {}
  private readonly logger = new Logger(VideoService.name);
  private readonly AWS_BUCKET_NAME_ZIP = this.configService.get<string>(
    'AWS_BUCKET_NAME_ZIP',
  );
  private readonly AWS_QUEUE_RETURN =
    this.configService.get<string>('AWS_QUEUE_RETURN');
  private readonly AWS_SNS_TOPIC_ARN =
    this.configService.get<string>('AWS_SNS_TOPIC_ARN');
  private readonly AWS_REGION = this.configService.get<string>('AWS_REGION');

  async processVideo(video: videoDto): Promise<any> {
    const { outputDir, file: fileRequest, zipPath } = video;

    if (!fileRequest) {
      throw new Error('No file uploaded!');
    }
    if (fileRequest.mimetype !== 'video/mp4') {
      throw new Error('Invalid file type. Only MP4 files are allowed.');
    }

    const path = fileRequest.path;

    const { file, fileContent } = await this.videoRepository.processVideo(
      path,
      outputDir,
      zipPath,
    );

    // Save Zip at Bucket
    const date = format(new Date(), 'dd-MM-yyyy');
    const s3Key = `file-${date}-${randomUUID()}.zip`;
    await this.videoRepository.sendToS3Bucket(
      fileContent,
      s3Key,
      this.AWS_BUCKET_NAME_ZIP!,
    );
    this.logger.log(`✅ saved to Bucket file in .Zip`);
    // Send Key of Bucket
    await this.videoRepository.sendToSqs(
      JSON.stringify({ key: s3Key, bucketName: this.AWS_BUCKET_NAME_ZIP }),
      this.AWS_QUEUE_RETURN!,
    );
    this.logger.log(`✅ send file zip in Queue`);
    // Send Email
    const params = {
      Subject: 'Arquivo Zipado com sucesso',
      Message: 'O seu video foi processado com sucesso',
      TopicArn: this.AWS_SNS_TOPIC_ARN,
    };
    await this.videoRepository.sendSnsEmail(params);
    this.logger.log(`✅ send to e-mail for client`);
    return file;
  }

  async downloadAndProcessVideo(bucket: string, key: string, videoID: string) {
    try {
      const filePath = await this.videoRepository.getFromS3Bucket(key, bucket);
      const outputDir = join(__dirname, '..', '..', `frames-${key}`);
      const zipPath = join(__dirname, '..', '..', `output-${key}.zip`);

      const { fileContent } = await this.videoRepository.processVideo(
        filePath,
        outputDir,
        zipPath,
      );

      // Save Zip at Bucket
      const date = format(new Date(), 'dd-MM-yyyy');
      const s3Key = `file-${date}-${randomUUID()}.zip`;
      await this.videoRepository.sendToS3Bucket(
        fileContent,
        s3Key,
        this.AWS_BUCKET_NAME_ZIP!,
      );
      this.logger.log(`✅ saved to Bucket file in .Zip`);

      const url = `https://${this.AWS_BUCKET_NAME_ZIP}.s3.${this.AWS_REGION}.amazonaws.com/${s3Key}`
      await this.videoRepository.updateStatus(videoID, url)
      this.logger.log(`✅ Update status and URL in DB`, url);
    } catch (error) {
      // Send Email
      const params = {
        Subject: 'Erro ao processar o video',
        Message:
          'O seu video não foi processo, por favor entrar em contato com o time de suporte!',
        TopicArn: this.AWS_SNS_TOPIC_ARN,
      };
      this.logger.log(`✅ send to e-mail for client`);
      await this.videoRepository.sendSnsEmail(params);
    }
  }
}
