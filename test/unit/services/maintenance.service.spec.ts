import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceService } from '@/maintenance/service/maintenance.service';
import { MaintenanceRepository } from '@/maintenance/repository/maintenance.repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createMockMaintenanceRepository } from '../__mocks__/repository.moks';
describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let maintenanceRepo: MaintenanceRepository;

  const mockMaintenance = {
    id: 1,
    moto_id: 1,
    fecha: new Date('2024-01-15'),
    tipo: 'Cambio de aceite',
    descripcion: 'Cambio de aceite completo',
    kilometraje: 5000,
    costo: 150,
  };

  beforeEach(async () => {
    // Usar el mock factory
    maintenanceRepo = createMockMaintenanceRepository() as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        { provide: MaintenanceRepository, useValue: maintenanceRepo },
      ],
    }).compile();

    service = module.get<MaintenanceService>(MaintenanceService);
  });

  describe('createMaintenance', () => {
    it('should create maintenance successfully', async () => {
      const maintenanceData = {
        moto_id: 1,
        fecha: '2024-01-15',
        tipo: 'Cambio de aceite',
        descripcion: 'Cambio de aceite completo',
        kilometraje: 5000,
        costo: 150,
      };

      jest.spyOn(maintenanceRepo, 'create').mockResolvedValue(mockMaintenance);

      const result = await service.createMaintenance(maintenanceData);

      expect(maintenanceRepo.create).toHaveBeenCalledWith({
        ...maintenanceData,
        fecha: new Date(maintenanceData.fecha),
      });
      expect(result).toEqual(mockMaintenance);
    });

    it('should throw BadRequestException for missing moto_id', async () => {
      const invalidData = {
        fecha: '2024-01-15',
        tipo: 'Cambio de aceite',
      };

      await expect(service.createMaintenance(invalidData as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for missing fecha', async () => {
      const invalidData = {
        moto_id: 1,
        tipo: 'Cambio de aceite',
      };

      await expect(service.createMaintenance(invalidData as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for missing tipo', async () => {
      const invalidData = {
        moto_id: 1,
        fecha: '2024-01-15',
      };

      await expect(service.createMaintenance(invalidData as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMaintenancesByMoto', () => {
    it('should return maintenances by moto id', async () => {
      const motoId = 1;
      const maintenances = [mockMaintenance];

      jest.spyOn(maintenanceRepo, 'findByMoto').mockResolvedValue(maintenances);

      const result = await service.getMaintenancesByMoto(motoId);

      expect(maintenanceRepo.findByMoto).toHaveBeenCalledWith(motoId);
      expect(result).toEqual(maintenances);
    });

    it('should throw BadRequestException for undefined motoId', async () => {
      // CORRECCIÓN: Usando un número inválido en lugar de undefined
      await expect(service.getMaintenancesByMoto(0)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for null motoId', async () => {
      // CORRECCIÓN: Usando as any para evitar el error de tipo
      await expect(service.getMaintenancesByMoto(null as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUpcomingMaintenances', () => {
    it('should return upcoming maintenances', async () => {
      const motoId = 1;
      const upcomingMaintenances = [mockMaintenance];

      jest.spyOn(maintenanceRepo, 'findUpcoming').mockResolvedValue(upcomingMaintenances);

      const result = await service.getUpcomingMaintenances(motoId);

      expect(maintenanceRepo.findUpcoming).toHaveBeenCalledWith(motoId);
      expect(result).toEqual(upcomingMaintenances);
    });
  });

  describe('getOilChangeRecords', () => {
    it('should return oil change records', async () => {
      const motoId = 1;
      const oilChanges = [mockMaintenance];

      jest.spyOn(maintenanceRepo, 'findOilChanges').mockResolvedValue(oilChanges);

      const result = await service.getOilChangeRecords(motoId);

      expect(maintenanceRepo.findOilChanges).toHaveBeenCalledWith(motoId);
      expect(result).toEqual(oilChanges);
    });
  });

  describe('deleteMaintenance', () => {
    it('should delete maintenance successfully', async () => {
      const maintenanceId = 1;

      // CORRECCIÓN: Usar findById en lugar de findByMoto
      jest.spyOn(maintenanceRepo, 'findById').mockResolvedValue(mockMaintenance);
      jest.spyOn(maintenanceRepo, 'delete').mockResolvedValue(undefined);

      await service.deleteMaintenance(maintenanceId);

      expect(maintenanceRepo.findById).toHaveBeenCalledWith(maintenanceId);
      expect(maintenanceRepo.delete).toHaveBeenCalledWith(maintenanceId);
    });

    it('should throw NotFoundException for non-existent maintenance', async () => {
      const maintenanceId = 999;

      // CORRECCIÓN: Usar findById
      jest.spyOn(maintenanceRepo, 'findById').mockResolvedValue(null);

      await expect(service.deleteMaintenance(maintenanceId)).rejects.toThrow(NotFoundException);
    });
  });
});

export { MaintenanceService };
