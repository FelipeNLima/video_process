import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export default async function (app: INestApplication) {
  const configService = app.get(ConfigService);

  const env = configService.get<string>('ENVIRONMENT');

  if (env !== 'prd') {
    const documentBuild = new DocumentBuilder()
      .setTitle('API Video Process')
      .setDescription('API desenvolvida para o projeto pos-tech.')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, documentBuild);

    SwaggerModule.setup('api/swagger', app, document, {
      customSiteTitle: 'API Backend',
      swaggerOptions: {
        syntaxHighlight: {
          activate: true,
          theme: 'tomorrow-night',
        },
      },
    });
  }
}
