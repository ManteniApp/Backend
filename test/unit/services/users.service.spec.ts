import { Test, TestingModule } from '@nestjs/testing';

import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcryptjs';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UsersService } from '@/users/service/users.service';
import { UsersRepository } from '@/users/repository/users.repository';
import { PasswordResetRepository } from '@/users/repository/password-reset.repository';
import { AuthService } from 'src/auth/auth.service';
import { MailService } from 'src/common/mail/mail.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { AuditService } from 'src/common/audit/audit.service';
import { DatabaseService } from '@/infrastructure/database/database.service';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

describe('UsersService', () => {
    let service: UsersService;
    let usersRepo: any;
    let resetRepo: any;
    let authService: any;
    let mailService: any;
    let configService: any;
    let notificationsService: any;
    let auditService: any;

    beforeEach(async () => {
        // Crear mocks FRESCOS en cada test
        usersRepo = {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findByGoogleId: jest.fn(),
            updateGoogleId: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            delete: jest.fn(),
            updateUser: jest.fn(),
            updatePasswordHash: jest.fn(),
        };

        resetRepo = {
            create: jest.fn(),
            findValidByToken: jest.fn(),
            markUsed: jest.fn(),
        };

        authService = {
            signPayload: jest.fn(),
        };

        mailService = {
            sendMail: jest.fn(),
        };

        configService = {
            get: jest.fn((key: string) => {
                const config = {
                    GOOGLE_CLIENT_ID: 'test-client-id',
                    PASSWORD_RESET_TOKEN_EXP_H: '1'
                };
                return config[key];
            }),
        };

        notificationsService = {
            sendConfirmationEmail: jest.fn(),
        };

        auditService = {
            log: jest.fn(),
        };

        // En la sección de providers del beforeEach:
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: UsersRepository, useValue: usersRepo },
                { provide: PasswordResetRepository, useValue: resetRepo },
                { provide: AuthService, useValue: authService },
                { provide: MailService, useValue: mailService },
                { provide: ConfigService, useValue: configService },
                { provide: NotificationsService, useValue: notificationsService },
                { provide: AuditService, useValue: auditService },
                // CORREGIR DatabaseService mock:
                // En el beforeEach, reemplaza el provider de DatabaseService con:
                {
                    provide: DatabaseService,
                    useValue: {
                        // Proporciona client como un objeto con métodos
                        client: {
                            query: jest.fn(),
                            delete: jest.fn(),
                            from: jest.fn().mockReturnThis(),
                            where: jest.fn().mockReturnThis(),
                        },
                        // O si necesita ser una función:
                        getClient: jest.fn().mockReturnValue({
                            query: jest.fn(),
                            delete: jest.fn(),
                        }),
                        beginTransaction: jest.fn(),
                        commitTransaction: jest.fn(),
                        rollbackTransaction: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('registerWithEmail', () => {
        it('should register a new user successfully', async () => {
            // Arrange
            const userData = {
                nombre: 'New User',
                email: 'new@example.com',
                password: 'password123',
                telefono: '123456789',
            };

            const mockUser = {
                id: 1,
                nombre: userData.nombre,
                email: userData.email,
                password_hash: 'hashed-password',
                telefono: userData.telefono,
                google_id: null,
            };

            usersRepo.findByEmail.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            usersRepo.create.mockResolvedValue(mockUser);
            authService.signPayload.mockReturnValue('jwt-token');

            // Act
            const result = await service.registerWithEmail(
                userData.nombre,
                userData.email,
                userData.password,
                userData.telefono,
            );

            // Assert
            expect(usersRepo.findByEmail).toHaveBeenCalledWith(userData.email);
            expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
            expect(usersRepo.create).toHaveBeenCalledWith({
                nombre: userData.nombre,
                email: userData.email,
                telefono: userData.telefono,
                password_hash: 'hashed-password',
            });
            expect(notificationsService.sendConfirmationEmail).toHaveBeenCalledWith(
                userData.email,
                userData.nombre,
            );
            expect(authService.signPayload).toHaveBeenCalledWith({
                sub: mockUser.id,
                email: mockUser.email,
            });

            // Verificar que el resultado no incluya password_hash
            expect(result.user.password_hash).toBeUndefined();
            expect(result.token).toBe('jwt-token');
        });

        it('should throw ConflictException if email already exists', async () => {
            // Arrange
            const userData = {
                nombre: 'Existing User',
                email: 'existing@example.com',
                password: 'password123',
            };

            const existingUser = {
                id: 1,
                nombre: 'Existing User',
                email: 'existing@example.com',
                password_hash: 'hashed',
                telefono: '123456789',
                google_id: null,
            };

            usersRepo.findByEmail.mockResolvedValue(existingUser);

            // Act & Assert
            await expect(
                service.registerWithEmail(userData.nombre, userData.email, userData.password),
            ).rejects.toThrow(ConflictException);

            expect(usersRepo.findByEmail).toHaveBeenCalledWith(userData.email);
            expect(usersRepo.create).not.toHaveBeenCalled();
        });
    });

    describe('loginWithEmail', () => {
        it('should login user successfully', async () => {
            // Arrange
            const loginData = {
                email: 'test@example.com',
                password: 'password123',
            };

            const mockUser = {
                id: 1,
                nombre: 'Test User',
                email: 'test@example.com',
                password_hash: 'hashed-password',
                telefono: '123456789',
                google_id: null,
            };

            usersRepo.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            authService.signPayload.mockReturnValue('jwt-token');

            // Act
            const result = await service.loginWithEmail(loginData.email, loginData.password);

            // Assert
            expect(usersRepo.findByEmail).toHaveBeenCalledWith(loginData.email);
            expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password_hash);
            expect(result.user.password_hash).toBeUndefined();
            expect(result.token).toBe('jwt-token');
        });

        it('should throw UnauthorizedException for non-existent user', async () => {
            // Arrange
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };

            usersRepo.findByEmail.mockResolvedValue(null);

            // Act & Assert
            await expect(service.loginWithEmail(loginData.email, loginData.password))
                .rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for invalid password', async () => {
            // Arrange
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };

            const mockUser = {
                id: 1,
                nombre: 'Test User',
                email: 'test@example.com',
                password_hash: 'hashed-password',
                telefono: '123456789',
                google_id: null,
            };

            usersRepo.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            // Act & Assert
            await expect(service.loginWithEmail(loginData.email, loginData.password))
                .rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for user without password', async () => {
            // Arrange
            const loginData = {
                email: 'google@example.com',
                password: 'password123',
            };

            const googleUser = {
                id: 2,
                nombre: 'Google User',
                email: 'google@example.com',
                password_hash: null,
                telefono: null,
                google_id: 'google-123',
            };

            usersRepo.findByEmail.mockResolvedValue(googleUser);

            // Act & Assert
            await expect(service.loginWithEmail(loginData.email, loginData.password))
                .rejects.toThrow(UnauthorizedException);
        });
    });

    describe('getMyProfile', () => {
        it('should return user profile without password', async () => {
            // Arrange
            const userId = 1;
            const mockUser = {
                id: 1,
                nombre: 'Test User',
                email: 'test@example.com',
                password_hash: 'hashed-password',
                telefono: '123456789',
                google_id: null,
            };

            usersRepo.findById.mockResolvedValue(mockUser);

            // Act
            const result = await service.getMyProfile(userId);

            // Assert
            expect(usersRepo.findById).toHaveBeenCalledWith(userId);
            expect(result.password_hash).toBeUndefined();
            expect(result.id).toBe(mockUser.id);
            expect(result.nombre).toBe(mockUser.nombre);
            expect(result.email).toBe(mockUser.email);
        });

        it('should throw NotFoundException for non-existent user', async () => {
            // Arrange
            const userId = 999;
            usersRepo.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.getMyProfile(userId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateProfile', () => {
        it('should update user profile successfully', async () => {
            // Arrange
            const userId = 1;
            const updateData = {
                nombre: 'Updated Name',
                email: 'updated@example.com',
            };

            const existingUser = {
                id: 1,
                nombre: 'Original Name',
                email: 'original@example.com',
                password_hash: 'hashed-password',
                telefono: '123456789',
                google_id: null,
            };

            const updatedUser = {
                ...existingUser,
                ...updateData,
            };

            usersRepo.findById.mockResolvedValue(existingUser);
            usersRepo.findByEmail.mockResolvedValue(null); // No existe otro usuario con ese email
            usersRepo.updateUser.mockResolvedValue(updatedUser);

            // Act
            const result = await service.updateProfile(userId, updateData);

            // Assert
            expect(usersRepo.findById).toHaveBeenCalledWith(userId);
            expect(usersRepo.findByEmail).toHaveBeenCalledWith(updateData.email);
            expect(usersRepo.updateUser).toHaveBeenCalledWith(userId, updateData);
            expect(result.nombre).toBe(updateData.nombre);
            expect(result.email).toBe(updateData.email);
            expect(result.password_hash).toBeUndefined();
        });

        it('should throw ConflictException if email is already in use', async () => {
            // Arrange
            const userId = 1;
            const updateData = {
                email: 'existing@example.com',
            };

            const existingUser = {
                id: 1,
                nombre: 'Test User',
                email: 'test@example.com',
                password_hash: 'hashed-password',
                telefono: '123456789',
                google_id: null,
            };

            const otherUser = {
                id: 2,
                nombre: 'Other User',
                email: 'existing@example.com',
                password_hash: 'hashed',
                telefono: '987654321',
                google_id: null,
            };

            usersRepo.findById.mockResolvedValue(existingUser);
            usersRepo.findByEmail.mockResolvedValue(otherUser);

            // Act & Assert
            await expect(service.updateProfile(userId, updateData)).rejects.toThrow(ConflictException);
        });

        it('should update password when current password is provided and valid', async () => {
            // Arrange
            const userId = 1;
            const updateData = {
                currentPassword: 'currentPassword',
                newPassword: 'newPassword123',
            };

            const existingUser = {
                id: 1,
                nombre: 'Test User',
                email: 'test@example.com',
                password_hash: 'hashed-current-password',
                telefono: '123456789',
                google_id: null,
            };

            usersRepo.findById.mockResolvedValue(existingUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
            usersRepo.updateUser.mockResolvedValue({
                ...existingUser,
                password_hash: 'new-hashed-password',
            });

            // Act
            const result = await service.updateProfile(userId, updateData);

            // Assert
            expect(bcrypt.compare).toHaveBeenCalledWith(
                updateData.currentPassword,
                existingUser.password_hash,
            );
            expect(bcrypt.hash).toHaveBeenCalledWith(updateData.newPassword, 10);
            expect(usersRepo.updateUser).toHaveBeenCalledWith(userId, {
                password_hash: 'new-hashed-password',
            });
            expect(result.password_hash).toBeUndefined();
        });

        it('should throw UnauthorizedException when current password is not provided for password change', async () => {
            // Arrange
            const userId = 1;
            const updateData = {
                newPassword: 'newPassword123',
            };

            const existingUser = {
                id: 1,
                nombre: 'Test User',
                email: 'test@example.com',
                password_hash: 'hashed-password',
                telefono: '123456789',
                google_id: null,
            };

            usersRepo.findById.mockResolvedValue(existingUser);

            // Act & Assert
            await expect(service.updateProfile(userId, updateData)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for invalid current password', async () => {
            // Arrange
            const userId = 1;
            const updateData = {
                currentPassword: 'wrongPassword',
                newPassword: 'newPassword123',
            };

            const existingUser = {
                id: 1,
                nombre: 'Test User',
                email: 'test@example.com',
                password_hash: 'hashed-password',
                telefono: '123456789',
                google_id: null,
            };

            usersRepo.findById.mockResolvedValue(existingUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            // Act & Assert
            await expect(service.updateProfile(userId, updateData)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('requestPasswordReset', () => {
        it('should send reset email for existing user', async () => {
            // Arrange
            const email = 'test@example.com';
            const frontendUrl = 'http://localhost:3000';
            const clientIp = '127.0.0.1';

            const mockUser = {
                id: 1,
                nombre: 'Test User',
                email: 'test@example.com',
                password_hash: 'hashed-password',
                telefono: '123456789',
                google_id: null,
            };

            usersRepo.findByEmail.mockResolvedValue(mockUser);
            resetRepo.create.mockResolvedValue(undefined);
            mailService.sendMail.mockResolvedValue(undefined);

            // Act
            const result = await service.requestPasswordReset(email, frontendUrl, clientIp);

            // Assert
            expect(usersRepo.findByEmail).toHaveBeenCalledWith(email);
            expect(resetRepo.create).toHaveBeenCalled();
            expect(mailService.sendMail).toHaveBeenCalled();
            expect(auditService.log).toHaveBeenCalled();
            expect(result.ok).toBe(true);
        });

        it('should return ok for non-existent user (security measure)', async () => {
            // Arrange
            const email = 'nonexistent@example.com';
            const frontendUrl = 'http://localhost:3000';

            usersRepo.findByEmail.mockResolvedValue(null);

            // Act
            const result = await service.requestPasswordReset(email, frontendUrl);

            // Assert
            expect(result.ok).toBe(true);
            expect(auditService.log).toHaveBeenCalled();
        });
    });

    describe('resetPassword', () => {
        it('should reset password with valid token', async () => {
            // Arrange
            const token = 'valid-token';
            const newPassword = 'newPassword123';
            const resetRecord = {
                id: 1,
                user_id: 1,
                token: 'valid-token',
                expires_at: new Date(Date.now() + 3600000),
                used: false,
            };

            resetRepo.findValidByToken.mockResolvedValue(resetRecord);
            (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
            usersRepo.updatePasswordHash.mockResolvedValue(undefined);
            resetRepo.markUsed.mockResolvedValue(undefined);

            // Act
            const result = await service.resetPassword(token, newPassword);

            // Assert
            expect(resetRepo.findValidByToken).toHaveBeenCalledWith(token);
            expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
            expect(usersRepo.updatePasswordHash).toHaveBeenCalledWith(1, 'new-hashed-password');
            expect(resetRepo.markUsed).toHaveBeenCalledWith(1);
            expect(auditService.log).toHaveBeenCalled();
            expect(result.ok).toBe(true);
        });

        it('should throw NotFoundException for invalid token', async () => {
            // Arrange
            const token = 'invalid-token';
            const newPassword = 'newPassword123';

            resetRepo.findValidByToken.mockResolvedValue(null);

            // Act & Assert
            await expect(service.resetPassword(token, newPassword))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('findById', () => {
        it('should return user by id', async () => {
            // Arrange
            const userId = 1;
            const mockUser = {
                id: 1,
                nombre: 'Test User',
                email: 'test@example.com',
                password_hash: 'hashed-password',
                telefono: '123456789',
                google_id: null,
            };

            usersRepo.findById.mockResolvedValue(mockUser);

            // Act
            const result = await service.findById(userId);

            // Assert
            expect(usersRepo.findById).toHaveBeenCalledWith(userId);
            expect(result).toEqual(mockUser);
        });

        it('should throw NotFoundException for non-existent user', async () => {
            // Arrange
            const userId = 999;
            usersRepo.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('getAllUsers', () => {
        it('should return all users without passwords', async () => {
            // Arrange
            const users = [
                {
                    id: 1,
                    nombre: 'User 1',
                    email: 'user1@example.com',
                    password_hash: 'hashed1',
                    telefono: '111111111',
                    google_id: null,
                },
                {
                    id: 2,
                    nombre: 'User 2',
                    email: 'user2@example.com',
                    password_hash: 'hashed2',
                    telefono: '222222222',
                    google_id: null,
                },
            ];

            usersRepo.findAll.mockResolvedValue(users);

            // Act
            const result = await service.getAllUsers();

            // Assert
            expect(usersRepo.findAll).toHaveBeenCalled();
            expect(result).toHaveLength(2);
            result.forEach(user => {
                expect(user.password_hash).toBeUndefined();
            });
        });

        it('should return empty array on error', async () => {
            // Arrange
            usersRepo.findAll.mockRejectedValue(new Error('Database error'));

            // Act & Assert
            // Verificar que no lance excepción y retorne array vacío
            await expect(service.getAllUsers()).resolves.toEqual([]);
            expect(usersRepo.findAll).toHaveBeenCalled();
        });
    });

});
 