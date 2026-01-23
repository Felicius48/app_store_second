const { runQuery, getQuery, getAllQuery } = require('../config/database');

class Order {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.orderNumber = data.order_number;
    this.status = data.status;
    this.totalAmount = parseFloat(data.total_amount);
    this.shippingAmount = parseFloat(data.shipping_amount || 0);
    this.discountAmount = parseFloat(data.discount_amount || 0);
    this.taxAmount = parseFloat(data.tax_amount || 0);
    this.currency = data.currency || 'RUB';
    this.shippingAddress = data.shipping_address ? JSON.parse(data.shipping_address) : null;
    this.billingAddress = data.billing_address ? JSON.parse(data.billing_address) : null;
    this.paymentMethod = data.payment_method;
    this.paymentStatus = data.payment_status;
    this.paymentId = data.payment_id;
    this.paymentConfirmationUrl = data.payment_confirmation_url;
    this.paymentPaidAt = data.payment_paid_at;
    this.shippingMethod = data.shipping_method;
    this.notes = data.notes;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Создание заказа
  static async create(orderData, orderItems) {
    const {
      userId, totalAmount, shippingAmount, discountAmount, taxAmount,
      shippingAddress, billingAddress, paymentMethod, shippingMethod, notes
    } = orderData;

    // Генерация номера заказа
    const orderNumber = this.generateOrderNumber();

    const sql = `
      INSERT INTO orders (
        user_id, order_number, total_amount, shipping_amount, discount_amount,
        tax_amount, shipping_address, billing_address, payment_method,
        shipping_method, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      userId, orderNumber, totalAmount, shippingAmount || 0, discountAmount || 0,
      taxAmount || 0, JSON.stringify(shippingAddress), JSON.stringify(billingAddress),
      paymentMethod, shippingMethod, notes
    ];

    try {
      const result = await runQuery(sql, params);
      const orderId = result.id;

      // Добавление элементов заказа
      for (const item of orderItems) {
        await runQuery(
          'INSERT INTO order_items (order_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.productId, item.quantity, item.price, item.total]
        );
      }

      return { id: orderId, orderNumber, message: 'Заказ успешно создан' };
    } catch (error) {
      throw error;
    }
  }

  // Поиск заказа по ID
  static async findById(id) {
    const sql = `
      SELECT o.*,
             u.first_name, u.last_name, u.email,
             (u.first_name || ' ' || u.last_name) as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `;
    const order = await getQuery(sql, [id]);
    return order ? new Order(order) : null;
  }

  // Поиск заказов пользователя
  static async findByUserId(userId, options = {}) {
    const { limit = 10, offset = 0, status } = options;

    let sql = `
      SELECT o.*,
             u.first_name, u.last_name, u.email,
             (u.first_name || ' ' || u.last_name) as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.user_id = ?
    `;

    const params = [userId];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const orders = await getAllQuery(sql, params);
    return orders.map(order => new Order(order));
  }

  // Получение элементов заказа
  static async getOrderItems(orderId) {
    const sql = `
      SELECT oi.*,
             p.name as product_name,
             p.images as product_images,
             p.sku as product_sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `;
    return await getAllQuery(sql, [orderId]);
  }

  // Обновление статуса заказа
  static async updateStatus(id, status) {
    const sql = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await runQuery(sql, [status, id]);
    return { message: 'Статус заказа обновлен' };
  }

  // Обновление информации о платеже (YooKassa)
  static async setPaymentInfo(id, { paymentId, paymentConfirmationUrl, paymentStatus }) {
    const sql = `
      UPDATE orders
      SET payment_id = COALESCE(?, payment_id),
          payment_confirmation_url = COALESCE(?, payment_confirmation_url),
          payment_status = COALESCE(?, payment_status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await runQuery(sql, [paymentId, paymentConfirmationUrl, paymentStatus, id]);
    return { message: 'Информация о платеже обновлена' };
  }

  // Отметить заказ как оплаченный
  static async markPaidByPaymentId(paymentId) {
    const sql = `
      UPDATE orders
      SET payment_status = 'paid',
          payment_paid_at = CURRENT_TIMESTAMP,
          status = CASE WHEN status = 'pending' THEN 'processing' ELSE status END,
          updated_at = CURRENT_TIMESTAMP
      WHERE payment_id = ?
    `;
    const result = await runQuery(sql, [paymentId]);
    return { changes: result.changes };
  }

  static async markFailedByPaymentId(paymentId) {
    const sql = `
      UPDATE orders
      SET payment_status = 'failed',
          updated_at = CURRENT_TIMESTAMP
      WHERE payment_id = ?
    `;
    const result = await runQuery(sql, [paymentId]);
    return { changes: result.changes };
  }

  // Генерация номера заказа
  static generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  // Получение статуса заказа в читаемом виде
  getStatusText() {
    const statusMap = {
      'pending': 'Ожидает подтверждения',
      'processing': 'Подтвержден',
      'shipped': 'Отправлен',
      'delivered': 'Доставлен',
      'cancelled': 'Отменен'
    };
    return statusMap[this.status] || this.status;
  }

  // Получение статуса оплаты в читаемом виде
  getPaymentStatusText() {
    const statusMap = {
      'pending': 'Ожидает оплаты',
      'paid': 'Оплачено',
      'failed': 'Ошибка оплаты',
      'refunded': 'Возвращен'
    };
    return statusMap[this.paymentStatus] || this.paymentStatus;
  }

  // Получение полной информации о заказе
  async getFullDetails() {
    const items = await Order.getOrderItems(this.id);
    return {
      ...this.toPublicData(),
      items: items.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productImages: item.product_images ? JSON.parse(item.product_images) : [],
        productSku: item.product_sku,
        quantity: item.quantity,
        price: parseFloat(item.price),
        total: parseFloat(item.total)
      }))
    };
  }

  // Получение публичных данных заказа
  toPublicData() {
    return {
      id: this.id,
      orderNumber: this.orderNumber,
      status: this.status,
      statusText: this.getStatusText(),
      totalAmount: this.totalAmount,
      shippingAmount: this.shippingAmount,
      discountAmount: this.discountAmount,
      taxAmount: this.taxAmount,
      currency: this.currency,
      shippingAddress: this.shippingAddress,
      billingAddress: this.billingAddress,
      paymentMethod: this.paymentMethod,
      paymentStatus: this.paymentStatus,
      paymentStatusText: this.getPaymentStatusText(),
      paymentId: this.paymentId,
      paymentPaidAt: this.paymentPaidAt,
      shippingMethod: this.shippingMethod,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      customerName: this.customer_name,
      customerEmail: this.email
    };
  }

  // Поиск всех заказов (для админа)
  static async findAll(options = {}) {
    const { limit, offset, status } = options;

    let sql = `
      SELECT o.*,
             u.first_name, u.last_name, u.email,
             (u.first_name || ' ' || u.last_name) as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }

    if (offset) {
      sql += ' OFFSET ?';
      params.push(offset);
    }

    try {
      const rows = await getAllQuery(sql, params);
      return rows.map(row => new Order(row));
    } catch (error) {
      throw error;
    }
  }

  // Подсчет количества заказов
  static async count(status = null) {
    let sql = 'SELECT COUNT(*) as count FROM orders WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    try {
      const result = await getQuery(sql, params);
      return result.count;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Order;
