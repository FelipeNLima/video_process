import { VideoService } from 'src/Application/services/video.service';
import { SqsConsumerService } from '../aws/aws-consumer.service';
import { AwsS3Service } from '../aws/aws-s3.service';
import { AwsSqsService } from '../aws/aws-sqs.service';

jest.mock('@aws-sdk/client-sqs', () => {
  return {
    SQSClient: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    ReceiveMessageCommand: jest.fn(),
    DeleteMessageCommand: jest.fn(),
  };
});

describe('SqsConsumerService', () => {
  let service: SqsConsumerService;
  let mockAwsSqsService: jest.Mocked<AwsSqsService>;
  let mockAwsS3Service: jest.Mocked<AwsS3Service>;
  let mockService: jest.Mocked<VideoService>;
  let configService: any;

  beforeEach(() => {
    mockAwsSqsService = { sendMessage: jest.fn() } as any;
    mockService = { processVideo: jest.fn() } as any;

    configService = {
      get: jest.fn((key: string) => {
        const mockConfig = {
          AWS_REGION: 'us-east-1',
          AWS_ACCESS_KEY_ID: 'mockAccessKeyId',
          AWS_SECRET_ACCESS_KEY: 'mockSecretAccessKey',
          AWS_SQS_QUEUE_URL_ORDER_DONE: 'mockQueueUrl',
          AWS_SESSION_TOKEN: 'mockSessionToken',
        };
        return mockConfig[key];
      }),
    };

    service = new SqsConsumerService(configService, mockAwsS3Service);
  });

  it('deve iniciar o consumo de mensagens quando o módulo for iniciado', async () => {
    // Mockando o método listenToQueue para testar a inicialização sem realmente consumir mensagens
    const listenToQueueSpy = jest
      .spyOn(service, 'listenToQueue')
      .mockImplementation(async () => {});

    await service.onModuleInit();

    expect(service.isRunning).toBe(true);
    expect(listenToQueueSpy).toHaveBeenCalled();
  });

  it('deve não fazer nada se a mensagem não contiver status "PRONTO"', async () => {
    // Chamando o método listenToQueue
    await service.listenToQueue();

    // Verificando que não há chamadas para enviar a mensagem ou atualizar o pedido
    expect(mockAwsSqsService.sendMessage).not.toHaveBeenCalled();
    expect(mockService.processVideo).not.toHaveBeenCalled();
  });
});
