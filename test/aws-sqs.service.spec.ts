import { DeleteMessageCommand, SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AwsSqsService } from 'src/infra/aws/aws-sqs.service';

jest.mock('@aws-sdk/client-sqs'); // Mock AWS SDK

describe('AwsSqsService', () => {
  let service: AwsSqsService;
  let sqsClientMock: jest.Mocked<SQSClient>;

  beforeEach(async () => {
    sqsClientMock = new SQSClient({}) as jest.Mocked<SQSClient>;
    sqsClientMock.send = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwsSqsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              const mockConfig = {
                AWS_REGION: 'us-east-1',
                AWS_ACCESS_KEY_ID: 'test-access-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret-key',
                AWS_SESSION_TOKEN: 'test-session-token',
              };
              return mockConfig[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AwsSqsService>(AwsSqsService);
    (service as any).sqsClient = sqsClientMock; // Replace actual client with mock
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message to SQS', async () => {
      const mockMessage = { key: 'test-key' };
      const mockQueueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/testQueue';

      await service.sendMessage(mockMessage, mockQueueUrl);

      expect(sqsClientMock.send).toHaveBeenCalledWith(
        expect.any(SendMessageCommand)
      );
    });

    it('should log an error if sending fails', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      const mockMessage = { key: 'test-key' };
      const mockQueueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/testQueue';

      (sqsClientMock.send as jest.Mock).mockRejectedValueOnce(new Error('SQS Send Error'));
      await service.sendMessage(mockMessage, mockQueueUrl);

      expect(loggerSpy).toHaveBeenCalledWith('FAIL SQS', expect.any(Error));
      loggerSpy.mockRestore();
    });
  });

  describe('deleteMessage', () => {
    it('should delete a message from SQS', async () => {
      const mockQueueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/testQueue';
      const mockReceiptHandle = 'test-receipt-handle';

      await service.deleteMessage(mockQueueUrl, mockReceiptHandle);

      expect(sqsClientMock.send).toHaveBeenCalledWith(
        expect.any(DeleteMessageCommand)
      );
    });

    it('should log an error if deletion fails', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      const mockQueueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/testQueue';
      const mockReceiptHandle = 'test-receipt-handle';

      (sqsClientMock.send as jest.Mock).mockRejectedValue(new Error('SQS Delete Error'));
      await service.deleteMessage(mockQueueUrl, mockReceiptHandle);

      expect(loggerSpy).toHaveBeenCalledWith('FAIL SQS', expect.any(Error));
      loggerSpy.mockRestore();
    });
  });
});
