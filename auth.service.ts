import {
  Injectable,
  // UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common'; // Adicionado InternalServerErrorException
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
// import { User } from '../entities/user.entity';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { UserResponseDto } from '../dto/user.dto';

// Interface para dados do usuário OAuth
interface OAuthUser {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // --- Métodos existentes ---
  async validateUser(
    email: string,
    pass: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.usersService.findByEmail(email);
    // IMPORTANT: Ensure user.password exists before comparing
    if (user && user.password && await bcrypt.compare(pass, user.password)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result as UserResponseDto;
    }
    return null; // Return null if user not found or password doesn't match
  }

  async login(user: UserResponseDto) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerAuthDto: RegisterAuthDto): Promise<UserResponseDto> {
    try {
      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(registerAuthDto.password, 10); // 10 is the salt rounds

      // Create the new user using the UsersService
      const newUser = await this.usersService.create({
        name: registerAuthDto.name,
        email: registerAuthDto.email,
        password: hashedPassword,
        phone: registerAuthDto.phoneNumber, 
      });

      // Remove password from the response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = newUser;
      return result as UserResponseDto;
    } catch (error) {
      // Handle potential errors, e.g., duplicate email
      console.error('Erro ao registrar usuário:', error);
      // You might want to throw a specific exception, e.g., ConflictException if email exists
      throw new InternalServerErrorException('Erro ao registrar usuário');
    }
  }

  // --- Método para OAuth ---

  /**
   * Valida um usuário vindo de um provedor OAuth (Google).
   * Encontra o usuário pelo providerId ou email, ou cria um novo se não existir.
   * @param oauthUser Dados do usuário obtidos do provedor OAuth.
   * @returns O UserResponseDto do usuário encontrado ou criado.
   */
  async validateOAuthLogin(oauthUser: OAuthUser): Promise<UserResponseDto> {
    try {
      // Tenta encontrar o usuário pelo providerId (ex: googleId)
      // Você precisará adicionar um método findByProviderId no UsersService
      // e o campo correspondente na entidade User (ex: googleId)
      // let user = await this.usersService.findByProviderId(oauthUser.provider, oauthUser.providerId);

      // Alternativa: Tenta encontrar pelo email
      let user = await this.usersService.findByEmail(oauthUser.email);

      if (user) {
        // Usuário encontrado pelo email.
        // Opcional: Atualizar dados (nome, foto) ou vincular providerId se ainda não tiver.
        // Ex: if (!user.googleId) { user.googleId = oauthUser.providerId; await this.usersService.save(user); }
        console.log(`Usuário OAuth encontrado: ${user.email}`);
      } else {
        // Usuário não encontrado, criar um novo.
        console.log(`Criando novo usuário OAuth: ${oauthUser.email}`);
        // Não temos senha para usuários OAuth, podemos deixar null ou gerar uma string aleatória segura
        // A abordagem mais simples é não ter senha e confiar no providerId/email.
        const newUser = await this.usersService.create({
          email: oauthUser.email,
          name: oauthUser.name,
          // password: null, // Ou gerar hash de string aleatória
          // Adicione campos específicos do provider se necessário:
          // googleId: oauthUser.providerId,
          // profilePictureUrl: oauthUser.picture,
          // provider: oauthUser.provider,
        });
        user = newUser; // O método create do UsersService retorna a entidade User
      }

      // Mapeia para DTO para remover a senha (mesmo que seja null)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result as UserResponseDto;
    } catch (error) {
      console.error('Erro ao validar/criar usuário OAuth:', error);
      throw new InternalServerErrorException('Erro ao processar login OAuth');
    }
  }
}
