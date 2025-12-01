import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from 'src/common/guards/jwt/jwt-auth.guard';
import { UploadImageDto } from './dto/upload-image.dto';

@Controller('images')
@UseGuards(JwtAuthGuard)
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  upload(@Body() uploadImageDto: UploadImageDto) {
    return this.imagesService.getUploadSignedUrl(uploadImageDto.filename);
  }
}
