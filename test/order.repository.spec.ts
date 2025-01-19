import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersRepository } from '../src/Domain/Repositories/order.repository';
import { OrderUpdateDto } from '../src/Presentation/orders/dto/order-update.dto';
import { OrdersDto } from '../src/Presentation/orders/dto/order.dto';
import { Order } from '../src/Presentation/orders/order.entity';

describe('OrdersRepository', () => {
  let ordersRepository: OrdersRepository;

  const mockOrderEntity = {
    findOne: jest.fn(),
    update: jest.fn(),
  };


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersRepository,         {
        provide: Order,
        useValue: mockOrderEntity,
      },
],
    }).compile();

    ordersRepository = module.get<OrdersRepository>(OrdersRepository);
  });

  describe('createOrder', () => {
    it('deve criar e salvar um pedido no banco de dados', async () => {
      const saveMock = jest.fn().mockResolvedValue(true);
      Order.prototype.save = saveMock;

      const dto: OrdersDto = {
        amount: 100,
        customer: 'Cliente Teste',
        customerID: 1,
        orderItens: [],
        orderTracking: null,
        payments: "",
        id: 0,
        createdAt: undefined,
        updatedAt: undefined,
        salesOrderID: "1"
      };

      const result = await ordersRepository.createOrder(dto);

      expect(saveMock).toHaveBeenCalled();
      expect(result.amount).toBe(dto.amount);
    });

    it('deve lançar exceção ao ocorrer erro no banco de dados', async () => {
      const saveMock = jest.fn().mockRejectedValue(new Error('Database Error'));
      Order.prototype.save = saveMock;

      const dto: OrdersDto = {
        amount: 100,
        customer: 'Cliente Teste',
        customerID: 1,
        orderItens: [],
        orderTracking: null,
        payments: "",
        id: 0,
        createdAt: undefined,
        updatedAt: undefined,
        salesOrderID: "1"
      };

      await expect(ordersRepository.createOrder(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getOrderById', () => {
    it('deve retornar um pedido pelo ID', async () => {
      const findOneMock = jest.fn().mockResolvedValue({ id: 1, customer: 'Cliente Teste' });
      Order.findOne = findOneMock;

      const result = await ordersRepository.getOrderById(1);

      expect(findOneMock).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1, customer: 'Cliente Teste' });
    });

    it('deve lançar exceção ao não conseguir buscar o pedido', async () => {
      const findOneMock = jest.fn().mockRejectedValue(new Error('Database Error'));
      Order.findOne = findOneMock;

      await expect(ordersRepository.getOrderById(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteOrder', () => {
    it('deve remover um pedido', async () => {
      const removeMock = jest.fn().mockResolvedValue(true);
      const getOrderByIdMock = jest.fn().mockResolvedValue({ id: 1 });
      Order.remove = removeMock;
      ordersRepository.getOrderById = getOrderByIdMock;

      await ordersRepository.deleteOrder(1);

      expect(getOrderByIdMock).toHaveBeenCalledWith(1);
      expect(removeMock).toHaveBeenCalledWith({ id: 1 });
    });

    it('deve lançar exceção ao não conseguir deletar o pedido', async () => {
      const removeMock = jest.fn().mockRejectedValue(new Error('Database Error'));
      const getOrderByIdMock = jest.fn().mockResolvedValue({ id: 1 });
      Order.remove = removeMock;
      ordersRepository.getOrderById = getOrderByIdMock;

      await expect(ordersRepository.deleteOrder(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateOrder', () => {
  
    it('deve lançar exceção ao atualizar o pedido', async () => {
      const mockUpdateOrderDto: OrderUpdateDto = {
        id: 1,
        salesOrderID: "1",
        amount: 200,
        orderTracking: 'Novo Tracking',
        payments: "",
      };

      mockOrderEntity.findOne.mockRejectedValue(new Error('Erro no banco de dados'));

      await expect(ordersRepository.updateOrder(mockUpdateOrderDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

});