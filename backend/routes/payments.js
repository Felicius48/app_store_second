const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

const Order = require('../models/Order');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function getYooKassaCredentials() {
  const shopId = process.env.YOOKASSA_SHOP_ID || process.env.YANDEX_KASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY || process.env.YANDEX_KASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    throw new Error('YooKassa не настроена: задайте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY');
  }

  return { shopId, secretKey };
}

async function yooRequest(path, { method = 'POST', idempotenceKey, body } = {}) {
  const { shopId, secretKey } = getYooKassaCredentials();
  const url = `https://api.yookassa.ru/v3/${path.replace(/^\//, '')}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
  };
  if (idempotenceKey) headers['Idempotence-Key'] = idempotenceKey;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {
    json = null;
  }

  if (!res.ok) {
    const message = json?.description || json?.message || text || `YooKassa error ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = json;
    throw err;
  }

  return json;
}

// Создание платежа и получение confirmation_url для редиректа
router.post(
  '/create',
  authenticate,
  [
    body('orderId').isInt().withMessage('orderId должен быть числом'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Ошибка валидации', errors: errors.array() });
      }

      const { orderId } = req.body;
      const order = await Order.findById(parseInt(orderId, 10));
      if (!order) {
        return res.status(404).json({ success: false, message: 'Заказ не найден' });
      }

      // Доступ: только владелец или админ
      if (req.user.role !== 'admin' && order.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Доступ запрещен' });
      }

      // Если уже оплачен — не создаём повторно
      if (order.paymentStatus === 'paid') {
        return res.json({
          success: true,
          data: {
            alreadyPaid: true,
            orderId: order.id,
            paymentStatus: order.paymentStatus,
          },
        });
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const returnUrl = `${frontendUrl}/order-success?orderId=${order.id}`;

      // idempotence_key обязателен, чтобы повторный клик не создал второй платеж
      const idempotenceKey = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

      // YooKassa ожидает сумму строкой с 2 знаками
      const amountValue = Number(order.totalAmount).toFixed(2);

      const payment = await yooRequest('/payments', {
        method: 'POST',
        idempotenceKey,
        body: {
          amount: {
            value: amountValue,
            currency: order.currency || 'RUB',
          },
          confirmation: {
            type: 'redirect',
            return_url: returnUrl,
          },
          capture: true,
          description: `Оплата заказа ${order.orderNumber}`,
          metadata: {
            order_id: String(order.id),
            order_number: String(order.orderNumber),
            user_id: String(order.userId),
          },
        },
      });

      await Order.setPaymentInfo(order.id, {
        paymentId: payment.id,
        paymentConfirmationUrl: payment.confirmation?.confirmation_url || null,
        paymentStatus: payment.status || 'pending',
      });

      const confirmationUrl = payment.confirmation?.confirmation_url;
      if (!confirmationUrl) {
        return res.status(500).json({ success: false, message: 'Не удалось получить ссылку на оплату' });
      }

      res.json({
        success: true,
        data: {
          orderId: order.id,
          paymentId: payment.id,
          confirmationUrl,
        },
      });
    } catch (error) {
      console.error('Ошибка создания платежа YooKassa:', error);
      res.status(500).json({ success: false, message: error.message || 'Ошибка сервера' });
    }
  }
);

// Статус оплаты по заказу (для страницы /order-success)
router.get('/status/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ success: false, message: 'Неверный orderId' });
    }

    let order = await Order.findById(parseInt(orderId, 10));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Заказ не найден' });
    }

    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Доступ запрещен' });
    }

    if (order.paymentId && order.paymentStatus !== 'paid') {
      try {
        const payment = await yooRequest(`/payments/${order.paymentId}`, { method: 'GET' });
        const paymentStatus = payment?.status;
        let normalizedStatus = 'pending';
        if (paymentStatus === 'succeeded') {
          normalizedStatus = 'paid';
        } else if (paymentStatus === 'canceled') {
          normalizedStatus = 'failed';
        } else if (paymentStatus === 'pending' || paymentStatus === 'waiting_for_capture') {
          normalizedStatus = 'pending';
        }

        if (normalizedStatus === 'paid') {
          await Order.markPaidByPaymentId(order.paymentId);
        } else if (normalizedStatus === 'failed') {
          await Order.markFailedByPaymentId(order.paymentId);
        } else {
          await Order.setPaymentInfo(order.id, { paymentStatus: normalizedStatus });
        }

        order = await Order.findById(order.id);
      } catch (error) {
        console.error('Ошибка обновления статуса YooKassa:', error.message || error);
      }
    }

    res.json({
      success: true,
      data: {
        order: order.toPublicData(),
      },
    });
  } catch (error) {
    console.error('Ошибка получения статуса оплаты:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Webhook от YooKassa
// Важно: добавьте этот URL в личном кабинете YooKassa (HTTP notifications):
// POST {BACKEND_URL}/api/payments/webhook
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    const paymentObject = event?.object;
    const paymentId = paymentObject?.id;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'Нет payment id' });
    }

    // Сначала проверяем событие
    if (event.event === 'payment.succeeded') {
      await Order.markPaidByPaymentId(paymentId);
    } else if (event.event === 'payment.canceled') {
      await Order.markFailedByPaymentId(paymentId);
    }

    // Всегда 200, чтобы YooKassa не ретраила бесконечно по нашей ошибке
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка webhook YooKassa:', error);
    res.json({ success: true });
  }
});

module.exports = router;

