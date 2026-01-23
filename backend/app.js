const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandlers');

const createApp = () => {
  const app = express();

  // Безопасность
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 200, // увеличено до 200 запросов
    standardHeaders: true,
    legacyHeaders: false,
    // Исключаем статические файлы и OPTIONS запросы
    skip: (req) => {
      return req.method === 'OPTIONS' || req.path.startsWith('/uploads/');
    }
  });
  app.use(limiter);

  // Middleware для парсинга JSON
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Статические файлы для изображений
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static(path.join(__dirname, 'uploads')));

  // API Routes
  app.use('/api', apiRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
  });

  // Обработка ошибок
  app.use(errorHandler);

  // 404 handler
  app.use(notFoundHandler);

  return app;
};

module.exports = { createApp };
