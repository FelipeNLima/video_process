import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { format } from 'date-fns';
import { VideoRepository } from 'src/Domain/Repositories/video.repository';
import { AwsS3Service } from 'src/infra/aws/aws-s3.service';
import { videoDto } from '../dtos/video.dto';
import { AwsSqsService } from './../../infra/aws/aws-sqs.service';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(VideoRepository)
    private videoRepository: VideoRepository,
    private awsS3: AwsS3Service,
    private awsSqs: AwsSqsService,
    private configService: ConfigService,
  ) {}

  private readonly AWS_BUCKET_NAME_ZIP = this.configService.get<string>(
    'AWS_BUCKET_NAME_ZIP',
  );

  private readonly AWS_QUEUE_RETURN =
    this.configService.get<string>('AWS_QUEUE_RETURN');

  async processVideo(video: videoDto): Promise<any> {
    const { outputDir, path, zipPath } = video;
    const { file, fileContent } = await this.videoRepository.processVideo(
      path,
      outputDir,
      zipPath,
    );

    // Save Zip at Bucket
    const date = format(new Date(), 'dd/MM/yyyy');
    const fileName = `fileZip-${date}-${randomUUID()}`;
    const s3 = await this.awsS3.sendToS3Bucket(
      fileContent,
      fileName,
      this.AWS_BUCKET_NAME_ZIP,
    );

    // Send Key of Bucket
    await this.awsSqs.sendMessage(s3, this.AWS_QUEUE_RETURN);
    return file;
  }
}
