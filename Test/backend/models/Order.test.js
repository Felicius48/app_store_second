const Order = require('../../../backend/models/Order');
const { runQuery, getQuery, getAllQuery } = require('../../../backend/config/database');

jest.mock('../../../backend/config/database');

describe('Order Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('должен создать новый заказ', async () => {
      const orderData = {
        userId: 1,
        totalAmount: 1000,
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          address: 'Test Street',
        },
        paymentMethod: 'card',
        shippingMethod: 'standard',
      };

      const orderItems = [
        { productId: 1, quantity: 2, price: 500, total: 1000 },
      ];

      runQuery
        .mockResolvedValueOnce({ id: 1 }) // INSERT orders
        .mockResolvedValue({}); // INSERT order_items

      const result = await Order.create(orderData, orderItems);

      expect(runQuery).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('orderNumber');
      expect(result.orderNumber).toMatch(/^ORD-/);
    });

    it('должен генерировать уникальный номер заказа', async () => {
      runQuery
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValue({});

      const orderData = {
        userId: 1,
        totalAmount: 1000,
        shippingAddress: {},
        paymentMethod: 'card',
      };

      const result1 = await Order.create(orderData, []);
      const result2 = await Order.create(orderData, []);

      expect(result1.orderNumber).not.toBe(result2.orderNumber);
    });
  });

  describe('findById', () => {
    it('должен найти заказ по ID', async () => {
      const mockOrder = {
        id: 1,
        user_id: 1,
        order_number: 'ORD-123',
        status: 'pending',
        total_amount: 1000,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
      };

      getQuery.mockResolvedValue(mockOrder);

      const order = await Order.findById(1);

      expect(getQuery).toHaveBeenCalled();
      expect(order).toBeInstanceOf(Order);
      expect(order.id).toBe(1);
    });
  });

  describe('findByUserId', () => {
    it('должен найти заказы пользователя', async () => {
      const mockOrders = [
        {
          id: 1,
          user_id: 1,
          order_number: 'ORD-123',
          status: 'pending',
          total_amount: 1000,
        },
      ];

      getAllQuery.mockResolvedValue(mockOrders);

      const orders = await Order.findByUserId(1);

      expect(getAllQuery).toHaveBeenCalled();
      expect(orders).toHaveLength(1);
      expect(orders[0]).toBeInstanceOf(Order);
    });

    it('должен фильтровать по статусу', async () => {
      getAllQuery.mockResolvedValue([]);

      await Order.findByUserId(1, { status: 'pending' });

      const sql = getAllQuery.mock.calls[0][0];
      expect(sql).toContain('AND o.status = ?');
    });
  });

  describe('updateStatus', () => {
    it('должен обновить статус заказа', async () => {
      runQuery.mockResolvedValue({ changes: 1 });

      const result = await Order.updateStatus(1, 'processing');

      expect(runQuery).toHaveBeenCalledWith(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['processing', 1]
      );
      expect(result).toHaveProperty('message');
    });
  });

  describe('setPaymentInfo', () => {
    it('должен обновить информацию о платеже', async () => {
      runQuery.mockResolvedValue({ changes: 1 });

      const paymentInfo = {
        paymentId: 'payment-123',
        paymentConfirmationUrl: 'https://yookassa.ru/pay',
        paymentStatus: 'pending',
      };

      const result = await Order.setPaymentInfo(1, paymentInfo);

      expect(runQuery).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });
  });

  describe('markPaidByPaymentId', () => {
    it('должен отметить заказ как оплаченный', async () => {
      runQuery.mockResolvedValue({ changes: 1 });

      const result = await Order.markPaidByPaymentId('payment-123');

      expect(runQuery).toHaveBeenCalled();
      expect(result).toHaveProperty('changes');
    });
  });

  describe('getStatusText', () => {
    it('должен вернуть читаемый статус заказа', () => {
      const order = new Order({
        id: 1,
        status: 'pending',
      });

      expect(order.getStatusText()).toBe('Ожидает подтверждения');
    });

    it('должен вернуть статус по умолчанию для неизвестного', () => {
      const order = new Order({
        id: 1,
        status: 'unknown',
      });

      expect(order.getStatusText()).toBe('unknown');
    });
  });

  describe('getPaymentStatusText', () => {
    it('должен вернуть читаемый статус оплаты', () => {
      const order = new Order({
        id: 1,
        payment_status: 'paid',
      });

      expect(order.getPaymentStatusText()).toBe('Оплачено');
    });
  });

  describe('generateOrderNumber', () => {
    it('должен генерировать номер заказа в правильном формате', () => {
      const orderNumber = Order.generateOrderNumber();
      expect(orderNumber).toMatch(/^ORD-\d+-\d{3}$/);
    });
  });
});
