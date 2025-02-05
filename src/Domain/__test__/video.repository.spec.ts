import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import { AwsS3Service } from 'src/infra/aws/aws-s3.service';
import { AwsSnsService } from 'src/infra/aws/aws-sns.service';
import { AwsSqsService } from 'src/infra/aws/aws-sqs.service';
import { VideoRepository } from '../Repositories/video.repository';

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false), // Assume outputDir does not exist
  mkdirSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('mock file content'),
  createWriteStream: jest.fn().mockReturnValue({
    on: jest.fn().mockImplementation((event, cb) => {
      if (event === 'close') cb();
    }),
  }),
  promises: {
    // Mock any fs.promises functions you are using
    readFile: jest.fn(),
  },
}));

// Mock archiver
jest.mock('archiver', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn(),
    directory: jest.fn(),
    on: jest.fn(),
    finalize: jest.fn(),
  }));
});

// Mock ffmpeg
jest.mock('fluent-ffmpeg', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === 'end') {
        callback();  // Simulate 'end' event immediately
      }
      if (event === 'error') {
        callback(new Error('FFmpeg error'));  // Simulate 'error' event if needed
      }
      return this;
    }),
    save: jest.fn(),
  }));
});

describe('VideoRepository', () => {
  let videoRepository: VideoRepository;
  let awsS3Service: AwsS3Service;
  let awsSqsService: AwsSqsService;
  let awsSnsService: AwsSnsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoRepository,
        {
          provide: AwsS3Service,
          useValue: {
            getFromS3Bucket: jest.fn(),
            sendToS3Bucket: jest.fn(),
          },
        },
        {
          provide: AwsSqsService,
          useValue: {
            sendMessage: jest.fn(),
          },
        },
        {
          provide: AwsSnsService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    videoRepository = module.get<VideoRepository>(VideoRepository);
    awsS3Service = module.get<AwsS3Service>(AwsS3Service);
    awsSqsService = module.get<AwsSqsService>(AwsSqsService);
    awsSnsService = module.get<AwsSnsService>(AwsSnsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processVideo', () => {
    it('should process video and return zip path', async () => {
      const mockVideoPath = 'test/video.mp4'
      const mockOutputDir = 'test/frames'
      const mockZipPath = 'test/output.zip'
  
      const zipPath = await videoRepository.processVideo(
        mockVideoPath,
        mockOutputDir,
        mockZipPath,
      );
  
      // Mock the constructor to return our mock object
  
      expect(zipPath).toEqual({"file": "test/output.zip", "fileContent": "mock file content"});
      expect(fs.existsSync).toHaveBeenCalledWith(mockOutputDir);
      expect(fs.mkdirSync).toHaveBeenCalledWith(mockOutputDir, {
        recursive: true,
      });
    });
  });

  describe('getFromS3Bucket', () => {
    it('should call getFromS3Bucket with correct parameters', async () => {
      const key = 'test-key';
      const bucket = 'test-bucket';
      await videoRepository.getFromS3Bucket(key, bucket);
      expect(awsS3Service.getFromS3Bucket).toHaveBeenCalledWith(key, bucket);
    });
  });

  describe('sendToS3Bucket', () => {
    it('should call sendToS3Bucket with correct parameters', async () => {
      const fileContent = Buffer.from('file-content');
      const s3Key = 'test-key';
      const queue = 'test-queue';
      await videoRepository.sendToS3Bucket(fileContent, s3Key, queue);
      expect(awsS3Service.sendToS3Bucket).toHaveBeenCalledWith(fileContent, s3Key, queue);
    });
  });

  describe('sendToSqs', () => {
    it('should call sendMessage with correct parameters', async () => {
      const message = 'test-message';
      const queue = 'test-queue';
      await videoRepository.sendToSqs(message, queue);
      expect(awsSqsService.sendMessage).toHaveBeenCalledWith(message, queue);
    });
  });

  describe('sendSnsEmail', () => {
    it('should call sendEmail with correct parameters', async () => {
      const params = { subject: 'test', message: 'test-message', email: 'test@example.com' };
      await videoRepository.sendSnsEmail(params);
      expect(awsSnsService.sendEmail).toHaveBeenCalledWith(params);
    });
  });
});
