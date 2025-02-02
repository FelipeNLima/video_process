import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { format } from 'date-fns';
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
  let awsS3: jest.Mocked<AwsS3Service>;
  let awsSqs: jest.Mocked<AwsSqsService>;
  let awsSns: jest.Mocked<AwsSnsService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        { provide: VideoRepository, useValue: { processVideo: jest.fn() } },
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
    awsS3 = module.get(AwsS3Service);
    awsSqs = module.get(AwsSqsService);
    awsSns = module.get(AwsSnsService);
    configService = module.get(ConfigService);
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
      expect(awsS3.sendToS3Bucket).toHaveBeenCalledWith(
        Buffer.from('zip-content'),
        `file-${format(new Date(), 'dd-MM-yyyy')}-mock-uuid.zip`,
        'test-bucket',
      );
      expect(awsSqs.sendMessage).toHaveBeenCalledWith(
        { key: expect.any(String), bucketName: 'test-bucket' },
        'test-queue',
      );
      expect(awsSns.sendEmail).toHaveBeenCalledWith({
        Subject: 'Arquivo Zipado com sucesso',
        Message: 'O seu video foi processado com sucesso',
        TopicArn: 'test-topic-arn',
      });
    });
  });

  describe('downloadAndProcessVideo', () => {
    it('should download video, process it, and upload zip to S3', async () => {
      const mockFilePath = 'test-video.mp4';
      awsS3.getFromS3Bucket.mockResolvedValue(mockFilePath);

      const processedFile = {
        file: 'processed-file',
        fileContent: Buffer.from('zip-content'),
      };
      videoRepository.processVideo.mockResolvedValue(processedFile);

      await service.downloadAndProcessVideo('test-bucket', 'test-key');

      expect(awsS3.getFromS3Bucket).toHaveBeenCalledWith(
        'test-key',
        'test-bucket',
      );
      expect(videoRepository.processVideo).toHaveBeenCalled();
      expect(awsS3.sendToS3Bucket).toHaveBeenCalledWith(
        Buffer.from('zip-content'),
        `file-${format(new Date(), 'dd-MM-yyyy')}-mock-uuid.zip`,
        'test-bucket',
      );
      expect(awsSqs.sendMessage).toHaveBeenCalledWith(
        { key: expect.any(String), bucketName: 'test-bucket' },
        'test-queue',
      );
      expect(awsSns.sendEmail).toHaveBeenCalled();
    });
  });

  it('should log messages', () => {
    const loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    service['logger'].log('Test log message');

    expect(loggerSpy).toHaveBeenCalledWith('Test log message');

    loggerSpy.mockRestore();
  });
});
