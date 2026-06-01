import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { SecureUploadService } from './secure-upload.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [UploadsController],
  providers: [SecureUploadService],
  exports: [SecureUploadService],
})
export class UploadsModule {}
