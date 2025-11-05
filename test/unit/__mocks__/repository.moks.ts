export const createMockUsersRepository = () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
  findByGoogleId: jest.fn(),
  updateGoogleId: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  delete: jest.fn(),
  updateUser: jest.fn(),
  updatePasswordHash: jest.fn(),
});

export const createMockPasswordResetRepository = () => ({
  create: jest.fn(),
  findValidByToken: jest.fn(),
  markUsed: jest.fn(),
});

export const createMockMotorcyclesRepository = () => ({
  create: jest.fn(),
  findAllByUserId: jest.fn(),
  findByPlaca: jest.fn(),
  findByPlacaAndUserId: jest.fn(),
  findByIdAndUserId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

export const createMockMaintenanceRepository = () => ({
  create: jest.fn(),
  findByMoto: jest.fn(),
  findUpcoming: jest.fn(),
  findOilChanges: jest.fn(),
  delete: jest.fn(),
  // AGREGAR ESTE MÉTODO
  findById: jest.fn(),
});

// NUEVO: Mock para MotorcycleSpecsRepository
export const createMockMotorcycleSpecsRepository = () => ({
  create: jest.fn(),
  findByMotorcycleId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
});