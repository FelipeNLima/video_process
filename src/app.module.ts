import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoRepository } from './Domain/Repositories/video.repository';
import { AwsModule } from './infra/aws/aws.module';
import { TypeOrmExModule } from './infra/database/typeorm-ex.module';
import { VideoModule } from './Presentation/videoProcessing/video.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER,
      password: String(process.env.DB_PASS),
      database: process.env.DB_NAME,
      synchronize: true,
      autoLoadEntities: true,
    }),
    TypeOrmExModule.forCustomRepository([VideoRepository]),
    VideoModule,
    AwsModule,
  ],
  controllers: [],
  providers: [],
})


export class AppModule {}
