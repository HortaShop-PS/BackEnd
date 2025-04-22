import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import * as bcrypt from "bcrypt"
import { User } from "../entities/user.entity"
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto, UserResponseDto } from "../dto/user.dto"

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private mapToDto(user: User): UserResponseDto {
    const { password, ...userDto } = user
    return userDto as UserResponseDto
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find()
    return users.map(user => this.mapToDto(user))
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.usersRepository.findOne({ where: { email: createUserDto.email } })
    if (existingUser) {
      throw new BadRequestException("Email já está em uso")
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10)
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    })
    const savedUser = await this.usersRepository.save(user)
    return this.mapToDto(savedUser)
  }

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`)
    }
    return this.mapToDto(user)
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`)
    }
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({ where: { email: updateUserDto.email } })
      if (existingUser) {
        throw new BadRequestException("Email já está em uso")
      }
    }
    Object.assign(user, updateUserDto)
    const updatedUser = await this.usersRepository.save(user)
    return this.mapToDto(updatedUser)
  }

  async updatePassword(id: number, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = updatePasswordDto
    const user = await this.usersRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`)
    }
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException("Senha atual incorreta")
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await this.usersRepository.save(user)
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`)
    }
    await this.usersRepository.delete(id)
    return { message: "Usuário removido com sucesso" }
  }
}