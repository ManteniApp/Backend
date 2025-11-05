import { Test, TestingModule } from '@nestjs/testing';
import { MotorcyclesController } from '@/motorcycles/controller/motorcycles.controller';
import { MotorcyclesService } from '@/motorcycles/service/motorcycles.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('MotorcyclesController', () => {
  let controller: MotorcyclesController;
  let motorcyclesService: MotorcyclesService;

  const mockUser = { id: 1 };
  const mockRequest = { user: mockUser } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MotorcyclesController],
      providers: [
        {
          provide: MotorcyclesService,
          useValue: {
            createMotorcycle: jest.fn(),
            findAllByUserId: jest.fn(),
            findByPlaca: jest.fn(),
            updateMotorcycle: jest.fn(),
            deleteMotorcycle: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MotorcyclesController>(MotorcyclesController);
    motorcyclesService = module.get<MotorcyclesService>(MotorcyclesService);
  });

  describe('create', () => {
    it('should create a motorcycle successfully', async () => {
      const motorcycleData = {
        marca: 'Honda',
        modelo: 'CBR 600',
        placa: 'ABC123',
        anio: 2020,
        kilometraje: 5000,
      };

      const expectedResult = {
        id: 1,
        cliente_id: 1,
        ...motorcycleData,
      };

      jest.spyOn(motorcyclesService, 'createMotorcycle').mockResolvedValue(expectedResult);

      const result = await controller.create(motorcycleData, mockRequest);

      expect(motorcyclesService.createMotorcycle).toHaveBeenCalledWith({
        cliente_id: mockUser.id,
        ...motorcycleData,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestException for missing modelo field', async () => {
      const invalidData = {
        marca: 'Honda',
        placa: 'ABC123',
        // modelo missing - esto debería causar error
      };

      // Mock para simular el error que lanza el servicio
      jest.spyOn(motorcyclesService, 'createMotorcycle').mockImplementation(() => {
        throw new BadRequestException('Campos requeridos: cliente_id, marca, modelo y placa');
      });

      await expect(controller.create(invalidData as any, mockRequest)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all motorcycles for user', async () => {
      const expectedMotorcycles = [
        {
          id: 1,
          marca: 'Honda',
          modelo: 'CBR 600',
          placa: 'ABC123',
          año: 2020,
          kilometraje: 5000,
        },
      ];

      jest.spyOn(motorcyclesService, 'findAllByUserId').mockResolvedValue(expectedMotorcycles);

      const result = await controller.findAll(mockRequest);

      expect(motorcyclesService.findAllByUserId).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expectedMotorcycles);
    });
  });

  describe('findByPlaca', () => {
    it('should return motorcycle by placa', async () => {
      const placa = 'ABC123';
      const expectedMotorcycle = {
        id: 1,
        cliente_id: 1,
        marca: 'Honda',
        modelo: 'CBR 600',
        placa: 'ABC123',
        anio: 2020,
        kilometraje: 5000,
      };

      jest.spyOn(motorcyclesService, 'findByPlaca').mockResolvedValue(expectedMotorcycle);

      const result = await controller.findByPlaca(placa, mockRequest);

      expect(motorcyclesService.findByPlaca).toHaveBeenCalledWith(placa, mockUser.id);
      expect(result).toEqual(expectedMotorcycle);
    });

    it('should throw NotFoundException for non-existent placa', async () => {
      const placa = 'NONEXISTENT';

      jest.spyOn(motorcyclesService, 'findByPlaca').mockRejectedValue(
        new NotFoundException(`No tienes registrada una motocicleta con la placa ${placa}`),
      );

      await expect(controller.findByPlaca(placa, mockRequest)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update motorcycle successfully', async () => {
      const motorcycleId = '1';
      const updates = {
        marca: 'Updated Honda',
        kilometraje: 6000,
      };

      const expectedResult = {
        id: 1,
        marca: 'Updated Honda',
        modelo: 'CBR 600',
        placa: 'ABC123',
        año: 2020,
        kilometraje: 6000,
      };

      jest.spyOn(motorcyclesService, 'updateMotorcycle').mockResolvedValue(expectedResult);

      const result = await controller.update(motorcycleId, updates, mockRequest);

      expect(motorcyclesService.updateMotorcycle).toHaveBeenCalledWith(1, updates, mockUser.id);
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException for non-existent motorcycle', async () => {
      const motorcycleId = '999';
      const updates = { marca: 'Updated' };

      jest.spyOn(motorcyclesService, 'updateMotorcycle').mockRejectedValue(
        new NotFoundException(`No tienes una motocicleta con id ${motorcycleId}`),
      );

      await expect(controller.update(motorcycleId, updates, mockRequest)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete motorcycle successfully', async () => {
      const motorcycleId = '1';
      const expectedResult = { message: 'Motocicleta eliminada exitosamente' };

      jest.spyOn(motorcyclesService, 'deleteMotorcycle').mockResolvedValue(expectedResult);

      const result = await controller.delete(motorcycleId, mockRequest);

      expect(motorcyclesService.deleteMotorcycle).toHaveBeenCalledWith(1, mockUser.id);
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException for non-existent motorcycle', async () => {
      const motorcycleId = '999';

      jest.spyOn(motorcyclesService, 'deleteMotorcycle').mockRejectedValue(
        new NotFoundException(`No tienes una motocicleta con id ${motorcycleId}`),
      );

      await expect(controller.delete(motorcycleId, mockRequest)).rejects.toThrow(NotFoundException);
    });
  });
});
