import { Given, Then, When } from '@cucumber/cucumber';
import sinon from 'sinon';

import { ConfigService } from '@nestjs/config';
import { VideoService } from 'src/Application/services/video.service';
import { VideoRepository } from 'src/Domain/Repositories/video.repository';
import { AwsS3Service } from '../../src/infra/aws/aws-s3.service';
import { AwsSnsService } from '../../src/infra/aws/aws-sns.service';
import { AwsSqsService } from '../../src/infra/aws/aws-sqs.service';

// Mock dependencies
let videoService: VideoService;
let awsS3Stub: sinon.SinonStub;
let awsSqsStub: sinon.SinonStub;
let awsSnsStub: sinon.SinonStub;
let errorThrown: any;

// Given: A valid MP4 video file is uploaded
Given('a video file {string} is uploaded', function (fileName: string) {
  const file = {
    filename: fileName,
    mimetype: 'video/mp4',
    path: `path/to/${fileName}`,
  };

  this.video = {
    file,
    outputDir: 'some/output/dir',
    zipPath: 'some/zip/path',
  };

  // Stub AWS Services
  awsS3Stub = sinon.stub(AwsS3Service.prototype, 'sendToS3Bucket').resolves();
  awsSqsStub = sinon.stub(AwsSqsService.prototype, 'sendMessage').resolves();
  awsSnsStub = sinon.stub(AwsSnsService.prototype, 'sendEmail').resolves();

  videoService = new VideoService(
    new VideoRepository(),
    awsS3Stub as any,
    awsSqsStub as any,
    awsSnsStub as any,
    new ConfigService(),
  );
});

// Given: No file is uploaded
Given('no video file is uploaded', function () {
  this.video = null;
});

// Given: A non-MP4 file is uploaded
Given('a non-video file {string} is uploaded', function (fileName: string) {
  const file = {
    filename: fileName,
    mimetype: 'image/jpeg', // Invalid type
    path: `path/to/${fileName}`,
  };
  this.video = { file, outputDir: 'some/output/dir', zipPath: 'some/zip/path' };
});

// When: The video is processed
When('the video is processed', async function () {
  try {
    await videoService.processVideo(this.video);
  } catch (error) {
    errorThrown = error;
  }
});

// Then: The file should be uploaded to S3
Then('the video should be uploaded to the S3 bucket', function () {
  sinon.assert.calledOnce(awsS3Stub); // Ensure S3 was called
});

// Then: A success email should be sent
Then('a success email should be sent', function () {
  sinon.assert.calledOnce(awsSnsStub); // Ensure email was sent
});
