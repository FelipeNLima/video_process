import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class videoDto {
  @ApiProperty()
  file: Express.Multer.File;

  @ApiProperty()
  @IsString()
  outputDir: string;

  @ApiProperty()
  @IsString()
  zipPath: string;
}
