import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../src/Application/services/orders.service';
import { OrdersRepository } from '../src/Domain/Repositories/order.repository';
import { OrdersDto } from '../src/Presentation/orders/dto/order.dto';

describe('OrdersService', () => {
  let service: OrdersService;
  let repository: OrdersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrdersRepository,
          useValue: {
            createOrder: jest.fn(),
            getOrderById: jest.fn(),
            updateOrder: jest.fn(),
            deleteOrder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    repository = module.get<OrdersRepository>(OrdersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('should call repository.createOrder with the correct arguments', async () => {
        const result = {
            "customerID": 2,
            "customer": "Victor",
            "amount": 31,
            "orderItens": [],
            "orderTracking": null,
            "payments": "",
            "id": 0,
            "createdAt": undefined,
            "updatedAt": undefined,
            "salesOrderID": ''
        }
        const dto: OrdersDto = {
            "customerID": 2,
            "customer": "Victor",
            "amount": 31,
            "orderItens": [],
            "orderTracking": null,
            "payments": "",
            "id": 0,
            "createdAt": undefined,
            "updatedAt": undefined,
            "salesOrderID": "1"  
        }; // Exemplos de dados

      jest.spyOn(repository, 'createOrder').mockResolvedValue(result);

      const response = await service.createOrder(dto);

      expect(repository.createOrder).toHaveBeenCalledWith(dto);
      expect(response).toEqual(result);
    });
  });

  describe('getById', () => {
    it('should call repository.getOrderById with the correct ID', async () => {
      const id = 1;
      const result = { id, price: 100 };

      jest.spyOn(repository, 'getOrderById').mockResolvedValue(result);

      const response = await service.getById(id);

      expect(repository.getOrderById).toHaveBeenCalledWith(id);
      expect(response).toEqual(result);
    });
  });

  describe('update', () => {
    it('should call repository.updateOrder with the correct arguments', async () => {
        const result = {
            "customerID": 2,
            "customer": "Victor",
            "amount": 31,
            "orderItens": [],
            "orderTracking": null,
            "payments": "",
            "id": 0,
            "createdAt": undefined,
            "updatedAt": undefined,
            "salesOrderID": "1"
        }
        const dto: OrdersDto = {
            "customerID": 2,
            "customer": "Victor",
            "amount": 31,
            "orderItens": [],
            "orderTracking": null,
            "payments": "",
            "id": 0,
            "createdAt": undefined,
            "updatedAt": undefined,
            "salesOrderID": "1"  
        }; // Exemplos de dados

      jest.spyOn(repository, 'updateOrder').mockResolvedValue(result);

      const response = await service.update(dto);

      expect(repository.updateOrder).toHaveBeenCalledWith(dto);
      expect(response).toEqual(result);
    });
  });

  describe('delete', () => {
    it('should call repository.deleteOrder with the correct ID', async () => {
      const id = 1;

      await service.delete(id);

      expect(repository.deleteOrder).toHaveBeenCalledWith(id);
    });
  });
});

