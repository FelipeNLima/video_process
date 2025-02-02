import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import { Readable } from 'stream';
import { AwsS3Service } from '../aws/aws-s3.service';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');

// Mock the 'fs' module properly
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  createWriteStream: jest.fn(),
  promises: {
    // Mock any fs.promises functions you are using
    readFile: jest.fn(),
  },
}));

describe('AwsS3Service', () => {
  let service: AwsS3Service;
  let s3ClientMock: jest.Mocked<S3Client>;

  beforeEach(async () => {
    s3ClientMock = new S3Client({}) as jest.Mocked<S3Client>;
    s3ClientMock.send = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwsS3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              const mockConfig = {
                AWS_REGION: 'us-east-1',
                AWS_ACCESS_KEY_ID: 'test-access-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret-key',
                AWS_SESSION_TOKEN: 'test-session-token',
              };
              return mockConfig[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AwsS3Service>(AwsS3Service);
    (service as any).s3Client = s3ClientMock; // Replace actual S3 client with mock
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendToS3Bucket', () => {
    it('should upload a file to S3', async () => {
      const mockFileContent = Buffer.from('test file');
      const mockFileName = 'test.zip';
      const mockBucketName = 'test-bucket';

      await service.sendToS3Bucket(mockFileContent, mockFileName, mockBucketName);

      expect(s3ClientMock.send).toHaveBeenCalledWith(
        expect.any(PutObjectCommand)
      );
    });

    it('should throw an error if parameters are missing', async () => {
      await expect(service.sendToS3Bucket(null, 'file.zip', 'bucket')).rejects.toThrow('Upload failed');
    });
  });

  describe('getFromS3Bucket', () => {
    it('should download a file from S3 and save it locally', async () => {
      const mockBucketName = 'test-bucket';
      const mockFileName = 'test.zip';
      const mockFilePath = `uploads\\${mockFileName}`;
      const mockFileStream = new Readable();
      mockFileStream.push('test file content');
      mockFileStream.push(null);

      (s3ClientMock.send as jest.Mock).mockResolvedValue({
        Body: mockFileStream,
      });

      const filePath = await service.getFromS3Bucket(mockFileName, mockBucketName);

      expect(s3ClientMock.send).toHaveBeenCalledWith(
        expect.any(GetObjectCommand)
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(mockFilePath, expect.any(Buffer));
      expect(filePath).toBe(mockFilePath);
    });

    it('should throw an error if no file is found in S3', async () => {
      (s3ClientMock.send as jest.Mock).mockResolvedValue({ Body: null } as any);

      await expect(service.getFromS3Bucket('test.zip', 'test-bucket')).rejects.toThrow(
        'Download failed'
      );
    });
  });
});
