import { AwsSqsService } from '../src/Application/services/sqs.service';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';

jest.mock('@aws-sdk/client-sqs', () => {
    return {
      SQSClient: jest.fn().mockImplementation(() => ({
        send: jest.fn(),
      })),
      SendMessageCommand: jest.fn(), // Mock do comando, caso necessário
    };
  });

describe('AwsSqsService', () => {
  let service: AwsSqsService;
  let configService: ConfigService;
  let mockSqsClient: jest.Mocked<SQSClient>;

  beforeEach(() => {
    // Mock do ConfigService
    configService = {
      get: jest.fn((key: string) => {
        const mockConfig = {
          AWS_ACCESS_KEY_ID: 'mockAccessKeyId',
          AWS_SECRET_ACCESS_KEY: 'mockSecretAccessKey',
          AWS_REGION: 'mockRegion',
          AWS_SESSION_TOKEN: 'mockSessionToken',
        };
        return mockConfig[key];
      }),
    } as unknown as ConfigService;

    // Mock do SQSClient
    mockSqsClient = {
      send: jest.fn() as jest.Mock<Promise<unknown>>, // Garantindo tipo no método send
    } as unknown as jest.Mocked<SQSClient>;

    // Substituindo o construtor do SQSClient no mock
    (SQSClient as jest.Mock).mockImplementation(() => mockSqsClient);

    // Instanciando o serviço
    service = new AwsSqsService(configService);
  });

  it('deve enviar uma mensagem para a fila SQS', async () => {
    const queueUrl = 'https://mock-queue-url';
    const message = { key: 'value' };

    // Mock para o método send do SQSClient

    await service.sendMessage(queueUrl, message);

    expect(mockSqsClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
      })
    );
  });

});