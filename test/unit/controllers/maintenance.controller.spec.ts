import { Test, TestingModule } from '@nestjs/testing';

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { MaintenanceController } from '@/maintenance/controller/maintenance.controller';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { MaintenanceService } from '@/maintenance/service/maintenance.service';

describe('MaintenanceController', () => {
  let controller: MaintenanceController;
  let maintenanceService: MaintenanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaintenanceController],
      providers: [
        {
          provide: MaintenanceService,
          useValue: {
            createMaintenance: jest.fn(),
            getMaintenancesByMoto: jest.fn(),
            getUpcomingMaintenances: jest.fn(),
            getOilChangeRecords: jest.fn(),
            deleteMaintenance: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MaintenanceController>(MaintenanceController);
    maintenanceService = module.get<MaintenanceService>(MaintenanceService);
  });

  describe('create', () => {
    it('should create maintenance successfully', async () => {
      const maintenanceData = {
        moto_id: 1,
        fecha: '2024-01-15',
        tipo: 'Cambio de aceite',
        descripcion: 'Cambio de aceite completo',
        kilometraje: 5000,
        costo: 150,
      };

      const expectedResult = {
        id: 1,
        ...maintenanceData,
        fecha: new Date(maintenanceData.fecha),
      };

      jest.spyOn(maintenanceService, 'createMaintenance').mockResolvedValue(expectedResult);

      const result = await controller.create(maintenanceData);

      expect(maintenanceService.createMaintenance).toHaveBeenCalledWith(maintenanceData);
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestException for missing required fields', async () => {
      const invalidData = {
        moto_id: 1,
        fecha: '2024-01-15',
        tipo: 'Cambio de aceite',
      };

      jest.spyOn(maintenanceService, 'createMaintenance').mockRejectedValue(
        new BadRequestException('Campos requeridos: moto_id, fecha y tipo.'),
      );

      await expect(controller.create(invalidData)).rejects.toThrow(BadRequestException);
    });
  });

  // CORRECCIÓN: Tests específicos para campos faltantes
  describe('create with missing fields', () => {
    it('should throw error when missing fecha', async () => {
      const invalidData = {
        moto_id: 1,
        tipo: 'Cambio de aceite',
        // fecha missing - esto debería fallar
      };

      // Mock para simular el error que lanza el servicio
      jest.spyOn(maintenanceService, 'createMaintenance').mockImplementation(() => {
        throw new BadRequestException('Campos requeridos: moto_id, fecha y tipo.');
      });

      await expect(controller.create(invalidData as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw error when missing tipo', async () => {
      const invalidData = {
        moto_id: 1,
        fecha: '2024-01-15',
        // tipo missing - esto debería fallar
      };

      // Mock para simular el error que lanza el servicio
      jest.spyOn(maintenanceService, 'createMaintenance').mockImplementation(() => {
        throw new BadRequestException('Campos requeridos: moto_id, fecha y tipo.');
      });

      await expect(controller.create(invalidData as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw error when missing moto_id', async () => {
      const invalidData = {
        fecha: '2024-01-15',
        tipo: 'Cambio de aceite',
        // moto_id missing - esto debería fallar
      };

      // Mock para simular el error que lanza el servicio
      jest.spyOn(maintenanceService, 'createMaintenance').mockImplementation(() => {
        throw new BadRequestException('Campos requeridos: moto_id, fecha y tipo.');
      });

      await expect(controller.create(invalidData as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getByMoto', () => {
    it('should return maintenances by moto id', async () => {
      const motoId = 1;
      const expectedMaintenances = [
        {
          id: 1,
          moto_id: 1,
          fecha: new Date('2024-01-15'),
          tipo: 'Cambio de aceite',
          descripcion: 'Cambio de aceite completo',
          kilometraje: 5000,
          costo: 150,
        },
      ];

      jest.spyOn(maintenanceService, 'getMaintenancesByMoto').mockResolvedValue(expectedMaintenances);

      const result = await controller.getByMoto(motoId);

      expect(maintenanceService.getMaintenancesByMoto).toHaveBeenCalledWith(motoId);
      expect(result).toEqual(expectedMaintenances);
    });
  });

  describe('getUpcoming', () => {
    it('should return upcoming maintenances', async () => {
      const motoId = 1;
      const expectedMaintenances = [
        {
          id: 1,
          moto_id: 1,
          fecha: new Date('2024-02-15'),
          tipo: 'Revisión general',
          descripcion: 'Revisión programada',
          kilometraje: 7500,
          costo: 200,
        },
      ];

      jest.spyOn(maintenanceService, 'getUpcomingMaintenances').mockResolvedValue(expectedMaintenances);

      const result = await controller.getUpcoming(motoId);

      expect(maintenanceService.getUpcomingMaintenances).toHaveBeenCalledWith(motoId);
      expect(result).toEqual(expectedMaintenances);
    });
  });

  describe('getOilChanges', () => {
    it('should return oil change records', async () => {
      const motoId = 1;
      const expectedOilChanges = [
        {
          id: 1,
          moto_id: 1,
          fecha: new Date('2024-01-15'),
          tipo: 'Cambio de aceite',
          descripcion: 'Cambio de aceite completo',
          kilometraje: 5000,
          costo: 150,
        },
      ];

      jest.spyOn(maintenanceService, 'getOilChangeRecords').mockResolvedValue(expectedOilChanges);

      const result = await controller.getOilChanges(motoId);

      expect(maintenanceService.getOilChangeRecords).toHaveBeenCalledWith(motoId);
      expect(result).toEqual(expectedOilChanges);
    });
  });

  describe('delete', () => {
    it('should delete maintenance successfully', async () => {
      const maintenanceId = 1;

      jest.spyOn(maintenanceService, 'deleteMaintenance').mockResolvedValue(undefined);

      const result = await controller.delete(maintenanceId);

      expect(maintenanceService.deleteMaintenance).toHaveBeenCalledWith(maintenanceId);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException for non-existent maintenance', async () => {
      const maintenanceId = 999;

      jest.spyOn(maintenanceService, 'deleteMaintenance').mockRejectedValue(
        new NotFoundException('Mantenimiento no encontrado'),
      );

      await expect(controller.delete(maintenanceId)).rejects.toThrow(NotFoundException);
    });
  });
});
