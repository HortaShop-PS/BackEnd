import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { UsersController } from "./users.controller"
import { UsersService } from "./users.service"
import { User } from "../entities/user.entity" // ajuste se necessário

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // mantém export do local
})
export class UsersModule {}