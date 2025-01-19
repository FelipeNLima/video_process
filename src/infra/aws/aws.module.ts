import { Module } from '@nestjs/common';
import { SqsConsumerService } from './aws-consumer.service';
import { AwsS3Service } from './aws-s3.service';
import { AwsSqsService } from './aws-sqs.service';

@Module({
  providers: [AwsSqsService, AwsS3Service, SqsConsumerService],
  exports: [AwsSqsService, AwsS3Service, SqsConsumerService],
})
export class AwsModule {}
