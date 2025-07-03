import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { register, login } from '../../controllers/authController';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock })) as any;

    res = {
      status: statusMock,
      json: jsonMock
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should hash password and return success message', async () => {
      req = {
        body: {
          email: 'test@example.com',
          password: 'password123',
          role: 'user'
        }
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await register(req as Request, res as Response);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User registered successfully' });
    });

    it('should handle errors', async () => {
      req = {
        body: {
          email: 'test@example.com',
          password: 'password123',
          role: 'user'
        }
      };

      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('hash error'));

      await register(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Registration failed' });
    });
  });

  describe('login', () => {
    it('should sign jwt token and return it', async () => {
      req = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };

      (jwt.sign as jest.Mock).mockReturnValue('fakeToken');

      await login(req as Request, res as Response);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user.id', role: 'user.role' },
        process.env.JWT_SECRET!
      );
      expect(jsonMock).toHaveBeenCalledWith({
        token: 'fakeToken',
        user: {
          id: 'user.id',
          email: 'user.email',
          role: 'user.role'
        }
      });
    });

    it('should handle login errors', async () => {
      req = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };

      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw new Error('jwt error');
      });

      await login(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Login failed' });
    });
  });
})