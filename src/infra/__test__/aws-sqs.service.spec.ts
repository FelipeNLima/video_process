// sqs.service.spec.ts
import * as AWS from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AwsSqsService } from '../aws/aws-sqs.service';

jest.mock('@aws-sdk/client-sqs', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-sqs');
  return {
    ...originalModule,
    SQSClient: jest.fn(() => ({
      send: jest.fn().mockResolvedValue({
        QueueUrl:
          'https://mock-queue-url',
      }),
    })),
    GetQueueUrlCommand: jest.fn(),
  };
});

describe('SqsService', () => {
  let sqsClientMock: jest.Mocked<AWS.SQSClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwsSqsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mockConfigValue'),
          },
        },
        {
          provide: AWS.SQSClient,
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    sqsClientMock = module.get<AWS.SQSClient>(
      AWS.SQSClient,
    ) as jest.Mocked<AWS.SQSClient>;
  });

  it('should resolve with the queue URL', async () => {
    const mockResponse: AWS.GetQueueUrlCommandOutput = {
      QueueUrl:
        'https://mock-queue-url',
      $metadata: {},
    };

    sqsClientMock.send.mockResolvedValue(mockResponse as never);

    const sqsClient = new AWS.SQSClient({});
    const command = new AWS.GetQueueUrlCommand({ QueueName: 'testQueue' });
    const result = await sqsClient.send(command);

    expect(result.QueueUrl).toBe(
      'https://mock-queue-url',
    );
  });
});

