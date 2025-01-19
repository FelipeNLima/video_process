import {
  GetObjectCommand,
  ListObjectsV2Command,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsS3Service {
  s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      endpoint: this.configService.get<string>('AWS_URL'),
    });
  }

  private readonly logger = new Logger(AwsS3Service.name);

  async sendToS3Bucket(fileContent: any, fileName: string, bucketName: string) {
    // Define S3 upload parameters
    const bucketParams = {
      Bucket: bucketName,
      Key: fileName, // Filename in the S3 bucket
      Body: fileContent, // The ZIP file content
      ContentType: 'application/zip', // MIME type for ZIP files
      ACL: ObjectCannedACL.public_read, // Optional: Define access control
    };

    try {
      // Upload the ZIP file to S3
      const data = await this.s3Client.send(new PutObjectCommand(bucketParams));
      this.logger.log('Upload Success:', data);
      return data;
    } catch (err) {
      console.error('Error uploading to S3:', err);
    }
  }

  async getFromS3Bucket(Key: string, bucketName: string) {
    const bucketParams = {
      Bucket: bucketName,
      Key,
    };

    try {
      const response = await this.s3Client.send(
        new GetObjectCommand(bucketParams),
      );

      const { Body } = response;

      return Body;
    } catch (error) {
      this.logger.error(Key + error);
    }
  }

  async listAllObjects(bucketName: string, folderName?: string) {
    let isTruncated = true;
    let continuationToken = undefined;
    const allObjects = [];

    try {
      while (isTruncated) {
        const params = {
          Bucket: bucketName,
          Prefix: folderName,
          ContinuationToken: continuationToken,
        };

        const response = await this.s3Client.send(
          new ListObjectsV2Command(params),
        );

        response.Contents.forEach((item) => {
          allObjects.push(item.Key);
        });

        isTruncated = response.IsTruncated;
        continuationToken = response.NextContinuationToken;
      }

      return allObjects;
    } catch (error) {
      this.logger.error(error);
    }
  }
}
