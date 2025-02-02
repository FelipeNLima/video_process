import { PublishCommand, PublishCommandInput, SNSClient } from '@aws-sdk/client-sns';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsSnsService {
  snsClient: SNSClient;
  
  constructor(
    private readonly configService: ConfigService,
  ) {
    this.snsClient = new SNSClient({
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

  async sendEmail(params: PublishCommandInput): Promise<void> {
    try {
      if (!params?.TopicArn) throw new Error('SNS Error')
      const command = new PublishCommand(params);
      await this.snsClient.send(command);
    } catch (error) {
      throw new Error('SNS Error');
    }
  }
}
