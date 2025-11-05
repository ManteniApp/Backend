import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '@/users/service/users.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { UsersController } from '@/users/controller/users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            registerWithEmail: jest.fn(),
            loginWithEmail: jest.fn(),
            loginWithGoogle: jest.fn(),
            registerOrLoginWithGoogle: jest.fn(),
            requestPasswordReset: jest.fn(),
            resetPassword: jest.fn(),
            getMyProfile: jest.fn(),
            updateProfile: jest.fn(),
            updateBasicProfile: jest.fn(),
            getAllUsers: jest.fn(),
            findById: jest.fn(),
            deleteUser: jest.fn(),
            findAllUsers: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('getAuthOptions', () => {
    it('should return authentication options', () => {
      const result = controller.getAuthOptions();
      
      expect(result).toHaveProperty('register');
      expect(result).toHaveProperty('login');
      expect(result).toHaveProperty('descriptions');
      expect(result.register.email).toContain('/users/register');
      expect(result.login.email).toContain('/users/login');
    });
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const userData = {
        nombre: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        telefono: '123456789',
      };

      const expectedResult = {
        user: { id: 1, nombre: 'Test User', email: 'test@example.com' },
        token: 'jwt-token',
      };

      jest.spyOn(usersService, 'registerWithEmail').mockResolvedValue(expectedResult);

      const result = await controller.register(userData);

      expect(usersService.registerWithEmail).toHaveBeenCalledWith(
        userData.nombre,
        userData.email,
        userData.password,
        userData.telefono,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw ConflictException when email already exists', async () => {
      const userData = {
        nombre: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      };

      jest.spyOn(usersService, 'registerWithEmail').mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(controller.register(userData)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        user: { id: 1, email: 'test@example.com', nombre: 'Test User' },
        token: 'jwt-token',
      };

      jest.spyOn(usersService, 'loginWithEmail').mockResolvedValue(expectedResult);

      const result = await controller.login(loginData);

      expect(usersService.loginWithEmail).toHaveBeenCalledWith(
        loginData.email,
        loginData.password,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(usersService, 'loginWithEmail').mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginData)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMyProfile', () => {
    it('should return user profile', async () => {
      const userId = '1';
      const expectedProfile = {
        id: 1,
        nombre: 'Test User',
        email: 'test@example.com',
      };

      jest.spyOn(usersService, 'getMyProfile').mockResolvedValue(expectedProfile);

      const result = await controller.getMyProfile(userId);

      expect(usersService.getMyProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedProfile);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const userId = '999';

      jest.spyOn(usersService, 'getMyProfile').mockRejectedValue(
        new NotFoundException('Usuario no encontrado'),
      );

      await expect(controller.getMyProfile(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = '1';
      const updateData = {
        nombre: 'Updated Name',
        email: 'updated@example.com',
      };

      const expectedResult = {
        id: 1,
        nombre: 'Updated Name',
        email: 'updated@example.com',
      };

      jest.spyOn(usersService, 'updateProfile').mockResolvedValue(expectedResult);

      const result = await controller.updateProfile(userId, updateData);

      expect(usersService.updateProfile).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const expectedUsers = [
        { id: 1, nombre: 'User 1', email: 'user1@example.com' },
        { id: 2, nombre: 'User 2', email: 'user2@example.com' },
      ];

      jest.spyOn(usersService, 'getAllUsers').mockResolvedValue(expectedUsers);

      const result = await controller.getAllUsers();

      expect(usersService.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual(expectedUsers);
    });
  });

  describe('getUser', () => {
    it('should return user by id', async () => {
      const userId = '1';
      const expectedUser = {
        id: 1,
        nombre: 'Test User',
        email: 'test@example.com',
      };

      jest.spyOn(usersService, 'findById').mockResolvedValue(expectedUser);

      const result = await controller.getUser(userId);

      expect(usersService.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = '1';
      const expectedResult = { message: 'User deleted successfully' };

      jest.spyOn(usersService, 'deleteUser').mockResolvedValue(expectedResult);

      const result = await controller.deleteUser(userId);

      expect(usersService.deleteUser).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });
  });

  // Tests para endpoints de Google OAuth
  describe('Google OAuth', () => {
    it('should return Google login URL', () => {
      const mockClientId = 'test-client-id';
      jest.spyOn(configService, 'get').mockReturnValue(mockClientId);

      const result = controller.getGoogleLoginUrl();

      expect(result).toHaveProperty('url');
      expect(result.url).toContain('accounts.google.com');
      expect(result.type).toBe('LOGIN');
    });

    it('should throw error when Google client ID is missing', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      expect(() => controller.getGoogleLoginUrl()).toThrow('Google OAuth configuration is missing');
    });
  });

  describe('Password Reset', () => {
    it('should request password reset', async () => {
      const emailData = { email: 'test@example.com' };
      const mockReq = { headers: {}, ip: '127.0.0.1' };
      const expectedResult = { ok: true };

      jest.spyOn(usersService, 'requestPasswordReset').mockResolvedValue(expectedResult);

      const result = await controller.forgot(emailData, mockReq, 'http://localhost:3000');

      expect(usersService.requestPasswordReset).toHaveBeenCalledWith(
        emailData.email,
        'http://localhost:3000',
        '127.0.0.1',
      );
      expect(result).toEqual(expectedResult);
    });

    it('should reset password', async () => {
      const resetData = {
        token: 'reset-token',
        newPassword: 'newpassword123',
      };
      const expectedResult = { ok: true };

      jest.spyOn(usersService, 'resetPassword').mockResolvedValue(expectedResult);

      const result = await controller.reset(resetData);

      expect(usersService.resetPassword).toHaveBeenCalledWith(
        resetData.token,
        resetData.newPassword,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
