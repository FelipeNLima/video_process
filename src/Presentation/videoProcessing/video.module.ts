import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoService } from 'src/Application/services/video.service';
import { VideoRepository } from 'src/Domain/Repositories/video.repository';
import { VideoController } from './video.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VideoRepository])],
  controllers: [VideoController],
  providers: [
    { provide: VideoRepository, useClass: VideoRepository },
    VideoService,
  ],
})
export class VideoModule {}
