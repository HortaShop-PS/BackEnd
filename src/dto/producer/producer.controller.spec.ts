import { Test, TestingModule } from '@nestjs/testing';
import { ProducerController } from './producer.controller';
import { ProducerService } from './producer.service'; // Importar o serviço

describe('ProducerController', () => {
  let controller: ProducerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProducerController],
      providers: [
        {
          provide: ProducerService,
          useValue: {
            create: jest.fn().mockResolvedValue({ message: 'Mocked success' }),
          },
        },
      ],
    }).compile();

    controller = module.get<ProducerController>(ProducerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });


});

