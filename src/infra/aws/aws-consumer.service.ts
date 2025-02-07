import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer } from 'sqs-consumer';
import { VideoService } from 'src/Application/services/video.service';

@Injectable()
export class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
  private consumer: Consumer;
  private readonly logger = new Logger(SqsConsumerService.name);

  constructor(
    private readonly videoService: VideoService,
    private readonly configService: ConfigService,
  ) {}

  private readonly AWS_BUCKET_NAME_VIDEO = this.configService.get<string>(
    'AWS_BUCKET_NAME_VIDEO',
  );
  private readonly AWS_SQS_QUEUE = this.configService.get<string>(
    'AWS_SQS_QUEUE',
  );


  onModuleInit() {
    this.handleInitConsumer();
  }

  onModuleDestroy() {
    if (this.consumer) {
      this.consumer.stop();
    }
  }

  private handleInitConsumer() {
    this.consumer = Consumer.create({
      queueUrl: this.AWS_SQS_QUEUE,
      handleMessage: async (message) => this.processMessage(message?.Body),
      batchSize: 10,
    });

    this.consumer.on('error', (err) => this.logger.error(err.message));
    this.consumer.on('processing_error', (err) =>
      this.logger.error(err.message),
    );
    this.consumer.on('timeout_error', (err) => this.logger.error(err.message));

    this.consumer.start();
  }

  private async processMessage(messageBody: string): Promise<void> {
    const parseMessage = JSON.parse(messageBody);
    const { key } = parseMessage;
    this.logger.log('🚀 started consumer '+ key);

    return await this.videoService.downloadAndProcessVideo(
      this.AWS_BUCKET_NAME_VIDEO,
      key
    );
  }
}
