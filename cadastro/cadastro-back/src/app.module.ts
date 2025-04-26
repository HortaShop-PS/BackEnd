import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity'; // Ajuste o caminho se necessário
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne( /* parâmetros */ ): Promise<User | undefined> { // Assinatura pode esperar undefined
    // ... lógica para buscar o usuário (exemplo)
    const user: User | null = await this.usersRepository.findOne( /* condições */ );

    // Retorna o usuário ou undefined se for null
    return user ?? undefined;
    // OU ajuste a assinatura da função para: Promise<User | null>
  }

  // ... outros métodos
}