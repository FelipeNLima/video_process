import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VideoService } from 'src/Application/services/video.service';
import { VideoRepository } from 'src/Domain/Repositories/video.repository';
import { SqsConsumerService } from './aws-consumer.service';
import { AwsS3Service } from './aws-s3.service';
import { AwsSnsService } from './aws-sns.service';
import { AwsSqsService } from './aws-sqs.service';

@Module({
  imports: [],
  providers: [
    AwsSqsService,
    AwsS3Service,
    SqsConsumerService,
    AwsSnsService,
    ConfigService,
    VideoService,
    { provide: VideoRepository, useClass: VideoRepository },
  ],
  exports: [AwsSqsService, AwsS3Service, SqsConsumerService, AwsSnsService],
})
export class AwsModule {}
