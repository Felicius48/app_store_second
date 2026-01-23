const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Review = require('../models/Review');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Валидация создания отзыва
const createReviewValidation = [
  body('productId')
    .isInt()
    .withMessage('ID товара должен быть числом'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Оценка должна быть от 1 до 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Заголовок должен содержать от 1 до 200 символов'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Комментарий должен содержать от 10 до 1000 символов')
];

// Получение отзывов для товара
router.get('/product/:productId', [
  query('page').optional().isInt({ min: 1 }).withMessage('Неверный номер страницы'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Лимит должен быть от 1 до 50'),
  query('verifiedOnly').optional().isBoolean().withMessage('verifiedOnly должен быть true или false')
], async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации параметров',
        errors: errors.array()
      });
    }

    const { productId } = req.params;
    const { page = 1, limit = 10, verifiedOnly = false } = req.query;

    if (!productId || isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID товара'
      });
    }

    const offset = (page - 1) * limit;

    const reviews = await Review.findByProductId(parseInt(productId), {
      limit: parseInt(limit),
      offset,
      verifiedOnly: verifiedOnly === 'true'
    });

    const totalCount = await Review.countByProductId(parseInt(productId), verifiedOnly === 'true');
    const totalPages = Math.ceil(totalCount / limit);

    // Получение средней оценки
    const ratingStats = await Review.getAverageRating(parseInt(productId));

    res.json({
      success: true,
      data: {
        reviews: reviews.map(review => review.toPublicData()),
        ratingStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения отзывов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Получение отзывов пользователя
router.get('/user/:userId', authenticate, [
  query('page').optional().isInt({ min: 1 }).withMessage('Неверный номер страницы'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Лимит должен быть от 1 до 50')
], async (req, res) => {
  try {
    // Проверка прав (пользователь может смотреть только свои отзывы, админ - все)
    const { userId } = req.params;
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен'
      });
    }

    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации параметров',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const reviews = await Review.findByUserId(parseInt(userId), {
      limit: parseInt(limit),
      offset
    });

    // Подсчет общего количества (простая версия)
    const totalCount = reviews.length + (page - 1) * limit;

    res.json({
      success: true,
      data: {
        reviews: reviews.map(review => ({
          ...review.toPublicData(),
          productName: review.product_name
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount: Math.max(totalCount, reviews.length),
          hasNext: reviews.length === limit,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения отзывов пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Получение отзыва по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID отзыва'
      });
    }

    const review = await Review.findById(parseInt(id));

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Отзыв не найден'
      });
    }

    res.json({
      success: true,
      data: {
        review: review.toPublicData()
      }
    });
  } catch (error) {
    console.error('Ошибка получения отзыва:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Создание отзыва
router.post('/', authenticate, createReviewValidation, async (req, res) => {
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

    const { productId, rating, title, comment } = req.body;

    // Проверка существования товара (упрощенная версия)
    // В реальном приложении нужно проверить через модель Product

    // Проверка, не оставлял ли пользователь уже отзыв на этот товар
    const hasReviewed = await Review.hasUserReviewedProduct(req.user.id, productId);
    if (hasReviewed) {
      return res.status(400).json({
        success: false,
        message: 'Вы уже оставляли отзыв на этот товар'
      });
    }

    // Создание отзыва
    const result = await Review.create({
      productId,
      userId: req.user.id,
      rating,
      title,
      comment
    });

    // Получение созданного отзыва
    const review = await Review.findById(result.id);

    res.status(201).json({
      success: true,
      message: 'Отзыв успешно создан',
      data: {
        review: review.toPublicData()
      }
    });
  } catch (error) {
    console.error('Ошибка создания отзыва:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Обновление отзыва (только автор или админ)
router.put('/:id', authenticate, [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Оценка должна быть от 1 до 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Заголовок должен содержать от 1 до 200 символов'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Комментарий должен содержать от 10 до 1000 символов')
], async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID отзыва'
      });
    }

    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: errors.array()
      });
    }

    // Получение отзыва
    const existingReview = await Review.findById(parseInt(id));
    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Отзыв не найден'
      });
    }

    // Проверка прав (только автор или админ)
    if (req.user.role !== 'admin' && existingReview.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен'
      });
    }

    const { rating, title, comment } = req.body;

    // Обновление отзыва
    await Review.update(parseInt(id), {
      rating,
      title,
      comment
    });

    // Получение обновленного отзыва
    const updatedReview = await Review.findById(parseInt(id));

    res.json({
      success: true,
      message: 'Отзыв успешно обновлен',
      data: {
        review: updatedReview.toPublicData()
      }
    });
  } catch (error) {
    console.error('Ошибка обновления отзыва:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Удаление отзыва (только автор или админ)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID отзыва'
      });
    }

    // Получение отзыва
    const existingReview = await Review.findById(parseInt(id));
    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Отзыв не найден'
      });
    }

    // Проверка прав (только автор или админ)
    if (req.user.role !== 'admin' && existingReview.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен'
      });
    }

    // Удаление отзыва
    await Review.delete(parseInt(id));

    res.json({
      success: true,
      message: 'Отзыв успешно удален'
    });
  } catch (error) {
    console.error('Ошибка удаления отзыва:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Верификация отзыва (только админ)
router.patch('/:id/verify', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID отзыва'
      });
    }

    // Получение отзыва
    const existingReview = await Review.findById(parseInt(id));
    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Отзыв не найден'
      });
    }

    // Верификация отзыва
    await Review.update(parseInt(id), { isVerified: true });

    res.json({
      success: true,
      message: 'Отзыв успешно верифицирован'
    });
  } catch (error) {
    console.error('Ошибка верификации отзыва:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

module.exports = router;
