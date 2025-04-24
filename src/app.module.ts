import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/product.module'; 

@Module({
  imports: [
    /* Carrega .env e torna ConfigService global */
    ConfigModule.forRoot({ isGlobal: true }),

    /* Conexão com PostgreSQL */
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,      // cuidado em produção
        logging: true,
        ssl: { rejectUnauthorized: false },
      }),
    }),

    UsersModule,
    ProductsModule,   
  ],
})
export class AppModule {}