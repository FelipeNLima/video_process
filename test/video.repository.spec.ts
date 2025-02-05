import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VideoRepository } from 'src/Domain/Repositories/video.repository';
import { AwsS3Service } from 'src/infra/aws/aws-s3.service';
import { AwsSnsService } from 'src/infra/aws/aws-sns.service';
import { AwsSqsService } from 'src/infra/aws/aws-sqs.service';
import { Video } from 'src/infra/typeorm/entities/video.entity';
import { Repository } from 'typeorm';

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

const mockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  save: jest.fn().mockResolvedValue({}),
  create: jest.fn().mockReturnValue({}),
  update: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
});


describe('VideoRepository', () => {
  let videoRepository: VideoRepository;
  let repositoryMock: jest.Mocked<Repository<Video>>;
  let awsS3Service: AwsS3Service;
  let awsSqsService: AwsSqsService;
  let awsSnsService: AwsSnsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoRepository,
        {
          provide: getRepositoryToken(Video),
          useValue: mockRepository, // Providing mock repository
      },
        {
          provide: AwsS3Service,
          useValue: {
            getFromS3Bucket: jest.fn(),
            sendToS3Bucket: jest.fn(),
          },
        },
        {
          provide: AwsSqsService,
          useValue: { sendMessage: jest.fn() },
        },
        {
          provide: AwsSnsService,
          useValue: { sendEmail: jest.fn() },
        },
      ],
    }).compile();

    videoRepository = module.get<VideoRepository>(VideoRepository);
    repositoryMock = module.get(getRepositoryToken(Video));
    awsS3Service = module.get<AwsS3Service>(AwsS3Service);
    awsSqsService = module.get<AwsSqsService>(AwsSqsService);
    awsSnsService = module.get<AwsSnsService>(AwsSnsService);
  });

  it('should be defined', () => {
    expect(videoRepository).toBeDefined();
  });

  describe('updateStatus', () => {
    it('should update the video status', async () => {
      jest.spyOn(repositoryMock, 'update').mockResolvedValue({} as any);
      await expect(videoRepository.updateStatus('123', 'http://example.com')).resolves.toEqual({});
      expect(repositoryMock.update).toHaveBeenCalledWith('123', { status: 'finality', zipURL: 'http://example.com' });
    });

    it('should throw an error if update fails', async () => {
      jest.spyOn(repositoryMock, 'update').mockRejectedValue(new Error('DB Error'));
      await expect(videoRepository.updateStatus('123', 'http://example.com')).rejects.toThrow('Error update DB');
    });
  });

  describe('getFromS3Bucket', () => {
    it('should call awsS3Service.getFromS3Bucket', async () => {
      jest.spyOn(awsS3Service, 'getFromS3Bucket').mockResolvedValue('fileData');
      await expect(videoRepository.getFromS3Bucket('key', 'bucket')).resolves.toBe('fileData');
      expect(awsS3Service.getFromS3Bucket).toHaveBeenCalledWith('key', 'bucket');
    });
  });

  describe('sendToS3Bucket', () => {
    it('should call awsS3Service.sendToS3Bucket', async () => {
      jest.spyOn(awsS3Service, 'sendToS3Bucket').mockResolvedValue(undefined);
      await expect(videoRepository.sendToS3Bucket(Buffer.from('file'), 'key', 'queue')).resolves.toBe('uploaded');
      expect(awsS3Service.sendToS3Bucket).toHaveBeenCalledWith(Buffer.from('file'), 'key', 'queue');
    });
  });

  describe('sendToSqs', () => {
    it('should call awsSqsService.sendMessage', async () => {
      jest.spyOn(awsSqsService, 'sendMessage').mockResolvedValueOnce(undefined);
      await expect(videoRepository.sendToSqs('msg', 'queue')).resolves.toBe('message sent');
      expect(awsSqsService.sendMessage).toHaveBeenCalledWith('msg', 'queue');
    });
  });

  describe('sendSnsEmail', () => {
    it('should call awsSnsService.sendEmail', async () => {
      jest.spyOn(awsSnsService, 'sendEmail').mockResolvedValue(undefined);
      await expect(videoRepository.sendSnsEmail({ to: 'test@example.com' })).resolves.toBe('email sent');
      expect(awsSnsService.sendEmail).toHaveBeenCalledWith({ to: 'test@example.com' });
    });
  });
});