import { PublishCommand, PublishCommandInput, SNSClient } from '@aws-sdk/client-sns';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsSnsService {
  constructor(
    private readonly snsClient: SNSClient,
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
      const command = new PublishCommand(params);
      await this.snsClient.send(command);
    } catch (error) {
      console.error('Error sending email:', error); // Debugging line
      throw new Error('SNS Error');
    }
  }
}
