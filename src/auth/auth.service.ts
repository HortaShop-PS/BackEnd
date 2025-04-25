import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dtos/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(registerDto: RegisterDto): Promise<any> {
    const { email, phoneNumber, password } = registerDto;

    if (!email && !phoneNumber) {
      throw new BadRequestException('É necessário fornecer um e-mail ou número de telefone.');
    }

    if (email) {
      const existingUserByEmail = await this.usersService.findOneByEmail(email);
      if (existingUserByEmail) {
        throw new BadRequestException('Este e-mail já está cadastrado.');
      }
    }

    if (phoneNumber) {
      const existingUserByPhoneNumber = await this.usersService.findOneByPhoneNumber(phoneNumber);
      if (existingUserByPhoneNumber) {
        throw new BadRequestException('Este número de telefone já está cadastrado.');
      }
    }

    const newUser = await this.usersService.createUser(email, phoneNumber, password);
    return { message: 'Usuário registrado com sucesso!', userId: newUser.id };
  }
}