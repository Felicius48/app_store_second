const express = require('express');
const { body, validationResult } = require('express-validator');
const Favorite = require('../models/Favorite');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const products = await Favorite.listProductsByUser(req.user.id);
    res.json({
      success: true,
      data: {
        products: products.map((product) => product.toPublicData()),
      },
    });
  } catch (error) {
    console.error('Ошибка получения избранного:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

router.post(
  '/',
  authenticate,
  [body('productId').isInt().withMessage('productId должен быть числом')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Ошибка валидации',
          errors: errors.array(),
        });
      }
      const productId = parseInt(req.body.productId, 10);
      await Favorite.add(req.user.id, productId);
      res.json({ success: true, message: 'Добавлено в избранное' });
    } catch (error) {
      console.error('Ошибка добавления в избранное:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
  }
);

router.delete('/:productId', authenticate, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Неверный productId' });
    }
    await Favorite.remove(req.user.id, productId);
    res.json({ success: true, message: 'Удалено из избранного' });
  } catch (error) {
    console.error('Ошибка удаления из избранного:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

module.exports = router;
