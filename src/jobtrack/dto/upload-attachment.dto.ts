import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UploadAttachmentDto {
  @ApiProperty({
    description: 'Document or image file to upload as attachment',
    type: 'string',
    format: 'binary',
    example: 'lettre-motivation.pdf',
  })
  file?: Express.Multer.File;
}

export class AttachmentResponseDto {
  @ApiProperty({
    description: 'Path to the uploaded attachment',
    example: '/uploads/docs/1699123456789-lettre-motivation.pdf',
  })
  @IsString()
  filePath: string;

  @ApiProperty({
    description: 'Original filename of the attachment',
    example: 'lettre-motivation.pdf',
  })
  @IsString()
  originalName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1048576,
  })
  size: number;

  @ApiProperty({
    description: 'File type (document or image)',
    example: 'document',
    enum: ['document', 'image'],
  })
  @IsString()
  fileType: 'document' | 'image';

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2024-09-08T07:51:00.000Z',
  })
  uploadedAt: Date;
}
