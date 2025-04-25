// filepath: /home/andre/dev/hortaShop/BackEnd/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Importe o ValidationPipe

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS (Cross-Origin Resource Sharing) se seu frontend estiver em outro domínio/porta
  app.enableCors();

  // Configura um pipe global para validação automática de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades extras que não estão no DTO
      forbidNonWhitelisted: true, // Lança um erro se propriedades extras forem enviadas
      transform: true, // Tenta transformar o payload para o tipo do DTO (ex: string para number)
      transformOptions: {
        enableImplicitConversion: true, // Permite conversão implícita de tipos
      },
    }),
  );

  // Define a porta onde a aplicação vai rodar
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`); // Mostra a URL no console
}
bootstrap().catch((err) => {
  console.error('Error starting the application:', err);
  process.exit(1); // Exit the process with an error code
});
