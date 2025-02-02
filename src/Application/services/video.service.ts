import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { format } from 'date-fns';
import { join } from 'path';
import { VideoRepository } from 'src/Domain/Repositories/video.repository';
import { AwsS3Service } from 'src/infra/aws/aws-s3.service';
import { AwsSnsService } from 'src/infra/aws/aws-sns.service';
import { videoDto } from '../dtos/video.dto';
import { AwsSqsService } from './../../infra/aws/aws-sqs.service';

@Injectable()
export class VideoService {
  constructor(
    @Inject(VideoRepository)
    private videoRepository: VideoRepository,
    private awsS3: AwsS3Service,
    private awsSqs: AwsSqsService,
    private awsSns: AwsSnsService,
    private configService: ConfigService,
  ) {}
  private readonly logger = new Logger(VideoService.name);
  private readonly AWS_BUCKET_NAME_ZIP = this.configService.get<string>(
    'AWS_BUCKET_NAME_ZIP',
  );
  private readonly AWS_QUEUE_RETURN =
    this.configService.get<string>('AWS_QUEUE_RETURN');
  private readonly AWS_SNS_TOPIC_ARN =
    this.configService.get<string>('AWS_SNS_TOPIC_ARN');

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
    await this.awsS3.sendToS3Bucket(
      fileContent,
      s3Key,
      this.AWS_BUCKET_NAME_ZIP,
    );
    this.logger.log(`✅ saved to Bucket file in .Zip`)
    // Send Key of Bucket
    await this.awsSqs.sendMessage({key: s3Key, bucketName: this.AWS_BUCKET_NAME_ZIP }, this.AWS_QUEUE_RETURN);
    this.logger.log(`✅ send file zip in Queue`)
    // Send Email
    const params = {
      Subject: "Arquivo Zipado com sucesso",
      Message: "O seu video foi processado com sucesso",
      TopicArn: this.AWS_SNS_TOPIC_ARN,
    }
    await this.awsSns.sendEmail(params)
    this.logger.log(`✅ send to e-mail for client`)
    return file;
  }

  async downloadAndProcessVideo(bucket: string, key: string) {
    const filePath = await this.awsS3.getFromS3Bucket(key, bucket);
    const outputDir = join(__dirname, '..', '..', 'frames');
    const zipPath = join(__dirname, '..', '..', 'output.zip');

    const { fileContent} = await this.videoRepository.processVideo(
      filePath,
      outputDir,
      zipPath
    );

    // Save Zip at Bucket
    const date = format(new Date(), 'dd-MM-yyyy');
    const s3Key = `file-${date}-${randomUUID()}.zip`;
    await this.awsS3.sendToS3Bucket(
      fileContent,
      s3Key,
      this.AWS_BUCKET_NAME_ZIP,
    );
    this.logger.log(`✅ saved to Bucket file in .Zip`)

    // Send Key of Bucket
    await this.awsSqs.sendMessage({key: s3Key, bucketName: this.AWS_BUCKET_NAME_ZIP }, this.AWS_QUEUE_RETURN);
    this.logger.log(`✅ send file zip in Queue`)

    // Send Email
    const params = {
      Subject: "Arquivo Zipado com sucesso",
      Message: "O seu video foi processado com sucesso",
      TopicArn: this.AWS_SNS_TOPIC_ARN,
    }
    this.logger.log(`✅ send to e-mail for client`)
    await this.awsSns.sendEmail(params)
  }
}
