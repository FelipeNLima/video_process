import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from './infra/aws/aws.module';
import { VideoModule } from './Presentation/videoProcessing/video.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    VideoModule,
    AwsModule,
  ],
  controllers: [],
  providers: [],
})


export class AppModule {}
