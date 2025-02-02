import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { VideoService } from 'src/Application/services/video.service';
import { VideoRepository } from 'src/Domain/Repositories/video.repository';
import { AwsModule } from 'src/infra/aws/aws.module';
import { VideoController } from '../videoProcessing/video.controller';

describe('VideoController', () => {
  let controller: VideoController;
  let service: VideoService;
  let videoRepositoryMock: jest.Mocked<VideoRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
        imports: [AwsModule],
        controllers: [VideoController],
        providers: [
          { provide: VideoRepository, useValue: videoRepositoryMock },
          VideoService,
          ConfigService,
        ],
        exports: [VideoService],
    }).compile();
    controller = module.get<VideoController>(VideoController);
    service = module.get<VideoService>(VideoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should successfully process an MP4 file', () => {
      const file = {
        originalname: 'test.mp4',
        mimetype: 'video/mp4',
        buffer: Buffer.from('test data'),
        size: 1024,
      } as Express.Multer.File;

      const res = {
        download: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      expect(controller.uploadVideo(file, res)).toBeDefined();
      expect(service.processVideo).toHaveBeenCalledWith(file);
    });

    it('should throw an error if no file is uploaded', () => {
      const file = null;
      const res = {
        download: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      expect(() => controller.uploadVideo(file as any, res)).toThrow(
        'No file uploaded!',
      );
    });

    it('should throw an error for non-MP4 files', () => {
      const file = {
        originalname: 'test.txt',
        mimetype: 'text/plain',
        buffer: Buffer.from('test data'),
        size: 1024,
      } as Express.Multer.File;

      const res = {
        download: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      expect(() => controller.uploadVideo(file, res)).toThrow(
        'Invalid file type. Only MP4 files are allowed.',
      );
    });
  });
});
