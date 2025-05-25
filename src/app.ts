// src/app.ts
import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import productRoutes from './routes/productRoutes';

// Carregar variáveis de ambiente
dotenv.config({ path: './src/config/config.env' });

// Conectar ao banco de dados
connectDB();

const app: Application = express();

// Middlewares
app.use(express.json()); // Body parser para JSON
app.use(cors()); // Habilita CORS

// Rotas
app.use('/api/producers', productRoutes); // Prefixo para as rotas do produtor

// Rota de teste
app.get('/', (req: Request, res: Response) => {
  res.send('API de Produtos está rodando...');
});

// Configuração do PORT
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Servidor rodando no modo ${process.env.NODE_ENV} na porta ${PORT}`,
  );
});
