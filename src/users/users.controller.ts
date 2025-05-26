import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto, UserResponseDto } from '../dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req): Promise<UserResponseDto> {
    return this.usersService.findOne(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req): Promise<UserResponseDto> {
    if (req.user.id !== +id) {
      throw new UnauthorizedException('Você só pode acessar seu próprio perfil');
    }
    return this.usersService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ): Promise<UserResponseDto> {
    if (req.user.id !== +id) {
      throw new UnauthorizedException('Você só pode atualizar seu próprio perfil');
    }
    return this.usersService.update(+id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/password')
  updatePassword(
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Request() req,
  ): Promise<{ message: string }> {
    if (req.user.id !== +id) {
      throw new UnauthorizedException('Você só pode atualizar sua própria senha');
    }
    return this.usersService
      .updatePassword(+id, updatePasswordDto)
      .then(() => ({ message: 'Senha atualizada com sucesso' }));
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req): Promise<{ message: string }> {
    if (req.user.id !== +id) {
      throw new UnauthorizedException('Você só pode remover seu próprio perfil');
    }
    return this.usersService.remove(+id);
  }
}
