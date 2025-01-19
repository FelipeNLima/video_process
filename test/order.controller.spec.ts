import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from '../src/Presentation/orders/orders.controller';
import { OrdersService } from '../src/Application/services/orders.service';
import { OrdersDto } from '../src/Presentation/orders/dto/order.dto';
import { OrderUpdateDto } from '../src/Presentation/orders/dto/order-update.dto';
import { NotFoundException } from '@nestjs/common';
import { AwsSqsService } from '../src/Application/services/sqs.service';
import { ConfigService } from '@nestjs/config';


describe('OrdersController', () => {
  let ordersController: OrdersController;
  let ordersService: OrdersService;
  let awsSqsService: AwsSqsService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            createOrder: jest.fn(),
            getById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: AwsSqsService,
          useValue: {
            sendMessage: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'AWS_SQS_QUEUE_URL_PAYMENT_INBOUND') {
                return 'test-queue-url';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    ordersController = module.get<OrdersController>(OrdersController);
    ordersService = module.get<OrdersService>(OrdersService);
    awsSqsService = module.get<AwsSqsService>(AwsSqsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(ordersController).toBeDefined();
  });

  describe('create', () => {
    it('should create an order and send a message to SQS', async () => {
      // Mock data
      const orderDto: OrdersDto = {
        id: 1,
        createdAt: new Date('2024-11-30'),
        updatedAt: new Date('2024-11-30'),
        salesOrderID: "123",
        amount: 500,
        orderItens: [],
        customerID: 123,
        customer: 'John Doe',
        orderTracking: 'TRACK-001',
        payments: "",
      };

      const mockOrder = {
        ...orderDto,
        id: 1,
        salesOrderID: 'SO-00123',
      };

      jest.spyOn(ordersService, 'createOrder').mockResolvedValue(mockOrder);
      const sendMessageSpy = jest.spyOn(awsSqsService, 'sendMessage').mockResolvedValue(null);

      // Act
      const result = await ordersController.create(orderDto);

      // Assert
      expect(ordersService.createOrder).toHaveBeenCalledWith(orderDto);
      expect(sendMessageSpy).toHaveBeenCalledWith('test-queue-url', {
        salesOrderID: mockOrder.salesOrderID,
        customerID: mockOrder.customerID,
        orderID: mockOrder.id,
        amount: mockOrder.amount,
        items: mockOrder.orderItens,
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw a NotFoundException when an error occurs', async () => {
      // Mock
      const orderDto: OrdersDto = {
        id: 1,
        createdAt: new Date('2024-11-30'),
        updatedAt: new Date('2024-11-30'),
        salesOrderID: "123",
        amount: 500,
        orderItens: [],
        customerID: 123,
        customer: 'John Doe',
        orderTracking: 'TRACK-001',
        payments: "",
      };
      jest.spyOn(ordersService, 'createOrder').mockRejectedValue(new Error('Create error'));

      // Act & Assert
      await expect(ordersController.create(orderDto)).rejects.toThrow(
        new NotFoundException('Create error'),
      );
    });
  });
  describe('getByID', () => {
    it('should return an order by ID', async () => {
      const mockOrder: OrdersDto = {
        id: 1,
        salesOrderID: '12345',
        customerID: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: 500,
        orderItens: [
          {
            title: 'Produto A',
            quantity: 2,
            unit_price: 50,
            sku_number: '123',
            category: 'marketplace',
            unit_measure: 'unit',
            total_amount: 100,
          },
        ],
        customer: 'Cliente Teste',
        orderTracking: 'Em andamento',
        payments: 'Cartão de Crédito',
      };

      jest.spyOn(ordersService, 'getById').mockResolvedValue(mockOrder);

      const result = await ordersController.getByID(1);

      expect(ordersService.getById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockOrder);
    });

    it('should throw a NotFoundException if order not found', async () => {
      jest.spyOn(ordersService, 'getById').mockRejectedValue(new Error('Not found'));

      await expect(ordersController.getByID(1)).rejects.toThrow(
        new NotFoundException('Not found'),
      );
    });
  });

  describe('update', () => {
    it('should update an order', async () => {
      const dto: OrderUpdateDto = {
        "amount": 31,
        "orderTracking": null,
        "payments": "",
        "id": 0,
        "salesOrderID": "1"     
      };
      const updatedOrder = { id: 1, salesOrderID: 'SO-123', amount: 600 };

      jest.spyOn(ordersService, 'update').mockResolvedValue(updatedOrder);

      const result = await ordersController.update(dto);

      expect(ordersService.update).toHaveBeenCalledWith(dto);
      expect(result).toEqual(updatedOrder);
    });

    it('should throw a NotFoundException if update fails', async () => {
      const dto: OrderUpdateDto = {
        "amount": 31,
        "orderTracking": null,
        "payments": "",
        "id": 0,
        "salesOrderID": "1"   
      };

      jest.spyOn(ordersService, 'update').mockRejectedValue(new Error('Update error'));

      await expect(ordersController.update(dto)).rejects.toThrow(
        new NotFoundException('Update error'),
      );
    });
  });

  describe('delete', () => {
    it('should delete an order', async () => {
      const mockResult = { success: true };

      jest.spyOn(ordersService, 'delete').mockResolvedValue(mockResult);

      const result = await ordersController.delete(1);

      expect(ordersService.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });

    it('should throw a NotFoundException if delete fails', async () => {
      jest.spyOn(ordersService, 'delete').mockRejectedValue(new Error('Delete error'));

      await expect(ordersController.delete(1)).rejects.toThrow(
        new NotFoundException('Delete error'),
      );
    });
  });
});