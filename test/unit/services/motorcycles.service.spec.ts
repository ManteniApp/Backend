import { Test, TestingModule } from '@nestjs/testing';
import { MotorcyclesService } from '@/motorcycles/service/motorcycles.service';
import { MotorcyclesRepository } from '@/motorcycles/repository/motorcycles.repository';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { createMockMotorcycleSpecsRepository } from '../__mocks__/repository.moks';
import { MotorcycleSpecsRepository } from '@/motorcycles/repository/motorcycle-specs.repository';


const mockMotorcycleSpecsRepository = {
  // Agrega métodos que puedan ser usados
  create: jest.fn(),
  findByMotorcycleId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('MotorcyclesService', () => {
  let service: MotorcyclesService;
  let motorcyclesRepo: jest.Mocked<MotorcyclesRepository>;
  let motorcycleSpecsRepo: jest.Mocked<MotorcycleSpecsRepository>;

  const mockMotorcycle = {
    id: 1,
    cliente_id: 1,
    marca: 'Honda',
    modelo: 'CBR 600',
    placa: 'ABC123',
    anio: 2020,
    kilometraje: 5000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MotorcyclesService,
        {
          provide: MotorcyclesRepository,
          useValue: {
            create: jest.fn(),
            findByPlaca: jest.fn(),
            findAllByUserId: jest.fn(),
            findByPlacaAndUserId: jest.fn(),
            findByIdAndUserId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: MotorcycleSpecsRepository, // Add this missing provider
          useValue: {
            findByMarcaAndModelo: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MotorcyclesService>(MotorcyclesService);
    motorcyclesRepo = module.get(MotorcyclesRepository);
    motorcycleSpecsRepo = module.get(MotorcycleSpecsRepository);
  });

  describe('createMotorcycle', () => {
    it('should create a motorcycle successfully', async () => {
      const motorcycleData = {
        cliente_id: 1,
        marca: 'Honda',
        modelo: 'CBR 600', // ✅ Campo modelo incluido
        placa: 'ABC123',
        anio: 2020,
        kilometraje: 5000,
      };

      jest.spyOn(motorcyclesRepo, 'findByPlaca').mockResolvedValue(null);
      jest.spyOn(motorcyclesRepo, 'create').mockResolvedValue(mockMotorcycle);

      const result = await service.createMotorcycle(motorcycleData);

      expect(motorcyclesRepo.findByPlaca).toHaveBeenCalledWith(motorcycleData.placa);
      expect(motorcyclesRepo.create).toHaveBeenCalledWith(motorcycleData);
      expect(result).toEqual(mockMotorcycle);
    });

    it('should throw BadRequestException for missing modelo field', async () => {
      const invalidData = {
        cliente_id: 1,
        marca: 'Honda',
        placa: 'ABC123',
        // modelo missing - esto debería causar error
      };

      await expect(service.createMotorcycle(invalidData as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for duplicate placa', async () => {
      const motorcycleData = {
        cliente_id: 1,
        marca: 'Honda',
        modelo: 'CBR 600',
        placa: 'EXISTING123',
      };

      jest.spyOn(motorcyclesRepo, 'findByPlaca').mockResolvedValue(mockMotorcycle);

      await expect(service.createMotorcycle(motorcycleData)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllByUserId', () => {
    it('should return all motorcycles for user', async () => {
      const userId = 1;
      const motorcycles = [mockMotorcycle];

      jest.spyOn(motorcyclesRepo, 'findAllByUserId').mockResolvedValue(motorcycles);

      const result = await service.findAllByUserId(userId);

      expect(motorcyclesRepo.findAllByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual([
        {
          id: 1,
          marca: 'Honda',
          modelo: 'CBR 600',
          placa: 'ABC123',
          año: 2020,
          kilometraje: 5000,
        },
      ]);
    });

    it('should throw BadRequestException for undefined userId', async () => {
      // CORRECCIÓN: Usando un número inválido
      await expect(service.findAllByUserId(0)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByPlaca', () => {
    it('should return motorcycle by placa for user', async () => {
      const placa = 'ABC123';
      const userId = 1;

      jest.spyOn(motorcyclesRepo, 'findByPlacaAndUserId').mockResolvedValue(mockMotorcycle);

      const result = await service.findByPlaca(placa, userId);

      expect(motorcyclesRepo.findByPlacaAndUserId).toHaveBeenCalledWith(placa, userId);
      expect(result).toEqual({
        id: 1,
        cliente_id: 1,
        marca: 'Honda',
        modelo: 'CBR 600',
        placa: 'ABC123',
        anio: 2020,
        kilometraje: 5000,
      });
    });

    it('should throw NotFoundException for non-existent placa', async () => {
      const placa = 'NONEXISTENT';
      const userId = 1;

      jest.spyOn(motorcyclesRepo, 'findByPlacaAndUserId').mockResolvedValue(null);

      await expect(service.findByPlaca(placa, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMotorcycle', () => {
    it('should update motorcycle successfully', async () => {
      const motorcycleId = 1;
      const userId = 1;
      const updates = {
        marca: 'Updated Honda',
        kilometraje: 6000,
      };

      const updatedMotorcycle = { ...mockMotorcycle, ...updates };

      jest.spyOn(motorcyclesRepo, 'findByIdAndUserId').mockResolvedValue(mockMotorcycle);
      jest.spyOn(motorcyclesRepo, 'findByPlaca').mockResolvedValue(null);
      jest.spyOn(motorcyclesRepo, 'update').mockResolvedValue(updatedMotorcycle);

      const result = await service.updateMotorcycle(motorcycleId, updates, userId);

      expect(motorcyclesRepo.findByIdAndUserId).toHaveBeenCalledWith(motorcycleId, userId);
      expect(motorcyclesRepo.update).toHaveBeenCalledWith(motorcycleId, updates);
      expect(result).toEqual({
        id: 1,
        marca: 'Updated Honda',
        modelo: 'CBR 600',
        placa: 'ABC123',
        año: 2020,
        kilometraje: 6000,
      });
    });
  });

  describe('deleteMotorcycle', () => {
    it('should delete motorcycle successfully', async () => {
      const motorcycleId = 1;
      const userId = 1;

      jest.spyOn(motorcyclesRepo, 'findByIdAndUserId').mockResolvedValue(mockMotorcycle);
      jest.spyOn(motorcyclesRepo, 'delete').mockResolvedValue(undefined);

      const result = await service.deleteMotorcycle(motorcycleId, userId);

      expect(motorcyclesRepo.findByIdAndUserId).toHaveBeenCalledWith(motorcycleId, userId);
      expect(motorcyclesRepo.delete).toHaveBeenCalledWith(motorcycleId);
      expect(result).toEqual({ message: 'Motocicleta eliminada exitosamente' });
    });
  });
});
