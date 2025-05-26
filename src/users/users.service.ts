import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto, UserResponseDto } from '../dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private mapToDto(user: User): UserResponseDto {
    const { password, producer, ...userDto } = user;
    return {
        ...userDto,
        producer: producer ? { id: producer.id } : undefined
    } as UserResponseDto;
}

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find();
    return users.map(user => this.mapToDto(user));
  }

async findOne(id: number, relations: string[] = ['producer']): Promise<UserResponseDto> {
  const user = await this.usersRepository.findOne({ 
      where: { id },
      relations: relations 
  });
  if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
  }
  return this.mapToDto(user);
}


  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.preload({
        id: id,
        ...updateUserDto,
    });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    if (updateUserDto.email) {
        const existingUser = await this.usersRepository.findOne({ where: { email: updateUserDto.email } });
        if (existingUser && existingUser.id !== id) {
            throw new BadRequestException('Email já está em uso por outro usuário');
        }
    }
    const updatedUser = await this.usersRepository.save(user);
    return this.mapToDto(updatedUser);
  }

  async updatePassword(id: number, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = updatePasswordDto;
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.usersRepository.save(user);
  }

  async remove(id: number): Promise<{ message: string }> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    return { message: 'Usuário removido com sucesso' };
}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
        where: { email },
        relations: ['producer']
    });
}

  async create(userData: Partial<User>): Promise<User> {
    if (!userData.userType) {
        userData.userType = 'consumer'; 
    }
    const newUser = this.usersRepository.create(userData);
    return this.usersRepository.save(newUser);
}
}