const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Конфигурация multer для загрузки аватаров
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены (jpeg, jpg, png, gif)'));
    }
  }
});

// Валидация регистрации
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Введите корректный email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать минимум 6 символов'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Имя должно содержать от 2 до 50 символов'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Фамилия должна содержать от 2 до 50 символов')
];

// Валидация логина
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Введите корректный email'),
  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен')
];

// Регистрация
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, phone } = req.body;

    // Создание пользователя
    const result = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone
    });

    // Получение созданного пользователя
    const user = await User.findById(result.id);

    // Генерация токена
    const token = user.generateToken();

    res.status(201).json({
      success: true,
      message: 'Пользователь успешно зарегистрирован',
      data: {
        user: user.toPublicData(),
        token
      }
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);

    if (error.message.includes('уже существует')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при регистрации'
    });
  }
});

// Вход в систему
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Поиск пользователя
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    // Проверка пароля
    const isValidPassword = await user.checkPassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    // Генерация токена
    const token = user.generateToken();

    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      data: {
        user: user.toPublicData(),
        token
      }
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при входе'
    });
  }
});

// Получение профиля пользователя
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toPublicData()
      }
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Обновление профиля
router.put('/profile', authenticate, [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Имя должно содержать от 2 до 50 символов'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Фамилия должна содержать от 2 до 50 символов'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Введите корректный номер телефона'),
  body('address')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Адрес должен содержать от 2 до 200 символов'),
  body('city')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Город должен содержать от 2 до 100 символов'),
  body('postalCode')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Индекс должен содержать от 2 до 20 символов')
], async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone, address, city, postalCode } = req.body;

    await User.updateProfile(req.user.id, {
      firstName,
      lastName,
      phone,
      address,
      city,
      postalCode
    });

    // Получение обновленного пользователя
    const updatedUser = await User.findById(req.user.id);

    res.json({
      success: true,
      message: 'Профиль успешно обновлен',
      data: {
        user: updatedUser.toPublicData()
      }
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Изменение пароля
router.put('/change-password', authenticate, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Текущий пароль обязателен'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Новый пароль должен содержать минимум 6 символов')
], async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    // Проверка текущего пароля
    const isValidPassword = await user.checkPassword(currentPassword);

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Текущий пароль неверен'
      });
    }

    // Изменение пароля
    await User.changePassword(req.user.id, newPassword);

    res.json({
      success: true,
      message: 'Пароль успешно изменен'
    });
  } catch (error) {
    console.error('Ошибка изменения пароля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Загрузка аватара
router.post('/upload-avatar', authenticate, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Файл не загружен'
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Обновляем аватар пользователя
    await User.updateProfile(req.user.id, { avatarUrl });

    // Получаем обновленного пользователя
    const updatedUser = await User.findById(req.user.id);

    res.json({
      success: true,
      message: 'Аватар успешно загружен',
      data: {
        user: updatedUser.toPublicData()
      }
    });
  } catch (error) {
    console.error('Ошибка загрузки аватара:', error);

    if (error.message.includes('Только изображения разрешены')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Файл слишком большой. Максимальный размер: 5MB'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при загрузке аватара'
    });
  }
});

// Удаление аватара
router.delete('/avatar', authenticate, async (req, res) => {
  try {
    // Обновляем аватар на null
    await User.updateProfile(req.user.id, { avatarUrl: null });

    // Получаем обновленного пользователя
    const updatedUser = await User.findById(req.user.id);

    res.json({
      success: true,
      message: 'Аватар удален',
      data: {
        user: updatedUser.toPublicData()
      }
    });
  } catch (error) {
    console.error('Ошибка удаления аватара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

module.exports = router;
