import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import {
  CreateUserDto, // Usado diretamente apenas se o controller chamar create
  UpdateUserDto,
  UpdatePasswordDto,
  UserResponseDto,
} from '../dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // --- Métodos existentes (mantidos) ---

  // Mapeia a entidade User para UserResponseDto (remove a senha)
  private mapToDto(user: User): UserResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userDto } = user;
    return userDto as UserResponseDto;
  }

  // Retorna todos os usuários como DTOs
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find();
    return users.map(user => this.mapToDto(user));
  }

  // Retorna um usuário pelo ID como DTO
  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    return this.mapToDto(user);
  }

  // Atualiza dados do usuário (exceto senha)
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.preload({
        id: id,
        ...updateUserDto,
    });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    // Verifica se o email está sendo alterado para um já existente
    if (updateUserDto.email) {
        const existingUser = await this.usersRepository.findOne({ where: { email: updateUserDto.email } });
        // Garante que o email existente não pertence ao próprio usuário que está sendo atualizado
        if (existingUser && existingUser.id !== id) {
            throw new BadRequestException('Email já está em uso por outro usuário');
        }
    }
    const updatedUser = await this.usersRepository.save(user);
    return this.mapToDto(updatedUser);
  }


  // Atualiza a senha do usuário
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

  // Remove um usuário
  async remove(id: number): Promise<{ message: string }> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    return { message: 'Usuário removido com sucesso' };
}

// --- Métodos necessários para AuthService (Adicionado/Modificado) ---

  /**
   * Busca um usuário pelo email, incluindo a senha hash.
   * Necessário para o AuthService.validateUser.
   * @param email O email a ser buscado.
   * @returns A entidade User completa (com senha) ou null se não encontrado.
   */
  async findByEmail(email: string): Promise<User | null> {
    // Usa o repositório para buscar o usuário pelo email
    return this.usersRepository.findOne({ where: { email } });
  }

  /**
   * Cria um novo usuário no banco de dados.
   * Necessário para o AuthService.register.
   * Recebe dados incluindo a senha JÁ COM HASH.
   * @param userData Dados do usuário a ser criado (geralmente de AuthService).
   * @returns A entidade User recém-criada (com senha hash).
   */
  async create(userData: Partial<User>): Promise<User> {
    // O AuthService já verificou se o email existe e já fez o hash da senha.
    // Apenas criamos e salvamos a entidade aqui.
    const newUser = this.usersRepository.create(userData);
    return this.usersRepository.save(newUser);
  }
}