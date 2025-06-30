import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Image } from '../entities/image.entity';
import { User } from '../entities/user.entity'; 

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    @InjectRepository(User) // ✅ Adicionar repositório do User
    private readonly userRepository: Repository<User>,
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

  // ✅ MÉTODO ORIGINAL MANTIDO
  async uploadProfileImage(file: Express.Multer.File, userId: number): Promise<string> {
    try {
      // Salvar imagem no banco de dados
      const image = this.imageRepository.create({
        filename: `profile_${userId}_${Date.now()}_${file.originalname}`,
        mimetype: file.mimetype,
        data: file.buffer,
      });

      const savedImage = await this.imageRepository.save(image);
      
      // URL da imagem
      const imageUrl = `/upload/image/${savedImage.id}`;

      // Atualizar usuário no banco de dados
      await this.userRepository.update(userId, {
        profileImage: imageUrl
      });

      console.log(`✅ Foto de perfil atualizada para usuário ${userId}: ${imageUrl}`);
      
      return imageUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da foto de perfil:', error);
      throw new Error('Erro ao fazer upload da imagem');
    }
  }

  // ✅ NOVO: Método melhorado que lida com substituição de imagem
  async uploadProfileImageWithReplacement(file: Express.Multer.File, userId: number): Promise<string> {
    try {
      console.log(`🔄 Iniciando upload de perfil para usuário ${userId}`);
      
      // Buscar o usuário atual
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      console.log('👤 Usuário encontrado:', user.name);
      console.log('🖼️ Imagem atual:', user.profileImage || 'Nenhuma');

      // Se o usuário já tem uma imagem de perfil, vamos removê-la
      if (user.profileImage) {
        try {
          // Extrair ID da imagem da URL (formato: /upload/image/{id})
          const imageIdMatch = user.profileImage.match(/\/upload\/image\/(.+)$/);
          if (imageIdMatch) {
            const oldImageId = imageIdMatch[1];
            console.log('🗑️ Removendo imagem antiga:', oldImageId);
            
            // Remover imagem antiga do banco
            await this.imageRepository.delete(oldImageId);
            console.log('✅ Imagem antiga removida');
          }
        } catch (deleteError) {
          console.warn('⚠️ Erro ao remover imagem antiga (continuando):', deleteError);
        }
      }

      // Criar nova imagem
      const image = this.imageRepository.create({
        filename: `profile_${userId}_${Date.now()}_${file.originalname}`,
        mimetype: file.mimetype,
        data: file.buffer,
      });

      console.log('💾 Salvando nova imagem...');
      const savedImage = await this.imageRepository.save(image);
      
      // URL da nova imagem
      const imageUrl = `/upload/image/${savedImage.id}`;
      console.log('🔗 Nova URL gerada:', imageUrl);

      // Atualizar usuário no banco de dados com a nova imagem
      console.log('📝 Atualizando perfil do usuário...');
      await this.userRepository.update(userId, {
        profileImage: imageUrl
      });

      // Verificar se a atualização foi bem-sucedida
      const updatedUser = await this.userRepository.findOne({ where: { id: userId } });
      console.log('✅ Perfil atualizado:', updatedUser?.profileImage);

      console.log(`✅ Upload completo para usuário ${userId}: ${imageUrl}`);
      
      return imageUrl;
    } catch (error) {
      console.error('❌ Erro detalhado no upload de perfil:', error);
      throw new Error(`Erro ao fazer upload da imagem: ${error.message}`);
    }
  }

  async getImageById(id: string): Promise<Image | null> {
    return this.imageRepository.findOne({ where: { id } });
  }

  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}