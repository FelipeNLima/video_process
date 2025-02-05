import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { format } from 'date-fns';
import { videoDto } from 'src/Application/dtos/video.dto';
import { VideoService } from 'src/Application/services/video.service';
import { VideoRepository } from 'src/Domain/Repositories/video.repository';

describe('VideoService', () => {
  let service: VideoService;
  let videoRepositoryMock: Partial<VideoRepository>;
  let configServiceMock: Partial<ConfigService>;

  beforeEach(async () => {
    videoRepositoryMock = {
      processVideo: jest.fn(),
      sendToS3Bucket: jest.fn(),
      sendToSqs: jest.fn(),
      sendSnsEmail: jest.fn(),
      getFromS3Bucket: jest.fn(),
      updateStatus: jest.fn(),
    };

    configServiceMock = {
      get: jest.fn().mockImplementation((key: string) => {
        const config = {
          AWS_BUCKET_NAME_ZIP: 'test-bucket',
          AWS_QUEUE_RETURN: 'test-queue',
          AWS_SNS_TOPIC_ARN: 'test-topic',
          AWS_REGION: 'us-east-1',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        { provide: VideoRepository, useValue: videoRepositoryMock },
        { provide: ConfigService, useValue: configServiceMock },
        Logger,
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processVideo', () => {
    it('should process the video and send to S3 and SQS', async () => {
      const mockVideoDto: videoDto = {
        outputDir: '/output/dir',
        file: { mimetype: 'video/mp4', path: 'path/to/video.mp4' } as any,
        zipPath: '/path/to/zip',
      };

      const processedVideo = { file: 'processed-video' };
      videoRepositoryMock.processVideo = jest.fn().mockResolvedValue(processedVideo);
      videoRepositoryMock.sendToS3Bucket = jest.fn().mockResolvedValue(undefined);
      videoRepositoryMock.sendToSqs = jest.fn().mockResolvedValue(undefined);
      videoRepositoryMock.sendSnsEmail = jest.fn().mockResolvedValue(undefined);

      const result = await service.processVideo(mockVideoDto);

      expect(result).toBe(processedVideo.file);
      expect(videoRepositoryMock.sendToS3Bucket).toHaveBeenCalled();
      expect(videoRepositoryMock.sendToSqs).toHaveBeenCalled();
      expect(videoRepositoryMock.sendSnsEmail).toHaveBeenCalled();
    });

    it('should throw error if no file is uploaded', async () => {
      const mockVideoDto: videoDto = { outputDir: '/output/dir', file: null, zipPath: '/path/to/zip' };

      await expect(service.processVideo(mockVideoDto)).rejects.toThrow('No file uploaded!');
    });

    it('should throw error if file is not an MP4', async () => {
      const mockVideoDto: videoDto = {
        outputDir: '/output/dir',
        file: { mimetype: 'video/avi', path: 'path/to/video.avi' } as any,
        zipPath: '/path/to/zip',
      };

      await expect(service.processVideo(mockVideoDto)).rejects.toThrow('Invalid file type. Only MP4 files are allowed.');
    });
  });

  describe('downloadAndProcessVideo', () => {
    it('should download, process video, and update URL in DB', async () => {
      const date = format(new Date(), 'dd-MM-yyyy');
      const mockVideoID = '123';
      const mockBucket = 'test-bucket';
      const mockKey = 'test-key';
      const filePath = '/path/to/downloaded/file';
      const fileContent = 'processed-content';
      const url = `https://test-bucket.s3.us-east-1.amazonaws.com/file-${date}-test-key.zip`;

      videoRepositoryMock.getFromS3Bucket = jest.fn().mockResolvedValue(filePath);
      videoRepositoryMock.processVideo = jest.fn().mockResolvedValue({ fileContent });
      videoRepositoryMock.sendToS3Bucket = jest.fn().mockResolvedValue(undefined);
      videoRepositoryMock.updateStatus = jest.fn().mockResolvedValue(undefined);
      videoRepositoryMock.sendSnsEmail = jest.fn().mockResolvedValue(undefined);

      await service.downloadAndProcessVideo(mockBucket, mockKey, mockVideoID);

      expect(videoRepositoryMock.getFromS3Bucket).toHaveBeenCalledWith(mockKey, mockBucket);
      expect(videoRepositoryMock.processVideo).toHaveBeenCalledWith(filePath, expect.any(String), expect.any(String));
      expect(videoRepositoryMock.sendToS3Bucket).toHaveBeenCalled();
      expect(videoRepositoryMock.updateStatus).toHaveBeenCalledWith(mockVideoID, url);
    });

    it('should handle errors gracefully and send an email on failure', async () => {
      const mockVideoID = '123';
      const mockBucket = 'test-bucket';
      const mockKey = 'test-key';

      videoRepositoryMock.getFromS3Bucket = jest.fn().mockRejectedValue(new Error('S3 error'));

      await service.downloadAndProcessVideo(mockBucket, mockKey, mockVideoID);

      expect(videoRepositoryMock.sendSnsEmail).toHaveBeenCalledWith({
        Subject: 'Erro ao processar o video',
        Message: 'O seu video não foi processo, por favor entrar em contato com o time de suporte!',
        TopicArn: 'test-topic',
      });
    });
  });
});
