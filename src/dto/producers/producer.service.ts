import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateProducerDto } from './create-producer.dto';
import { Producer } from '../../entities/producer.entity';
import { UsersService } from '../../users/users.service';
import { CompleteProfileDto } from 'src/dto/complete-profile.dto';
import { ProfileStatusDto } from 'src/dto/producers/profile-status';

@Injectable()
export class ProducerService {
  constructor(
    @InjectRepository(Producer)
    private readonly producerRepository: Repository<Producer>,
    private readonly usersService: UsersService,
  ) {}

  async create(createProducerDto: CreateProducerDto): Promise<any> {
    try {
      if (createProducerDto.email) {
        const existingUser = await this.usersService.findByEmail(createProducerDto.email);
        if (existingUser) {
          throw new BadRequestException('Email já está em uso');
        }
      }

      const hashedPassword = await bcrypt.hash(createProducerDto.password, 10);
      
      const newUser = await this.usersService.create({
        name: createProducerDto.name || 'Produtor',
        email: createProducerDto.email,
        password: hashedPassword,
        phone: createProducerDto.phoneNumber,
        userType: 'producer',
      });

      const producer = this.producerRepository.create({
        cnpj: createProducerDto.cnpj,
        farmName: createProducerDto.farmName,
        address: createProducerDto.address,
        city: createProducerDto.city,
        state: createProducerDto.state,
        userId: newUser.id,
        user: newUser,
      });

      const savedProducer = await this.producerRepository.save(producer);
      const { user, ...producerResult } = savedProducer;
      const { password, ...userResult } = user;
      
      return {
        message: 'Produtor criado com sucesso!',
        data: {
          ...producerResult,
          user: userResult,
        }
      };
    } catch (error) {
      console.error('Erro ao criar produtor:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao criar produtor');
    }
  }

  async findByUserId(userId: number): Promise<Producer | null> {
    return this.producerRepository.findOne({ 
      where: { userId },
      select: ['id', 'userId', 'farmName', 'cnpj', 'address', 'city', 'state', 'bankDetails', 'businessDescription']
    });
  }

  async findAll(): Promise<Producer[]> {
    return this.producerRepository.find();
  }

  async findOne(id: number): Promise<Producer | null> {
    return this.producerRepository.findOne({ where: { id } });
  }

  async getProfileStatus(producerId: string): Promise<ProfileStatusDto> {
    const producer = await this.findOne(Number(producerId));
    if (!producer) {
      throw new NotFoundException(`Producer with ID "${producerId}" not found.`);
    }

    return this.calculateProfileStatus(producer);
  }

  async getProfileStatusByUserId(userId: number): Promise<ProfileStatusDto> {
    const producer = await this.findByUserId(userId);
    if (!producer) {
      throw new NotFoundException(`Producer with userId "${userId}" not found.`);
    }

    return this.calculateProfileStatus(producer);
  }

  private calculateProfileStatus(producer: Producer): ProfileStatusDto {
    const missingFields: string[] = [];
    let completedFieldsCount = 0;
    
    // Campos obrigatórios: address, bankDetails, businessDescription
    // CNPJ é opcional
    const totalRequiredFields = 3;

    // CNPJ é opcional - só conta se estiver preenchido
    let totalPossibleFields = totalRequiredFields;
    let hasCnpj = false;
    
    if (producer.cnpj && producer.cnpj.trim() !== '') {
      completedFieldsCount++;
      hasCnpj = true;
      totalPossibleFields = 4; // Se tem CNPJ, conta nos possíveis
    }

    // Address (obrigatório)
    if (producer.address && typeof producer.address === 'string' && producer.address.trim() !== '') {
      try {
        const parsedAddress = JSON.parse(producer.address);
        if (parsedAddress && Object.keys(parsedAddress).length > 0 && 
            Object.values(parsedAddress).every(v => v && String(v).trim() !== '')) {
          completedFieldsCount++;
        } else {
          missingFields.push('address');
        }
      } catch {
        missingFields.push('address');
      }
    } else if (producer.address && typeof producer.address === 'object' && 
               Object.keys(producer.address).length > 0 && 
               Object.values(producer.address).every(v => v && String(v).trim() !== '')) {
      completedFieldsCount++;
    } else {
      missingFields.push('address');
    }
    
    // Bank Details (obrigatório)
    if (producer.bankDetails && Object.keys(producer.bankDetails).length > 0 && 
        Object.values(producer.bankDetails).every(v => v && String(v).trim() !== '')) {
      completedFieldsCount++;
    } else {
      missingFields.push('bankDetails');
    }

    // Business Description (obrigatório)
    if (typeof producer.businessDescription === 'string' &&
        producer.businessDescription &&
        producer.businessDescription.trim() !== '') {
      completedFieldsCount++;
    } else {
      missingFields.push('businessDescription');
    }

    const completionPercentage = Math.round((completedFieldsCount / totalPossibleFields) * 100);
    
    // Para considerar completo, deve ter todos os campos obrigatórios
    // (address, bankDetails, businessDescription)
    const requiredFieldsCompleted = !missingFields.includes('address') && 
                                   !missingFields.includes('bankDetails') && 
                                   !missingFields.includes('businessDescription');
    
    const isComplete = requiredFieldsCompleted;

    return { isComplete, missingFields, completionPercentage };
  }

  async completeProfile(producerId: string, completeProfileDto: CompleteProfileDto): Promise<Producer> {
    const producer = await this.findOne(Number(producerId));
    if (!producer) {
      throw new NotFoundException(`Producer with ID "${producerId}" not found.`);
    }

    return this.updateProducerProfile(producer, completeProfileDto);
  }

  async completeProfileByUserId(userId: number, completeProfileDto: CompleteProfileDto): Promise<Producer> {
    const producer = await this.findByUserId(userId);
    if (!producer) {
      throw new NotFoundException(`Producer with userId "${userId}" not found.`);
    }

    return this.updateProducerProfile(producer, completeProfileDto);
  }

  private async updateProducerProfile(producer: Producer, completeProfileDto: CompleteProfileDto): Promise<Producer> {
    // Update producer fields
    // CNPJ é opcional - só atualiza se foi fornecido
    if (completeProfileDto.cnpj) {
      producer.cnpj = completeProfileDto.cnpj;
    }
    
    producer.address = typeof completeProfileDto.address === 'string' 
      ? completeProfileDto.address 
      : JSON.stringify(completeProfileDto.address);
    producer.bankDetails = completeProfileDto.bankDetails;
    producer.businessDescription = completeProfileDto.businessDescription;

    return this.producerRepository.save(producer);
  }
}