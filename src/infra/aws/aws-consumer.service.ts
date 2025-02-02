import { ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VideoService } from 'src/Application/services/video.service';
import { AwsS3Service } from './aws-s3.service';

@Injectable()
export class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
  private sqsClient: SQSClient;
  private queueUrl: string;
  isRunning: boolean;

  constructor(
    private readonly videoService: VideoService,
    private readonly configService: ConfigService,
    private awsS3: AwsS3Service,
  ) {
    this.sqsClient = new SQSClient({
      region: this.configService.get<string>('AWS_REGION'),
      endpoint: this.configService.get<string>('AWS_SQS_QUEUE'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
        sessionToken: this.configService.get<string>('AWS_SESSION_TOKEN'),
      },
    });
  }

  private readonly AWS_BUCKET_NAME_VIDEO = this.configService.get<string>(
    'AWS_BUCKET_NAME_VIDEO',
  );

  async onModuleInit() {
    this.isRunning = true;
    this.listenToQueue();
  }

  async onModuleDestroy() {
    this.isRunning = false;
  }

  async listenToQueue() {
    while (this.isRunning) {
      try {
        // Recebe mensagens da fila
        const command = new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 10, // Máximo de mensagens por chamada
          WaitTimeSeconds: 10, // Long polling
        });

        const response = await this.sqsClient.send(command);

        if (response.Messages) {
          for (const message of response.Messages) {
            // Processa a mensagem
            await this.processMessage(message.Body);
          }
        }
      } catch (error) {
        console.error('Erro ao consumir mensagens da SQS:', error);
      }
    }
  }

  private async processMessage(messageBody: string): Promise<void> {
    const parseMessage = JSON.parse(messageBody);
    const { key } = parseMessage;

    await this.videoService.downloadAndProcessVideo(
      this.AWS_BUCKET_NAME_VIDEO,
      key,
    );
  }
}
