import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Request, BadRequestException, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { Response } from 'express';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ✅ NOVO: Health check para upload
  @Get('health')
  getUploadHealth() {
    return {
      status: 'ok',
      service: 'upload',
      timestamp: new Date().toISOString(),
      message: 'Upload service is running'
    };
  }

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException('Apenas arquivos de imagem são permitidos!'), false);
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

  // ✅ ENDPOINT PARA UPLOAD DE FOTO DE PERFIL - MELHORADO
  @Post('profile-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        console.log('🔍 Verificando arquivo:', {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
        
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
          console.error('❌ Tipo de arquivo não permitido:', file.originalname);
          return cb(new BadRequestException('Apenas arquivos de imagem são permitidos!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    console.log('📥 Recebendo upload de foto de perfil...');
    console.log('👤 Usuário ID:', req.user?.id);
    console.log('📄 Arquivo recebido:', file ? {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } : 'Nenhum arquivo');

    if (!file) {
      console.error('❌ Nenhum arquivo enviado');
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    try {
      const userId = req.user.id;
      console.log('🔄 Processando upload para usuário:', userId);
      
      // ✅ MELHORADO: Usar método aprimorado que lida com substituição
      const imageUrl = await this.uploadService.uploadProfileImageWithReplacement(file, userId);
      
      console.log('✅ Upload concluído com sucesso:', imageUrl);
      
      return {
        success: true,
        imageUrl,
        message: 'Imagem de perfil atualizada com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao fazer upload da imagem:', error);
      throw new BadRequestException(error.message || 'Erro ao processar upload da imagem');
    }
  }
}