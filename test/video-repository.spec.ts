import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VideoRepository } from 'src/Domain/Repositories/video.repository';
import { AwsS3Service } from 'src/infra/aws/aws-s3.service';
import { AwsSnsService } from 'src/infra/aws/aws-sns.service';
import { Video } from 'src/infra/typeorm/entities/video.entity';
import { Repository } from 'typeorm';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
    mkdir: jest.fn(),
  },
}));

jest.mock('fluent-ffmpeg');
jest.mock('archiver');

describe('VideoRepository', () => {
    let videoRepository: VideoRepository;
    let repository: Repository<Video>;
    let awsS3Service: AwsS3Service;
    let awsSnsService: AwsSnsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VideoRepository,
                {
                    provide: getRepositoryToken(Video),
                    useClass: Repository,
                },
                {
                  provide: AwsS3Service,
                  useValue: {
                    getFromS3Bucket: jest.fn(),
                    sendToS3Bucket: jest.fn(),
                  },
                },
                {
                  provide: AwsSnsService,
                  useValue: { sendEmail: jest.fn() },
                },
            ],
        }).compile();

        videoRepository = module.get<VideoRepository>(VideoRepository);
        awsS3Service = module.get<AwsS3Service>(AwsS3Service);
        awsSnsService = module.get<AwsSnsService>(AwsSnsService);
        repository = module.get<Repository<Video>>(getRepositoryToken(Video));
    });

    it('should be defined', () => {
      expect(videoRepository).toBeDefined();
    });

    describe('updateStatus', () => {
      it('should update video status', async () => {
        jest.spyOn(repository, 'update').mockResolvedValue({ affected: 1 } as any);
        const result = await videoRepository.updateStatus('1', 'url');
        expect(repository.update).toHaveBeenCalledWith('1', { status: 'finality', zipURL: 'url' });
        expect(result).toEqual({ affected: 1 });
      });
  
      it('should throw error on update failure', async () => {
        jest.spyOn(repository, 'update').mockRejectedValue(new Error('DB error'));
        await expect(videoRepository.updateStatus('1', 'url')).rejects.toThrow('Error update DB');
      });
    });

    describe('sendToS3Bucket', () => {
      it('should call AwsS3Service sendToS3Bucket', async () => {
        awsS3Service.sendToS3Bucket = jest.fn().mockResolvedValue('success');
        const result = await videoRepository.sendToS3Bucket(Buffer.from('file'), 'key', 'queue');
        expect(awsS3Service.sendToS3Bucket).toHaveBeenCalledWith(Buffer.from('file'), 'key', 'queue');
        expect(result).toBe('success');
      });
    });
    
    describe('sendSnsEmail', () => {
      it('should call AwsSnsService sendEmail', async () => {
        awsSnsService.sendEmail = jest.fn().mockResolvedValue('email sent');
        const result = await videoRepository.sendSnsEmail({ subject: 'Test' });
        expect(awsSnsService.sendEmail).toHaveBeenCalledWith({ subject: 'Test' });
        expect(result).toBe('email sent');
      });
    });
});