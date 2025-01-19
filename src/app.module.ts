import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoRepository } from './Domain/Repositories/video.repository';
import { AwsModule } from './infra/aws/aws.module';
import { typeOrmConfig } from './infra/configs/typeorm.config';
import { TypeOrmExModule } from './infra/database/typeorm-ex.module';
import { VideoModule } from './Presentation/videoProcessing/video.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmExModule.forCustomRepository([VideoRepository]),
    ConfigModule.forRoot({ isGlobal: true }),
    VideoModule,
    AwsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
