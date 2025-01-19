import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class videoDto {
  @ApiProperty()
  @IsString()
  path: string;
  @ApiProperty()
  @IsString()
  outputDir: string;
  @ApiProperty()
  @IsString()
  zipPath: string;
}
