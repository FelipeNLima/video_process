import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { join } from 'path';
import { Readable } from 'stream';

@Injectable()
export class AwsS3Service {
  s3Client: S3Client;
  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
        sessionToken: this.configService.get<string>('AWS_SESSION_TOKEN'),
      },
    });
  }

  private readonly logger = new Logger(AwsS3Service.name);

  async sendToS3Bucket(fileContent: any, fileName: string, bucketName: string) {
    try {
      if (!fileContent || !fileName || !bucketName) {
        throw new Error();
      }
      // Define S3 upload parameters
      const bucketParams = {
        Bucket: bucketName,
        Key: fileName, // Filename in the S3 bucket
        Body: fileContent, // The ZIP file content
        ContentType: 'application/zip', // MIME type for ZIP files
        Acl: 'public-read',
      };

      // Upload the ZIP file to S3
      await this.s3Client.send(new PutObjectCommand(bucketParams));
    } catch (err) {
      throw new Error('Upload failed');
    }
  }

  async getFromS3Bucket(Key: string, bucketName: string) {
    try {
      const bucketParams = {
        Bucket: bucketName,
        Key,
      };

      const response = await this.s3Client.send(
        new GetObjectCommand(bucketParams),
      );

      const { Body } = response;

      if (!Body) throw new Error('No video found in S3');
      // Save the file locally
      const filePath = join('./uploads', Key);
      const streamToBuffer = (stream: Readable): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
          const chunks: any[] = [];
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
        });
      };

      const buffer = await streamToBuffer(Body as Readable);
      fs.writeFileSync(filePath, buffer);
      return filePath;
    } catch (error) {
      throw new Error('Download failed');
    }
  }
}
