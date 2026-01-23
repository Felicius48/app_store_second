const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Валидация создания категории
const createCategoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Название категории должно содержать от 2 до 100 символов'),
  body('parentId')
    .optional()
    .isInt()
    .withMessage('ID родительской категории должен быть числом')
];

// Получение всех категорий
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll();

    res.json({
      success: true,
      data: {
        categories: categories.map(category => category.toPublicData())
      }
    });
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Получение дерева категорий
router.get('/tree', async (req, res) => {
  try {
    const tree = await Category.getTree();

    res.json({
      success: true,
      data: {
        categories: tree
      }
    });
  } catch (error) {
    console.error('Ошибка получения дерева категорий:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Получение категории по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID категории'
      });
    }

    const category = await Category.findById(parseInt(id));

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    res.json({
      success: true,
      data: {
        category: category.toPublicData()
      }
    });
  } catch (error) {
    console.error('Ошибка получения категории:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Создание категории (только админ)
router.post('/', authenticate, createCategoryValidation, async (req, res) => {
  try {
    // Проверка прав администратора
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Требуются права администратора'
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

    const { name, description, imageUrl, parentId } = req.body;

    // Если указан parentId, проверяем существование родительской категории
    if (parentId) {
      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Родительская категория не найдена'
        });
      }
    }

    // Создание категории
    const result = await Category.create({
      name,
      description,
      imageUrl,
      parentId
    });

    // Получение созданной категории
    const category = await Category.findById(result.id);

    res.status(201).json({
      success: true,
      message: 'Категория успешно создана',
      data: {
        category: category.toPublicData()
      }
    });
  } catch (error) {
    console.error('Ошибка создания категории:', error);

    if (error.message.includes('уже существует')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Обновление категории (только админ)
router.put('/:id', authenticate, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Название категории должно содержать от 2 до 100 символов'),
  body('parentId')
    .optional()
    .isInt()
    .withMessage('ID родительской категории должен быть числом')
], async (req, res) => {
  try {
    // Проверка прав администратора
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Требуются права администратора'
      });
    }

    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID категории'
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

    // Проверка существования категории
    const existingCategory = await Category.findById(parseInt(id));
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    const { name, description, imageUrl, parentId } = req.body;

    // Если указан parentId, проверяем существование родительской категории
    if (parentId && parentId !== existingCategory.parentId) {
      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Родительская категория не найдена'
        });
      }

      // Проверяем, что не пытаемся сделать категорию родителем самой себя
      if (parentId === parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'Категория не может быть родителем самой себя'
        });
      }
    }

    // Обновление категории
    await Category.update(parseInt(id), {
      name,
      description,
      imageUrl,
      parentId
    });

    // Получение обновленной категории
    const updatedCategory = await Category.findById(parseInt(id));

    res.json({
      success: true,
      message: 'Категория успешно обновлена',
      data: {
        category: updatedCategory.toPublicData()
      }
    });
  } catch (error) {
    console.error('Ошибка обновления категории:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Удаление категории (только админ)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Проверка прав администратора
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Требуются права администратора'
      });
    }

    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID категории'
      });
    }

    // Проверка существования категории
    const existingCategory = await Category.findById(parseInt(id));
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    // Удаление категории
    await Category.delete(parseInt(id));

    res.json({
      success: true,
      message: 'Категория успешно удалена'
    });
  } catch (error) {
    console.error('Ошибка удаления категории:', error);

    if (error.message.includes('подкатегории')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

module.exports = router;
