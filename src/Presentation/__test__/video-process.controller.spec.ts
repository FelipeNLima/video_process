import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import * as path from 'path';
import { VideoService } from 'src/Application/services/video.service';
import { VideoController } from '../videoProcessing/video.controller';

describe('VideoController', () => {
  let controller: VideoController;
  let videoService: jest.Mocked<VideoService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoController],
      providers: [
        {
          provide: VideoService,
          useValue: {
            processVideo: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VideoController>(VideoController);
    videoService = module.get(VideoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadVideo', () => {
    it('should process video and return file download response', async () => {
      const mockFile = { originalname: 'test.mp4', path: 'uploads/test.mp4' } as Express.Multer.File;
      const mockRes = {
        download: jest.fn(),
      } as unknown as Response;

      const mockZipPath = 'output.zip';
      videoService.processVideo.mockResolvedValue(mockZipPath);

      await controller.uploadVideo(mockFile, mockRes);

      expect(videoService.processVideo).toHaveBeenCalledWith({
        file: mockFile,
        outputDir: path.join(__dirname, '..', '..', 'frames'),
        zipPath: path.join(__dirname, '..', '..', 'output.zip'),
      });
      expect(mockRes.download).toHaveBeenCalledWith(mockZipPath);
    });

    it('should return 500 error on failure', async () => {
      const mockFile = { originalname: 'test.mp4', path: 'uploads/test.mp4' } as Express.Multer.File;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      videoService.processVideo.mockRejectedValue(new Error('Processing failed'));

      await controller.uploadVideo(mockFile, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Processing failed' });
    });
  });
});
