import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VideoService } from 'src/Application/services/video.service';
import { VideoRepository } from 'src/Domain/Repositories/video.repository';
import { AwsModule } from 'src/infra/aws/aws.module';
import { VideoController } from './video.controller';

@Module({
  imports: [AwsModule],
  controllers: [VideoController],
  providers: [
    { provide: VideoRepository, useClass: VideoRepository },
    VideoService,
    ConfigService,
  ],
  exports: [VideoService],
})
export class VideoModule {}
