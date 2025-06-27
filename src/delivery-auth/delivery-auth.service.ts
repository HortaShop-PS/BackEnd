import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DeliveryMan } from '../entities/delivery-man.entity';
import { RegisterDeliveryDto } from './dto/register-delivery.dto';
import { LoginDeliveryDto } from './dto/login-delivery.dto';
import { UpdateDeliveryProfileDto } from './dto/update-delivery-profile.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class DeliveryAuthService {
  constructor(
    @InjectRepository(DeliveryMan)
    private deliveryManRepository: Repository<DeliveryMan>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDeliveryDto): Promise<DeliveryMan> {
    const { name, email, password, phone, cpf, cnhNumber } = registerDto;

    // Verificar se o email já existe
    const existingDeliveryMan = await this.deliveryManRepository.findOne({
      where: [{ email }, { cpf }, { cnhNumber }],
    });

    if (existingDeliveryMan) {
      if (existingDeliveryMan.email === email) {
        throw new ConflictException('Email já está em uso');
      }
      if (existingDeliveryMan.cpf === cpf) {
        throw new ConflictException('CPF já está em uso');
      }
      if (existingDeliveryMan.cnhNumber === cnhNumber) {
        throw new ConflictException('Número da CNH já está em uso');
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar novo entregador
    const deliveryMan = this.deliveryManRepository.create({
      name,
      email,
      password: hashedPassword,
      phone,
      cpf,
      cnhNumber,
    });

    const savedDeliveryMan = await this.deliveryManRepository.save(deliveryMan);
    
    // Remover a senha do retorno
    delete savedDeliveryMan.password;
    return savedDeliveryMan;
  }

  async login(loginDto: LoginDeliveryDto): Promise<{ token: string; user: DeliveryMan }> {
    const { email, password } = loginDto;

    // Buscar entregador por email
    const deliveryMan = await this.deliveryManRepository.findOne({
      where: { email },
    });

    if (!deliveryMan) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar se a senha existe
    if (!deliveryMan.password) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, deliveryMan.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar se está ativo
    if (!deliveryMan.isActive) {
      throw new UnauthorizedException('Conta desativada');
    }

    // Gerar token JWT
    const payload = { sub: deliveryMan.id, email: deliveryMan.email, type: 'delivery' };
    const token = this.jwtService.sign(payload);

    // Remover a senha do retorno
    delete deliveryMan.password;

    return {
      token,
      user: deliveryMan,
    };
  }

  async getProfile(deliveryManId: number): Promise<DeliveryMan> {
    const deliveryMan = await this.deliveryManRepository.findOne({
      where: { id: deliveryManId },
    });

    if (!deliveryMan) {
      throw new NotFoundException('Entregador não encontrado');
    }

    delete deliveryMan.password;
    return deliveryMan;
  }

  async updateProfile(deliveryManId: number, updateDto: UpdateDeliveryProfileDto): Promise<DeliveryMan> {
    const deliveryMan = await this.deliveryManRepository.findOne({
      where: { id: deliveryManId },
    });

    if (!deliveryMan) {
      throw new NotFoundException('Entregador não encontrado');
    }

    // Verificar se o email já está em uso por outro entregador
    if (updateDto.email && updateDto.email !== deliveryMan.email) {
      const existingDeliveryMan = await this.deliveryManRepository.findOne({
        where: { email: updateDto.email },
      });

      if (existingDeliveryMan) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Atualizar dados
    Object.assign(deliveryMan, updateDto);
    const updatedDeliveryMan = await this.deliveryManRepository.save(deliveryMan);

    delete updatedDeliveryMan.password;
    return updatedDeliveryMan;
  }

  async updateVehicle(deliveryManId: number, updateVehicleDto: UpdateVehicleDto): Promise<DeliveryMan> {
    const deliveryMan = await this.deliveryManRepository.findOne({
      where: { id: deliveryManId },
    });

    if (!deliveryMan) {
      throw new NotFoundException('Entregador não encontrado');
    }

    // Atualizar dados do veículo
    Object.assign(deliveryMan, updateVehicleDto);
    const updatedDeliveryMan = await this.deliveryManRepository.save(deliveryMan);

    delete updatedDeliveryMan.password;
    return updatedDeliveryMan;
  }

  async validateDeliveryMan(id: number): Promise<DeliveryMan | null> {
    const deliveryMan = await this.deliveryManRepository.findOne({
      where: { id },
    });

    if (!deliveryMan || !deliveryMan.isActive) {
      return null;
    }

    return deliveryMan;
  }
}