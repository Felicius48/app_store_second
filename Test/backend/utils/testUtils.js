const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Моковые данные для тестов
const mockUser = {
  id: 1,
  email: 'test@example.com',
  password: 'hashedpassword',
  first_name: 'Test',
  last_name: 'User',
  phone: '+79991234567',
  address: 'Test Street 1',
  city: 'Test City',
  postal_code: '12345',
  role: 'user',
  is_active: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockAdmin = {
  ...mockUser,
  id: 2,
  email: 'admin@example.com',
  role: 'admin',
};

const mockProduct = {
  id: 1,
  name: 'Test Product',
  slug: 'test-product',
  description: 'Test description',
  short_description: 'Short description',
  price: 1000.0,
  sale_price: null,
  sku: 'TEST-001',
  stock_quantity: 10,
  stock_status: 'in_stock',
  category_id: 1,
  brand_id: null,
  weight: null,
  dimensions: null,
  images: JSON.stringify(['/uploads/test.jpg']),
  specifications: JSON.stringify({}),
  is_featured: 0,
  is_active: 1,
  seo_title: null,
  seo_description: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockCategory = {
  id: 1,
  name: 'Test Category',
  slug: 'test-category',
  description: 'Test category description',
  image_url: null,
  icon_url: null,
  parent_id: null,
  is_active: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockOrder = {
  id: 1,
  user_id: 1,
  order_number: 'ORD-1234567890-001',
  status: 'pending',
  total_amount: 1000.0,
  shipping_amount: 0.0,
  discount_amount: 0.0,
  tax_amount: 0.0,
  currency: 'RUB',
  shipping_address: JSON.stringify({
    firstName: 'Test',
    lastName: 'User',
    address: 'Test Street 1',
    city: 'Test City',
    postalCode: '12345',
  }),
  billing_address: null,
  payment_method: 'card',
  payment_status: 'pending',
  payment_id: null,
  payment_confirmation_url: null,
  payment_paid_at: null,
  shipping_method: 'standard',
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Генерация JWT токена
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
}

// Создание мокового запроса
function createMockRequest(options = {}) {
  const {
    user = null,
    body = {},
    params = {},
    query = {},
    headers = {},
    file = null,
    files = [],
  } = options;

  return {
    body,
    params,
    query,
    headers: {
      authorization: user ? `Bearer ${generateToken(user)}` : null,
      ...headers,
    },
    user,
    file,
    files,
  };
}

// Создание мокового ответа
function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
  };
  return res;
}

// Создание мокового next
function createMockNext() {
  return jest.fn();
}

module.exports = {
  mockUser,
  mockAdmin,
  mockProduct,
  mockCategory,
  mockOrder,
  generateToken,
  createMockRequest,
  createMockResponse,
  createMockNext,
};
