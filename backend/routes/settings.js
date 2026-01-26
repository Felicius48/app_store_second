const express = require('express');
const { body, validationResult } = require('express-validator');
const Settings = require('../models/Settings');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getAll();
    res.json({ success: true, data: { settings } });
  } catch (error) {
    console.error('Ошибка получения настроек:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

router.get('/banners', async (req, res) => {
  try {
    const value = await Settings.getValue('home_banners');
    const banners = value ? JSON.parse(value) : [];
    res.json({ success: true, data: { banners } });
  } catch (error) {
    console.error('Ошибка получения баннеров:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

router.put(
  '/banners',
  authenticate,
  requireAdmin,
  [body('banners').isArray().withMessage('banners должен быть массивом')],
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

      await Settings.setValue('home_banners', JSON.stringify(req.body.banners));
      res.json({ success: true, message: 'Баннеры сохранены' });
    } catch (error) {
      console.error('Ошибка сохранения баннеров:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
  }
);

module.exports = router;
