import { Injectable } from '@nestjs/common';
import { CreateProducerDto } from './create-producer.dto';
@Injectable()
export class ProducerService {
  async create(createProducerDto: CreateProducerDto): Promise<any> {
    console.log('Dados recebidos para criar produtor:', createProducerDto);
    return { message: 'Produtor criado com sucesso!', data: createProducerDto }; // Placeholder
  }
}