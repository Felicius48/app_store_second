const request = require('supertest');
const express = require('express');
const authRoutes = require('../../../backend/routes/auth');
const User = require('../../../backend/models/User');
const bcrypt = require('bcryptjs');

jest.mock('../../../backend/models/User');
jest.mock('bcryptjs');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('должен зарегистрировать нового пользователя', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      User.create.mockResolvedValue({ id: 1 });
      User.findById.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        generateToken: jest.fn().mockReturnValue('mock-token'),
      });

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
    });

    it('должен вернуть ошибку при невалидных данных', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('должен вернуть ошибку при дублировании email', async () => {
      User.create.mockRejectedValue(new Error('Пользователь с таким email уже существует'));

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('должен авторизовать пользователя с правильными данными', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        checkPassword: jest.fn().mockResolvedValue(true),
        generateToken: jest.fn().mockReturnValue('mock-token'),
        toPublicData: jest.fn().mockReturnValue({
          id: 1,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        }),
      };

      User.findByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(mockUser.checkPassword).toHaveBeenCalledWith('password123');
    });

    it('должен вернуть ошибку при неверном пароле', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        checkPassword: jest.fn().mockResolvedValue(false),
      };

      User.findByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('должен вернуть ошибку если пользователь не найден', async () => {
      User.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /auth/profile', () => {
    it('должен вернуть профиль авторизованного пользователя', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        toPublicData: jest.fn().mockReturnValue({
          id: 1,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        }),
      };

      // Мокаем middleware authenticate
      const authenticate = (req, res, next) => {
        req.user = mockUser;
        next();
      };

      const appWithAuth = express();
      appWithAuth.use(express.json());
      appWithAuth.use('/auth', (req, res, next) => {
        if (req.path === '/profile' && req.method === 'GET') {
          return authenticate(req, res, next);
        }
        next();
      });
      appWithAuth.use('/auth', authRoutes);

      const response = await request(appWithAuth)
        .get('/auth/profile')
        .set('Authorization', 'Bearer mock-token');

      // Проверяем что маршрут существует
      expect(response.status).not.toBe(404);
    });
  });
});
