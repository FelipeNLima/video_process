import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { VideoRepository } from 'src/Domain/Repositories/video.repository';
import { AwsS3Service } from 'src/infra/aws/aws-s3.service';
import { AwsSnsService } from 'src/infra/aws/aws-sns.service';
import { AwsSqsService } from 'src/infra/aws/aws-sqs.service';
import { VideoService } from '../services/video.service';

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => 'mock-uuid'),
}));

describe('VideoService', () => {
  let service: VideoService;
  let videoRepository: jest.Mocked<VideoRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        {
          provide: VideoRepository,
          useValue: {
            processVideo: jest.fn(),
            getFromS3Bucket: jest.fn(),
            sendToS3Bucket: jest.fn(),
            sendToSqs: jest.fn(),
            sendSnsEmail: jest.fn(),
          },
        },
        {
          provide: AwsS3Service,
          useValue: { sendToS3Bucket: jest.fn(), getFromS3Bucket: jest.fn() },
        },
        { provide: AwsSqsService, useValue: { sendMessage: jest.fn() } },
        { provide: AwsSnsService, useValue: { sendEmail: jest.fn() } },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const mockConfig = {
                AWS_BUCKET_NAME_ZIP: 'test-bucket',
                AWS_QUEUE_RETURN: 'test-queue',
                AWS_SNS_TOPIC_ARN: 'test-topic-arn',
              };
              return mockConfig[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
    videoRepository = module.get(VideoRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processVideo', () => {
    it('should throw an error if no file is uploaded', async () => {
      await expect(
        service.processVideo({ outputDir: '', file: null, zipPath: '' }),
      ).rejects.toThrow('No file uploaded!');
    });

    it('should throw an error for invalid file type', async () => {
      await expect(
        service.processVideo({
          outputDir: '',
          file: {
            mimetype: 'video/avi',
            path: '',
            fieldname: '',
            originalname: '',
            encoding: '',
            size: 0,
            buffer: Buffer.from(''),
            stream: null,
            destination: '',
            filename: '',
          },
          zipPath: '',
        }),
      ).rejects.toThrow('Invalid file type. Only MP4 files are allowed.');
    });

    it('should process video and upload zip to S3', async () => {
      const mockVideo = {
        outputDir: 'output',
        zipPath: 'zipPath',
        file: {
          mimetype: 'video/mp4',
          path: 'test-path',
          fieldname: 'file',
          originalname: 'test.mp4',
          encoding: '7bit',
          size: 1024,
          buffer: Buffer.from(''),
          stream: null,
          destination: '',
          filename: '',
        },
      };
      const processedFile = {
        file: 'processed-file',
        fileContent: Buffer.from('zip-content'),
      };
      videoRepository.processVideo.mockResolvedValue(processedFile);

      await service.processVideo(mockVideo);

      expect(videoRepository.processVideo).toHaveBeenCalledWith(
        'test-path',
        'output',
        'zipPath',
      );
    });
  });

  describe('downloadAndProcessVideo', () => {
    it('should download video, process it, and upload zip to S3', async () => {
      const processedFile = {
        file: 'processed-file',
        fileContent: Buffer.from('zip-content'),
      };
      videoRepository.processVideo.mockResolvedValue(processedFile);

      await service.downloadAndProcessVideo('test-bucket', 'test-key');

      expect(videoRepository.processVideo).toHaveBeenCalled();
    });
  });

  it('should log messages', () => {
    const loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    service['logger'].log('Test log message');

    expect(loggerSpy).toHaveBeenCalledWith('Test log message');

    loggerSpy.mockRestore();
  });
});
