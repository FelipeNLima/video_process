// s3.service.spec.ts
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { AwsS3Service } from '../aws/aws-s3.service';

// Mock the S3Client
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

describe('S3Service', () => {
  let service: AwsS3Service;
  let s3ClientMock: S3Client;
  let configService: ConfigService;

  beforeEach(() => {
    s3ClientMock = new S3Client();
    configService = new ConfigService();
    service = new AwsS3Service(s3ClientMock, configService);  // Inject the mocked client into the service
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file to S3 and return success message', async () => {
      const mockUploadResponse = { $metadata: { httpStatusCode: 200 } };

      // Mock the send method of S3Client
      (s3ClientMock.send as jest.Mock).mockResolvedValueOnce(mockUploadResponse);

      const result = await service.sendToS3Bucket(Buffer.from('Hello World'), 'file.txt', 'my-bucket');
      
      expect(result).toBe('File uploaded successfully to my-bucket/file.txt');
    });

    it('should throw an error if upload fails', async () => {
      (s3ClientMock.send as jest.Mock).mockRejectedValueOnce(new Error('Upload failed'));

      await expect(service.sendToS3Bucket(Buffer.from('Hello World'), 'file.txt', null))
        .rejects
        .toThrow('Upload failed');
    });
  });

  describe('downloadFile', () => {
    it('should throw an error if download fails', async () => {
      (s3ClientMock.send as jest.Mock).mockRejectedValueOnce(new Error('Download failed'));

      await expect(service.getFromS3Bucket('file.txt', 'my-bucket'))
        .rejects
        .toThrow('Download failed');
    });
  });
});
