import { S3Client } from '@aws-sdk/client-s3';
import { SNSClient } from '@aws-sdk/client-sns';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { VideoRepository } from 'src/Domain/Repositories/video.repository';
import { AwsS3Service } from 'src/infra/aws/aws-s3.service';
import { AwsSnsService } from 'src/infra/aws/aws-sns.service';
import { AwsSqsService } from 'src/infra/aws/aws-sqs.service';
import { videoDto } from '../dtos/video.dto';
import { VideoService } from '../services/video.service';


// Mock ffmpeg
jest.mock('fluent-ffmpeg', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === 'end') {
        callback(); // Simulate 'end' event immediately
      }
      if (event === 'error') {
        callback(new Error('FFmpeg error')); // Simulate 'error' event if needed
      }
      return this;
    }),
    save: jest.fn(),
  }));
});

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false), // Assume outputDir does not exist
  mkdirSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('mock file content'),
  promises: {
    readFile: jest.fn().mockResolvedValue('mocked file content'),
  },
  createReadStream: jest.fn().mockReturnValue('mocked stream'),
  createWriteStream: jest.fn().mockReturnValue({
    on: jest.fn().mockImplementation((event, cb) => {
      if (event === 'close') cb();
    }),
  }),
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

// Mock the S3Client
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

describe('VideoService', () => {
  let service: VideoService;
  let configService: ConfigService;
  let videoRepository: VideoRepository;
  let awsS3: AwsS3Service; 
  let awsSqs: AwsSqsService; 
  let awsSns: AwsSnsService;
  let s3ClientMock: S3Client;
  let snsClient: SNSClient;

  beforeAll(() => {
    // Set environment variables for testing
    dotenv.config({ path: '.env' });
  });

  beforeEach(() => {
    s3ClientMock = new S3Client();
    snsClient = new SNSClient();
    configService = new ConfigService();
    videoRepository = new VideoRepository();
    awsS3 = new AwsS3Service(s3ClientMock, configService);
    awsSqs = new AwsSqsService(configService);
    awsSns = new AwsSnsService(snsClient, configService);
    service = new VideoService(videoRepository, awsS3, awsSqs, awsSns, configService);
  });

  it('should process video and return zip path', async () => {
    const mockUploadResponse = { $metadata: { httpStatusCode: 200 } };

    // Mock the send method of S3Client
    (s3ClientMock.send as jest.Mock).mockResolvedValueOnce(mockUploadResponse);

    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'video.mp4',
      encoding: '7bit',
      mimetype: 'video/mp4',
      size: 1024,
      stream: fs.createReadStream('path/to/video.mp4'),
      destination: 'uploads/',
      filename: 'video.mp4',
      path: 'uploads/video.mp4',
      buffer: Buffer.from('dummy content'),
    };
    const mockOutputDir = 'test/frames';
    const mockZipPath = 'test/output.zip';

    const videoDto: videoDto = {
      file: mockFile,
      outputDir: mockOutputDir,
      zipPath: mockZipPath,
    };

    const zipPath = await service.processVideo(videoDto);

    expect(zipPath).toBe(mockZipPath);
    expect(fs.existsSync).toHaveBeenCalledWith(mockOutputDir);
    expect(fs.mkdirSync).toHaveBeenCalledWith(mockOutputDir, {
      recursive: true,
    });
  });
});
