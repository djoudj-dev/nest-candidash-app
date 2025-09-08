import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UploadCvDto {
  @ApiProperty({
    description: 'CV file to upload',
    type: 'string',
    format: 'binary',
    example: 'cv.pdf',
  })
  file?: Express.Multer.File;
}

export class UploadCvResponseDto {
  @ApiProperty({
    description: 'Path to the uploaded CV file',
    example: '/uploads/docs/1699123456789-cv.pdf',
  })
  @IsString()
  cvPath: string;

  @ApiProperty({
    description: 'Original filename of the uploaded CV',
    example: 'cv.pdf',
  })
  @IsString()
  originalName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048576,
  })
  size: number;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2024-09-08T07:51:00.000Z',
  })
  uploadedAt: Date;
}
