import {
  DeleteMessageCommand,
  SendMessageCommand,
  SQSClient
} from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsSqsService {
  sqsClient: SQSClient;

  constructor(private readonly configService: ConfigService) {
    this.sqsClient = new SQSClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
        sessionToken: this.configService.get<string>('AWS_SESSION_TOKEN'),
      },
    });
  }

  private readonly logger = new Logger(AwsSqsService.name);
  async sendMessage(message: any, queueUrl: string) {
    try {
      const params = {
        DelaySeconds: 10,
        MessageBody: JSON.stringify(message),
        QueueUrl: queueUrl,
      };

      await this.sqsClient.send(new SendMessageCommand(params));
    } catch (error) {
      this.logger.error('FAIL SQS', error);
    }
  }

  async deleteMessage(queueUrl: string, receiptHandle: string) {
    try {
      const params = {
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      };

      await this.sqsClient.send(new DeleteMessageCommand(params));
    } catch (error) {
      this.logger.error('FAIL SQS', error);
    }
  }
}
