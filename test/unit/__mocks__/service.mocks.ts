export const createMockAuthService = () => ({
  signPayload: jest.fn(),
  validateUser: jest.fn(),
});

export const createMockMailService = () => ({
  sendMail: jest.fn(),
});

export const createMockConfigService = () => ({
  get: jest.fn(),
});

export const createMockNotificationsService = () => ({
  sendConfirmationEmail: jest.fn(),
});

export const createMockAuditService = () => ({
  log: jest.fn(),
});
