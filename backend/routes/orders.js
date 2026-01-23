const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Валидация создания заказа
const createOrderValidation = [
  body('items').isArray().withMessage('Элементы заказа должны быть массивом'),
  body('items.*.productId').isInt().withMessage('ID товара должен быть числом'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Количество должно быть положительным числом'),
  body('shippingAddress').isObject().withMessage('Адрес доставки обязателен'),
  body('paymentMethod').isIn(['card', 'cash']).withMessage('Неверный метод оплаты')
];

// Получение заказов пользователя
router.get('/my-orders', authenticate, [
  query('page').optional().isInt({ min: 1 }).withMessage('Неверный номер страницы'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Лимит должен быть от 1 до 50'),
  query('status').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Неверный статус заказа')
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

    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const orders = await Order.findByUserId(req.user.id, {
      limit: parseInt(limit),
      offset,
      status
    });

    // Загрузка items для каждого заказа
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        return await order.getFullDetails();
      })
    );

    // Подсчет общего количества
    const totalCount = orders.length + offset; // Упрощенная версия

    res.json({
      success: true,
      data: {
        orders: ordersWithItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          hasNext: orders.length === parseInt(limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Получение деталей заказа
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID заказа'
      });
    }

    const order = await Order.findById(parseInt(id));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }

    // Проверка прав доступа (только владелец заказа или админ)
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен'
      });
    }

    const fullOrder = await order.getFullDetails();

    res.json({
      success: true,
      data: {
        order: fullOrder
      }
    });
  } catch (error) {
    console.error('Ошибка получения заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Создание заказа
router.post('/', authenticate, createOrderValidation, async (req, res) => {
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

    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      shippingMethod,
      notes
    } = req.body;

    // Расчет итоговой суммы
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      // Получаем актуальную цену товара из базы данных
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Товар с ID ${item.productId} не найден`
        });
      }

      const price = product.price;
      const total = price * item.quantity;
      totalAmount += total;

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        productImages: product.images,
        productSku: product.sku,
        quantity: item.quantity,
        price: price,
        total: total
      });
    }

    // Расчет доставки (упрощенная логика)
    const shippingAmount = shippingMethod === 'express' ? 1000 : totalAmount >= 10000 ? 0 : 500;

    const orderData = {
      userId: req.user.id,
      totalAmount: totalAmount + shippingAmount,
      shippingAmount,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      shippingMethod,
      notes
    };

    const result = await Order.create(orderData, orderItems);

    res.status(201).json({
      success: true,
      message: 'Заказ успешно создан',
      data: {
        orderId: result.id,
        orderNumber: result.orderNumber
      }
    });
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Управление заказами (только админ)
router.get('/admin/all', authenticate, requireAdmin, [
  query('page').optional().isInt({ min: 1 }).withMessage('Неверный номер страницы'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Лимит должен быть от 1 до 50'),
  query('status').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Неверный статус заказа')
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

    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    // Получаем все заказы с товарами
    const allOrders = await Order.findAll({ limit, offset, status });
    const totalCount = await Order.count(status);

    // Для админа получаем полную информацию о заказах с товарами
    const ordersWithItems = await Promise.all(
      allOrders.map(async (order) => {
        return await order.getFullDetails();
      })
    );

    res.json({
      success: true,
      data: {
        orders: ordersWithItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Обновление статуса заказа (только админ)
router.patch('/:id/status', authenticate, requireAdmin, [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Неверный статус заказа')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: errors.array()
      });
    }

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID заказа'
      });
    }

    await Order.updateStatus(parseInt(id), status);

    res.json({
      success: true,
      message: 'Статус заказа обновлен'
    });
  } catch (error) {
    console.error('Ошибка обновления статуса заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

module.exports = router;
