const { authenticate, requireAdmin, requireOwnerOrAdmin, optionalAuth } = require('../../../backend/middleware/auth');
const User = require('../../../backend/models/User');
const jwt = require('jsonwebtoken');

jest.mock('../../../backend/models/User');
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('должен вернуть 401 если токен отсутствует', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Требуется авторизация',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('должен вернуть 401 если токен не начинается с Bearer', async () => {
      req.headers.authorization = 'Invalid token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('должен добавить пользователя в req при валидном токене', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'user',
      };

      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ id: 1, email: 'test@example.com' });
      User.findById.mockResolvedValue(mockUser);

      await authenticate(req, res, next);

      expect(jwt.verify).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith(1);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('должен вернуть 401 если токен истек', async () => {
      req.headers.authorization = 'Bearer expired-token';
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Токен истек',
      });
    });

    it('должен вернуть 401 если пользователь не найден', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ id: 999 });
      User.findById.mockResolvedValue(null);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Пользователь не найден',
      });
    });
  });

  describe('requireAdmin', () => {
    it('должен вернуть 401 если пользователь не авторизован', () => {
      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('должен вернуть 403 если пользователь не админ', () => {
      req.user = { id: 1, role: 'user' };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Требуются права администратора',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('должен пропустить запрос если пользователь админ', () => {
      req.user = { id: 1, role: 'admin' };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnerOrAdmin', () => {
    it('должен вернуть 401 если пользователь не авторизован', () => {
      const middleware = requireOwnerOrAdmin(1);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('должен пропустить запрос если пользователь админ', () => {
      req.user = { id: 2, role: 'admin' };
      const middleware = requireOwnerOrAdmin(1);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('должен пропустить запрос если пользователь владелец', () => {
      req.user = { id: 1, role: 'user' };
      const middleware = requireOwnerOrAdmin(1);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('должен вернуть 403 если пользователь не владелец и не админ', () => {
      req.user = { id: 2, role: 'user' };
      const middleware = requireOwnerOrAdmin(1);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('должен продолжить без пользователя если токен отсутствует', async () => {
      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('должен добавить пользователя в req при валидном токене', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ id: 1 });
      User.findById.mockResolvedValue(mockUser);

      await optionalAuth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('должен продолжить без пользователя при невалидном токене', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });
});
