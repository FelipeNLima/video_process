import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { AwsSnsService } from '../aws/aws-sns.service';
dotenv.config({ path: '.env' });

jest.mock('@aws-sdk/client-sns', () => {
  return {
    SNSClient: jest.fn().mockImplementation(() => ({
      send: jest.fn(),  // Mock the send method
    })),
    PublishCommand: jest.fn(), // Mock the PublishCommand
  };
});

describe('AwsSnsService', () => {
  let service: AwsSnsService;
  let snsClientMock: SNSClient;
  let configService: ConfigService;

  beforeEach(() => {
    snsClientMock = new SNSClient();
    configService = new ConfigService();
    service = new AwsSnsService(configService);  // Inject the mocked client into the service
  });

  it('should send an email via SNS', async () => {
    new PublishCommand({
      TopicArn: process.env.AWS_SNS_TOPIC_ARN,
      Message: "O seu video foi processado com sucesso",
    });

    const params = {
      Subject: 'Arquivo Zipado com sucesso',
      Message: 'O seu video foi processado com sucesso',
      TopicArn: process.env.AWS_SNS_TOPIC_ARN,
    };

    // Mock the send method to resolve
    (snsClientMock.send as jest.Mock).mockResolvedValueOnce({});  // Mock send to resolve

    await expect(service.sendEmail(params)).resolves.toBeUndefined();
  });

  it('should throw an error if SNS fails', async () => {
    // Mock send method to reject with an error
    (snsClientMock.send as jest.Mock).mockRejectedValueOnce(new Error('SNS Error'));
    const params = {
      Subject: "Arquivo Zipado com sucesso",
      Message: "O seu video foi processado com sucesso",
    }
    // Test that the service handles errors correctly
    await expect(service.sendEmail(params)).rejects.toThrow('SNS Error');
  });
});