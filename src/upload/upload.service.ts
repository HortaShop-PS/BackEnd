import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Image } from '../entities/image.entity';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
  ) {}

  async saveImageToDatabase(file: Express.Multer.File): Promise<string> {
    try {
      const image = this.imageRepository.create({
        filename: file.originalname,
        mimetype: file.mimetype,
        data: file.buffer,
      });

      const savedImage = await this.imageRepository.save(image);
      return savedImage.id;
    } catch (error) {
      console.error('Erro ao salvar imagem no banco de dados:', error);
      throw new Error('Falha ao processar imagem');
    }
  }

  async getImageById(id: string): Promise<Image | null> {
    return this.imageRepository.findOne({ where: { id } });
  }

  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}
