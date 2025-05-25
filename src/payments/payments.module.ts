// Importa o decorador Module do NestJS, usado para organizar componentes.
import { Module } from '@nestjs/common';
// Importa o TypeOrmModule para integração com o TypeORM, um ORM para TypeScript.
import { TypeOrmModule } from '@nestjs/typeorm';
// Importa o controlador de pagamentos, que lida com as requisições HTTP.
import { PaymentsController } from './payments.controller';
// Importa o serviço de pagamentos, que contém a lógica de negócios.
import { PaymentsService } from './payments.service';
// Importa a entidade Card, que representa a tabela de cartões no banco de dados.
import { Card } from './entities/card.entity';
import { CartModule } from '../cart/cart.module'; // Importar CartModule
import { ProductsModule } from '../products/product.module'; // Corrigido para ProductsModule
import { forwardRef } from '@nestjs/common';

// Define o módulo de pagamentos.
@Module({
  // Importa outros módulos necessários, incluindo CartModule e ProductModule com forwardRef para evitar dependências circulares.
  imports: [
    TypeOrmModule.forFeature([Card]),
    forwardRef(() => CartModule),
    forwardRef(() => ProductsModule), // Corrigido para ProductsModule
  ],
  // Declara os controladores que pertencem a este módulo.
  controllers: [PaymentsController],
  // Declara os provedores (serviços) que pertencem a este módulo e podem ser injetados em outros componentes.
  providers: [PaymentsService],
  exports: [PaymentsService],
})
// Exporta a classe PaymentsModule para que possa ser importada em outros módulos (geralmente o AppModule).
export class PaymentsModule {}
