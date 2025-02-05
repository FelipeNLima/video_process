import { Module, forwardRef } from '@nestjs/common';
import { VideoModule } from 'src/Presentation/videoProcessing/video.module';
import { SqsConsumerService } from './aws-consumer.service';
import { AwsS3Service } from './aws-s3.service';
import { AwsSnsService } from './aws-sns.service';
import { AwsSqsService } from './aws-sqs.service';

@Module({
  imports: [forwardRef(() => VideoModule)], // 🔥 Use forwardRef para evitar dependência circular
  providers: [AwsS3Service, AwsSqsService, AwsSnsService, SqsConsumerService],
  exports: [AwsS3Service, AwsSqsService, AwsSnsService, SqsConsumerService], // 🔥 Agora exporta o AwsS3Service corretamente!
})
export class AwsModule {}
