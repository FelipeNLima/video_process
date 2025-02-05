import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AwsModule } from './infra/aws/aws.module';
import { VideoModule } from './Presentation/videoProcessing/video.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [__dirname + '/../**/*.entity.{js,ts}'], // Auto detecta entidades
      synchronize: true,
    }),
    VideoModule,
    AwsModule,
  ],
  controllers: [],
  providers: [],
})


export class AppModule {}
