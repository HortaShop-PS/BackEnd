import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/product.module';
import { AuthModule } from './auth/auth.module';
import { ProducerModule } from './dto/producer/producer.module';
import { FavoritesModule } from './favorites/favorites.module';
import { UploadModule } from './upload/upload.module';
import { CartModule } from './cart/cart.module';
import { PaymentsModule } from './payments/payments.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CheckoutModule } from './checkout/checkout.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AddressesModule } from './addresses/addresses.module';
import { AppController } from './app.controller'; 

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true,
        logging: true,
        ssl: { rejectUnauthorized: false },
      }),
    }),
    UsersModule,
    ProductsModule,
    AuthModule,
    ProducerModule,
    FavoritesModule,
    UploadModule,
    CartModule,
    PaymentsModule,
    OrdersModule,
    ReviewsModule,
    CheckoutModule,
    NotificationsModule,
    AddressesModule,
  ],
  controllers: [AppController], 
})
export class AppModule {}
