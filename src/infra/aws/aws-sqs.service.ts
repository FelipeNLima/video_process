import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageBatchCommand,
  SendMessageBatchCommandInput,
  SendMessageBatchCommandOutput,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsSqsService {
  sqsClient: SQSClient;

  constructor(private readonly configService: ConfigService) {
    this.sqsClient = new SQSClient({
      region: this.configService.get<string>('AWS_REGION'),
      endpoint: this.configService.get<string>('AWS_URL'),
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

  async sendMessageAsBase64(message: any, queueUrl: string) {
    try {
      const params = {
        DelaySeconds: 10,
        MessageBody: Buffer.from(JSON.stringify(message)).toString('base64'),
        QueueUrl: queueUrl,
      };

      return await this.sqsClient.send(new SendMessageCommand(params));
    } catch (error) {
      this.logger.error('FAIL BASE64 SQS', error);
    }
  }

  async sendBatchMessageAsBase64<T extends object>(
    messages: T[],
    queueUrl: string,
  ) {
    try {
      const batchPromises: Promise<SendMessageBatchCommandOutput>[] = [];
      const batchSize = 10; // AWS SQS Batch has a limit of 10 messages per batch

      for (
        let currentIndex = 0;
        currentIndex < messages.length;
        currentIndex += batchSize
      ) {
        const batch = messages.slice(currentIndex, currentIndex + batchSize);

        const batchEntries: SendMessageBatchCommandInput['Entries'] = batch.map(
          (message, index) => ({
            Id: `${currentIndex + index}`,
            MessageBody: Buffer.from(JSON.stringify(message)).toString(
              'base64',
            ),
            DelaySeconds: 10,
          }),
        );

        const params: SendMessageBatchCommandInput = {
          QueueUrl: queueUrl,
          Entries: batchEntries,
        };

        batchPromises.push(
          this.sqsClient.send(new SendMessageBatchCommand(params)),
        );
      }

      await Promise.all(batchPromises);
    } catch (error) {
      this.logger.error('FAIL BATCH BASE64 SQS', error);
    }
  }

  async sendRawMessage(rawMessage: any, queueUrl: string) {
    try {
      const params = {
        DelaySeconds: 10,
        MessageBody: rawMessage,
        QueueUrl: queueUrl,
      };

      return await this.sqsClient.send(new SendMessageCommand(params));
    } catch (error) {
      this.logger.error('FAIL SQS', error);
    }
  }

  async retrieveMessage(queueUrl: string) {
    try {
      const params = {
        MaxNumberOfMessages: 10,
        MessageAttributeNames: ['All'],
        QueueUrl: queueUrl,
        VisibilityTimeout: 20,
        WaitTimeSeconds: 5,
      };

      const data = await this.sqsClient.send(new ReceiveMessageCommand(params));
      return data;
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
