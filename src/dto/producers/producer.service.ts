import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateProducerDto } from './create-producer.dto';
import { Producer } from '../../entities/producer.entity';
import { UsersService } from '../../users/users.service';
import { CompleteProfileDto } from 'src/dto/complete-profile.dto';
import { ProfileStatusDto } from 'src/dto/producers/profile-status';
import { Address } from 'cluster';
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
      select: ['id', 'userId', 'farmName', 'cnpj'] 
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

    const missingFields: string[] = [];
    let completedFieldsCount = 0;
    const totalPotentialFields = 4; // cnpj, address, bankDetails, businessDescription

    if (producer.cnpj && producer.cnpj.trim() !== '') completedFieldsCount++;
    else missingFields.push('cnpj');

    if (producer.address && Object.keys(producer.address).length > 0 && Object.values(producer.address).every(v => v && String(v).trim() !== '')) completedFieldsCount++;
    else missingFields.push('address');
    
    if (producer.bankDetails && Object.keys(producer.bankDetails).length > 0 && Object.values(producer.bankDetails).every(v => v && String(v).trim() !== '')) completedFieldsCount++;
    else missingFields.push('bankDetails');

    if (
      typeof producer.businessDescription === 'string' &&
      producer.businessDescription &&
      (producer.businessDescription as string).trim() !== ''
    ) completedFieldsCount++;
    else missingFields.push('businessDescription');

    const completionPercentage = Math.round((completedFieldsCount / totalPotentialFields) * 100);
    const isComplete = missingFields.length === 0;

    return { isComplete, missingFields, completionPercentage };
  }

  async completeProfile(producerId: string, completeProfileDto: CompleteProfileDto): Promise<Producer> {
    const producer = await this.findOne(Number(producerId));
    if (!producer) {
      throw new NotFoundException(`Producer with ID "${producerId}" not found.`);
    }

    // Atualiza os campos do produtor
    // Com TypeORM: Object.assign(producer, completeProfileDto);
    producer.cnpj = completeProfileDto.cnpj;
    producer.address = JSON.stringify(completeProfileDto.address); // Serializa o endereço como string
    producer.bankDetails = completeProfileDto.bankDetails as any; // Cast para 'any' já que BankDetails não está disponível

    return this.save(producer); // Salva o produtor atualizado
  }
  save(producer: Producer): Producer | PromiseLike<Producer> {
    throw new Error('Method not implemented.');
  }
}