const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware для проверки аутентификации
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация'
      });
    }

    const token = authHeader.substring(7); // Убираем 'Bearer '

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }

    // Проверка токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Поиск пользователя в базе данных
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Добавляем пользователя в запрос
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Токен истек'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Недействительный токен'
      });
    }

    console.error('Ошибка аутентификации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при аутентификации'
    });
  }
};

// Middleware для проверки роли администратора
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Требуется авторизация'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Требуются права администратора'
    });
  }

  next();
};

// Middleware для проверки владельца ресурса или админа
const requireOwnerOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация'
      });
    }

    // Админ может делать всё
    if (req.user.role === 'admin') {
      return next();
    }

    // Пользователь может работать только со своими ресурсами
    if (req.user.id !== resourceUserId) {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен'
      });
    }

    next();
  };
};

// Middleware для опциональной аутентификации
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.id);

        if (user) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    // Игнорируем ошибки и продолжаем без аутентификации
    next();
  }
};

module.exports = {
  authenticate,
  requireAdmin,
  requireOwnerOrAdmin,
  optionalAuth
};
