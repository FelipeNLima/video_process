import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Consumer } from 'sqs-consumer';
import { VideoService } from '../src/Application/services/video.service';
import { SqsConsumerService } from '../src/infra/aws/aws-consumer.service';

jest.mock('sqs-consumer', () => ({
  Consumer: {
    create: jest.fn().mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
      on: jest.fn(),
    }),
  },
}));

describe('SqsConsumerService', () => {
  let service: SqsConsumerService;
  let videoService: jest.Mocked<VideoService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqsConsumerService,
        {
          provide: VideoService,
          useValue: { downloadAndProcessVideo: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'AWS_BUCKET_NAME_VIDEO') return 'test-bucket';
              if (key === 'AWS_SQS_QUEUE') return 'https://sqs.queue.url';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SqsConsumerService>(SqsConsumerService);
    videoService = module.get(VideoService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize the SQS consumer on module init', () => {
    const spy = jest.spyOn(service as any, 'handleInitConsumer');
    service.onModuleInit();
    expect(spy).toHaveBeenCalled();
  });

  it('should stop the consumer on module destroy', () => {
    service.onModuleInit(); // Ensure consumer is initialized
    service.onModuleDestroy();
    expect(Consumer.create({ queueUrl: '', handleMessage: async () => {} }).stop).toHaveBeenCalled();
  });

  it('should process messages correctly', async () => {
    const mockMessage = JSON.stringify({ bucket: 'test-bucket', key: 'test-video.mp4', videoID: '1' });
    await (service as any).processMessage(mockMessage);

    expect(videoService.downloadAndProcessVideo).toHaveBeenCalledWith(
      'test-bucket',
      'test-video.mp4',
      '1'
    );
  });

  it('should log errors from the consumer', () => {
    // Spy on the NestJS Logger's `error` method
    const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  
    service.onModuleInit(); // Initialize the consumer
  
    // Simulate the error event
    const errorCallback = (Consumer.create({ queueUrl: '', handleMessage: async () => {} }).on as jest.Mock).mock.calls.find(
      ([event]) => event === 'error',
    )?.[1];
  
    if (errorCallback) {
      errorCallback(new Error('Test Error')); // Trigger error event
    }
  
    // Expect the error to be logged
    expect(loggerSpy).toHaveBeenCalledWith('Test Error');
  
    // Restore original logger behavior
    loggerSpy.mockRestore();
  });
});
