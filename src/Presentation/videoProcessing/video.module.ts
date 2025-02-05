import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoService } from 'src/Application/services/video.service';
import { VideoRepository } from 'src/Domain/Repositories/video.repository';
import { AwsS3Service } from 'src/infra/aws/aws-s3.service';
import { AwsSnsService } from 'src/infra/aws/aws-sns.service';
import { AwsSqsService } from 'src/infra/aws/aws-sqs.service';
import { Video } from 'src/infra/typeorm/entities/video.entity';
import { VideoController } from './video.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Video])],
  controllers: [VideoController],
  providers: [
    VideoService,
    { provide: VideoRepository, useClass: VideoRepository },
    AwsS3Service,
    AwsSqsService,
    AwsSnsService,
  ],
  exports: [VideoService, VideoRepository, TypeOrmModule],
})
export class VideoModule {}
