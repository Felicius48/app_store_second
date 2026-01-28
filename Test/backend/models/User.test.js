const User = require('../../../backend/models/User');
const { runQuery, getQuery, getAllQuery } = require('../../../backend/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../../../backend/config/database');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('должен создать нового пользователя с хешированным паролем', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      bcrypt.hash.mockResolvedValue('hashedpassword');
      runQuery.mockResolvedValue({ id: 1 });

      const result = await User.create(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(runQuery).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('message');
    });

    it('должен выбросить ошибку при дублировании email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      bcrypt.hash.mockResolvedValue('hashedpassword');
      runQuery.mockRejectedValue(new Error('UNIQUE constraint failed'));

      await expect(User.create(userData)).rejects.toThrow('Пользователь с таким email уже существует');
    });
  });

  describe('findByEmail', () => {
    it('должен найти пользователя по email', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        is_active: 1,
      };

      getQuery.mockResolvedValue(mockUser);

      const user = await User.findByEmail('test@example.com');

      expect(getQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ? AND is_active = 1',
        ['test@example.com']
      );
      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe('test@example.com');
    });

    it('должен вернуть null если пользователь не найден', async () => {
      getQuery.mockResolvedValue(null);

      const user = await User.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('должен найти пользователя по ID', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        is_active: 1,
      };

      getQuery.mockResolvedValue(mockUser);

      const user = await User.findById(1);

      expect(getQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ? AND is_active = 1',
        [1]
      );
      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(1);
    });
  });

  describe('checkPassword', () => {
    it('должен вернуть true при правильном пароле', async () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      bcrypt.compare.mockResolvedValue(true);

      const result = await user.checkPassword('password123');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(result).toBe(true);
    });

    it('должен вернуть false при неправильном пароле', async () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      bcrypt.compare.mockResolvedValue(false);

      const result = await user.checkPassword('wrongpassword');

      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('должен сгенерировать JWT токен', () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        role: 'user',
      });

      jwt.sign.mockReturnValue('mock-token');

      const token = user.generateToken();

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, email: 'test@example.com', role: 'user' },
        expect.any(String),
        { expiresIn: '7d' }
      );
      expect(token).toBe('mock-token');
    });
  });

  describe('updateProfile', () => {
    it('должен обновить профиль пользователя', async () => {
      runQuery.mockResolvedValue({ changes: 1 });

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        address: 'New Address',
        city: 'New City',
        postalCode: '54321',
      };

      const result = await User.updateProfile(1, updateData);

      expect(runQuery).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });
  });

  describe('changePassword', () => {
    it('должен изменить пароль пользователя', async () => {
      bcrypt.hash.mockResolvedValue('newhashedpassword');
      runQuery.mockResolvedValue({ changes: 1 });

      const result = await User.changePassword(1, 'newpassword');

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 12);
      expect(runQuery).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });
  });

  describe('toPublicData', () => {
    it('должен вернуть публичные данные пользователя', () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        phone: '+79991234567',
        address: 'Test Street',
        city: 'Test City',
        postal_code: '12345',
        role: 'user',
        avatar_url: '/uploads/avatar.jpg',
        created_at: '2024-01-01',
      });

      const publicData = user.toPublicData();

      expect(publicData).not.toHaveProperty('password');
      expect(publicData).toHaveProperty('id');
      expect(publicData).toHaveProperty('email');
      expect(publicData).toHaveProperty('firstName');
      expect(publicData).toHaveProperty('lastName');
    });
  });
});
