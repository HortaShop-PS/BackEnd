import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { Response } from 'express';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException(
              'Apenas arquivos de imagem são permitidos!',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadImage(@UploadedFile() file, @Request() req) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    try {
      const imageId = await this.uploadService.saveImageToDatabase(file);

      return {
        url: `/upload/image/${imageId}`,
        filename: file.originalname,
        size: file.size,
      };
    } catch (error) {
      console.error('Erro ao processar upload:', error);
      throw new BadRequestException('Falha ao processar o upload da imagem');
    }
  }

  @Get('image/:id')
  async getImage(@Param('id') id: string, @Res() res: Response) {
    try {
      const image = await this.uploadService.getImageById(id);

      if (!image) {
        return res.status(404).send('Imagem não encontrada');
      }

      res.set({
        'Content-Type': image.mimetype,
        'Content-Disposition': `inline; filename="${image.filename}"`,
      });

      return res.send(image.data);
    } catch (error) {
      console.error('Erro ao buscar imagem:', error);
      return res.status(500).send('Erro ao buscar imagem');
    }
  }
}
