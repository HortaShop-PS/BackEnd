import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateProducerDto } from './create-producer.dto';
import { Producer } from '../../entities/producer.entity';
import { UsersService } from '../../users/users.service';

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
}