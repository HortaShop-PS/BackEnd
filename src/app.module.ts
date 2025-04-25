import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/product.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'), // Verifique se o nome está correto no .env
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'), // Verifique se o nome está correto no .env
        autoLoadEntities: true,
        synchronize: true, // Cuidado em produção
        logging: true,
        ssl: { rejectUnauthorized: false }, // Stenção nessa linha se o banco de dados não estiver em SSL
      }),
    }),
    UsersModule,
    ProductsModule,
    AuthModule,
  ],
})
export class AppModule {}
